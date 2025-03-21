from django.contrib.auth import authenticate, login
from django.shortcuts import render, redirect
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.views.generic import TemplateView
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.contrib.sites.shortcuts import get_current_site
from django.urls import reverse
from authentication.serializers import RegisterSerializer, LoginSerializer
from accounts.serializers import UserProfileSerializer
from accounts.models import User
import json
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth import get_user_model
from django.http import JsonResponse
import random
from django.utils.crypto import get_random_string
from django.core.cache import cache
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import smart_bytes, smart_str
from django.contrib.auth import get_user_model
from .models import OTPVerification
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from .models import OTPVerification
from django.contrib.auth.hashers import make_password
from django.views.decorators.csrf import csrf_exempt

User = get_user_model()


def password_reset_page(request):
    return render(request, 'authentication/password_reset.html')

# Helper function to create JWT token
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def password_reset_request(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        if User.objects.filter(email=email).exists():
            otp = get_random_string(6, allowed_chars='0123456789')
            cache.set(f'reset_otp_{email}', otp, timeout=300)

            send_mail(
                'Password Reset OTP',
                f'Your OTP is: {otp}',
                'your_email@gmail.com',  
                [email],
                fail_silently=False,
            )

            return redirect('verify-otp', email=email)
        else:
            return render(request, 'authentication/password_reset.html', {'error': 'No account found with this email.'})

    return render(request, 'authentication/password_reset.html')

def password_reset_confirm(request, email):
    if request.method == 'POST':
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')

        if new_password != confirm_password:
            messages.error(request, 'Passwords do not match.')
        else:
            user = get_user_model().objects.get(email=email)
            user.set_password(new_password)
            user.save()
            messages.success(request, 'Password updated successfully!')
            return redirect('login-page')

    return render(request, 'authentication/password_reset_confirm.html', {'email': email})

def verify_otp(request, email):
    if request.method == 'POST':
        entered_otp = request.POST.get('otp')
        cached_otp = cache.get(f'reset_otp_{email}')

        if cached_otp and cached_otp == entered_otp:
            cache.delete(f'reset_otp_{email}')
            return redirect('password-reset-confirm', email=email)
        else:
            messages.error(request, 'Invalid OTP. Please try again.')

    return render(request, 'authentication/verify_otp.html', {'email': email})

class VerifyOTPReset(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')

        if not email or not otp or not new_password:
            return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

        cached_otp = cache.get(f"reset_otp_{email}")
        if cached_otp is None or cached_otp != otp:
            return Response({'error': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = get_user_model().objects.get(email=email)
            user.set_password(new_password)
            user.save()

            # Invalidate OTP after success
            cache.delete(f"reset_otp_{email}")

            return Response({'message': 'Password reset successful'}, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({'error': 'User with this email does not exist'}, status=status.HTTP_404_NOT_FOUND)


        
class RequestOTPReset(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.POST.get('email')  # Using request.POST here (from form submission)
        if not email:
            messages.error(request, 'Email is required.')
            return redirect('password-reset-page')

        try:
            user = get_user_model().objects.get(email=email)
        except get_user_model().DoesNotExist:
            messages.error(request, 'User with this email does not exist.')
            return redirect('password-reset-page')

        # Generate OTP
        otp = get_random_string(length=6, allowed_chars='1234567890')
        cache.set(f"reset_otp_{email}", otp, timeout=300)  # 5 minutes expiry

        # Send OTP to email
        send_mail(
            'Password Reset OTP',
            f'Your OTP code is: {otp}',
            'no-reply@unihub.com',
            [user.email],
            fail_silently=False,
        )

        messages.success(request, 'OTP sent to your email.')
        return redirect('verify-otp', email=email)
    
class DashboardView(TemplateView):
    template_name = "authentication/dashboard.html"
    
# Signup API (Register)
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
            verification_link = f"http://{get_current_site(request).domain}{reverse('email-verify', args=[token])}"
            send_mail(
                'Email Verification',
                f'Click the link to verify your email: {verification_link}',
                'no-reply@unihub.com',
                [user.email],
                fail_silently=False,
            )
            
            return Response({'message': 'User registered successfully. Check your email to verify your account.'}, status=status.HTTP_201_CREATED)
        return redirect('login-page')  


# Email Verification API
class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):  
        try:
            user = get_user_model().get(is_active=False)
            if default_token_generator.check_token(user, token):
                user.is_active = True
                user.save()
                return Response({'message': 'Email verified successfully!'}, status=status.HTTP_200_OK)
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class RequestPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = get_user_model().objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User with this email does not exist'}, status=status.HTTP_404_NOT_FOUND)

        # Generate a 6-digit OTP
        otp = get_random_string(length=6, allowed_chars='1234567890')
        
        # Save OTP in cache (valid for 5 minutes)
        cache.set(f"reset_otp_{email}", otp, timeout=300)

        # Send OTP via email
        send_mail(
            'Password Reset OTP',
            f'Your OTP for password reset is: {otp}\nThis OTP is valid for 5 minutes.',
            'no-reply@unihub.com',
            [user.email],
            fail_silently=False,
        )

        return Response({'message': 'OTP sent to email'}, status=status.HTTP_200_OK)

# Login API
class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(request, username=serializer.validated_data['email'], password=serializer.validated_data['password'] )
            if user:
                tokens = get_tokens_for_user(user)
                return Response({'tokens': tokens}, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
class PasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = get_user_model().objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User with this email does not exist'}, status=status.HTTP_404_NOT_FOUND)

        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(smart_bytes(user.pk))
        reset_link = f"{request.scheme}://{get_current_site(request).domain}{reverse('password-reset-confirm', args=[uid, token])}"


        # Send reset email
        send_mail(
            'Password Reset',
            f'Click the link to reset your password: {reset_link}',
            'no-reply@unihub.com',
            [user.email],
            fail_silently=False,
        )

        return Response({'message': 'Password reset email sent'}, status=status.HTTP_200_OK)
    

class ResetPasswordConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')

        if not email or not otp or not new_password:
            return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check OTP from cache
        cached_otp = cache.get(f"reset_otp_{email}")
        if cached_otp is None:
            return Response({'error': 'OTP expired or invalid'}, status=status.HTTP_400_BAD_REQUEST)

        if cached_otp != otp:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = get_user_model().objects.get(email=email)
            user.set_password(new_password)
            user.save()

            # Invalidate OTP after successful reset
            cache.delete(f"reset_otp_{email}")

            return Response({'message': 'Password reset successful'}, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({'error': 'User with this email does not exist'}, status=status.HTTP_404_NOT_FOUND)

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

# Signup Page (HTML)
def signup_page(request):
    if request.method == "POST":
        first_name = request.POST.get("first_name")
        last_name = request.POST.get("last_name")
        email = request.POST.get("email")
        username = request.POST.get("username")
        password = request.POST.get("password")
        date_of_birth = request.POST.get("date_of_birth")
        academic_year = request.POST.get("academic_year")

        # Check if the email or username is already in use
        if User.objects.filter(email=email).exists():
            messages.error(request, "Email is already registered.")
            return redirect("signup-page")

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username is already taken.")
            return redirect("signup-page")

        # Create and save the user
        user = User.objects.create_user(
            first_name=first_name,
            last_name=last_name,
            email=email,
            username=username,
            password=password,
            date_of_birth=date_of_birth,
            academic_year=academic_year,
        )

        # Generate JWT tokens for automatic login
        refresh = RefreshToken.for_user(user)
        request.session["access_token"] = str(refresh.access_token)
        request.session["refresh_token"] = str(refresh)

        login(request, user)  # Log in the user
        return redirect("dashboard")  # Redirect to dashboard after login

    return render(request, "authentication/signup.html")

@csrf_exempt  # Remove this if CSRF protection is required
def login_page(request):
    if request.method == "POST":
        try:
            if request.content_type == "application/json":
                data = json.loads(request.body.decode("utf-8"))  # Expecting JSON
                username = data.get("username")
                password = data.get("password")
            else:
                username = request.POST.get("username")  # Handle form data
                password = request.POST.get("password")

            if not username or not password:
                messages.error(request, "Username and password are required.")
                return redirect("login-page")

            user = authenticate(username=username, password=password)
            if user:
                login(request, user)

                # Ensure "dashboard" exists in `urls.py`
                return redirect("dashboard")  

            messages.error(request, "Invalid username or password.")
            return redirect("login-page")

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format"}, status=400)

    return render(request, "authentication/login.html")