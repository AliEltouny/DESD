from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from django.db import models
from django.db.models import Count
from django.core.cache import cache

from .models import Community, Membership, Post, Comment


@receiver(post_save, sender=Community)
def invalidate_community_cache(sender, instance, **kwargs):
    """Invalidate cache for community by slug when it's updated"""
    # Clear the cached community lookup by slug
    cache_key = f"community:slug:{instance.slug}"
    cache.delete(cache_key)
    
    # Clear related serializer cache keys
    cache.delete(f"community:post_count:{instance.id}")
    cache.delete(f"community:recent_posts:{instance.id}")
    cache.delete(f"community:admins:{instance.id}")
    
    # Also clear any cached community-related querysets
    cache.delete_pattern("cache_queryset:CommunityService:get_community_queryset*")
    cache.delete_pattern(f"cached_method:*:get_community_members*{instance.id}*")


@receiver(post_save, sender=Membership)
@receiver(post_delete, sender=Membership)
def update_community_member_count(sender, instance, **kwargs):
    """Update the member count cache when a membership is created, updated or deleted"""
    community = instance.community
    user = instance.user
    
    # Use update to avoid triggering other signals
    Community.objects.filter(id=community.id).update(
        member_count_cache=Membership.objects.filter(
            community=community,
            status='approved'
        ).count()
    )
    
    # Clear cached members list
    cache_key = f"cached_method:CommunityService:get_community_members:{community.id}"
    cache.delete_pattern(f"{cache_key}*")
    
    # Clear post visibility cache keys
    cache.delete(f"membership_status:{community.id}:{user.id}")
    cache.delete(f"post_creation_permission:{community.id}:{user.id}")
    
    # Clear cached post querysets for this user and community
    cache.delete_pattern(f"cache_queryset:PostService:get_post_queryset:*user={user.id}*community={community.slug}*")
    
    # Clear community membership status cache
    cache.delete(f"community_membership:{community.slug}:{user.id}")
    
    # Force refresh any cached post lists
    cache.delete_pattern(f"post_list:{community.slug}:*")


@receiver(post_save, sender=Comment)
@receiver(post_delete, sender=Comment)
def update_post_comment_count(sender, instance, **kwargs):
    """Update the comment count cache when a comment is created, updated or deleted"""
    post = instance.post
    # Use update to avoid triggering other signals
    Post.objects.filter(id=post.id).update(
        comment_count_cache=Comment.objects.filter(post=post).count()
    )


@receiver(m2m_changed, sender=Post.upvotes.through)
def update_post_upvote_count(sender, instance, action, **kwargs):
    """Update the upvote count cache when the post upvotes M2M is changed"""
    if action in ('post_add', 'post_remove', 'post_clear'):
        # Only update on changes
        Post.objects.filter(id=instance.id).update(
            upvote_count_cache=instance.upvotes.count()
        )


@receiver(m2m_changed, sender=Comment.upvotes.through)
def update_comment_upvote_count(sender, instance, action, **kwargs):
    """Update the upvote count cache when the comment upvotes M2M is changed"""
    if action in ('post_add', 'post_remove', 'post_clear'):
        # Only update on changes
        Comment.objects.filter(id=instance.id).update(
            upvote_count_cache=instance.upvotes.count()
        )


# Batch update function for maintenance or migrations
def update_all_cache_counts():
    """Update all cache counters in the database"""
    
    # Update community member counts
    communities = Community.objects.all()
    for community in communities:
        Community.objects.filter(id=community.id).update(
            member_count_cache=Membership.objects.filter(
                community=community,
                status='approved'
            ).count()
        )
    
    # Update post comment counts
    posts = Post.objects.all()
    for post in posts:
        Post.objects.filter(id=post.id).update(
            comment_count_cache=Comment.objects.filter(post=post).count(),
            upvote_count_cache=post.upvotes.count()
        )
    
    # Update comment upvote counts
    comments = Comment.objects.all()
    for comment in comments:
        Comment.objects.filter(id=comment.id).update(
            upvote_count_cache=comment.upvotes.count()
        ) 