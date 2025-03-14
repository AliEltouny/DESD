from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from django.contrib.auth.tokens import default_token_generator
from django.contrib.sites.shortcuts import get_current_site
from django.urls import reverse
from authentication.serializers import RegisterSerializer, LoginSerializer, PasswordResetSerializer
from accounts.serializers import UserProfileSerializer
from accounts.models import User

# Helper function to create JWT token
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

# Register API with Email Verification
class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.is_active = False  # Require email verification
            user.save()
            
            # Send Verification Email
            token = default_token_generator.make_token(user)
            verification_link = f"{get_current_site(request).domain}{reverse('email-verify', args=[token])}"
            send_mail(
                'Email Verification',
                f'Click the link to verify your email: {verification_link}',
                'no-reply@unihub.com',
                [user.email],
                fail_silently=False,
            )
            
            return Response({'message': 'User registered successfully. Check your email to verify your account.'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Login API
class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(email=serializer.validated_data['email'], password=serializer.validated_data['password'])
            if user:
                tokens = get_tokens_for_user(user)
                return Response({'tokens': tokens}, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_401_UNAUTHORIZED)

# Password Reset API
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.filter(email=email).first()
            if user:
                token = default_token_generator.make_token(user)
                reset_link = f"{get_current_site(request).domain}{reverse('password-reset-confirm', args=[token])}"
                send_mail(
                    'Password Reset Request',
                    f'Click the link to reset your password: {reset_link}',
                    'no-reply@unihub.com',
                    [email],
                    fail_silently=False,
                )
                return Response({'message': 'Password reset link sent to email'}, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid email address'}, status=status.HTTP_400_BAD_REQUEST)

# User Profile API
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

