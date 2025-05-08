import { useState, useCallback, useEffect } from 'react';
import { communityApi } from '@/services/api';
import { useMembershipStatus } from './useMembershipStatus';
import { ApiSuccessResponse } from '@/types/api';

/**
 * Custom hook for managing community membership operations
 * Provides functions for joining and leaving communities with proper error handling.
 * 
 * @param slug The community slug
 * @returns Object with membership data and operations
 */
export function useCommunityMembership(slug: string | undefined) {
  // Get membership status from existing hook
  const { 
    membershipStatus, 
    isLoading: isLoadingMembership, 
    error: membershipError,
    refetch: refetchMembership
  } = useMembershipStatus(slug || '');
  
  // Local states for operations
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [lastActionResponse, setLastActionResponse] = useState<ApiSuccessResponse | null>(null);
  
  // Attempt to access React Query client if available (optional dependency)
  let queryClient: any = null;
  try {
    // Dynamic import to prevent build errors if React Query is not installed
    const reactQuery = require('@tanstack/react-query');
    if (reactQuery && typeof reactQuery.useQueryClient === 'function') {
      try {
        queryClient = reactQuery.useQueryClient();
      } catch (e) {
        console.warn('React Query client not available:', e);
      }
    }
  } catch (e) {
    // React Query not installed, just continue without it
    console.log('React Query not available, skipping cache invalidation');
  }
  
  // Derived state
  const isMember = membershipStatus?.is_member || false;
  const membershipRole = membershipStatus?.role || null;
  const membershipStatusValue = membershipStatus?.status || null;
  const isProcessing = isJoining || isLeaving || isLoadingMembership;
  
  // Invalidate caches - works with or without React Query
  const invalidateCaches = useCallback(() => {
    if (!slug) return;
    
    try {
      if (queryClient) {
        // Invalidate community queries if React Query is available
        queryClient.invalidateQueries(['community', slug]);
        queryClient.invalidateQueries(['communities']);
        queryClient.invalidateQueries(['membershipStatus', slug]);
      } else {
        // Fallback if React Query not available - use direct refetch
        if (refetchMembership) {
          refetchMembership();
        }
      }
    } catch (error) {
      console.warn('Error invalidating caches:', error);
      
      // Final fallback - try direct refetch if invalidation fails
      try {
        if (refetchMembership) {
          refetchMembership();
        }
      } catch (e) {
        // Silently fail if even this fails
      }
    }
  }, [slug, queryClient, refetchMembership]);
  
  /**
   * Join a community
   */
  const joinCommunity = useCallback(async (): Promise<ApiSuccessResponse | null> => {
    if (!slug) {
      setJoinError('Community slug is required');
      return null;
    }
    
    setIsJoining(true);
    setJoinError(null);
    
    try {
      console.log(`Joining community: ${slug}`);
      
      // Multiple retries built into communityApi
      const response = await communityApi.joinCommunity(slug);
      
      // Success, update UI state
      setLastActionResponse(response);
      
      // Invalidate caches to get fresh data
      invalidateCaches();
      
      return response;
    } catch (error: any) {
      console.error('Error joining community:', error);
      const errorMessage = error?.message || 'Failed to join community';
      setJoinError(errorMessage);
      return null;
    } finally {
      setIsJoining(false);
    }
  }, [slug, invalidateCaches]);
  
  /**
   * Leave a community
   */
  const leaveCommunity = useCallback(async (): Promise<ApiSuccessResponse | null> => {
    if (!slug) {
      setLeaveError('Community slug is required');
      return null;
    }
    
    setIsLeaving(true);
    setLeaveError(null);
    
    try {
      console.log(`Leaving community: ${slug}`);
      
      // Multiple retries built into communityApi
      const response = await communityApi.leaveCommunity(slug);
      
      // Success, update UI state
      setLastActionResponse(response);
      
      // Invalidate caches to get fresh data
      invalidateCaches();
      
      return response;
    } catch (error: any) {
      console.error('Error leaving community:', error);
      const errorMessage = error?.message || 'Failed to leave community';
      setLeaveError(errorMessage);
      return null;
    } finally {
      setIsLeaving(false);
    }
  }, [slug, invalidateCaches]);
  
  /**
   * Toggle membership (join if not a member, leave if already a member)
   */
  const toggleMembership = useCallback(async (): Promise<ApiSuccessResponse | null> => {
    if (isProcessing) return null;
    
    if (isMember) {
      return leaveCommunity();
    } else {
      return joinCommunity();
    }
  }, [isMember, isProcessing, joinCommunity, leaveCommunity]);
  
  // Reset errors when slug changes
  useEffect(() => {
    setJoinError(null);
    setLeaveError(null);
    setLastActionResponse(null);
  }, [slug]);
  
  return {
    // Status
    isMember,
    membershipRole,
    membershipStatus: membershipStatusValue,
    isLoadingMembership,
    membershipError,
    
    // Operations
    joinCommunity,
    leaveCommunity,
    toggleMembership,
    
    // Operation states
    isJoining,
    isLeaving,
    isProcessing,
    joinError,
    leaveError,
    lastActionResponse,
    
    // Utilities
    refetchMembership,
    invalidateCaches
  };
} 