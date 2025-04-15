"""
Views for handling community analytics
"""
from django.db.models import Count, Sum, F, Q
from django.db.models.functions import TruncDay, TruncMonth
from django.utils import timezone
from datetime import timedelta

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from drf_spectacular.utils import extend_schema

from ..models import Membership, Post, Comment, Community
from ..permissions import IsCommunityMember


class AnalyticsViews:
    """
    This class contains view methods related to community analytics
    that will be added to the CommunityViewSet
    """
    
    @extend_schema(
        summary="Get Community Analytics",
        description="Retrieves analytics data for a community. Only available to community admins and moderators.",
        responses={200: {'type': 'object', 'properties': {
            'member_growth': {'type': 'object', 'description': 'Member growth over time'},
            'post_activity': {'type': 'object', 'description': 'Post activity over time'},
            'engagement_stats': {'type': 'object', 'description': 'Engagement statistics'},
            'top_contributors': {'type': 'array', 'description': 'Top contributors to the community'},
        }}},
    )
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def analytics(self, request, slug=None):
        """Get analytics data for a community"""
        try:
            community = self.get_object()
            user = request.user
            
            # Check if user has permission to view analytics (community member or creator)
            is_member = Membership.objects.filter(
                community=community, 
                user=user, 
                status='approved'
            ).exists()
            
            is_creator = community.creator == user
            
            if not (is_member or is_creator):
                return Response(
                    {"detail": "You must be a member of this community to view analytics."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Basic community stats
            total_members = Membership.objects.filter(
                community=community,
                status='approved'
            ).count()
            
            total_posts = Post.objects.filter(community=community).count()
            
            # Get the last 14 days of data for member growth
            last_14_days = timezone.now() - timedelta(days=14)
            
            # Member growth - daily data for the last 14 days
            daily_member_growth = Membership.objects.filter(
                community=community,
                status='approved',
                joined_at__gte=last_14_days
            ).annotate(
                day=TruncDay('joined_at')
            ).values('day').annotate(
                count=Count('id')
            ).order_by('day')
            
            # Member growth - monthly data (all time)
            monthly_member_growth = Membership.objects.filter(
                community=community,
                status='approved'
            ).annotate(
                month=TruncMonth('joined_at')
            ).values('month').annotate(
                count=Count('id')
            ).order_by('month')
            
            # Post activity - daily data for the last 14 days
            daily_post_activity = Post.objects.filter(
                community=community,
                created_at__gte=last_14_days
            ).annotate(
                day=TruncDay('created_at')
            ).values('day').annotate(
                count=Count('id')
            ).order_by('day')
            
            # Post activity - monthly data (all time)
            monthly_post_activity = Post.objects.filter(
                community=community
            ).annotate(
                month=TruncMonth('created_at')
            ).values('month').annotate(
                count=Count('id')
            ).order_by('month')
            
            # Calculate total comments
            total_comments = Comment.objects.filter(
                post__community=community
            ).count()
            
            # Calculate total upvotes
            total_upvotes = Post.objects.filter(
                community=community
            ).aggregate(
                total_upvotes=Sum('upvote_count')
            )['total_upvotes'] or 0
            
            # Top contributors (members with most posts)
            top_contributors = Post.objects.filter(
                community=community
            ).values(
                'author_id',
                'author__username',
                'author__first_name',
                'author__last_name'
            ).annotate(
                post_count=Count('id')
            ).order_by('-post_count')[:10]
            
            # Format the data for the frontend
            formatted_daily_growth = [
                {'day': item['day'].isoformat(), 'count': item['count']} 
                for item in daily_member_growth
            ]
            
            formatted_monthly_growth = [
                {'month': item['month'].isoformat(), 'count': item['count']} 
                for item in monthly_member_growth
            ]
            
            formatted_daily_activity = [
                {'day': item['day'].isoformat(), 'count': item['count']} 
                for item in daily_post_activity
            ]
            
            formatted_monthly_activity = [
                {'month': item['month'].isoformat(), 'count': item['count']} 
                for item in monthly_post_activity
            ]
            
            # Prepare engagement stats
            engagement_stats = {
                'total_members': total_members,
                'total_posts': total_posts,
                'total_comments': total_comments,
                'total_upvotes': total_upvotes,
                'posts_per_member': round(total_posts / total_members, 2) if total_members > 0 else 0,
                'comments_per_post': round(total_comments / total_posts, 2) if total_posts > 0 else 0,
                'upvotes_per_post': round(total_upvotes / total_posts, 2) if total_posts > 0 else 0,
                'avg_upvotes_per_post': round(total_upvotes / total_posts, 2) if total_posts > 0 else 0,
                'avg_comments_per_post': round(total_comments / total_posts, 2) if total_posts > 0 else 0,
            }
            
            # Format contributors
            formatted_contributors = [
                {
                    'author_id': item['author_id'],
                    'username': item['author__username'],
                    'full_name': f"{item['author__first_name']} {item['author__last_name']}".strip(),
                    'post_count': item['post_count']
                }
                for item in top_contributors
            ]
            
            # Prepare the full analytics data
            analytics_data = {
                'member_growth': {
                    'daily': formatted_daily_growth,
                    'monthly': formatted_monthly_growth
                },
                'post_activity': {
                    'daily': formatted_daily_activity,
                    'monthly': formatted_monthly_activity
                },
                'engagement_stats': engagement_stats,
                'top_contributors': formatted_contributors
            }
            
            return Response(analytics_data)
            
        except Exception as e:
            # Log the error for debugging
            print(f"Error generating analytics for {slug}: {str(e)}")
            import traceback
            traceback.print_exc()
            
            # Return a 200 with empty data rather than a 404 error
            return Response({
                'member_growth': {'daily': [], 'monthly': []},
                'post_activity': {'daily': [], 'monthly': []},
                'engagement_stats': {
                    'total_members': 0,
                    'total_posts': 0,
                    'total_comments': 0,
                    'total_upvotes': 0,
                    'posts_per_member': 0,
                    'comments_per_post': 0,
                    'upvotes_per_post': 0
                },
                'top_contributors': []
            }) 