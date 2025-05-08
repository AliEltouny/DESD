from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from django.db import models
from django.db.models import Count
from django.core.mail import send_mail
from django.conf import settings

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


@receiver(m2m_changed, sender=Post.event_participants.through)
def send_event_join_confirmation_email(sender, instance, action, pk_set, **kwargs):
    """
    Signal handler to send confirmation emails when a user joins an event post.
    This uses Django's signals to automatically detect when users are added to events.
    """
    # Only trigger when users are added to event_participants
    if action != 'post_add' or not pk_set:
        return
    
    # Skip if not an event post
    if instance.post_type != 'event':
        return
    
    # Skip if no event date
    if not instance.event_date:
        return
    
    # Get the community
    community = instance.community
    
    # Process each added user
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    for user_id in pk_set:
        try:
            user = User.objects.get(id=user_id)
            
            # Skip if no email
            if not user.email:
                continue
            
            # Format date with error handling
            try:
                formatted_date = instance.event_date.strftime('%A, %d %B %Y at %I:%M %p')
            except:
                formatted_date = "Date not available"
            
            # Create email content
            subject = f"You're Confirmed for {instance.title} 🎉"
            message = f"""Hi {user.first_name or user.username},

You're confirmed for the event:

📌 {instance.title}  
📍 Location: {instance.event_location or 'Not specified'}  
📅 Date & Time: {formatted_date}
🌐 Community: {community.name}

You can view the event details here:
{settings.FRONTEND_URL}/communities/{community.slug}/posts/{instance.id}

See you there!
UniHub Team
"""
            # Send the email
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True
            )
        except Exception as e:
            # Log but don't break the flow
            print(f"Failed to send confirmation email: {str(e)}")


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