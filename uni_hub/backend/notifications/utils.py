from django.contrib.contenttypes.models import ContentType
from .models import Notification, NotificationPreference
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.utils.html import strip_tags

def create_notification(
    recipient,
    notification_type,
    title,
    message,
    sender=None,
    content_object=None
):
    """Create a new notification for a user"""
    
    # Check user preferences
    try:
        preferences = recipient.notification_preferences
    except NotificationPreference.DoesNotExist:
        preferences = NotificationPreference.objects.create(user=recipient)
    
    # Check if this type of notification is enabled
    if not is_notification_enabled(preferences, notification_type):
        return None
    
    # Create the notification
    notification = Notification.objects.create(
        recipient=recipient,
        sender=sender,
        notification_type=notification_type,
        title=title,
        message=message,
    )
    
    # Link to content object if provided
    if content_object:
        notification.content_type = ContentType.objects.get_for_model(content_object)
        notification.object_id = content_object.id
        notification.save()
    
    # Send email if enabled
    if should_send_email(preferences, notification_type):
        send_notification_email(notification)
    
    return notification

def is_notification_enabled(preferences, notification_type):
    """Check if a notification type is enabled in user preferences"""
    mapping = {
        'community_invite': preferences.community_invites,
        'community_join_request': preferences.community_join_requests,
        'community_join_approved': preferences.community_join_requests,
        'community_join_rejected': preferences.community_join_requests,
        'community_new_post': preferences.community_new_posts,
        'community_post_updated': preferences.community_post_updates,
        'post_upvote': preferences.post_upvotes,
        'comment_upvote': preferences.comment_upvotes,
        'comment_reply': preferences.comment_replies,
        'mention': preferences.mention_notifications,
    }
    
    return mapping.get(notification_type, True)

def should_send_email(preferences, notification_type):
    """Check if an email should be sent for this notification type"""
    if not preferences.push_notifications:
        return False
    
    if notification_type in ['community_invite'] and preferences.email_community_invites:
        return True
    if notification_type in ['community_new_post', 'community_post_updated'] and preferences.email_community_updates:
        return True
    if notification_type in ['post_upvote', 'comment_upvote', 'comment_reply', 'mention'] and preferences.email_engagement:
        return True
    
    return False

def send_notification_email(notification):
    """Send an email notification"""
    subject = f"Uni Hub Notification: {notification.title}"
    
    # Render HTML email template
    html_message = render_to_string('notifications/email_notification.html', {
        'notification': notification,
        'site_name': 'Uni Hub'
    })
    
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [notification.recipient.email],
        html_message=html_message,
        fail_silently=True
    )

def notify_community_invite(invitation):
    """Create notification for community invitation"""
    title = f"You've been invited to join {invitation.community.name}"
    message = f"{invitation.inviter.get_full_name()} has invited you to join the {invitation.community.name} community."
    
    return create_notification(
        recipient=invitation.invitee,
        notification_type='community_invite',
        title=title,
        message=message,
        sender=invitation.inviter,
        content_object=invitation
    )

def notify_community_join_request(membership):
    """Create notification for community join request"""
    title = f"New join request for {membership.community.name}"
    message = f"{membership.user.get_full_name()} has requested to join your community."
    
    # Notify all community admins
    admins = membership.community.membership_set.filter(role__in=['admin', 'moderator'])
    for admin in admins:
        create_notification(
            recipient=admin.user,
            notification_type='community_join_request',
            title=title,
            message=message,
            sender=membership.user,
            content_object=membership
        )

def notify_community_join_decision(membership, approved=True):
    """Notify user about their join request decision"""
    if approved:
        title = f"Your request to join {membership.community.name} was approved"
        message = f"You are now a member of {membership.community.name}."
        notification_type = 'community_join_approved'
    else:
        title = f"Your request to join {membership.community.name} was rejected"
        message = f"Your request to join {membership.community.name} was not approved."
        notification_type = 'community_join_rejected'
    
    return create_notification(
        recipient=membership.user,
        notification_type=notification_type,
        title=title,
        message=message,
        content_object=membership.community
    )

def notify_new_post(post):
    """Notify community members about a new post"""
    title = f"New post in {post.community.name}: {post.title}"
    message = f"{post.author.get_full_name()} has posted in {post.community.name}."
    
    # Get all community members who want this notification
    members = post.community.members.filter(
        notification_preferences__community_new_posts=True
    ).exclude(id=post.author.id)
    
    for member in members:
        create_notification(
            recipient=member,
            notification_type='community_new_post',
            title=title,
            message=message,
            sender=post.author,
            content_object=post
        )

def notify_post_upvote(post, upvoter):
    """Notify post author about an upvote"""
    if post.author == upvoter:
        return None
    
    title = f"Your post was upvoted: {post.title}"
    message = f"{upvoter.get_full_name()} upvoted your post in {post.community.name}."
    
    return create_notification(
        recipient=post.author,
        notification_type='post_upvote',
        title=title,
        message=message,
        sender=upvoter,
        content_object=post
    )

def notify_comment_upvote(comment, upvoter):
    """Notify comment author about an upvote"""
    if comment.author == upvoter:
        return None
    
    title = f"Your comment was upvoted"
    message = f"{upvoter.get_full_name()} upvoted your comment on {comment.post.title}."
    
    return create_notification(
        recipient=comment.author,
        notification_type='comment_upvote',
        title=title,
        message=message,
        sender=upvoter,
        content_object=comment
    )

def notify_comment_reply(comment):
    """Notify parent comment author about a reply"""
    if not comment.parent or comment.parent.author == comment.author:
        return None
    
    title = f"New reply to your comment"
    message = f"{comment.author.get_full_name()} replied to your comment on {comment.post.title}."
    
    return create_notification(
        recipient=comment.parent.author,
        notification_type='comment_reply',
        title=title,
        message=message,
        sender=comment.author,
        content_object=comment
    )