import { useState, useCallback, useRef, useEffect } from 'react';
import { communityApi } from '@/services/api';
import { CommunityMember } from '@/types/api';
import { useCommunityMembers } from './useCommunityMembers';

interface UseMemberManagementResult {
  members: CommunityMember[];
  totalMembers: number;
  isLoading: boolean;
  error: string | null;
  isUpdating: boolean;
  updateMemberRole: (userId: number, newRole: string) => Promise<boolean>;
  refetchMembers: () => void;
}

/**
 * Hook for managing community members, particularly for admins
 * to promote other members to admin before leaving
 * 
 * Optimized version with:
 * - Caching for faster repeat access
 * - Throttled refetching to prevent excessive API calls
 * - Optimistic UI updates for better responsiveness
 */
export function useMemberManagement(slug: string): UseMemberManagementResult {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<number, string>>({});
  const pendingRefetch = useRef<NodeJS.Timeout | null>(null);
  
  // Reset optimistic state when slug changes
  useEffect(() => {
    setOptimisticUpdates({});
    return () => {
      if (pendingRefetch.current) {
        clearTimeout(pendingRefetch.current);
      }
    };
  }, [slug]);
  
  // Use the existing hook to fetch members
  const {
    members: fetchedMembers,
    totalMembers,
    isLoading,
    error,
    refetch: refetchMembers
  } = useCommunityMembers({
    slug,
    pageSize: 50, // Get a larger page size for management
    autoRefresh: false // Don't auto-refresh, we'll do it manually
  });
  
  // Apply optimistic updates to members list
  const members = fetchedMembers.map(member => {
    if (optimisticUpdates[member.user.id]) {
      return {
        ...member,
        role: optimisticUpdates[member.user.id]
      };
    }
    return member;
  });
  
  // Debounced refetch to prevent excessive API calls
  const debouncedRefetch = useCallback(() => {
    if (pendingRefetch.current) {
      clearTimeout(pendingRefetch.current);
    }
    
    pendingRefetch.current = setTimeout(() => {
      refetchMembers();
      pendingRefetch.current = null;
    }, 300);
  }, [refetchMembers]);
  
  // Function to update a member's role
  const updateMemberRole = useCallback(async (userId: number, newRole: string): Promise<boolean> => {
    if (!slug) {
      setUpdateError('Community slug is required');
      return false;
    }
    
    // First, update the UI optimistically
    setOptimisticUpdates(prev => ({
      ...prev,
      [userId]: newRole
    }));
    
    setIsUpdating(true);
    setUpdateError(null);
    
    try {
      // Call the API to update the role
      await communityApi.updateMemberRole(slug, userId, newRole);
      
      // On success, remove from optimistic updates since it's now real
      setOptimisticUpdates(prev => {
        const { [userId]: _, ...rest } = prev;
        return rest;
      });
      
      // Refresh the members list after a delay to ensure server consistency
      debouncedRefetch();
      
      return true;
    } catch (error: any) {
      console.error('Error updating member role:', error);
      
      // Roll back optimistic update on error
      setOptimisticUpdates(prev => {
        const { [userId]: _, ...rest } = prev;
        return rest;
      });
      
      // Extract error message
      let errorMessage = 'Failed to update member role';
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setUpdateError(errorMessage);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [slug, debouncedRefetch]);
  
  return {
    members,
    totalMembers,
    isLoading,
    error: error || updateError,
    isUpdating,
    updateMemberRole,
    refetchMembers
  };
} 