from django.shortcuts import get_object_or_404
from django.db.models import Q, Prefetch
from rest_framework.exceptions import PermissionDenied

from ..models import Community, Membership, Post, Comment


class PostService:
    """Service class for post operations"""
    
    @staticmethod
    def get_post_queryset(user, community_slug=None, post_type=None, search=None):
        """
        Get a filtered queryset of posts based on parameters.
        """
        queryset = Post.objects.all()
        
        # Add select_related for foreign keys
        queryset = queryset.select_related('community', 'author')
        
        # Add prefetch_related for reverse relations and many-to-many
        queryset = queryset.prefetch_related(
            'upvotes',
            Prefetch(
                'comments',
                queryset=Comment.objects.filter(parent=None).select_related('author'),
                to_attr='top_level_comments'
            )
        )
        
        # Filter by community
        if community_slug:
            queryset = queryset.filter(community__slug=community_slug)
        
        # Filter by post type
        if post_type:
            queryset = queryset.filter(post_type=post_type)
        
        # Filter by search term
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(content__icontains=search)
            )
        
        # Only show posts the user has access to
        if not user.is_authenticated:
            queryset = queryset.filter(community__is_private=False)
        else:
            queryset = queryset.filter(
                Q(community__is_private=False) | 
                Q(community__members=user)
            ).distinct()
        
        # Default ordering
        return queryset.order_by('-is_pinned', '-created_at')
    
    @staticmethod
    def validate_post_creation(user, community):
        """
        Validate that a user can create a post in a community.
        Raises PermissionDenied if validation fails.
        Returns (validated, membership) tuple otherwise.
        """
        # If user is the creator
        if community.creator == user or community.creator_id == user.id:
            # Ensure creator has admin membership
            membership, created = Membership.objects.get_or_create(
                user=user,
                community=community,
                defaults={'role': 'admin', 'status': 'approved'}
            )
            return True, membership
        
        # If user is a member
        try:
            membership = Membership.objects.get(
                user=user, 
                community=community,
                status='approved'
            )
            return True, membership
        except Membership.DoesNotExist:
            raise PermissionDenied("You must be a member of this community to post.")
    
    @staticmethod
    def toggle_post_upvote(post, user):
        """
        Toggle upvote on a post.
        Returns (upvoted, message)
        """
        # Check if user is a member of the community OR is the creator
        is_member = Membership.objects.filter(
            user=user, 
            community=post.community,
            status='approved'
        ).exists()
        
        is_creator = post.community.creator == user
        
        if not (is_member or is_creator):
            return False, "You must be a member of this community to upvote posts."
        
        # Toggle upvote
        if post.upvotes.filter(id=user.id).exists():
            post.upvotes.remove(user)
            return False, "Upvote removed."
        else:
            post.upvotes.add(user)
            return True, "Post upvoted."
    
    @staticmethod
    def toggle_post_pin(post):
        """
        Toggle pin status on a post.
        Returns (pinned, message)
        """
        post.is_pinned = not post.is_pinned
        post.save()
        
        if post.is_pinned:
            return True, "Post pinned."
        else:
            return False, "Post unpinned." 