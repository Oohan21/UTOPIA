from rest_framework import generics, permissions, status
from rest_framework.decorators import authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.authtoken.models import Token
from rest_framework.pagination import PageNumberPagination
from django.db.models.functions import TruncDate
from collections import defaultdict
from django.core.cache import cache
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.utils.decorators import method_decorator
from django.middleware.csrf import get_token
from django.db import models 
from django.db.models import Count, Sum, Q
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import *
from .models import CustomUser, UserActivity
from .utils.email import send_password_reset_email
from real_estate.models import Property
from subscriptions.models import Payment
from django.db import transaction
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from datetime import timedelta, datetime
import uuid
import json
import logging

logger = logging.getLogger(__name__)

@method_decorator(ensure_csrf_cookie, name='dispatch')
class GetCSRFToken(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Set CSRF cookie and return success"""
        # Get CSRF token from Django's middleware
        csrf_token = get_token(request)
        
        # Create session if it doesn't exist
        if not request.session.session_key:
            request.session.create()
        
        # Log request info for debugging
        logger.debug(f"CSRF Request - Origin: {request.headers.get('Origin')}, Referer: {request.headers.get('Referer')}")
        logger.debug(f"CSRF Token generated: {csrf_token[:20]}...")
        
        # Create response with token info
        response = Response({
            "success": "CSRF cookie set",
            "csrf_token": csrf_token,
            "session_key": request.session.session_key,
        })
        
        # Django's @ensure_csrf_cookie decorator already sets the cookie,
        # but we'll explicitly set it here to ensure correct configuration
        response.set_cookie(
            key=settings.CSRF_COOKIE_NAME,
            value=csrf_token,
            max_age=settings.CSRF_COOKIE_AGE if hasattr(settings, 'CSRF_COOKIE_AGE') else 31449600,  # 1 year default
            httponly=settings.CSRF_COOKIE_HTTPONLY,
            samesite=settings.CSRF_COOKIE_SAMESITE,
            secure=settings.CSRF_COOKIE_SECURE,
            path=settings.CSRF_COOKIE_PATH,
            domain=settings.CSRF_COOKIE_DOMAIN,
        )
        
        logger.info(f"✅ CSRF cookie set: {settings.CSRF_COOKIE_NAME}")
        
        return response

# ============ SESSION VIEWS ============
class CheckSessionView(APIView):
    """Check if user has a valid session"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        return Response({
            "authenticated": request.user.is_authenticated,
            "user_id": request.user.id if request.user.is_authenticated else None,
            "username": request.user.email if request.user.is_authenticated else None,
        })

class VerifyEmailView(APIView):
    """Verify email using token"""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    
    def post(self, request):
        token = request.data.get('token')
        
        if not token:
            return Response(
                {"error": "Verification token is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Find user with matching verification token
            user = CustomUser.objects.filter(verification_token=token).first()
            
            # Verify token
            if user and user.verify_email_token(token):
                # Log activity
                log_user_activity(user, 'email_verified', {}, request=request)
                
                return Response({
                    "success": True,
                    "message": "Email verified successfully!",
                    "user": UserSerializer(user).data
                })
            else:
                return Response({
                    "error": "Invalid or expired verification token"
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except CustomUser.DoesNotExist:
            return Response({
                "error": "Invalid verification token"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logger.error(f"Email verification error: {str(e)}", exc_info=True)
            return Response(
                {"error": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ResendVerificationEmailView(APIView):
    """Resend verification email"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        # Check if already verified
        if user.email_verified:
            return Response({
                "success": True,
                "message": "Email is already verified",
                "email_verified": True
            })
        
        # Rate limiting: max 3 emails per hour
        if user.verification_sent_at:
            time_since_last = timezone.now() - user.verification_sent_at
            if time_since_last < timedelta(minutes=1):  # Changed to 1 min for testing
                return Response({
                    "success": False,
                    "error": "Please wait 1 minute before requesting another verification email"
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        try:
            # Send verification email
            success = user.send_verification_email(request)
            
            if success:
                # Log activity
                log_user_activity(user, 'verification_resent', {}, request=request)
                
                return Response({
                    "success": True,
                    "message": "Verification email sent successfully. Please check your inbox.",
                    "email_sent": True,
                    "next_resend_allowed": (timezone.now() + timedelta(minutes=1)).isoformat()
                })
            else:
                return Response({
                    "success": False,
                    "error": "Failed to send verification email. Please try again later."
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"Error resending verification email: {str(e)}", exc_info=True)
            return Response({
                "success": False,
                "error": "An unexpected error occurred"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CheckVerificationStatusView(APIView):
    """Check email verification status"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        return Response({
            "email_verified": user.email_verified,
            "phone_verified": user.phone_verified,
            "is_verified": user.is_verified,
            "verification_sent_at": user.verification_sent_at,
            "can_resend": self.can_resend_verification(user)
        })
    
    def can_resend_verification(self, user):
        if not user.verification_sent_at:
            return True
        
        time_since_last = timezone.now() - user.verification_sent_at
        return time_since_last >= timedelta(minutes=15)

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Create the user
            user = serializer.save()
            
            # Send verification email
            try:
                email_sent = user.send_verification_email(request)
            except Exception as e:
                email_sent = False
                logger.warning(f"Verification email failed: {str(e)}")
            
            # Prepare response
            response_data = {
                "success": True,
                "message": "Registration successful!",
                "user": UserSerializer(user, context={'request': request}).data,
                "requires_verification": not user.email_verified,
                "email_verification_sent": email_sent,
            }
            
            return Response(
                response_data,
                status=status.HTTP_201_CREATED,
            )
            
        except Exception as e:
            logger.error(f"Registration error: {str(e)}", exc_info=True)
            return Response(
                {
                    "success": False,
                    "error": str(e),
                    "message": "Registration failed"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # No authentication needed for login
    
    def post(self, request):
        logger.info("🔐 LOGIN ATTEMPT")
        logger.info(f"   Request data keys: {list(request.data.keys())}")
        logger.info(f"   Email provided: {request.data.get('email')}")
        logger.info(f"   CSRF token header (request.headers): {request.headers.get('X-CSRFToken')}")
        logger.info(f"   CSRF token header (META HTTP_X_CSRFTOKEN): {request.META.get('HTTP_X_CSRFTOKEN')}")
        logger.info(f"   Request cookies: {request.COOKIES}")
        logger.info(f"   Session key: {request.session.session_key}")
        logger.info(f"   Session CSRF token (session['csrf_token']): {request.session.get('csrf_token')}")
        
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            password = serializer.validated_data["password"]
            
            print(f"\n🔐 VALIDATED LOGIN:")
            print(f"   Email: {email}")
            
            try:
                # First, try to get the user
                user = CustomUser.objects.get(email=email)
                logger.debug(f"   User found in DB: {user.email}")
                logger.debug(f"   User ID: {user.id}")
                logger.debug(f"   Is active: {user.is_active}")
                logger.debug(f"   Email verified: {user.email_verified}")

                # Check password
                password_correct = user.check_password(password)
                logger.debug(f"   Password check result: {password_correct}")
                
                if password_correct:
                    if not user.is_active:
                        print(f"   ❌ User is not active")
                        return Response(
                            {"error": "Account is deactivated."},
                            status=status.HTTP_403_FORBIDDEN,
                        )
                    
                    if not user.email_verified:
                        print(f"   ⚠️  Email not verified")
                        return Response(
                            {
                                "error": "Please verify your email before logging in.",
                                "requires_verification": True,
                                "user_id": user.id,
                                "email": user.email,
                            },
                            status=status.HTTP_403_FORBIDDEN,
                        )
                    
                    # Authenticate user using username fallback (ModelBackend expects 'username')
                    auth_user = authenticate(request, username=email, password=password)
                    logger.debug(f"   authenticate() result: {auth_user}")

                    # If backend didn't return a user but we've already verified the password,
                    # allow login of the fetched user instance (useful when custom kwargs are not supported).
                    if auth_user is None:
                        auth_user = user

                    if auth_user is not None:
                        # LOGIN USER - Django's login() handles session creation
                        login(request, auth_user)
                        request.session.save()

                        logger.info("✅ Login successful")
                        logger.info(f"   Session created: {request.session.session_key}")

                        # Get user data
                        user_data = UserSerializer(auth_user, context={'request': request}).data

                        # Return success response
                        # Django's CSRF middleware will automatically rotate the CSRF token after login
                        return Response({
                            "user": user_data,
                            "message": "Login successful",
                            "session_key": request.session.session_key,
                        })
                    
                print(f"   ❌ Password incorrect or authentication failed")
                return Response(
                    {"error": "Invalid email or password"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
                    
            except CustomUser.DoesNotExist:
                print(f"   ❌ User not found in database")
                return Response(
                    {"error": "Invalid email or password"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        
        print(f"   ❌ Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)

class CurrentUserView(APIView):
    """Get current authenticated user"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        serializer = UserSerializer(user, context={'request': request})
        return Response(serializer.data)

class UserProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserProfileUpdateView(generics.UpdateAPIView):
    """Update user profile details"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserProfileUpdateSerializer
    
    def get_object(self):
        # Get or create profile for user
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        
        if serializer.is_valid():
            try:
                # Handle city and sub_city fields (they might be IDs or names)
                data = serializer.validated_data.copy()
                
                # Handle city if provided as ID
                if 'city' in request.data and request.data['city']:
                    try:
                        if isinstance(request.data['city'], int):
                            from real_estate.models import City
                            city = City.objects.get(id=request.data['city'])
                            data['city'] = city
                        elif isinstance(request.data['city'], str) and request.data['city'].isdigit():
                            from real_estate.models import City
                            city = City.objects.get(id=int(request.data['city']))
                            data['city'] = city
                    except (ValueError, City.DoesNotExist):
                        pass
                
                # Handle sub_city if provided as ID
                if 'sub_city' in request.data and request.data['sub_city']:
                    try:
                        if isinstance(request.data['sub_city'], int):
                            from real_estate.models import SubCity
                            sub_city = SubCity.objects.get(id=request.data['sub_city'])
                            data['sub_city'] = sub_city
                        elif isinstance(request.data['sub_city'], str) and request.data['sub_city'].isdigit():
                            from real_estate.models import SubCity
                            sub_city = SubCity.objects.get(id=int(request.data['sub_city']))
                            data['sub_city'] = sub_city
                    except (ValueError, SubCity.DoesNotExist):
                        pass
                
                # Save the profile
                serializer.save(**data)
                
                # Log activity
                log_user_activity(
                    request.user, 
                    'profile_update', 
                    {
                        'fields_updated': list(request.data.keys()),
                        'profile_id': instance.id
                    },
                    request=request
                )
                
                return Response({
                    "success": True,
                    "message": "Profile updated successfully",
                    "profile": serializer.data
                })
                
            except Exception as e:
                logger.error(f"Profile update error: {str(e)}", exc_info=True)
                return Response(
                    {"error": f"Failed to update profile: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateProfileView(generics.UpdateAPIView):
    """Update user basic information"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        data = request.data.copy()
        
        # Handle profile picture removal
        if "profile_picture" in data and data["profile_picture"] in ["", "null", None]:
            data["profile_picture"] = None
        
        # If there's a file in FILES, use it
        if "profile_picture" in request.FILES:
            data["profile_picture"] = request.FILES["profile_picture"]

        serializer = self.get_serializer(instance, data=data, partial=True)

        try:
            serializer.is_valid(raise_exception=True)
            updated_instance = serializer.save()
            
            # Log activity
            log_user_activity(
                request.user,
                'profile_update',
                {'fields_updated': list(data.keys())},
                request=request
            )

            return Response({
                "success": True,
                "message": "Profile updated successfully",
                "user": serializer.data
            })

        except Exception as e:
            logger.error(f"User update error: {str(e)}", exc_info=True)
            return Response(
                {
                    "error": str(e),
                    "detail": "Failed to update profile",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

class UserActivityPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50

class UserActivitiesView(generics.ListAPIView):
    """Get user activities with filtering and pagination"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserActivitySerializer
    pagination_class = UserActivityPagination
    
    def get_queryset(self):
        user = self.request.user
        queryset = UserActivity.objects.filter(user=user)
        
        # Filter by activity type if provided
        activity_type = self.request.query_params.get('activity_type')
        if activity_type:
            queryset = queryset.filter(activity_type=activity_type)
        
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d')
                queryset = queryset.filter(created_at__date__gte=start_date)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d')
                queryset = queryset.filter(created_at__date__lte=end_date)
            except ValueError:
                pass
        
        # Filter by search term in metadata
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(metadata__icontains=search) |
                Q(activity_type__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        
        # Add activity stats
        total_activities = UserActivity.objects.filter(user=request.user).count()
        
        # Get activity counts by type for the last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_activities = UserActivity.objects.filter(
            user=request.user,
            created_at__gte=thirty_days_ago
        )
        
        activity_counts = {}
        for activity_type, _ in UserActivity.ACTIVITY_TYPES:
            count = recent_activities.filter(activity_type=activity_type).count()
            activity_counts[activity_type] = count
        
        response.data['stats'] = {
            'total_activities': total_activities,
            'recent_activity_counts': activity_counts,
            'last_30_days_total': recent_activities.count(),
        }
        
        return response

# In views.py, update the CreateUserActivityView:
class CreateUserActivityView(generics.CreateAPIView):
    """Create a new user activity record"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserActivityCreateSerializer
    
    def perform_create(self, serializer):
        # Get IP address from request
        ip_address = None
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = self.request.META.get('REMOTE_ADDR')
        
        # Get user agent
        user_agent = self.request.META.get('HTTP_USER_AGENT', '')
        
        activity = serializer.save(
            user=self.request.user,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Update user's counters based on activity type
        user = self.request.user
        activity_type = activity.activity_type
        
        # Use F() expressions to update counters atomically
        from django.db.models import F
        
        update_fields = {'last_activity': timezone.now()}
        
        if activity_type == 'property_view':
            update_fields['total_properties_viewed'] = F('total_properties_viewed') + 1
        elif activity_type == 'property_save':
            update_fields['total_properties_saved'] = F('total_properties_saved') + 1
        elif activity_type == 'inquiry':
            update_fields['total_inquiries_sent'] = F('total_inquiries_sent') + 1
        elif activity_type == 'search':
            update_fields['total_searches'] = F('total_searches') + 1
        elif activity_type == 'login':
            update_fields['total_logins'] = F('total_logins') + 1
        
        # Update the user
        CustomUser.objects.filter(id=user.id).update(**update_fields)
        
        # Refresh user instance
        user.refresh_from_db()

class UserActivitySummaryView(APIView):
    """Get summary of user activities"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get today's activities
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_activities = UserActivity.objects.filter(
            user=user,
            created_at__gte=today_start
        ).count()
        
        # Get this week's activities
        week_start = today_start - timedelta(days=today_start.weekday())
        week_activities = UserActivity.objects.filter(
            user=user,
            created_at__gte=week_start
        ).count()
        
        # Get this month's activities
        month_start = today_start.replace(day=1)
        month_activities = UserActivity.objects.filter(
            user=user,
            created_at__gte=month_start
        ).count()
        
        # Get most frequent activity types
        activity_counts = UserActivity.objects.filter(user=user).values(
            'activity_type'
        ).annotate(
            count=models.Count('id')
        ).order_by('-count')[:5]
        
        # Get latest activity
        latest_activity = UserActivity.objects.filter(user=user).order_by('-created_at').first()
        
        data = {
            'today_activities': today_activities,
            'week_activities': week_activities,
            'month_activities': month_activities,
            'activity_counts': list(activity_counts),
            'latest_activity': UserActivitySerializer(latest_activity).data if latest_activity else None,
            'total_activities': UserActivity.objects.filter(user=user).count(),
        }
        
        return Response(data)

# Update the UserDashboardView to include activity data
class UserDashboardView(APIView):
    """User dashboard with basic stats"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get user's properties
        user_properties = user.owned_properties.filter(is_active=True)
        
        # Calculate basic stats
        total_properties = user_properties.count()
        active_properties = user_properties.filter(property_status='available').count()
        sold_properties = user_properties.filter(property_status='sold').count()
        rented_properties = user_properties.filter(property_status='rented').count()
        
        # Aggregate views and inquiries
        views_inquiries = user_properties.aggregate(
            total_views=Sum('views_count'),
            total_inquiries=Sum('inquiry_count')
        )
        
        # Calculate profile completion
        profile_completion = user.profile_completion_percentage
        
        # Financial stats
        financial_stats = Payment.objects.filter(
            user=user,
            status='completed'
        ).aggregate(
            total_spent=Sum('amount_etb'),
            transaction_count=Count('id')
        )
        
        # Active promotions
        active_promotions = user_properties.filter(is_promoted=True).count()
        
        # Get user activity summary
        activity_summary = self.get_activity_summary(user)
        
        # Prepare response data
        data = {
            'user': {
                'email': user.email,
                'full_name': user.get_full_name(),
                'user_type': user.user_type,
                'profile_picture': user.profile_picture.url if user.profile_picture else None,
                'is_premium': user.is_premium,
                'total_logins': user.total_logins,
                'total_properties_viewed': user.total_properties_viewed,
                'total_properties_saved': user.total_properties_saved,
                'total_inquiries_sent': user.total_inquiries_sent,
                'total_searches': user.total_searches,
            },
            'stats': {
                'total_properties': total_properties,
                'active_properties': active_properties,
                'sold_properties': sold_properties,
                'rented_properties': rented_properties,
                'total_views': views_inquiries['total_views'] or 0,
                'total_inquiries': views_inquiries['total_inquiries'] or 0,
            },
            'activity': activity_summary,
            'profile_completion': profile_completion,
            'financial': {
                'total_spent': financial_stats['total_spent'] or 0,
                'transaction_count': financial_stats['transaction_count'] or 0,
                'active_promotions': active_promotions,
            },
            'recommendations': self.get_user_recommendations(user),
            'last_activity': user.last_activity,
        }
        
        return Response(data)
    
    def get_activity_summary(self, user):
        """Get user activity summary"""
        # Get today's activities
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_activities = UserActivity.objects.filter(
            user=user,
            created_at__gte=today_start
        ).count()
        
        # Get recent activity types
        week_start = today_start - timedelta(days=7)
        recent_activities = UserActivity.objects.filter(
            user=user,
            created_at__gte=week_start
        )
        
        # Count by activity type
        activity_types = ['property_view', 'property_save', 'inquiry', 'search']
        activity_counts = {}
        
        for activity_type in activity_types:
            count = recent_activities.filter(activity_type=activity_type).count()
            activity_counts[activity_type] = count
        
        return {
            'today_activities': today_activities,
            'recent_activity_counts': activity_counts,
            'total_activities': UserActivity.objects.filter(user=user).count(),
        }
    
    def get_user_recommendations(self, user):
        """Get personalized recommendations for user"""
        recommendations = []
        
        # Check profile completion
        if user.profile_completion_percentage < 80:
            recommendations.append({
                'type': 'profile',
                'title': 'Complete Your Profile',
                'message': 'Complete your profile to increase credibility and get better matches',
                'priority': 'high',
                'action': '/profile/edit'
            })
        
        # Check if user has no properties
        if user.owned_properties.count() == 0:
            recommendations.append({
                'type': 'property',
                'title': 'List Your First Property',
                'message': 'Start by listing your first property to reach potential buyers/renters',
                'priority': 'high',
                'action': '/properties/add'
            })
        
        # Check for properties without primary photos
        properties_without_primary = user.owned_properties.filter(
            images__isnull=True
        )
        if properties_without_primary.exists():
            recommendations.append({
                'type': 'property',
                'title': 'Add Photos to Properties',
                'message': 'Properties with photos get 10x more views',
                'priority': 'medium',
                'action': '/my-properties'
            })
        
        return recommendations

class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    
    def post(self, request):
        try:
            # Get and validate email
            email = request.data.get('email', '').strip().lower()
            
            if not email:
                return Response(
                    {"error": "Email is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if user exists
            try:
                user = CustomUser.objects.get(email=email)
                
                # Generate reset token
                import uuid
                from django.utils import timezone
                from datetime import timedelta
                
                reset_token = uuid.uuid4()
                
                # Update user with reset token
                user.reset_token = reset_token
                user.reset_token_sent_at = timezone.now()
                user.reset_token_expires_at = timezone.now() + timedelta(hours=24)
                user.save(update_fields=[
                    'reset_token', 
                    'reset_token_sent_at', 
                    'reset_token_expires_at'
                ])
                
                # Send email
                email_sent = send_password_reset_email(
                    user_email=user.email,
                    user_name=user.get_full_name() or user.email.split('@')[0],
                    reset_token=reset_token
                )
                
                if email_sent:
                    logger.info(f"Password reset email successfully sent to {user.email}")
                    
                    # In development, still log the link for testing
                    if settings.DEBUG:
                        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
                        reset_link = f"{frontend_url}/auth/reset-password?token={reset_token}"
                        print(f"\n{'='*60}")
                        print(f"DEBUG: Password reset link for {user.email}:")
                        print(f"{reset_link}")
                        print(f"{'='*60}\n")
                
                # Always return success message (security best practice)
                return Response({
                    "success": True,
                    "message": "If an account exists with this email, password reset instructions have been sent."
                }, status=status.HTTP_200_OK)
                
            except CustomUser.DoesNotExist:
                # For security, don't reveal if user exists
                logger.info(f"Password reset requested for non-existent email: {email}")
                return Response({
                    "success": True,
                    "message": "If an account exists with this email, password reset instructions have been sent."
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"Forgot password error: {str(e)}", exc_info=True)
            return Response(
                {
                    "error": "An unexpected error occurred. Please try again later.",
                    "debug": str(e) if settings.DEBUG else None
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ValidateResetTokenView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    
    def post(self, request):
        token = request.data.get('token')
        
        if not token:
            return Response({
                "valid": False,
                "error": "Token is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = CustomUser.objects.get(
                reset_token=token,
                reset_token_expires_at__gt=timezone.now()
            )
            
            return Response({
                "valid": True,
                "email": user.email
            }, status=status.HTTP_200_OK)
            
        except CustomUser.DoesNotExist:
            return Response({
                "valid": False,
                "error": "Invalid or expired token"
            }, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            # Find user with valid reset token
            user = CustomUser.objects.get(
                reset_token=token,
                reset_token_expires_at__gt=timezone.now()
            )
            
            # Set new password
            user.set_password(new_password)
            
            # Clear reset token
            user.reset_token = None
            user.reset_token_sent_at = None
            user.reset_token_expires_at = None
            user.save()
            
            logger.info(f"Password reset successful for user: {user.email}")
            
            return Response({
                "success": True,
                "message": "Password has been reset successfully. You can now login with your new password."
            }, status=status.HTTP_200_OK)
            
        except CustomUser.DoesNotExist:
            return Response({
                "error": "Invalid or expired reset token."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logger.error(f"Password reset error: {str(e)}", exc_info=True)
            return Response(
                {"error": "An unexpected error occurred. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            user = request.user
            
            # Check current password
            if not user.check_password(serializer.validated_data['current_password']):
                return Response(
                    {"error": "Current password is incorrect"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            # Update session to prevent logout
            update_session_auth_hash(request, user)
            
            # Log activity
            log_user_activity(user, 'password_change', request=request)
            
            return Response({
                "success": True,
                "message": "Password has been changed successfully"
            })
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
        
class DeleteAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = DeleteAccountSerializer(data=request.data)
        
        if serializer.is_valid():
            user = request.user
            
            # Verify password if provided
            if 'password' in serializer.validated_data:
                if not user.check_password(serializer.validated_data['password']):
                    return Response(
                        {"error": "Incorrect password"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            reason = serializer.validated_data.get('reason', 'No reason provided')
            
            # Log deletion request
            logger.warning(f"User {user.email} requested account deletion. Reason: {reason}")
            
            # In production, you might want to:
            # 1. Schedule deletion after X days
            # 2. Anonymize data instead of hard delete
            # 3. Send confirmation email
            
            # For now, immediately delete
            user.delete()
            
            # Logout user
            logout(request)
            
            return Response({
                "success": True,
                "message": "Account has been deleted successfully"
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserProfileSerializer
    
    def get_object(self):
        # Get or create profile for user
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile


class UserProfileCreateView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserProfileSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class BulkProfileUpdateView(APIView):
    """Update both user and profile data in one request"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def put(self, request):
        user = request.user
        
        try:
            with transaction.atomic():
                # Update user data
                user_data = request.data.get('user', {})
                if user_data:
                    user_serializer = UserSerializer(
                        user, 
                        data=user_data, 
                        partial=True,
                        context={'request': request}
                    )
                    
                    if user_serializer.is_valid():
                        user_serializer.save()
                    else:
                        return Response(
                            {"errors": {"user": user_serializer.errors}},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                # Update profile data
                profile_data = request.data.get('profile', {})
                if profile_data:
                    profile, created = UserProfile.objects.get_or_create(user=user)
                    profile_serializer = UserProfileUpdateSerializer(
                        profile,
                        data=profile_data,
                        partial=True,
                        context={'request': request}
                    )
                    
                    if profile_serializer.is_valid():
                        profile_serializer.save()
                    else:
                        return Response(
                            {"errors": {"profile": profile_serializer.errors}},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                # Log activity
                log_user_activity(user, 'profile_update', {
                    'bulk_update': True,
                    'fields_updated': list(request.data.keys())
                }, request=request)
                
                # Get updated data
                updated_user = UserSerializer(user).data
                profile = getattr(user, 'user_profile', None)
                updated_profile = UserProfileSerializer(profile).data if profile else None
                
                return Response({
                    "success": True,
                    "message": "Profile updated successfully",
                    "user": updated_user,
                    "profile": updated_profile
                })
                
        except Exception as e:
            logger.error(f"Bulk profile update error: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to update profile: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserProfileDetailView(generics.RetrieveAPIView):
    """Get user profile details"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserProfileSerializer
    
    def get_object(self):
        # Get or create profile for user
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

class ValidatePhoneNumberView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        phone_number = request.data.get('phone_number', '')
        
        if not phone_number:
            return Response(
                {"error": "Phone number is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Parse phone number (assuming Ethiopian numbers)
            parsed = phonenumbers.parse(phone_number, "ET")
            
            if not phonenumbers.is_valid_number(parsed):
                return Response({
                    "valid": False,
                    "error": "Invalid phone number"
                })
            
            formatted = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
            
            # Check if phone number already exists (except for current user)
            existing_user = CustomUser.objects.filter(
                phone_number=formatted
            ).exclude(id=request.user.id).first()
            
            if existing_user:
                return Response({
                    "valid": False,
                    "error": "Phone number is already registered"
                })
            
            return Response({
                "valid": True,
                "formatted": formatted,
                "country": phonenumbers.region_code_for_number(parsed)
            })
            
        except phonenumbers.NumberParseException as e:
            return Response({
                "valid": False,
                "error": f"Invalid phone number format: {str(e)}"
            })


class ValidateProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        data = request.data
        errors = {}
        warnings = {}
        
        # Validate email if provided
        if 'email' in data:
            try:
                validate_email(data['email'])
                
                # Check if email already exists
                existing_user = CustomUser.objects.filter(
                    email=data['email'].lower()
                ).exclude(id=request.user.id).first()
                
                if existing_user:
                    errors['email'] = ['Email is already registered']
            except ValidationError as e:
                errors['email'] = [str(e)]
        
        # Validate phone number if provided
        if 'phone_number' in data and data['phone_number']:
            try:
                parsed = phonenumbers.parse(data['phone_number'], "ET")
                
                if not phonenumbers.is_valid_number(parsed):
                    errors['phone_number'] = ['Invalid phone number']
                else:
                    formatted = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
                    
                    # Check if phone number already exists
                    existing_user = CustomUser.objects.filter(
                        phone_number=formatted
                    ).exclude(id=request.user.id).first()
                    
                    if existing_user:
                        errors['phone_number'] = ['Phone number is already registered']
            except phonenumbers.NumberParseException:
                errors['phone_number'] = ['Invalid phone number format']
        
        # Validate date of birth
        if 'date_of_birth' in data and data['date_of_birth']:
            try:
                dob = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
                today = datetime.now().date()
                
                if dob > today:
                    errors['date_of_birth'] = ['Date of birth cannot be in the future']
                
                # Check if user is at least 18 years old
                age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                if age < 18:
                    warnings['date_of_birth'] = ['You must be at least 18 years old']
                
            except ValueError:
                errors['date_of_birth'] = ['Invalid date format. Use YYYY-MM-DD']
        
        # Validate URLs
        url_fields = ['website', 'facebook_url', 'twitter_url', 'linkedin_url', 'instagram_url']
        for field in url_fields:
            if field in data and data[field]:
                if not data[field].startswith(('http://', 'https://')):
                    warnings[field] = ['URL should start with http:// or https://']
        
        # Validate budget range
        if 'budget_range_min' in data and 'budget_range_max' in data:
            if data['budget_range_min'] and data['budget_range_max']:
                if float(data['budget_range_min']) > float(data['budget_range_max']):
                    errors['budget_range'] = ['Minimum budget cannot be greater than maximum budget']
        
        return Response({
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        })


class VerificationStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Calculate profile completion
        fields = ['first_name', 'last_name', 'phone_number', 'profile_picture', 'bio']
        completed = sum(1 for field in fields if getattr(user, field))
        profile_completion = int((completed / len(fields)) * 100)
        
        return Response({
            "email_verified": user.email_verified,
            "phone_verified": user.phone_verified,
            "is_verified": user.is_verified,
            "profile_completed": profile_completion >= 80,
            "profile_completion_percentage": profile_completion,
            "verification_level": self.get_verification_level(user)
        })
    
    def get_verification_level(self, user):
        level = 0
        
        if user.email_verified:
            level += 1
        if user.phone_verified:
            level += 1
        if user.profile_completion_percentage >= 80:
            level += 1
        if user.is_premium:
            level += 1
        
        return min(level, 4)


class AccountActivityView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get activities
        activities = UserActivity.objects.filter(
            user=user
        ).order_by('-created_at')
        
        # Paginate
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        paginated_activities = activities[start:end]
        
        serializer = UserActivitySerializer(paginated_activities, many=True)
        
        return Response({
            "activities": serializer.data,
            "total": activities.count(),
            "page": page,
            "page_size": page_size,
            "total_pages": (activities.count() + page_size - 1) // page_size
        })


class ExportDataView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Prepare data for export
        export_data = {
            "user": {
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone_number": user.phone_number,
                "created_at": user.created_at.isoformat(),
                "updated_at": user.updated_at.isoformat()
            },
            "profile": None,
            "properties": [],
            "activities": [],
            "inquiries": []
        }
        
        # Add profile data if exists
        if hasattr(user, 'user_profile'):
            profile = user.user_profile
            export_data["profile"] = {
                "date_of_birth": str(profile.date_of_birth) if profile.date_of_birth else None,
                "gender": profile.gender,
                "address": profile.address,
                "city": profile.city.name if profile.city else None,
                "sub_city": profile.sub_city.name if profile.sub_city else None,
                "postal_code": profile.postal_code,
                "created_at": profile.created_at.isoformat(),
                "updated_at": profile.updated_at.isoformat()
            }
        
        # Add properties
        properties = user.owned_properties.all()
        for prop in properties:
            export_data["properties"].append({
                "title": prop.title,
                "property_type": prop.property_type,
                "price_etb": str(prop.price_etb),
                "status": prop.property_status,
                "created_at": prop.created_at.isoformat()
            })
        
        # Add activities
        activities = user.activities.all()[:100]  # Limit to 100 most recent
        for activity in activities:
            export_data["activities"].append({
                "type": activity.activity_type,
                "created_at": activity.created_at.isoformat(),
                "metadata": activity.metadata
            })
        
        # Add inquiries
        inquiries = user.inquiries.all()[:100]  # Limit to 100 most recent
        for inquiry in inquiries:
            export_data["inquiries"].append({
                "property": inquiry.property_rel.title if inquiry.property_rel else None,
                "message": inquiry.message,
                "status": inquiry.status,
                "created_at": inquiry.created_at.isoformat()
            })
        
        # Create JSON response
        response = Response(
            json.dumps(export_data, indent=2, default=str),
            content_type='application/json'
        )
        
        # Set filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        response['Content-Disposition'] = f'attachment; filename="user_data_{timestamp}.json"'
        
        return response


class PrivacySettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Get privacy settings from user profile or return defaults
        profile = getattr(request.user, 'user_profile', None)
        
        return Response({
            "profile_visibility": getattr(profile, 'profile_visibility', 'public') if profile else 'public',
            "show_email": getattr(request.user, 'show_email', False),
            "show_phone": getattr(request.user, 'show_phone', False),
            "show_last_seen": getattr(request.user, 'show_last_seen', True),
            "allow_messages": getattr(request.user, 'allow_messages', True),
            "data_sharing": getattr(request.user, 'data_sharing', False)
        })
    
    def patch(self, request):
        user = request.user
        
        # Update user fields
        user_fields = ['show_email', 'show_phone', 'show_last_seen', 'allow_messages', 'data_sharing']
        for field in user_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
        
        user.save()
        
        # Update profile fields if profile exists
        if hasattr(user, 'user_profile'):
            profile = user.user_profile
            if 'profile_visibility' in request.data:
                profile.profile_visibility = request.data['profile_visibility']
            profile.save()
        
        return Response({
            "success": True,
            "message": "Privacy settings updated"
        })

def log_user_activity(user, activity_type, metadata=None, request=None):
    """Utility function to log user activities"""
    if not user or not user.is_authenticated:
        return None
    
    ip_address = None
    user_agent = ''
    
    if request:
        # Get IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        
        # Get user agent
        user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    try:
        activity = UserActivity.objects.create(
            user=user,
            activity_type=activity_type,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=metadata or {}
        )
        
        # Update user's last activity timestamp
        user.last_activity = timezone.now()
        user.save(update_fields=['last_activity'])
        
        return activity
    except Exception as e:
        logger.error(f"Error logging user activity: {str(e)}", exc_info=True)
        return None

# ============ DEBUG VIEW ============
class DebugSessionView(APIView):
    """Debug session information"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        return Response({
            'authentication': {
                'is_authenticated': request.user.is_authenticated,
                'user_id': request.user.id if request.user.is_authenticated else None,
                'email': request.user.email if request.user.is_authenticated else None,
            },
            'session': {
                'session_key': request.session.session_key,
                'session_exists': request.session.exists(request.session.session_key) if request.session.session_key else False,
                'session_age': request.session.get_expiry_age() if request.session.session_key else None,
            },
            'cookies': {
                'sessionid_exists': 'sessionid' in request.COOKIES,
                'csrftoken_exists': 'csrftoken' in request.COOKIES,
            },
            'request': {
                'method': request.method,
                'path': request.path,
                'remote_addr': request.META.get('REMOTE_ADDR'),
            },
        })