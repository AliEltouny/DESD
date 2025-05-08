from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q, Count, Prefetch
from django.db.models.functions import TruncMonth, TruncDay
from django.db import transaction, IntegrityError
from django.core.cache import cache

from ..models import Community, Membership, CommunityInvitation
from ..utils.cache import cache_queryset, cached_method


class CommunityService:
    """Service class for community operations"""
    
    @staticmethod
    @cache_queryset(timeout=60)  # Cache for 1 minute
    def get_community_queryset(user, category=None, search=None, tag=None, member_of=None, order_by='created_at'):
        """
        Get a filtered queryset of communities based on parameters.
        """
        # Convert user to user.id if authenticated to avoid serialization issues
        user_id = user.id if user and hasattr(user, 'id') else None
        
        queryset = Community.objects.all()
        
        # Add select_related for foreign keys
        queryset = queryset.select_related('creator')
        
        # Add prefetch_related for reverse relations and many-to-many
        queryset = queryset.prefetch_related(
            'members',
            Prefetch(
                'membership_set', 
                queryset=Membership.objects.filter(status='approved').select_related('user'),
                to_attr='active_memberships'
            )
        )
        
        # Filter by category
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by search term
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search) |
                Q(tags__icontains=search)
            )
        
        # Filter by tag - optimize by using Q objects for partial match
        if tag:
            tag = tag.strip().lower()
            # Match tags in comma-separated list with surrounding spaces/commas
            queryset = queryset.filter(
                Q(tags__icontains=f", {tag},") | 
                Q(tags__istartswith=f"{tag},") | 
                Q(tags__iendswith=f", {tag}") |
                Q(tags__exact=tag)
            )
        
        # Only show communities the user is a member of
        if member_of and user_id:
            queryset = queryset.filter(members__id=user_id)
        
        # Only show public communities or communities the user is a member of
        if not user_id:
            queryset = queryset.filter(is_private=False)
        else:
            queryset = queryset.filter(
                Q(is_private=False) | 
                Q(members__id=user_id)
            ).distinct()
        
        # Apply ordering
        if order_by == 'name':
            queryset = queryset.order_by('name')
        elif order_by == 'member_count':
            # Use cached member count if available, otherwise fallback to annotation
            queryset = queryset.order_by('-member_count_cache')
        else:  # Default to most recent
            queryset = queryset.order_by('-created_at')
            
        return queryset
    
    @staticmethod
    def join_community(user, community):
        """
        Handle joining a community with appropriate status based on community settings.
        Returns (created_membership, message)
        """
        # Check if user is already a member
        if Membership.objects.filter(user=user, community=community).exists():
            return None, "You are already a member of this community."
        
        # Check if community requires approval
        if community.requires_approval:
            # Create membership with pending status
            membership = Membership.objects.create(
                user=user,
                community=community,
                role='member',
                status='pending'
            )
            return membership, "Join request submitted. An admin will review your request."
        else:
            # Direct join
            membership = Membership.objects.create(
                user=user,
                community=community,
                role='member',
                status='approved'
            )
            return membership, "You have successfully joined this community."
    
    @staticmethod
    def leave_community(user, community):
        """
        Handle leaving a community.
        Returns (success, message)
        """
        try:
            membership = Membership.objects.get(user=user, community=community)
        except Membership.DoesNotExist:
            return False, "You are not a member of this community."
        
        # Check if user is the only admin
        if membership.role == 'admin':
            admin_count = Membership.objects.filter(
                community=community, 
                role='admin'
            ).count()
            
            if admin_count == 1:
                return False, "You cannot leave the community as you are the only admin. Please make another user an admin first."
        
        # Delete the membership
        membership.delete()
        
        # More aggressive cache invalidation
        # Delete user-specific membership caches
        user_cache_keys = [
            f"membership_status:{community.id}:{user.id}",
            f"community_membership:{community.slug}:{user.id}",
            f"post_creation_permission:{community.id}:{user.id}",
            f"user_memberships:{user.id}",
            f"user_admin_memberships:{user.id}"
        ]
        cache.delete_many(user_cache_keys)
        
        # Delete community-specific caches
        community_cache_keys = [
            f"community:members:{community.id}",
            f"community:member_count:{community.id}",
            f"community:posts:{community.id}",
            f"community:posts:{community.slug}",
            f"cache_queryset:CommunityService:get_community_queryset*"
        ]
        for key in community_cache_keys:
            cache.delete_pattern(key)
        
        # Delete post-related caches for this community
        cache.delete_pattern(f"post_list:{community.slug}:*")
        cache.delete_pattern(f"cache_queryset:PostService:get_post_queryset:*community={community.slug}*")
        
        # Delete all specific post visibility caches for this user in this community
        cache.delete_pattern(f"post_visibility:{community.id}:*:{user.id}")
        
        # Update community's member_count_cache
        if community.member_count_cache and community.member_count_cache > 0:
            Community.objects.filter(id=community.id).update(
                member_count_cache=max(0, community.member_count_cache - 1)
            )
            
        return True, "You have successfully left this community."
    
    @staticmethod
    def invite_to_community(inviter, community, invitee_email, message=None, request=None):
        """
        Create an invitation and send email.
        Returns (success, message)
        """
        # Create invitation
        invitation = CommunityInvitation.objects.create(
            community=community,
            inviter=inviter,
            invitee_email=invitee_email,
            message=message or "",
            status='pending'
        )
        
        # Prepare email if request object is provided (for build_absolute_uri)
        if request:
            subject = f"Invitation to join {community.name} on Uni Hub"
            email_message = f"""
            Hello,
            
            {inviter.first_name} {inviter.last_name} has invited you to join the {community.name} community on Uni Hub.
            
            {invitation.message if invitation.message else ''}
            
            You can join this community by creating an account or logging in at:
            {request.build_absolute_uri(f'/communities/{community.slug}')}
            
            Best regards,
            Uni Hub Team
            """
            
            try:
                send_mail(
                    subject,
                    email_message,
                    settings.DEFAULT_FROM_EMAIL,
                    [invitation.invitee_email],
                    fail_silently=False,
                )
                invitation.is_sent = True
                invitation.sent_at = timezone.now()
                invitation.save()
                return True, "Invitation sent successfully."
            except Exception as e:
                return False, f"Invitation created but email could not be sent: {str(e)}"
        
        return True, "Invitation created successfully."
    
    @staticmethod
    def update_member_role(community, user_id, new_role, current_user):
        """
        Update a member's role.
        Returns (success, message)
        """
        # Validate the role
        valid_roles = [choice[0] for choice in Membership.ROLE_CHOICES]
        if new_role not in valid_roles:
            return False, f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        
        try:
            membership = Membership.objects.get(user_id=user_id, community=community)
        except Membership.DoesNotExist:
            return False, "User is not a member of this community."
        
        # Check if trying to change own role
        if membership.user == current_user and new_role != 'admin':
            admin_count = Membership.objects.filter(
                community=community, 
                role='admin'
            ).count()
            
            if admin_count == 1:
                return False, "You cannot change your role as you are the only admin."
        
        membership.role = new_role
        membership.save()
        
        return True, f"User role updated to {new_role}."
    
    @staticmethod
    def handle_membership_request(community, user_id, approve):
        """
        Approve or reject a pending membership request.
        Returns (success, message)
        """
        try:
            membership = Membership.objects.get(
                user_id=user_id, 
                community=community,
                status='pending'
            )
        except Membership.DoesNotExist:
            return False, "No pending membership request found for this user."
        
        if approve:
            membership.status = 'approved'
            membership.save()
            return True, "Membership request approved."
        else:
            membership.status = 'rejected'
            membership.save()
            return True, "Membership request rejected."
    
    @staticmethod
    @cached_method(timeout=60)  # Cache for 1 minute
    def get_community_members(community, role=None):
        """
        Get members of a community with optional role filtering.
        Returns queryset of Membership objects.
        """
        # Create a cache key specific to this community and role filter
        # Base query with select_related for performance
        memberships = Membership.objects.filter(community=community)
        
        # Use prefetch_related to optimize user related data
        memberships = memberships.select_related('user', 'community')
        memberships = memberships.prefetch_related(
            Prefetch('user__created_communities', 
                    queryset=Community.objects.only('id', 'name', 'slug'), 
                    to_attr='prefetched_created_communities')
        )
        
        # Filter by role if specified
        if role:
            memberships = memberships.filter(role=role)
            
        # Filter by status (default to only approved members)
        memberships = memberships.filter(status='approved')
        
        # Order by role importance then join date
        return memberships.order_by(
            # Admin first, then moderator, then member
            '-role', 
            'joined_at'
        )
    
    @staticmethod
    @cached_method(timeout=300)  # Cache for 5 minutes
    def get_community_analytics(community_id):
        """
        Get analytics data for a community.
        This is a computationally expensive operation, so we cache it.
        """
        community = Community.objects.get(id=community_id)
        
        # Member growth analytics
        member_growth = Membership.objects.filter(
            community=community, 
            status='approved'
        ).annotate(
            month=TruncMonth('joined_at')
        ).values('month').annotate(count=Count('id')).order_by('month')
        
        # Post activity analytics
        post_activity = community.posts.annotate(
            day=TruncDay('created_at')
        ).values('day').annotate(count=Count('id')).order_by('day')
        
        # Top contributors (users with most posts)
        top_contributors = community.posts.values(
            'author__id', 'author__username', 'author__first_name', 'author__last_name'
        ).annotate(post_count=Count('id')).order_by('-post_count')[:10]
        
        return {
            'member_growth': list(member_growth),
            'post_activity': list(post_activity),
            'top_contributors': list(top_contributors),
            'total_members': community.members.filter(membership__status='approved').count(),
            'total_posts': community.posts.count(),
            'total_comments': sum(post.comments.count() for post in community.posts.all()),
        }
    
    @staticmethod
    def bulk_invite_to_community(inviter, community, invitee_emails, message=None, request=None):
        """
        Create multiple invitations at once for better performance.
        Returns (success_count, failed_emails)
        """
        # Create all invitation objects in one go
        invitations = []
        for email in invitee_emails:
            invitations.append(
                CommunityInvitation(
                    community=community,
                    inviter=inviter,
                    invitee_email=email,
                    message=message or "",
                    status='pending'
                )
            )
        
        # Bulk create all invitations
        created_invitations = CommunityInvitation.objects.bulk_create(invitations)
        
        # Skip emails if request is not provided
        if not request:
            return len(created_invitations), []
            
        # Prepare for bulk emailing
        success_count = 0
        failed_emails = []
        
        # Send emails
        for invitation in created_invitations:
            subject = f"Invitation to join {community.name} on Uni Hub"
            email_message = f"""
            Hello,
            
            {inviter.first_name} {inviter.last_name} has invited you to join the {community.name} community on Uni Hub.
            
            {invitation.message if invitation.message else ''}
            
            You can join this community by creating an account or logging in at:
            {request.build_absolute_uri(f'/communities/{community.slug}')}
            
            Best regards,
            Uni Hub Team
            """
            
            try:
                from django.core.mail import send_mail
                from django.conf import settings
                
                send_mail(
                    subject,
                    email_message,
                    settings.DEFAULT_FROM_EMAIL,
                    [invitation.invitee_email],
                    fail_silently=True,
                )
                
                # Mark as sent
                invitation.is_sent = True
                invitation.sent_at = timezone.now()
                success_count += 1
            except Exception:
                failed_emails.append(invitation.invitee_email)
                
        # Bulk update the sent status
        CommunityInvitation.objects.bulk_update(
            created_invitations, 
            ['is_sent', 'sent_at']
        )
        
        return success_count, failed_emails
        
    @staticmethod
    def bulk_handle_membership_requests(community, user_ids, approve=True):
        """
        Approve or reject multiple membership requests at once.
        Returns (success_count, error_count)
        """
        # Get all relevant memberships in one query
        memberships = Membership.objects.filter(
            community=community,
            user_id__in=user_ids,
            status='pending'
        )
        
        # No memberships found
        if not memberships:
            return 0, len(user_ids)
            
        # Update all at once
        new_status = 'approved' if approve else 'rejected'
        count = memberships.update(status=new_status)
        
        # Clear membership caches
        cache.delete_many([f"membership_status:{community.id}:{user_id}" for user_id in user_ids])
            
        # Also update member count cache if approving
        if approve:
            current_count = community.member_count_cache or 0
            Community.objects.filter(id=community.id).update(
                member_count_cache=current_count + count
            )
            
        return count, len(user_ids) - count 
    
    @staticmethod
    def update_community_with_lock(community_id, update_data, user):
        """
        Update a community with optimistic locking to prevent race conditions.
        Returns (updated_community, error_message)
        """
        # Start a transaction
        with transaction.atomic():
            # Get the community with a lock for update
            try:
                community = Community.objects.select_for_update().get(id=community_id)
            except Community.DoesNotExist:
                return None, "Community not found."
                
            # Check permissions
            if community.creator.id != user.id:
                # Check if user is an admin
                try:
                    membership = Membership.objects.get(
                        community=community,
                        user=user,
                        role='admin'
                    )
                except Membership.DoesNotExist:
                    return None, "You don't have permission to update this community."
                    
            # Update fields
            for field, value in update_data.items():
                if field in ['name', 'description', 'short_description', 'category', 
                            'tags', 'rules', 'is_private', 'requires_approval']:
                    setattr(community, field, value)
                    
            # Special handling for image and banner (file uploads)
            if 'image' in update_data and update_data['image'] is not None:
                community.image = update_data['image']
                
            if 'banner' in update_data and update_data['banner'] is not None:
                community.banner = update_data['banner']
                
            # Save changes
            try:
                community.save()
                # Clear cache for this community
                cache.delete(f"community:slug:{community.slug}")
                return community, None
            except IntegrityError as e:
                # Handle uniqueness constraints
                if 'communities_community_name_key' in str(e):
                    return None, "A community with this name already exists."
                # Other integrity errors
                return None, f"Database error: {str(e)}"
            except Exception as e:
                return None, f"Error updating community: {str(e)}" 