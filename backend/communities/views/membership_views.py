"""
Views for handling community membership operations
"""
from django.shortcuts import get_object_or_404

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema, OpenApiParameter

from ..models import Community, Membership
from ..serializers import MembershipSerializer
from ..permissions import IsCommunityAdminOrReadOnly, IsCommunityMember
from ..services.community_service import CommunityService


class MembershipViews:
    """
    This class contains view methods related to community membership
    that will be added to the CommunityViewSet
    """
    
    @extend_schema(
        summary="Join Community",
        description="Join a community. If the community requires approval, the membership will be pending.",
        responses={201: None},
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def join(self, request, slug=None):
        """Join a community"""
        community = self.get_object()
        user = request.user
        
        membership, message = CommunityService.join_community(user, community)
        
        if membership:
            return Response(
                {"detail": message},
                status=status.HTTP_201_CREATED
            )
        else:
            return Response(
                {"detail": message},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="Leave Community",
        description="Leave a community. If you are the only admin, you cannot leave.",
        responses={200: None},
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def leave(self, request, slug=None):
        """Leave a community"""
        community = self.get_object()
        user = request.user
        
        success, message = CommunityService.leave_community(user, community)
        
        if success:
            return Response(
                {"detail": message},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"detail": message},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="List Community Members",
        description="Get a list of members in a community.",
        parameters=[
            OpenApiParameter(name="role", description="Filter by role", required=False, type=str, enum=["admin", "moderator", "member"]),
        ],
    )
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, IsCommunityMember])
    def members(self, request, slug=None):
        """Get community members"""
        community = self.get_object()
        role = request.query_params.get('role')
        
        # Create queryset with efficient select_related to reduce DB queries
        queryset = Membership.objects.filter(community=community, status='approved')
        
        # Apply role filter if provided
        if role:
            queryset = queryset.filter(role=role)
        
        # Select related user data to avoid N+1 query issues
        queryset = queryset.select_related('user')
        
        serializer = MembershipSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Update Member Role",
        description="Update a member's role in the community (member, moderator, admin).",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'user_id': {'type': 'integer'},
                    'role': {'type': 'string', 'enum': ['member', 'moderator', 'admin']},
                },
                'required': ['user_id', 'role'],
            }
        },
        responses={200: None},
    )
    @action(detail=True, methods=['put'], permission_classes=[IsAuthenticated, IsCommunityAdminOrReadOnly])
    def update_member_role(self, request, slug=None):
        """Update a member's role"""
        community = self.get_object()
        user_id = request.data.get('user_id')
        role = request.data.get('role')
        
        if not user_id or not role:
            return Response(
                {"detail": "Both user_id and role are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success, message = CommunityService.update_member_role(
            community=community,
            user_id=user_id,
            role=role,
            current_user=request.user
        )
        
        if success:
            return Response(
                {"detail": message},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"detail": message},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="Approve Membership",
        description="Approve or reject a pending membership request.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'user_id': {'type': 'integer'},
                    'approve': {'type': 'boolean'},
                },
                'required': ['user_id'],
            }
        },
        responses={200: None, 404: None},
    )
    @action(detail=True, methods=['put'], permission_classes=[IsAuthenticated, IsCommunityAdminOrReadOnly])
    def approve_membership(self, request, slug=None):
        """Approve or reject a membership request"""
        community = self.get_object()
        user_id = request.data.get('user_id')
        approve = request.data.get('approve', True)
        
        if not user_id:
            return Response(
                {"detail": "User ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the membership object
        membership = get_object_or_404(
            Membership, 
            community=community, 
            user_id=user_id, 
            status='pending'
        )
        
        # Update the membership status
        if approve:
            membership.status = 'approved'
            membership.save()
            return Response(
                {"detail": "Membership approved successfully."},
                status=status.HTTP_200_OK
            )
        else:
            membership.delete()
            return Response(
                {"detail": "Membership request rejected."},
                status=status.HTTP_200_OK
            ) 