from django.db import models

class NotificationType(models.TextChoices):
    GENERAL = 'general', 'General Notification'
    COMMUNITY_INVITE = 'community_invite', 'Community Invitation'
    COMMUNITY_JOIN_REQUEST = 'community_join_request', 'Community Join Request'
    COMMUNITY_JOIN_APPROVED = 'community_join_approved', 'Community Join Approved'
    COMMUNITY_JOIN_REJECTED = 'community_join_rejected', 'Community Join Rejected'
    COMMUNITY_NEW_POST = 'community_new_post', 'New Community Post'
    COMMUNITY_POST_UPDATED = 'community_post_updated', 'Community Post Updated'
    COMMUNITY_EVENT = 'community_event', 'Community Event'
    POST_UPVOTE = 'post_upvote', 'Post Upvote'
    COMMENT_UPVOTE = 'comment_upvote', 'Comment Upvote'
    COMMENT_REPLY = 'comment_reply', 'Comment Reply'
    MENTION = 'mention', 'Mention'
    ADMIN_ALERT = 'admin_alert', 'Admin Alert'