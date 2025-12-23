from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json
import uuid
import traceback
from .services.chapa_service import ChapaPaymentService
from .models import PropertyPromotionTier, PropertyPromotion, Payment, PromoCode
from .serializers import (
    PropertyPromotionTierSerializer,
    PropertyPromotionSerializer,
    PaymentSerializer,
    PurchasePromotionSerializer,
    CalculatePromotionPriceSerializer,
)
from real_estate.models import Property


class PropertyPromotionTierViewSet(viewsets.ReadOnlyModelViewSet):
    """Promotion tiers - 3 tiers with fixed durations"""
    
    queryset = PropertyPromotionTier.objects.filter(is_active=True)
    serializer_class = PropertyPromotionTierSerializer
    permission_classes = [AllowAny]


class PropertyPromotionViewSet(viewsets.ModelViewSet):
    """Property promotions - required for visibility"""
    
    serializer_class = PropertyPromotionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return PropertyPromotion.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=["post"])
    def calculate_price(self, request):
        """Calculate promotion price for specific duration"""
        serializer = CalculatePromotionPriceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        
        try:
            tier_type = serializer.validated_data["tier_type"]
            duration_days = serializer.validated_data["duration_days"]
            
            tier = get_object_or_404(
                PropertyPromotionTier, 
                tier_type=tier_type,
                is_active=True
            )
            
            # Calculate base price for specific duration
            base_price = tier.get_price(duration_days)
            
            # Apply promo code if provided
            promo_code = serializer.validated_data.get("promo_code")
            final_price = base_price
            
            if promo_code:
                try:
                    promo = PromoCode.objects.get(code=promo_code, is_active=True)
                    if promo.is_valid():
                        final_price = promo.apply_discount(base_price)
                except PromoCode.DoesNotExist:
                    pass
            
            return Response({
                "tier_name": tier.name,
                "duration_days": duration_days,
                "original_price": base_price,
                "final_price": final_price,
                "discount_applied": base_price - final_price,
                "has_promo_discount": final_price < base_price,
            })
            
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class InitiatePromotionPaymentView(APIView):
    """Initiate payment for property promotion with specific duration"""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Get request data
            property_id = request.data.get("property_id")
            tier_type = request.data.get("tier_type")
            duration_days = request.data.get("duration_days", 30)
            promo_code = request.data.get("promo_code", "")
            
            print(f"DEBUG: Received payment initiation request")
            print(f"DEBUG: property_id={property_id}, tier_type={tier_type}, duration_days={duration_days}")
            
            # Validate required fields
            if not all([property_id, tier_type, duration_days]):
                return Response(
                    {"error": "property_id, tier_type, and duration_days are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Validate duration is one of the allowed values
            allowed_durations = [7, 30, 60, 90]
            if int(duration_days) not in allowed_durations:
                return Response(
                    {"error": f"Duration must be one of: {allowed_durations}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Get property (must be owned by user)
            property_obj = get_object_or_404(
                Property, id=property_id, owner=request.user
            )
            
            print(f"DEBUG: Found property: {property_obj.title}")
            
            # Get promotion tier
            tier = get_object_or_404(
                PropertyPromotionTier,
                tier_type=tier_type,
                is_active=True
            )
            
            print(f"DEBUG: Found tier: {tier.name}")
            
            # Calculate price for specific duration
            base_price = tier.get_price(int(duration_days))
            final_price = base_price
            
            print(f"DEBUG: Base price: {base_price}")
            
            # Apply promo code if provided
            if promo_code:
                try:
                    promo = PromoCode.objects.get(code=promo_code, is_active=True)
                    if promo.is_valid():
                        final_price = promo.apply_discount(base_price)
                        print(f"DEBUG: Applied promo code, final price: {final_price}")
                except PromoCode.DoesNotExist:
                    print(f"DEBUG: Promo code not found or invalid")
                    pass
            
            # Generate unique transaction reference
            tx_ref = f"promo_{uuid.uuid4().hex[:16]}"
            
            print(f"DEBUG: Creating payment and promotion records...")
            
            with transaction.atomic():
                # Create payment record first
                payment = Payment.objects.create(
                    user=request.user,
                    amount_etb=final_price,
                    payment_method="chapa",
                    chapa_reference=tx_ref,
                    status="pending",
                )
                
                print(f"DEBUG: Created payment: {payment.id}")
                
                # Create promotion record linked to payment
                promotion = PropertyPromotion.objects.create(
                    user=request.user,
                    listed_property=property_obj,
                    tier=tier,
                    duration_days=duration_days,
                    status="pending",
                )
                
                print(f"DEBUG: Created promotion: {promotion.id}")
                
                # Update payment with promotion reference
                payment.promotion = promotion
                payment.save()
                
                # Prepare Chapa payment data
                chapa_data = {
                    "amount": str(final_price),
                    "currency": "ETB",
                    "email": request.user.email,
                    "first_name": request.user.first_name or "Customer",
                    "last_name": request.user.last_name or "",
                    "phone_number": request.user.phone_number or "",
                    "tx_ref": tx_ref,
                    "callback_url": f"{settings.FRONTEND_URL}/api/subscriptions/payment/webhook/",
                    "return_url": f"{settings.FRONTEND_URL}/payment/callback?tx_ref={tx_ref}&promotion_id={str(promotion.id)}",
                    "customization": {
                        "title": "Property Promo"[:16],
                        "description": f"Promoting property: {property_obj.title[:30]}",
                    },
                    "meta": {
                        "payment_id": str(payment.id),
                        "promotion_id": str(promotion.id),
                        "user_id": str(request.user.id),
                        "property_id": str(property_obj.id),
                        "tier_type": tier.tier_type,
                        "duration_days": duration_days,
                    },
                }
                import re
                description = chapa_data['customization']['description']
                # Remove any characters that are not allowed
                cleaned_description = re.sub(r'[^\w\s\-\.]', '', description)
                chapa_data['customization']['description'] = cleaned_description
                
                print(f"DEBUG: Chapa data prepared with cleaned description")
                print(f"DEBUG: Customization title: {chapa_data['customization']['title']}")
                print(f"DEBUG: Customization description: {chapa_data['customization']['description']}")
                print(f"DEBUG: Chapa data prepared")
                # Add webhook if secret exists
                if hasattr(settings, 'CHAPA_WEBHOOK_SECRET') and settings.CHAPA_WEBHOOK_SECRET:
                    chapa_data['receive_webhook'] = 1
                    chapa_data['webhook_url'] = f"{settings.FRONTEND_URL}/api/subscriptions/payment/webhook/"
                
                print(f"DEBUG: Initializing payment with Chapa...")
                
                # Initialize payment with Chapa
                payment_response = ChapaPaymentService.initialize_payment(chapa_data)
                
                print(f"DEBUG: Chapa response: {payment_response}")
                
                if payment_response.get("status") == "success":
                    checkout_url = payment_response["data"]["checkout_url"]
                    
                    return Response(
                        {
                            "success": True,
                            "message": "Payment initialized successfully",
                            "checkout_url": checkout_url,
                            "payment_reference": tx_ref,
                            "payment_id": str(payment.id),
                            "promotion_id": str(promotion.id),
                            "amount": final_price,
                            "tier_name": tier.name,
                            "duration_days": duration_days,
                        }
                    )
                else:
                    # Mark payment and promotion as failed
                    payment.status = "failed"
                    payment.save()
                    promotion.status = "failed"
                    promotion.save()
                    
                    return Response(
                        {
                            "error": f"Payment initialization failed: {payment_response.get('message', 'Unknown error')}",
                            "details": payment_response.get('data'),
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                
        except Exception as e:
            print(f"ERROR: Exception in InitiatePromotionPaymentView: {str(e)}")
            print(traceback.format_exc())  # Print full traceback
            
            return Response(
                {
                    "error": f"Error initiating payment: {str(e)}",
                    "debug_info": {
                        "property_id": property_id if 'property_id' in locals() else None,
                        "tier_type": tier_type if 'tier_type' in locals() else None,
                        "duration_days": duration_days if 'duration_days' in locals() else None,
                        "user": request.user.email if request.user else None,
                    }
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

@method_decorator(csrf_exempt, name="dispatch")
class ChapaWebhookView(APIView):
    """Handle Chapa payment webhook"""
    
    permission_classes = []
    
    def post(self, request):
        try:
            # Get signature from header
            signature = request.headers.get("Chapa-Signature", "")
            
            # Verify signature
            payload = request.body
            if not ChapaPaymentService.verify_webhook_signature(payload, signature):
                return Response(
                    {"error": "Invalid signature"}, status=status.HTTP_401_UNAUTHORIZED
                )
            
            data = json.loads(payload.decode("utf-8"))
            tx_ref = data.get("tx_ref")
            status_value = data.get("status")
            
            if not tx_ref:
                return Response(
                    {"error": "No transaction reference"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Find payment by chapa reference
            try:
                payment = Payment.objects.get(chapa_reference=tx_ref)
                promotion = payment.promotion
                
                if status_value == "success":
                    # Update payment status
                    payment.mark_completed(
                        transaction_id=data.get("id", ""),
                        chapa_reference=tx_ref
                    )
                    
                    # Activate promotion
                    if promotion:
                        success = promotion.activate()
                    
                    return Response({"status": "success", "payment_id": str(payment.id)})
                else:
                    payment.status = "failed"
                    payment.save()
                    
                    if promotion:
                        promotion.status = "failed"
                        promotion.save()
                    
                    return Response({"status": "payment_failed", "payment_id": str(payment.id)})
                
            except Payment.DoesNotExist:
                return Response(
                    {"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND
                )
            
        except json.JSONDecodeError:
            return Response(
                {"error": "Invalid JSON"}, status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerifyPaymentView(APIView):
    """Verify payment status"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        tx_ref = request.GET.get("tx_ref")
        payment_id = request.GET.get("payment_id")
        promotion_id = request.GET.get("promotion_id")
        
        print(f"DEBUG - VerifyPaymentView: tx_ref={tx_ref}, payment_id={payment_id}, promotion_id={promotion_id}")
        
        if not any([tx_ref, payment_id, promotion_id]):
            return Response(
                {"error": "Either tx_ref, payment_id, or promotion_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        try:
            # Find payment
            if payment_id:
                payment = get_object_or_404(
                    Payment, id=payment_id, user=request.user
                )
            elif promotion_id:
                promotion = get_object_or_404(
                    PropertyPromotion, id=promotion_id, user=request.user
                )
                payment = promotion.payment
                print(f"DEBUG - Found promotion: {promotion.id}, payment: {payment.id if payment else 'None'}")
            else:
                payment = get_object_or_404(
                    Payment, chapa_reference=tx_ref, user=request.user
                )
            
            print(f"DEBUG - Payment found: {payment.id}, status: {payment.status}")
            
            # Verify with Chapa if payment is still pending
            if payment.status == "pending":
                print(f"DEBUG - Payment is pending, verifying with Chapa...")
                verification = ChapaPaymentService.verify_payment(payment.chapa_reference)
                print(f"DEBUG - Chapa verification response: {verification}")
                
                if verification.get("status") == "success":
                    data = verification["data"]
                    
                    # Update payment status
                    payment.mark_completed(
                        transaction_id=data.get("id", ""),
                        chapa_reference=payment.chapa_reference
                    )
                    
                    # Activate promotion
                    if payment.promotion:
                        print(f"DEBUG - Activating promotion...")
                        payment.promotion.activate()
            
            # Return payment and promotion status
            response_data = {
                "payment": {
                    "id": str(payment.id),
                    "status": payment.status,
                    "amount": payment.amount_etb,
                    "paid_at": payment.paid_at,
                }
            }
            
            if payment.promotion:
                print(f"DEBUG - Adding promotion data to response")
                success = payment.promotion.activate()
                print(f"DEBUG - Promotion property: {payment.promotion.listed_property}")
                print(f"DEBUG - Promotion property ID: {payment.promotion.listed_property.id}")
                
                response_data["promotion"] = {
                    "id": str(payment.promotion.id),
                    "status": payment.promotion.status,
                    "tier": payment.promotion.tier.tier_type,  # Use tier_type for consistency
                    "property_id": payment.promotion.listed_property.id,  # FIXED: Use listed_property, not property
                    "property_title": payment.promotion.listed_property.title,  # Add property title
                    "duration_days": payment.promotion.duration_days,
                    "start_date": payment.promotion.start_date,
                    "end_date": payment.promotion.end_date,
                }
            
            print(f"DEBUG - Returning response: {response_data}")
            return Response(response_data)
            
        except Exception as e:
            print(f"ERROR - Verification error: {str(e)}")
            import traceback
            print(f"ERROR - Traceback: {traceback.format_exc()}")
            return Response(
                {"error": f"Verification error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

class UserPromotionsDashboardView(APIView):
    """User promotions dashboard"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        active_promotions = PropertyPromotion.objects.filter(
            user=request.user, 
            status="active"
        )
        
        pending_payments = Payment.objects.filter(
            user=request.user,
            status="pending"
        )
        
        total_spent = sum(
            payment.amount_etb 
            for payment in Payment.objects.filter(
                user=request.user,
                status="completed"
            )
        )
        
        return Response(
            {
                "stats": {
                    "active_promotions": active_promotions.count(),
                    "pending_payments": pending_payments.count(),
                    "total_spent": total_spent,
                    "promotions_by_tier": {
                        "basic": active_promotions.filter(tier__tier_type="basic").count(),
                        "standard": active_promotions.filter(tier__tier_type="standard").count(),
                        "premium": active_promotions.filter(tier__tier_type="premium").count(),
                    }
                },
                "active_promotions": PropertyPromotionSerializer(active_promotions, many=True).data,
                "pending_payments": PaymentSerializer(pending_payments, many=True).data,
            }
        )