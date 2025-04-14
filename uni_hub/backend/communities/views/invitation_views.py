from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, extend_schema_view

from ..models import CommunityInvitation, Community
from ..serializers import CommunityInvitationSerializer
from ..permissions import IsCommunityAdminOrReadOnly
from ..services.community_service import CommunityService


@extend_schema_view(
    list=extend_schema(
        summary="List Invitations",
        description="List invitations sent by the current user or for communities they admin.",
    ),
    retrieve=extend_schema(
        summary="Get Invitation Details",
        description="Retrieve details of a specific invitation.",
    ),
    create=extend_schema(
        summary="Create Invitation",
        description="Create a new invitation to a community.",
    ),
    destroy=extend_schema(
        summary="Delete Invitation",
        description="Delete an invitation.",
    ),
)
class CommunityInvitationViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet
):
    """
    ViewSet for handling community invitations.
    """
    serializer_class = CommunityInvitationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Return invitations sent by the current user or for communities they admin.
        """
        user = self.request.user
        # Get admin communities
        admin_communities = user.communities.filter(
            membership__role__in=['admin', 'moderator'],
            membership__status='approved'
        )
        # Return invitations for communities user administers or invitations sent by user
        return CommunityInvitation.objects.filter(
            community__in=admin_communities
        ) | CommunityInvitation.objects.filter(
            inviter=user
        )
    
    def perform_create(self, serializer):
        """
        Create a new invitation and send email notification.
        """
        community_id = self.request.data.get('community')
        community = get_object_or_404(Community, id=community_id)
        
        # Check if user can invite to this community
        if not IsCommunityAdminOrReadOnly().has_object_permission(self.request, self, community):
            return Response(
                {"detail": "You do not have permission to send invitations for this community."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Call service to create and send invitation
        invitee_email = self.request.data.get('invitee_email')
        message = self.request.data.get('message', '')
        
        success, msg = CommunityService.invite_to_community(
            inviter=self.request.user,
            community=community,
            invitee_email=invitee_email,
            message=message,
            request=self.request
        )
        
        if success:
            # Get the created invitation
            invitation = CommunityInvitation.objects.get(
                community=community,
                invitee_email=invitee_email
            )
            return Response(
                CommunityInvitationSerializer(invitation, context={'request': self.request}).data,
                status=status.HTTP_201_CREATED
            )
        else:
            return Response(
                {"detail": msg},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="Resend Invitation",
        description="Resend an existing invitation email.",
        responses={200: CommunityInvitationSerializer},
    )
    @action(detail=True, methods=['post'])
    def resend(self, request, pk=None):
        """
        Resend an invitation email.
        """
        invitation = self.get_object()
        
        success, msg = CommunityService.invite_to_community(
            inviter=invitation.inviter,
            community=invitation.community,
            invitee_email=invitation.invitee_email,
            message=invitation.message,
            request=request
        )
        
        if success:
            return Response(
                CommunityInvitationSerializer(invitation, context={'request': request}).data
            )
        else:
            return Response(
                {"detail": msg},
                status=status.HTTP_400_BAD_REQUEST
            ) 