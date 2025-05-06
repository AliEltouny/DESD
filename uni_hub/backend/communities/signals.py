from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from django.db import models
from django.db.models import Count

from .models import Community, Membership, Post, Comment


@receiver(post_save, sender=Membership)
@receiver(post_delete, sender=Membership)
def update_community_member_count(sender, instance, **kwargs):
    """Update the member count cache when a membership is created, updated or deleted"""
    community = instance.community
    # Use update to avoid triggering other signals
    Community.objects.filter(id=community.id).update(
        member_count_cache=Membership.objects.filter(
            community=community,
            status='approved'
        ).count()
    )


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