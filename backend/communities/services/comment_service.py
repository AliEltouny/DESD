from django.shortcuts import get_object_or_404
from django.db.models import Q, Prefetch
from rest_framework.exceptions import PermissionDenied

from ..models import Post, Comment, Membership


class CommentService:
    """Service class for comment operations"""
    
    @staticmethod
    def get_comment_queryset(user, post_id=None, parent_id=None):
        """
        Get a filtered queryset of comments based on parameters.
        """
        queryset = Comment.objects.all()
        
        # Add select_related for foreign keys
        queryset = queryset.select_related('post', 'author', 'parent', 'post__community')
        
        # Add prefetch_related for reverse relations and many-to-many
        queryset = queryset.prefetch_related(
            'upvotes',
            Prefetch(
                'replies',
                queryset=Comment.objects.select_related('author').prefetch_related('upvotes'),
                to_attr='nested_replies'
            )
        )
        
        # Filter by post
        if post_id:
            queryset = queryset.filter(post_id=post_id)
        
        # Filter for replies to a specific comment
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        else:
            # By default, show only top-level comments
            queryset = queryset.filter(parent=None)
        
        # Only show comments the user has access to
        if not user.is_authenticated:
            queryset = queryset.filter(post__community__is_private=False)
        else:
            queryset = queryset.filter(
                Q(post__community__is_private=False) | 
                Q(post__community__members=user)
            ).distinct()
        
        return queryset
    
    @staticmethod
    def validate_comment_creation(user, post, parent_id=None):
        """
        Validate that a user can create a comment.
        Returns (parent_comment, can_comment)
        Raises PermissionDenied if validation fails.
        """
        # Check if user is a member of the community OR is the creator
        is_member = Membership.objects.filter(
            user=user, 
            community=post.community,
            status='approved'
        ).exists()
        
        is_creator = post.community.creator == user
        
        if not (is_member or is_creator):
            raise PermissionDenied("You must be a member of this community to comment.")
        
        # Process parent comment if provided
        parent = None
        if parent_id:
            parent = get_object_or_404(Comment, id=parent_id, post=post)
        
        return parent
    
    @staticmethod
    def toggle_comment_upvote(comment, user):
        """
        Toggle upvote on a comment.
        Returns (upvoted, message)
        """
        # Check if user is a member of the community OR is the creator
        is_member = Membership.objects.filter(
            user=user, 
            community=comment.post.community,
            status='approved'
        ).exists()
        
        is_creator = comment.post.community.creator == user
        
        if not (is_member or is_creator):
            return False, "You must be a member of this community to upvote comments."
        
        # Toggle upvote
        if comment.upvotes.filter(id=user.id).exists():
            comment.upvotes.remove(user)
            return False, "Upvote removed."
        else:
            comment.upvotes.add(user)
            return True, "Comment upvoted." 