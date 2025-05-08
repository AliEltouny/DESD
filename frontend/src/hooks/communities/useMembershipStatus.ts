import { useState, useEffect, useCallback } from 'react';
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
  const [retryCount, setRetryCount] = useState<number>(0);
  
  const { isAuthenticated } = useAuth();
  
  const fetchWithRetry = useCallback(async (communitySlug: string) => {
    // Maximum 3 retry attempts
    const MAX_RETRIES = 3;
    let attempt = 0;
    let lastError: Error | null = null;
    
    while (attempt < MAX_RETRIES) {
      try {
        console.log(`Attempt ${attempt + 1} to fetch membership status for ${communitySlug}`);
        
        // Use XMLHttpRequest instead of API client
        const result = await new Promise<MembershipStatus | null>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const url = `http://localhost:8000/api/communities/${communitySlug}/membership_status/`;
          
          xhr.open('GET', url);
          xhr.withCredentials = true;
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          xhr.setRequestHeader('Pragma', 'no-cache');
          xhr.setRequestHeader('Expires', '0');
          
          // Add access token if available
          const getCookie = (name: string): string | undefined => {
            if (typeof document === "undefined") return undefined;
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(";").shift();
            return undefined;
          };
          
          const token = getCookie("accessToken");
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
          
          xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve(data);
              } catch (e) {
                console.error('Error parsing JSON response:', e);
                resolve({ is_member: false, status: null, role: null });
              }
            } else {
              console.error('XHR request failed:', xhr.status, xhr.statusText);
              reject(new Error(`Failed with status: ${xhr.status}`));
            }
          };
          
          xhr.onerror = function() {
            console.error('XHR network error for membership status');
            reject(new Error('Network error'));
          };
          
          xhr.send();
        });
        
        return { data: result, error: null };
      } catch (err) {
        attempt++;
        lastError = err as Error;
        console.warn(`Attempt ${attempt} failed. ${MAX_RETRIES - attempt} retries left.`);
        
        // Wait a bit longer between retries (exponential backoff)
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    return { data: null, error: lastError };
  }, []);
  
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
        
        // Use retry logic for more reliability
        const { data, error: fetchError } = await fetchWithRetry(slug);
        
        if (!isMounted) return;
        
        if (data) {
          setMembershipStatus(data);
          setError(null);
        } else if (fetchError) {
          console.warn(`Membership status error for ${slug} after retries:`, fetchError);
          // Set a default membership status even after failure
          setMembershipStatus({ is_member: false, status: null, role: null });
          
          // Only set user-facing error for non-auth issues
          if (fetchError.message && 
              !fetchError.message.includes("Authentication") && 
              !fetchError.message.includes("not authenticated") && 
              !fetchError.message.includes("permission")) {
            setError(fetchError.message || "Failed to fetch membership status");
          } else {
            console.log("Authentication-related membership status error:", fetchError.message);
            setError(null);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        
        console.error(`Unhandled error in useMembershipStatus hook:`, err);
        // Set a default membership status
        setMembershipStatus({ is_member: false, status: null, role: null });
        setError(null); // Don't show errors to users for membership status issues
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchMembershipStatus();
    
    return () => {
      isMounted = false;
    };
  }, [slug, isAuthenticated, fetchWithRetry, retryCount]);
  
  // Function to manually retry fetching membership status
  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);
  
  return {
    membershipStatus,
    isLoading,
    error,
    retry // Expose retry function
  };
} 