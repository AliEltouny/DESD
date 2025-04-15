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

class InvitationViews:
    """
    This class contains view methods related to community invitations
    that will be added to the CommunityViewSet
    """
    
    @extend_schema(
        summary="Invite User",
        description="Invite a user to join the community via email.",
        request=CommunityInvitationSerializer,
        responses={201: None, 207: None},
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCommunityAdminOrReadOnly])
    def invite(self, request, slug=None):
        """Invite a user to join the community"""
        community = self.get_object()
        
        serializer = CommunityInvitationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            success, message = CommunityService.invite_to_community(
                inviter=request.user,
                community=community,
                invitee_email=serializer.validated_data['invitee_email'],
                message=serializer.validated_data.get('message', ''),
                request=request
            )
            
            if success:
                return Response(
                    {"detail": message},
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {"detail": message},
                    status=status.HTTP_207_MULTI_STATUS
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    @extend_schema(
        summary="List Community Invitations",
        description="Get a list of pending invitations for a community.",
    )
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, IsCommunityAdminOrReadOnly])
    def invitations(self, request, slug=None):
        """Get list of pending invitations for a community"""
        community = self.get_object()
        
        # Get all pending invitations for this community
        invitations = CommunityInvitation.objects.filter(
            community=community,
            status='pending'
        ).select_related('inviter')
        
        serializer = CommunityInvitationSerializer(invitations, many=True, context={'request': request})
        return Response(serializer.data)
        
    @extend_schema(
        summary="Cancel Invitation",
        description="Cancel a pending invitation.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'invitation_id': {'type': 'integer'},
                },
                'required': ['invitation_id'],
            }
        },
        responses={200: None, 404: None},
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCommunityAdminOrReadOnly])
    def cancel_invitation(self, request, slug=None):
        """Cancel a pending invitation"""
        community = self.get_object()
        invitation_id = request.data.get('invitation_id')
        
        if not invitation_id:
            return Response(
                {"detail": "Invitation ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Ensure the invitation belongs to this community and is pending
            invitation = CommunityInvitation.objects.get(
                id=invitation_id,
                community=community,
                status='pending'
            )
            
            # Cancel the invitation
            invitation.status = 'cancelled'
            invitation.save()
            
            return Response(
                {"detail": "Invitation cancelled successfully."},
                status=status.HTTP_200_OK
            )
        except CommunityInvitation.DoesNotExist:
            return Response(
                {"detail": "Invitation not found or already processed."},
                status=status.HTTP_404_NOT_FOUND
            ) 