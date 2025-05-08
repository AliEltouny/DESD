from django.shortcuts import render, get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.http import JsonResponse
from django.conf import settings
import os

from users.models import User
from users.serializers import (
    UserRegistrationSerializer,
    OTPVerificationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
from users.utils import (
    generate_otp, save_otp, verify_otp, send_otp_email,
    generate_password_reset_token, send_password_reset_email
)

from .models import Testimonial, Message, MessageGroup
from .serializers import (
    TestimonialSerializer,
    MessageSerializer,
    MessageGroupSerializer,
    UserShortSerializer
)

# Import the Testimonial model and serializer
from .models import Testimonial
from .serializers import TestimonialSerializer

User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    """
    Register a new user, send OTP to their email, and return the email for OTP verification.
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate OTP, save it and send email
        otp = generate_otp()
        save_otp(user.email, otp)
        send_otp_email(user.email, otp)
        
        return Response({
            'message': 'User registration successful. Please verify your email with the OTP sent.',
            'email': user.email
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp_view(request, email):
    """
    Verify the OTP and activate the user.
    """
    serializer = OTPVerificationSerializer(data=request.data)
    if serializer.is_valid():
        otp = serializer.validated_data['otp']
        
        # Verify OTP
        if verify_otp(email, otp):
            # Activate user
            user = get_object_or_404(User, email=email)
            user.is_active = True
            user.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Email verified successfully.',
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        
        return Response({
            'message': 'Invalid or expired OTP.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Authenticate user and return JWT tokens.
    """
    serializer = UserLoginSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        # Return complete user data
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'date_of_birth': user.date_of_birth,
                'academic_year': user.academic_year,
                'address': user.address,
                'post_code': user.post_code,
                'study_program': user.study_program,
                'interests': user.interests,
                'bio': user.bio,
                'profile_picture': user.profile_picture.url if user.profile_picture else None,
                'rewards': user.rewards,
                'achievements': user.achievements
            }
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer
    
    def get_object(self):
        return self.request.user
    
    def retrieve(self, request):
        """
        Get current user's profile.
        """
        serializer = self.get_serializer(self.get_object())
        return Response(serializer.data)
    
    def partial_update(self, request):
        """
        Update current user's profile.
        """
        serializer = self.get_serializer(self.get_object(), data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Add the TestimonialViewSet
class TestimonialViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for retrieving testimonials.
    Only active testimonials are returned.
    """
    queryset = Testimonial.objects.filter(active=True)
    serializer_class = TestimonialSerializer
    permission_classes = [AllowAny]  # Allow public access to testimonials
    
    def list(self, request, *args, **kwargs):
        """Override list method to add debugging"""
        print(f"TestimonialViewSet: Total active testimonials: {self.queryset.count()}")
        print(f"TestimonialViewSet: All testimonials: {Testimonial.objects.all().count()}")
        
        # Get the queryset and serialize it
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        
        # Print the serialized data for debugging
        print(f"TestimonialViewSet: Serialized data: {serializer.data}")
        
        # Standard response format
        return Response({
            'count': queryset.count(),
            'next': None,
            'previous': None,
            'results': serializer.data
        })
    
    def get_serializer_context(self):
        """
        Extra context provided to the serializer class.
        """
        context = super().get_serializer_context()
        return context

#########################################################################

class MessageGroupViewSet(viewsets.ModelViewSet):
    serializer_class = MessageGroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MessageGroup.objects.filter(members=self.request.user)

    def perform_create(self, serializer):
        group = serializer.save()
        group.members.add(self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def add_member(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"detail": "user_id required"}, status=400)
        try:
            user = User.objects.get(id=user_id)
            group.members.add(user)
            return Response({"detail": "User added."})
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            Q(sender=user) |
            Q(recipient=user) |
            Q(group__members=user)
        ).distinct()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_search(request):
    print("AUTH HEADER:", request.META.get("HTTP_AUTHORIZATION"))
    print("COOKIES:", request.COOKIES)
    q = request.GET.get('q', '')
    search_type = request.GET.get('search_type', 'all')
    
    # Build the query based on search_type
    if search_type == 'username':
        query = Q(username__icontains=q)
    elif search_type == 'name':
        query = Q(first_name__icontains=q) | Q(last_name__icontains=q)
    elif search_type == 'full_name':
        # For full name search, look for first and last name combination
        names = q.split()
        if len(names) > 1:
            # If multiple words, try matching first and last name
            first = names[0]
            last = ' '.join(names[1:])
            query = Q(first_name__icontains=first, last_name__icontains=last)
        else:
            # If only one word, search in both first and last name
            query = Q(first_name__icontains=q) | Q(last_name__icontains=q)
    elif search_type == 'interest':
        query = Q(interests__icontains=q)
    else:  # 'all' or any other value
        query = Q(username__icontains=q) | \
                Q(email__icontains=q) | \
                Q(first_name__icontains=q) | \
                Q(last_name__icontains=q) | \
                Q(interests__icontains=q)
    
    users = User.objects.filter(query).exclude(id=request.user.id)[:10]
    serializer = UserShortSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_dm(request):
    other_user_id = request.data.get('user_id')
    if not other_user_id:
        return Response({'detail': 'user_id required'}, status=400)
    try:
        other_user = User.objects.get(id=other_user_id)
    except User.DoesNotExist:
        return Response({'detail': 'User not found'}, status=404)
    group = MessageGroup.objects.filter(
        is_direct=True,
        direct_users=request.user
    ).filter(
        direct_users=other_user
    ).first()
    if not group:
        group = MessageGroup.objects.create(is_direct=True)
        group.direct_users.set([request.user, other_user])
        group.members.set([request.user, other_user])
        group.save()
    serializer = MessageGroupSerializer(group)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def group_messages(request):
    print("AUTH HEADER:", request.META.get("HTTP_AUTHORIZATION"))
    print("COOKIES:", request.COOKIES)
    group_id = request.GET.get('group')
    if not group_id:
        return Response({'detail': 'Missing group query parameter.'}, status=400)
    try:
        group_id = int(group_id)
    except ValueError:
        return Response({'detail': 'Invalid group id.'}, status=400)
    # Check if the user is a member of the group
    try:
        group = MessageGroup.objects.get(id=group_id)
    except MessageGroup.DoesNotExist:
        return Response({'detail': 'Group not found.'}, status=404)
    if not group.members.filter(id=request.user.id).exists():
        return Response({'detail': 'You are not a member of this group.'}, status=403)
    messages = Message.objects.filter(group=group).order_by('created_at')
    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data)

#########################################################################################


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    """
    Request a password reset link to be sent to the user's email.
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            
            # Generate reset token
            token_data = generate_password_reset_token(user)
            
            # Create reset URL for frontend
            reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={token_data['uid']}&token={token_data['token']}"
            
            # Send email with reset link
            send_password_reset_email(user, reset_url)
            
            return Response({
                'message': 'Password reset link has been sent to your email.'
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            # We return 200 even if the user doesn't exist for security reasons
            return Response({
                'message': 'Password reset link has been sent to your email.'
            }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """
    Confirm a password reset by validating token and setting new password.
    """
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        new_password = serializer.validated_data['new_password']
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Password has been reset successfully.'
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
