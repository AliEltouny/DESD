from django.shortcuts import get_object_or_404
from django.db.models import Q, Prefetch
from rest_framework.exceptions import PermissionDenied
from django.core.cache import cache
import logging

from ..models import Community, Membership, Post, Comment


class PostService:
    """Service class for post operations"""
    
    @staticmethod
    def get_post_queryset(user, community_slug=None, post_type=None, search=None):
        """
        Get a filtered queryset of posts based on parameters.
        """
        logger = logging.getLogger(__name__)
        
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
            
            # Debug logging
            try:
                logger.info(f"Post visibility debug for community '{community_slug}':")
                is_authenticated = user.is_authenticated if user else False
                logger.info(f"User is authenticated: {is_authenticated}")
                
                if is_authenticated:
                    # Check cache for membership status
                    cache_key = f"community_membership:{community_slug}:{user.id}"
                    membership_info = cache.get(cache_key)
                    
                    if membership_info is None:
                        # Not in cache, query database
                        is_member = Membership.objects.filter(
                            user=user,
                            community__slug=community_slug,
                            status='approved'
                        ).exists()
                        
                        is_admin = Membership.objects.filter(
                            user=user,
                            community__slug=community_slug,
                            status='approved',
                            role='admin'
                        ).exists()
                        
                        # Cache the result (shorter timeout to avoid stale data)
                        membership_info = {'is_member': is_member, 'is_admin': is_admin}
                        cache.set(cache_key, membership_info, 180)  # 3 minute cache
                    else:
                        is_member = membership_info.get('is_member', False)
                        is_admin = membership_info.get('is_admin', False)
                    
                    logger.info(f"User is member: {is_member}, is admin: {is_admin}")
                    
                    # Count posts by visibility
                    total_posts = Post.objects.filter(community__slug=community_slug).count()
                    public_posts = Post.objects.filter(community__slug=community_slug, visibility='public').count()
                    member_posts = Post.objects.filter(community__slug=community_slug, visibility='members').count()
                    admin_posts = Post.objects.filter(community__slug=community_slug, visibility='admin').count()
                    
                    logger.info(f"Post counts - Total: {total_posts}, Public: {public_posts}, Members: {member_posts}, Admin: {admin_posts}")
            except Exception as e:
                logger.error(f"Error in visibility debug logging: {str(e)}")
        
        # Filter by post type
        if post_type:
            queryset = queryset.filter(post_type=post_type)
        
        # Filter by search term
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(content__icontains=search)
            )
        
        # Filter posts based on visibility and user access
        if not user or not user.is_authenticated:
            # For unauthenticated users, only show public posts in public communities
            queryset = queryset.filter(
                community__is_private=False,
                visibility='public'
            )
        else:
            # Get a list of communities where the user is an approved member
            # Check cache first
            cache_key = f"user_memberships:{user.id}"
            member_communities = cache.get(cache_key)
            
            if member_communities is None:
                member_communities = list(Membership.objects.filter(
                    user=user,
                    status='approved'
                ).values_list('community_id', flat=True))
                
                # Cache for a short time
                cache.set(cache_key, member_communities, 180)  # 3 minute cache
            
            # Get a list of communities where the user is an admin
            cache_key = f"user_admin_memberships:{user.id}"
            admin_communities = cache.get(cache_key)
            
            if admin_communities is None:
                admin_communities = list(Membership.objects.filter(
                    user=user,
                    status='approved',
                    role='admin'
                ).values_list('community_id', flat=True))
                
                # Cache for a short time
                cache.set(cache_key, admin_communities, 180)  # 3 minute cache
            
            # Always double-check membership for a specific community slug if provided
            # This ensures we don't rely solely on cached data that might be stale
            if community_slug:
                # Get the community ID
                community = Community.get_by_slug(community_slug)
                if community:
                    # Verify actual membership in database if this is a specific community query
                    is_member = Membership.objects.filter(
                        user=user,
                        community_id=community.id,
                        status='approved'
                    ).exists()
                    
                    # If there's a discrepancy between cache and actual membership,
                    # update our working lists and invalidate the cache
                    if is_member and community.id not in member_communities:
                        member_communities.append(community.id)
                        cache.delete(f"user_memberships:{user.id}")
                    elif not is_member and community.id in member_communities:
                        # Remove from our working list
                        if community.id in member_communities:
                            member_communities.remove(community.id)
                        # Also remove from admin communities if present
                        if community.id in admin_communities:
                            admin_communities.remove(community.id)
                        # Invalidate caches
                        cache.delete(f"user_memberships:{user.id}")
                        cache.delete(f"user_admin_memberships:{user.id}")
            
            # For non-private communities, show public posts (regardless of membership)
            public_communities_posts = Q(
                community__is_private=False, 
                visibility='public'
            )
            
            # For communities the user is a member of, show public and members-only posts
            member_communities_posts = Q(
                community_id__in=member_communities,
                visibility__in=['public', 'members']
            )
            
            # For communities where the user is an admin, show all posts
            admin_communities_posts = Q(
                community_id__in=admin_communities
            )
            
            # Combine filters for final query
            queryset = queryset.filter(
                public_communities_posts | member_communities_posts | admin_communities_posts
            ).distinct()
        
        # Default ordering
        filtered_queryset = queryset.order_by('-is_pinned', '-created_at')
        
        # Log the final count for debugging
        if community_slug:
            try:
                logger.info(f"Final filtered post count: {filtered_queryset.count()}")
            except Exception as e:
                logger.error(f"Error getting final post count: {str(e)}")
        
        return filtered_queryset
    
    @staticmethod
    def validate_post_creation(user, community):
        """
        Validate that a user can create a post in a community.
        Raises PermissionDenied if validation fails.
        Returns (validated, membership) tuple otherwise.
        """
        # Check cache first for membership validation
        cache_key = f"post_creation_permission:{community.id}:{user.id}"
        cached_result = cache.get(cache_key)
        
        if cached_result:
            if cached_result == "denied":
                raise PermissionDenied("You must be a member of this community to post.")
            return True, cached_result
            
        # If user is the creator
        if community.creator == user or community.creator_id == user.id:
            # Ensure creator has admin membership
            membership, created = Membership.objects.get_or_create(
                user=user,
                community=community,
                defaults={'role': 'admin', 'status': 'approved'}
            )
            # Cache the result for 5 minutes
            cache.set(cache_key, membership, 300)
            return True, membership
        
        # If user is a member
        try:
            # Use more efficient query with index
            membership = Membership.objects.select_related('user', 'community').get(
                user_id=user.id, 
                community_id=community.id,
                status='approved'
            )
            # Cache the result for 5 minutes
            cache.set(cache_key, membership, 300)
            return True, membership
        except Membership.DoesNotExist:
            # Cache the denial for 1 minute (shorter time for denials)
            cache.set(cache_key, "denied", 60)
            raise PermissionDenied("You must be a member of this community to post.")
    
    @staticmethod
    def toggle_post_upvote(post, user):
        """
        Toggle upvote on a post.
        Returns (upvoted, message)
        """
        # Check if user is a member of the community OR is the creator
        # Check cache first
        membership_key = f"membership_status:{post.community_id}:{user.id}"
        is_member = cache.get(membership_key)
        
        if is_member is None:
            # Not in cache, check database
            is_member = Membership.objects.filter(
                user_id=user.id, 
                community_id=post.community_id,
                status='approved'
            ).exists()
            # Cache result for 5 minutes
            cache.set(membership_key, is_member, 300)
        
        is_creator = post.community.creator_id == user.id
        
        if not (is_member or is_creator):
            return False, "You must be a member of this community to upvote posts."
        
        # Toggle upvote
        if post.upvotes.filter(id=user.id).exists():
            post.upvotes.remove(user)
            # Update cache
            post.upvote_count_cache = max(0, post.upvote_count_cache - 1)
            post.save(update_fields=['upvote_count_cache'])
            return False, "Upvote removed."
        else:
            post.upvotes.add(user)
            # Update cache
            post.upvote_count_cache = post.upvote_count_cache + 1
            post.save(update_fields=['upvote_count_cache'])
            return True, "Post upvoted."
    
    @staticmethod
    def toggle_post_pin(post):
        """
        Toggle pin status on a post.
        Returns (pinned, message)
        """
        post.is_pinned = not post.is_pinned
        post.save(update_fields=['is_pinned'])
        
        if post.is_pinned:
            return True, "Post pinned."
        else:
            return False, "Post unpinned." 
    
    @staticmethod
    def bulk_create_posts(community, user, post_data_list):
        """
        Bulk create multiple posts in one database operation.
        Returns the created posts.
        """
        # Validate user can create posts in this community
        PostService.validate_post_creation(user, community)
        
        # Prepare post objects
        posts = []
        for post_data in post_data_list:
            post = Post(
                community=community,
                author=user,
                title=post_data.get('title', ''),
                content=post_data.get('content', ''),
                post_type=post_data.get('post_type', 'discussion'),
                event_date=post_data.get('event_date'),
                event_location=post_data.get('event_location', ''),
                is_pinned=post_data.get('is_pinned', False),
            )
            posts.append(post)
        
        # Bulk create posts
        created_posts = Post.objects.bulk_create(posts)
        
        return created_posts 