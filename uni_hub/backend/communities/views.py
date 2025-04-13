from django.shortcuts import render, get_object_or_404
from django.db.models import Q, Count
from django.utils import timezone
from rest_framework import viewsets, status, generics, mixins
from rest_framework.decorators import action, api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.mail import send_mail
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import traceback
import json

from .models import Community, Membership, Post, Comment, CommunityInvitation
from .serializers import (
    CommunitySerializer, CommunityDetailSerializer, CommunityCreateSerializer,
    MembershipSerializer, PostSerializer, PostDetailSerializer,
    CommentSerializer, CommunityInvitationSerializer
)
from .permissions import (
    IsCommunityAdminOrReadOnly, IsCommunityMember,
    IsPostAuthorOrCommunityAdminOrReadOnly, IsCommentAuthorOrCommunityAdminOrReadOnly
)


@method_decorator(csrf_exempt, name='dispatch')
class CommunityViewSet(viewsets.ModelViewSet):
    """ViewSet for handling community operations"""
    queryset = Community.objects.all()
    serializer_class = CommunitySerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsCommunityAdminOrReadOnly]
    lookup_field = 'slug'  # Use slug in URL instead of primary key
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CommunityCreateSerializer
        if self.action == 'retrieve':
            return CommunityDetailSerializer
        return CommunitySerializer
    
    def create(self, request, *args, **kwargs):
        """Override create to add detailed debugging and error handling"""
        try:
            # Log request details
            print(f"REQUEST METHOD: {request.method}")
            print(f"REQUEST USER: {request.user.username if request.user.is_authenticated else 'Anonymous'}")
            print(f"REQUEST DATA: {request.data}")
            
            # Create serializer with request data
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                print(f"SERIALIZER ERRORS: {serializer.errors}")
                # Return validation errors in a consistent format
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Save the community without setting creator (will be set in serializer)
            community = serializer.save()
            
            # Create admin membership for creator
            Membership.objects.create(
                user=request.user,
                community=community,
                role='admin',
                status='approved'
            )
            
            # Return the created community data
            return Response(
                CommunitySerializer(community, context=self.get_serializer_context()).data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            print(f"ERROR IN CREATE: {str(e)}")
            print(traceback.format_exc())
            
            # Check if it's a duplicate key error
            if 'duplicate key' in str(e).lower() and 'communities_community_slug_key' in str(e).lower():
                return Response(
                    {"name": ["A community with this name already exists. Please choose a different name."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Return a generic error for other cases
            return Response(
                {"detail": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by search term
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search) |
                Q(tags__icontains=search)
            )
        
        # Filter by tag
        tag = self.request.query_params.get('tag', None)
        if tag:
            queryset = queryset.filter(tags__icontains=tag)
        
        # Only show communities the user is a member of
        member_of = self.request.query_params.get('member_of', None)
        if member_of and self.request.user.is_authenticated:
            queryset = queryset.filter(members=self.request.user)
        
        # Only show public communities or communities the user is a member of
        user = self.request.user
        if not user.is_authenticated:
            queryset = queryset.filter(is_private=False)
        else:
            queryset = queryset.filter(
                Q(is_private=False) | 
                Q(members=user)
            ).distinct()
        
        # Default ordering
        order_by = self.request.query_params.get('order_by', 'created_at')
        if order_by == 'name':
            queryset = queryset.order_by('name')
        elif order_by == 'member_count':
            queryset = queryset.annotate(member_count=Count('members')).order_by('-member_count')
        else:  # Default to most recent
            queryset = queryset.order_by('-created_at')
            
        return queryset
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def join(self, request, slug=None):
        """Join a community"""
        community = self.get_object()
        user = request.user
        
        # Check if user is already a member
        if Membership.objects.filter(user=user, community=community).exists():
            return Response(
                {"detail": "You are already a member of this community."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if community requires approval
        if community.requires_approval:
            # Create membership with pending status
            Membership.objects.create(
                user=user,
                community=community,
                role='member',
                status='pending'
            )
            return Response(
                {"detail": "Join request submitted. An admin will review your request."},
                status=status.HTTP_201_CREATED
            )
        else:
            # Direct join
            Membership.objects.create(
                user=user,
                community=community,
                role='member',
                status='approved'
            )
            return Response(
                {"detail": "You have successfully joined this community."},
                status=status.HTTP_201_CREATED
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def leave(self, request, slug=None):
        """Leave a community"""
        community = self.get_object()
        user = request.user
        
        # Get membership if exists
        try:
            membership = Membership.objects.get(user=user, community=community)
        except Membership.DoesNotExist:
            return Response(
                {"detail": "You are not a member of this community."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is the only admin
        if membership.role == 'admin':
            admin_count = Membership.objects.filter(
                community=community, 
                role='admin'
            ).count()
            
            if admin_count == 1:
                return Response(
                    {"detail": "You cannot leave the community as you are the only admin. Please make another user an admin first."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Delete the membership
        membership.delete()
        return Response(
            {"detail": "You have successfully left this community."},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, IsCommunityMember])
    def members(self, request, slug=None):
        """Get list of community members"""
        community = self.get_object()
        memberships = Membership.objects.filter(community=community, status='approved')
        
        # Optional role filter
        role = request.query_params.get('role', None)
        if role:
            memberships = memberships.filter(role=role)
        
        serializer = MembershipSerializer(memberships, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCommunityAdminOrReadOnly])
    def invite(self, request, slug=None):
        """Invite a user to join the community"""
        community = self.get_object()
        
        serializer = CommunityInvitationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            invitation = serializer.save(
                community=community,
                inviter=request.user,
                status='pending'
            )
            
            # Send invitation email
            subject = f"Invitation to join {community.name} on Uni Hub"
            message = f"""
            Hello,
            
            {request.user.first_name} {request.user.last_name} has invited you to join the {community.name} community on Uni Hub.
            
            {invitation.message if invitation.message else ''}
            
            You can join this community by creating an account or logging in at:
            {request.build_absolute_uri(f'/communities/{community.slug}')}
            
            Best regards,
            Uni Hub Team
            """
            
            try:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [invitation.invitee_email],
                    fail_silently=False,
                )
                invitation.is_sent = True
                invitation.sent_at = timezone.now()
                invitation.save()
            except Exception as e:
                return Response(
                    {"detail": f"Invitation created but email could not be sent: {str(e)}"},
                    status=status.HTTP_207_MULTI_STATUS
                )
            
            return Response(
                {"detail": "Invitation sent successfully."},
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['put'], permission_classes=[IsAuthenticated, IsCommunityAdminOrReadOnly])
    def update_member_role(self, request, slug=None):
        """Update a member's role in the community"""
        community = self.get_object()
        user_id = request.data.get('user_id')
        new_role = request.data.get('role')
        
        if not user_id or not new_role:
            return Response(
                {"detail": "User ID and role are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate the role
        valid_roles = [choice[0] for choice in Membership.ROLE_CHOICES]
        if new_role not in valid_roles:
            return Response(
                {"detail": f"Invalid role. Must be one of: {', '.join(valid_roles)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            membership = Membership.objects.get(user_id=user_id, community=community)
        except Membership.DoesNotExist:
            return Response(
                {"detail": "User is not a member of this community."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if trying to change own role
        if membership.user == request.user and new_role != 'admin':
            admin_count = Membership.objects.filter(
                community=community, 
                role='admin'
            ).count()
            
            if admin_count == 1:
                return Response(
                    {"detail": "You cannot change your role as you are the only admin."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        membership.role = new_role
        membership.save()
        
        return Response(
            {"detail": f"User role updated to {new_role}."},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['put'], permission_classes=[IsAuthenticated, IsCommunityAdminOrReadOnly])
    def approve_membership(self, request, slug=None):
        """Approve or reject a pending membership request"""
        community = self.get_object()
        user_id = request.data.get('user_id')
        approve = request.data.get('approve', True)
        
        if not user_id:
            return Response(
                {"detail": "User ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            membership = Membership.objects.get(
                user_id=user_id, 
                community=community,
                status='pending'
            )
        except Membership.DoesNotExist:
            return Response(
                {"detail": "No pending membership request found for this user."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if approve:
            membership.status = 'approved'
            membership.save()
            return Response(
                {"detail": "Membership request approved."},
                status=status.HTTP_200_OK
            )
        else:
            membership.status = 'rejected'
            membership.save()
            return Response(
                {"detail": "Membership request rejected."},
                status=status.HTTP_200_OK
            )


class PostViewSet(viewsets.ModelViewSet):
    """ViewSet for handling posts within a community"""
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsPostAuthorOrCommunityAdminOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PostDetailSerializer
        return PostSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by community
        community_slug = self.kwargs.get('community_slug')
        if community_slug:
            queryset = queryset.filter(community__slug=community_slug)
        
        # Filter by post type
        post_type = self.request.query_params.get('type', None)
        if post_type:
            queryset = queryset.filter(post_type=post_type)
        
        # Filter by search term
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(content__icontains=search)
            )
        
        # Only show posts the user has access to
        user = self.request.user
        if not user.is_authenticated:
            queryset = queryset.filter(community__is_private=False)
        else:
            queryset = queryset.filter(
                Q(community__is_private=False) | 
                Q(community__members=user)
            ).distinct()
        
        # Default ordering
        return queryset.order_by('-is_pinned', '-created_at')
    
    def perform_create(self, serializer):
        community_slug = self.kwargs.get('community_slug')
        community = get_object_or_404(Community, slug=community_slug)
        
        # Check if user is a member of the community
        if not Membership.objects.filter(
            user=self.request.user, 
            community=community,
            status='approved'
        ).exists():
            raise PermissionDenied("You must be a member of this community to post.")
        
        serializer.save(author=self.request.user, community=community)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def upvote(self, request, pk=None, community_slug=None):
        """Upvote a post"""
        post = self.get_object()
        user = request.user
        
        # Check if user is a member of the community
        if not Membership.objects.filter(
            user=user, 
            community=post.community,
            status='approved'
        ).exists():
            return Response(
                {"detail": "You must be a member of this community to upvote posts."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Toggle upvote
        if post.upvotes.filter(id=user.id).exists():
            post.upvotes.remove(user)
            return Response(
                {"detail": "Upvote removed."},
                status=status.HTTP_200_OK
            )
        else:
            post.upvotes.add(user)
            return Response(
                {"detail": "Post upvoted."},
                status=status.HTTP_200_OK
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCommunityAdminOrReadOnly])
    def toggle_pin(self, request, pk=None, community_slug=None):
        """Pin or unpin a post"""
        post = self.get_object()
        post.is_pinned = not post.is_pinned
        post.save()
        
        if post.is_pinned:
            return Response(
                {"detail": "Post pinned."},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"detail": "Post unpinned."},
                status=status.HTTP_200_OK
            )


class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet for handling comments on posts"""
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsCommentAuthorOrCommunityAdminOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by post
        post_id = self.kwargs.get('post_pk')
        if post_id:
            queryset = queryset.filter(post_id=post_id)
        
        # Filter for replies to a specific comment
        parent_id = self.request.query_params.get('parent', None)
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        else:
            # By default, show only top-level comments
            queryset = queryset.filter(parent=None)
        
        # Only show comments the user has access to
        user = self.request.user
        if not user.is_authenticated:
            queryset = queryset.filter(post__community__is_private=False)
        else:
            queryset = queryset.filter(
                Q(post__community__is_private=False) | 
                Q(post__community__members=user)
            ).distinct()
        
        return queryset
    
    def perform_create(self, serializer):
        post_id = self.kwargs.get('post_pk')
        post = get_object_or_404(Post, id=post_id)
        
        # Check if user is a member of the community
        if not Membership.objects.filter(
            user=self.request.user, 
            community=post.community,
            status='approved'
        ).exists():
            raise PermissionDenied("You must be a member of this community to comment.")
        
        parent_id = self.request.data.get('parent')
        parent = None
        if parent_id:
            parent = get_object_or_404(Comment, id=parent_id, post=post)
        
        serializer.save(author=self.request.user, post=post, parent=parent)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def upvote(self, request, pk=None, post_pk=None, community_slug=None):
        """Upvote a comment"""
        comment = self.get_object()
        user = request.user
        
        # Check if user is a member of the community
        if not Membership.objects.filter(
            user=user, 
            community=comment.post.community,
            status='approved'
        ).exists():
            return Response(
                {"detail": "You must be a member of this community to upvote comments."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Toggle upvote
        if comment.upvotes.filter(id=user.id).exists():
            comment.upvotes.remove(user)
            return Response(
                {"detail": "Upvote removed."},
                status=status.HTTP_200_OK
            )
        else:
            comment.upvotes.add(user)
            return Response(
                {"detail": "Comment upvoted."},
                status=status.HTTP_200_OK
            )
