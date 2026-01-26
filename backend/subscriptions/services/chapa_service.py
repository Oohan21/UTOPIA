# subscriptions/services/chapa_service.py
import requests
import hmac
import hashlib
import json
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class ChapaPaymentService:
    
    @staticmethod
    def initialize_payment(payment_data):
        """
        Initialize Chapa payment
        """
        # Try different URL formats
        url = f"{settings.CHAPA_API_URL}/transaction/initialize"
        
        # Alternative URL formats to try if the first fails
        alt_urls = [
            f"{settings.CHAPA_API_URL}/transaction/initialize",
            "https://api.chapa.co/v1/transaction/initialize",
            "https://api.chapa.co/checkout/",
        ]
        
        headers = {
            'Authorization': f'Bearer {settings.CHAPA_SECRET_KEY}',
            'Content-Type': 'application/json'
        }
        
        logger.info("=== CHAPA PAYMENT REQUEST ===")
        logger.info(f"URL: {url}")
        logger.info(f"Data being sent: {json.dumps(payment_data, indent=2)}")
        
        # Validate required fields
        required_fields = ['amount', 'currency', 'email', 'first_name', 'tx_ref']
        missing_fields = [field for field in required_fields if field not in payment_data]
        
        if missing_fields:
            error_msg = f"Missing required fields: {missing_fields}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Validate amount
        try:
            amount = float(payment_data['amount'])
            if amount <= 0:
                error_msg = "Amount must be greater than 0"
                logger.error(error_msg)
                raise ValueError(error_msg)
        except (ValueError, TypeError):
            error_msg = f"Invalid amount: {payment_data['amount']}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Add webhook if secret exists
        if hasattr(settings, 'CHAPA_WEBHOOK_SECRET') and settings.CHAPA_WEBHOOK_SECRET:
            payment_data['receive_webhook'] = 1
            payment_data['webhook_url'] = f"{settings.FRONTEND_URL}/api/subscriptions/payment/webhook/"
        
        print(f"\n=== Sending to Chapa API ===")
        print(f"URL: {url}")
        print(f"Headers: {headers}")
        print(f"Data: {json.dumps(payment_data, indent=2)}")
        
        # Try multiple URL formats
        for current_url in alt_urls:
            try:
                print(f"\nTrying URL: {current_url}")
                response = requests.post(current_url, json=payment_data, headers=headers, timeout=30)
                
                print(f"\n=== Chapa Response ===")
                print(f"Status Code: {response.status_code}")
                print(f"Response: {response.text}")
                
                response.raise_for_status()
                
                result = response.json()
                print(f"\n=== Parsed Chapa Response ===")
                print(json.dumps(result, indent=2))
                
                # Process successful response
                if result.get('status') == 'success':
                    data = result.get('data', {})
                    
                    # Extract checkout_url
                    checkout_url = data.get('checkout_url')
                    if not checkout_url:
                        checkout_url = result.get('checkout_url')
                    
                    # Extract tx_ref
                    tx_ref = data.get('tx_ref', payment_data.get('tx_ref'))
                    if not tx_ref:
                        tx_ref = result.get('tx_ref', payment_data.get('tx_ref'))
                    
                    if not checkout_url:
                        return {
                            'status': 'failed',
                            'message': 'No checkout URL in response',
                            'data': result
                        }
                    
                    print(f"\n=== Extracted Data ===")
                    print(f"Checkout URL: {checkout_url}")
                    print(f"Transaction Ref: {tx_ref}")
                    
                    return {
                        'status': 'success',
                        'message': result.get('message', 'Payment initialized'),
                        'data': {
                            'checkout_url': checkout_url,
                            'tx_ref': tx_ref
                        }
                    }
                else:
                    # Try next URL if this one failed with "not found"
                    if result.get('message', '').lower().find('not found') != -1:
                        print(f"Endpoint not found, trying next URL...")
                        continue
                    
                    return {
                        'status': 'failed',
                        'message': result.get('message', 'Payment initialization failed'),
                        'data': result
                    }
                    
            except requests.exceptions.RequestException as e:
                print(f"Error with URL {current_url}: {str(e)}")
                if current_url == alt_urls[-1]:  # Last URL, re-raise the error
                    raise
                continue  # Try next URL
        
        # If all URLs failed
        raise Exception("All Chapa API endpoints failed")
        
    @staticmethod
    def initialize_payment_with_webhook(payment_data):
        """Initialize payment with webhook configuration"""
        try:
            # Get webhook secret from settings
            webhook_secret = getattr(settings, 'CHAPA_WEBHOOK_SECRET', None)
            
            if not webhook_secret:
                print("Warning: CHAPA_WEBHOOK_SECRET not set. Webhooks disabled.")
                # Fallback to regular initialization without webhook
                return ChapaPaymentService.initialize_payment(payment_data)
            
            # Add webhook configuration
            enhanced_data = payment_data.copy()
            enhanced_data['receive_webhook'] = 1
            enhanced_data['webhook_url'] = f"{settings.FRONTEND_URL}/api/subscriptions/payment/webhook/"
            
            # Add custom headers for webhook
            url = f"{settings.CHAPA_API_URL}/transaction/initialize"
            headers = {
                'Authorization': f'Bearer {settings.CHAPA_SECRET_KEY}',
                'Content-Type': 'application/json',
                'X-Webhook-Secret': webhook_secret,
            }
            
            print(f"\n=== Sending to Chapa API with Webhook ===")
            print(f"Webhook URL: {enhanced_data['webhook_url']}")
            print(f"Webhook Secret: {webhook_secret[:10]}...")
            
            response = requests.post(url, json=enhanced_data, headers=headers, timeout=30)
            
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('status') == 'success':
                    return {
                        'status': 'success',
                        'message': 'Payment initialized with webhook',
                        'data': {
                            'checkout_url': result['data']['checkout_url'],
                            'tx_ref': result['data']['tx_ref']
                        }
                    }
                else:
                    # Try without webhook if it fails
                    print("Webhook initialization failed, trying without...")
                    return ChapaPaymentService.initialize_payment(payment_data)
            else:
                return {
                    'status': 'error',
                    'message': f'HTTP {response.status_code}: {response.text}',
                    'data': None
                }
                
        except Exception as e:
            print(f"Webhook initialization error: {str(e)}")
            # Fallback to regular initialization
            return ChapaPaymentService.initialize_payment(payment_data)

    @staticmethod
    def verify_payment(transaction_ref):
        """
        Verify Chapa payment status
        """
        url = f"{settings.CHAPA_API_URL}/transaction/verify/{transaction_ref}"
        
        headers = {
            'Authorization': f'Bearer {settings.CHAPA_SECRET_KEY}'
        }
        
        logger.info(f"Verifying payment: {transaction_ref}")
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            logger.info(f"Verification Response: {response.status_code} - {response.text}")
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Chapa Verification Error: {e}")
            raise
    
    @staticmethod
    def verify_webhook_signature(payload, signature):
        """
        Verify Chapa webhook signature
        """
        secret = settings.CHAPA_WEBHOOK_SECRET.encode()
        expected_signature = hmac.new(secret, payload, hashlib.sha256).hexdigest()
        return hmac.compare_digest(signature, expected_signature)

    @staticmethod
    def get_test_credentials():
        """Get test credentials for development"""
        return {
            'public_key': settings.CHAPA_PUBLIC_KEY,
            'secret_key': settings.CHAPA_SECRET_KEY,
            'test_email': 'test@example.com',
            'test_amount': '100',
            'test_first_name': 'Test',
            'test_last_name': 'User',
            'test_phone': '0912345678'
        }