"""
Join and leave event-type posts
"""
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from django.core.mail import send_mail
from django.conf import settings
import logging
import traceback

from ..models import Post, Community

# Set up logging
logger = logging.getLogger(__name__)

@extend_schema(
    summary="Join an event post",
    description="Allows a user to join an event-type post if they are authorized and the event isn't full",
    parameters=[
        OpenApiParameter(
            name="community_slug",
            description="The unique slug of the community that contains the event post",
            required=True,
            type=OpenApiTypes.STR,
            location=OpenApiParameter.PATH
        ),
        OpenApiParameter(
            name="post_id",
            description="The ID of the event post to join",
            required=True,
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH
        ),
    ],
    responses={
        200: OpenApiTypes.OBJECT,
        400: OpenApiTypes.OBJECT,
        403: OpenApiTypes.OBJECT,
        404: OpenApiTypes.OBJECT
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_event_post(request, community_slug, post_id):
    """Allow a user to join an event-type post"""
    # Get community and post objects
    community = get_object_or_404(Community, slug=community_slug)
    post = get_object_or_404(Post, id=post_id, community=community)
    
    # Verify this is an event post
    if post.post_type != 'event':
        return Response(
            {"detail": "This post is not an event."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if the user is already a participant
    if post.event_participants.filter(id=request.user.id).exists():
        return Response(
            {"detail": "You are already a participant of this event."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if the event is full
    if post.event_participant_limit is not None:
        if post.event_participants.count() >= post.event_participant_limit:
            return Response(
                {"detail": "This event is already full."},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # For private communities, check if user is a member
    if community.is_private and not community.members.filter(id=request.user.id).exists():
        return Response(
            {"detail": "You must be a member of this community to join its events."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Add user to event participants
    post.event_participants.add(request.user)
    
    # Send a direct email, bypassing the events app utility for maximum control
    email_status = "Not attempted"
    
    try:
        # Only proceed if we have the necessary data
        if not request.user.email:
            email_status = "No user email available"
        elif not post.event_date:
            email_status = "No event date available"
        else:
            # Format date with error handling
            try:
                formatted_date = post.event_date.strftime('%A, %d %B %Y at %I:%M %p')
            except Exception as date_error:
                formatted_date = "Date not available"
                logger.error(f"Date formatting error: {str(date_error)}")
                email_status = f"Date formatting error: {str(date_error)}"
            
            # Create email content
            subject = f"You're Confirmed for {post.title} 🎉"
            message = f"""Hi {request.user.first_name or request.user.username},

You're confirmed for the event:

📌 {post.title}  
📍 Location: {post.event_location or 'Not specified'}  
📅 Date & Time: {formatted_date}
🌐 Community: {community.name}

You can view the event details here:
{settings.FRONTEND_URL}/communities/{community.slug}/posts/{post.id}

See you there!
UniHub Team
"""
            # Send the email
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[request.user.email],
                    fail_silently=False
                )
                email_status = "Sent successfully"
            except Exception as mail_error:
                logger.error(f"Email sending error: {str(mail_error)}")
                traceback.print_exc()
                email_status = f"Failed to send: {str(mail_error)}"
    except Exception as e:
        logger.error(f"Unexpected error in email processing: {str(e)}")
        traceback.print_exc()
        email_status = f"Unexpected error: {str(e)}"
    
    return Response(
        {
            "detail": "You have successfully joined this event.",
            "participant_count": post.event_participants.count(),
            "email_status": email_status
        },
        status=status.HTTP_200_OK
    )

@extend_schema(
    summary="Leave an event post",
    description="Allows a user to leave an event-type post they previously joined",
    parameters=[
        OpenApiParameter(
            name="community_slug",
            description="The unique slug of the community that contains the event post",
            required=True,
            type=OpenApiTypes.STR,
            location=OpenApiParameter.PATH
        ),
        OpenApiParameter(
            name="post_id",
            description="The ID of the event post to leave",
            required=True,
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH
        ),
    ],
    responses={
        200: OpenApiTypes.OBJECT,
        400: OpenApiTypes.OBJECT,
        404: OpenApiTypes.OBJECT
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_event_post(request, community_slug, post_id):
    """Allow a user to leave an event-type post"""
    # Get community and post objects
    community = get_object_or_404(Community, slug=community_slug)
    post = get_object_or_404(Post, id=post_id, community=community)
    
    # Verify this is an event post
    if post.post_type != 'event':
        return Response(
            {"detail": "This post is not an event."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if the user is a participant
    if not post.event_participants.filter(id=request.user.id).exists():
        return Response(
            {"detail": "You are not a participant of this event."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Remove user from event participants
    post.event_participants.remove(request.user)
    
    return Response(
        {
            "detail": "You have successfully left this event.",
            "participant_count": post.event_participants.count()
        },
        status=status.HTTP_200_OK
    )