from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .models import Notification
from communities.models import Post, Comment, CommunityInvitation, Membership
from .utils import (
    notify_new_post,
    notify_post_upvote,
    notify_comment_upvote,
    notify_comment_reply,
    notify_community_invite,
    notify_community_join_request
)

@receiver(post_save, sender=Post)
def handle_new_post(sender, instance, created, **kwargs):
    """Handle new post creation"""
    if created:
        notify_new_post(instance)

@receiver(m2m_changed, sender=Post.upvotes.through)
def handle_post_upvote(sender, instance, action, pk_set, **kwargs):
    """Handle post upvotes"""
    if action == 'post_add':
        for user_id in pk_set:
            notify_post_upvote(instance, instance.upvotes.get(id=user_id))

@receiver(m2m_changed, sender=Comment.upvotes.through)
def handle_comment_upvote(sender, instance, action, pk_set, **kwargs):
    """Handle comment upvotes"""
    if action == 'post_add':
        for user_id in pk_set:
            notify_comment_upvote(instance, instance.upvotes.get(id=user_id))

@receiver(post_save, sender=Comment)
def handle_new_comment(sender, instance, created, **kwargs):
    """Handle new comment creation"""
    if created and instance.parent:
        notify_comment_reply(instance)

@receiver(post_save, sender=CommunityInvitation)
def handle_new_invitation(sender, instance, created, **kwargs):
    """Handle new community invitation"""
    if created:
        notify_community_invite(instance)

@receiver(post_save, sender=Membership)
def handle_new_membership_request(sender, instance, created, **kwargs):
    """Handle new membership request"""
    if created and instance.status == 'pending':
        notify_community_join_request(instance)