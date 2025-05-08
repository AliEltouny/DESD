import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { communityApi } from '@/services/api';
import { MembershipStatus } from '@/types/api';

/**
 * Hook for retrieving the membership status of the current user for a specific community.
 * Uses communityApi.getMembershipStatus and properly handles auth state.
 *
 * @param slug - The community slug.
 * @returns Object containing membershipStatus, isLoading, and error.
 */
export function useMembershipStatus(slug: string | undefined) {
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchMembershipStatus = async () => {
      // Skip fetch if not authenticated or no slug
      if (!slug || !isAuthenticated) {
        if (isMounted) {
          setMembershipStatus(null);
          setIsLoading(false);
          setError(!slug ? null : "Authentication required");
        }
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Use the communityApi service as intended
        const response = await communityApi.getMembershipStatus(slug);
        
        if (isMounted) {
          setMembershipStatus(response);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setMembershipStatus(null);
          setIsLoading(false);
          setError(err.message || "Failed to fetch membership status");
        }
      }
    };
    
    fetchMembershipStatus();
    
    return () => {
      isMounted = false;
    };
  }, [slug, isAuthenticated]);
  
  return {
    membershipStatus,
    isLoading,
    error
  };
} 