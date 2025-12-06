from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.middleware.csrf import get_token
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer
from .models import CustomUser


@method_decorator(ensure_csrf_cookie, name="dispatch")
class GetCSRFToken(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"success": "CSRF cookie set"})


class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Auto login after registration
        login(request, user)

        # Return user data
        headers = self.get_success_headers(serializer.data)
        return Response(
            {"user": UserSerializer(user).data, "message": "Registration successful"},
            status=status.HTTP_201_CREATED,
            headers=headers,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            password = serializer.validated_data["password"]

            try:
                user = CustomUser.objects.get(email=email)
                if user.check_password(password):
                    login(request, user)
                    user_data = UserSerializer(user).data
                    return Response(
                        {"user": user_data, "message": "Login successful"},
                        status=status.HTTP_200_OK,
                    )
                else:
                    return Response(
                        {"error": "Invalid credentials"},
                        status=status.HTTP_401_UNAUTHORIZED,
                    )
            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "Invalid credentials"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)


class UserProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UpdateProfileView(generics.UpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        # Handle both multipart/form-data and application/json
        data = request.data.copy()

        # Debug logging
        print(f"=== UPDATE PROFILE REQUEST ===")
        print(f"Data: {data}")
        print(f"Files: {request.FILES}")
        print(f"User: {instance.email}")

        # If profile_picture is an empty string or 'null', set it to None
        if "profile_picture" in data and (
            data["profile_picture"] == "" or data["profile_picture"] == "null"
        ):
            data["profile_picture"] = None

        # If there's a file in FILES, use it instead of the data value
        if "profile_picture" in request.FILES:
            data["profile_picture"] = request.FILES["profile_picture"]

        serializer = self.get_serializer(instance, data=data, partial=True)

        try:
            serializer.is_valid(raise_exception=True)
            updated_instance = serializer.save()  # Save returns the instance

            print(f"Update successful!")
            print(f"Updated instance: {updated_instance}")
            print(f"Profile picture: {updated_instance.profile_picture}")

            return Response(serializer.data)

        except Exception as e:
            print(f"=== UPDATE ERROR ===")
            print(f"Error: {str(e)}")
            print(f"Data: {data}")
            print(
                f"Serializer errors: {serializer.errors if hasattr(serializer, 'errors') else 'No serializer'}"
            )

            # Return detailed error information
            return Response(
                {
                    "error": str(e),
                    "detail": "Failed to update profile",
                    "serializer_errors": (
                        serializer.errors if hasattr(serializer, "errors") else None
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
