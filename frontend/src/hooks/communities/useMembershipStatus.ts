import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { communityApi } from '@/services/api';
import { MembershipStatus } from '@/types/api';

/**
 * Hook for retrieving the membership status of the current user for a specific community.
 * Uses communityApi.getMembershipStatus and properly handles auth state.
 *
 * @param slug - The community slug.
 * @returns Object containing membershipStatus, isLoading, error, and a refresh function.
 */
export function useMembershipStatus(slug: string | undefined) {
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { isAuthenticated } = useAuth();
  
  // Create a function to fetch membership status that we can call on demand
  const fetchMembershipStatus = useCallback(async () => {
    // Skip fetch if no slug (but still check if authenticated to avoid unnecessary errors)
    if (!slug) {
      setMembershipStatus(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    // Skip fetch if not authenticated, but set appropriate status
    if (!isAuthenticated) {
      setMembershipStatus({
        is_member: false,
        status: null,
        role: null
      });
      setIsLoading(false);
      setError(null); // Don't set error, just return non-member status
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the communityApi service as intended
      const response = await communityApi.getMembershipStatus(slug);
      setMembershipStatus(response);
      setIsLoading(false);
      // Reset retry count on success
      if (retryCount > 0) setRetryCount(0);
    } catch (err: any) {
      console.log(`Membership status fetch error (attempt ${retryCount + 1})`, err.message || "Unknown error");
      
      // Default status for errors - prevents UI crashes
      setMembershipStatus({
        is_member: false,
        status: null,
        role: null
      });
      
      setIsLoading(false);
      setError(err.message || "Failed to fetch membership status");
      
      // Retry logic for 404 errors when community might not be ready yet
      if (err.response?.status === 404 && retryCount < 3) {
        setRetryCount(prev => prev + 1);
        // Exponential backoff - wait longer between retries
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          console.log(`Retrying membership status fetch (attempt ${retryCount + 1})`);
          fetchMembershipStatus();
        }, delay);
      }
    }
  }, [slug, isAuthenticated, retryCount]);

  // Initial fetch on mount and when dependencies change
  useEffect(() => {
    let isMounted = true;
    
    const initialFetch = async () => {
      // Skip fetch if no slug
      if (!slug) {
        if (isMounted) {
          setMembershipStatus(null);
          setIsLoading(false);
          setError(null);
        }
        return;
      }
      
      // Skip fetch if not authenticated, but set appropriate status
      if (!isAuthenticated) {
        if (isMounted) {
          setMembershipStatus({
            is_member: false,
            status: null,
            role: null
          });
          setIsLoading(false);
          setError(null); // Don't set error
        }
        return;
      }
      
      try {
        if (isMounted) {
          setIsLoading(true);
          setError(null);
        }
        
        // Use the communityApi service
        const response = await communityApi.getMembershipStatus(slug);
        
        if (isMounted) {
          setMembershipStatus(response);
          setIsLoading(false);
          // Reset retry count on success
          if (retryCount > 0) setRetryCount(0);
        }
      } catch (err: any) {
        if (isMounted) {
          console.log(`Initial membership status fetch error`, err.message || "Unknown error");
          
          // Default status for errors - prevents UI crashes
          setMembershipStatus({
            is_member: false,
            status: null,
            role: null
          });
          
          setIsLoading(false);
          setError(err.message || "Failed to fetch membership status");
          
          // Retry logic for 404 errors (new community might not be ready)
          if (err.response?.status === 404 && retryCount < 3) {
            setRetryCount(prev => prev + 1);
            // Exponential backoff
            const delay = Math.pow(2, retryCount) * 1000;
            setTimeout(() => {
              console.log(`Retrying initial membership status fetch (attempt ${retryCount + 1})`);
              initialFetch();
            }, delay);
          }
        }
      }
    };
    
    initialFetch();
    
    return () => {
      isMounted = false;
    };
  }, [slug, isAuthenticated, retryCount]);

  return {
    membershipStatus,
    isLoading,
    error,
    refreshMembershipStatus: fetchMembershipStatus
  };
}