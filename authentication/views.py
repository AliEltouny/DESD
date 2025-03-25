import re
from django.contrib.auth import authenticate, login
from django.shortcuts import render, redirect
from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.views.generic import TemplateView
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.contrib.sites.shortcuts import get_current_site
from django.urls import reverse
from authentication.serializers import RegisterSerializer, LoginSerializer
from rest_framework import serializers
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
from django.contrib.auth.models import User

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
            user.is_active = False  # Email verification required
            user.save()

            # Generate OTP
            otp = get_random_string(length=6, allowed_chars='1234567890')
            cache.set(f"otp_{user.email}", otp, timeout=300)  # Cache the OTP for 5 minutes

            # Send OTP to email
            send_mail(
                'Email Verification OTP',
                f'Your OTP for email verification is: {otp}\nThis OTP is valid for 5 minutes.',
                'no-reply@unihub.com',
                [user.email],
                fail_silently=False,
            )

            # Redirect to OTP verification page
            return redirect('verify-signup-otp', email=user.email)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField()

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'username', 'password', 'date_of_birth', 'academic_year']
        extra_kwargs = {'password': {'write_only': True}}

    def validate_email(self, value):
        # Allow only emails from uwe.ac.uk and live.uwe.ac.uk
        if not re.match(r"^[a-zA-Z0-9._%+-]+@(uwe\.ac\.uk|live\.uwe\.ac\.uk)$", value):
            raise serializers.ValidationError("Email must be a UWE email (@uwe.ac.uk or @live.uwe.ac.uk).")
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one digit.")
        if not any(char.isalpha() for char in value):
            raise serializers.ValidationError("Password must contain at least one letter.")
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
    
class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, email):
        otp = request.data.get('otp')

        if not otp:
            return Response({'error': 'OTP is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Get the OTP from the cache
        cached_otp = cache.get(f"otp_{email}")

        if cached_otp and cached_otp == otp:
            # OTP is valid, activate the user
            try:
                user = get_user_model().objects.get(email=email)
                user.is_active = True
                user.save()

                # Invalidate the OTP after successful verification
                cache.delete(f"otp_{email}")

                return Response({'message': 'Email verified successfully!'}, status=status.HTTP_200_OK)

            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)

def verify_signup_otp(request, email):  # Accept email as a parameter
    if request.method == "GET":
        return render(request, 'authentication/verify_otp.html', {'email': email})

    elif request.method == "POST":
        entered_otp = request.POST.get('otp')

        # Check if the email is registered
        if not User.objects.filter(email=email).exists():
            messages.error(request, "Email not found. Please register first.")
            return redirect('signup-page')

        cached_otp = cache.get(f"otp_{email}")

        if entered_otp == cached_otp:
            # OTP is correct, activate the user
            user = User.objects.get(email=email)
            user.is_active = True
            user.save()

            # Generate JWT tokens for automatic login
            refresh = RefreshToken.for_user(user)
            request.session["access_token"] = str(refresh.access_token)
            request.session["refresh_token"] = str(refresh)

            login(request, user)
            return redirect('index')
        else:
            messages.error(request, "Invalid OTP. Please try again.")
            return redirect('verify-signup-otp', email=email)  # Pass the email back to the OTP page

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
                if not user.is_active:
                    # Redirect to OTP verification page if the user is not active
                    return redirect('verify-signup-otp', email=user.email)

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
        data = {
            "first_name": request.POST.get("first_name"),
            "last_name": request.POST.get("last_name"),
            "email": request.POST.get("email"),
            "username": request.POST.get("username"),
            "password": request.POST.get("password"),
            "date_of_birth": request.POST.get("date_of_birth"),
            "academic_year": request.POST.get("academic_year"),
        }

        serializer = RegisterSerializer(data=data)
        
        try:
            if serializer.is_valid(raise_exception=True):
                user = serializer.save()
                user.is_active = False  # Set user as inactive until email verification
                user.save()

                # Generate OTP for email verification
                otp = get_random_string(length=6, allowed_chars='1234567890')
                cache.set(f"otp_{user.email}", otp, timeout=300)  # Cache OTP for 5 minutes

                # Send OTP to user's email
                send_mail(
                    'Email Verification OTP',
                    f'Your OTP for email verification is: {otp}\nThis OTP is valid for 5 minutes.',
                    'no-reply@unihub.com',
                    [user.email],
                    fail_silently=False,
                )
                print(f"Generated OTP: {otp} for {user.email}")

                return redirect(reverse('verify-signup-otp', kwargs={'email': user.email}))
        except ValidationError as e:
            for field, errors in e.detail.items():
                for error in errors:
                    messages.error(request, f"{field}: {error}")
            return redirect("signup-page")

    return render(request, "authentication/signup.html")

from django.core.mail import send_mail
from django.conf import settings

def send_otp_email(email, otp):
    subject = "Your OTP Code"
    message = f"Your OTP code is {otp}. Please use this to verify your email."
    from_email = settings.DEFAULT_FROM_EMAIL

    try:
        send_mail(subject, message, from_email, [email])
    except Exception as e:
        print(f"Error sending OTP email: {e}")

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

                # Ensure "index" exists in `urls.py`
                return redirect("index")  

            messages.error(request, "Invalid username or password.")
            return redirect("login-page")

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format"}, status=400)

    return render(request, "authentication/login.html")

def index_page(request):
    return render(request, "pages/index.html")