import { useState, useEffect, useCallback, useRef } from 'react';
import { communityApi } from '@/services/api';
import { CommunityMember } from '@/types/api';

interface UseCommunityMembersParams {
  slug: string;
  initialRole?: string;
  pageSize?: number;
  refreshInterval?: number;
  autoRefresh?: boolean;
}

interface UseCommunityMembersResult {
  members: CommunityMember[];
  totalMembers: number;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  currentRole: string | null;
  setPage: (page: number) => void;
  setRole: (role: string | null) => void;
  refetch: () => Promise<void>;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Hook for fetching and managing community members with pagination and filtering
 * 
 * @param slug - Community slug
 * @param initialRole - Initial role filter (optional)
 * @param pageSize - Number of members per page (optional, default 10)
 * @param refreshInterval - How often to refresh members in ms (default 5000)
 * @param autoRefresh - Whether to auto-refresh members (default true)
 */
export function useCommunityMembers({
  slug,
  initialRole = null,
  pageSize = 10,
  refreshInterval = 5000,
  autoRefresh = true
}: UseCommunityMembersParams): UseCommunityMembersResult {
  // State for the member list and pagination
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [totalMembers, setTotalMembers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentRole, setCurrentRole] = useState<string | null>(initialRole);
  const [retryCount, setRetryCount] = useState<number>(0);
  
  // Use ref to track auto-refresh interval
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to fetch members with current filters
  const fetchMembers = useCallback(async (skipLoadingState = false) => {
    if (!slug) {
      setError('Community slug is required');
      setIsLoading(false);
      return;
    }

    if (!skipLoadingState) {
      setIsLoading(true);
    }
    setError(null);

    try {
      console.log(`Fetching members for ${slug}, page ${currentPage}, role ${currentRole || 'all'}`);
      
      // Calculate pagination offset
      const offset = (currentPage - 1) * pageSize;
      
      // Build params object
      const params: Record<string, any> = {
        limit: pageSize,
        offset,
      };
      
      // Add role filter if specified
      if (currentRole) {
        params.role = currentRole;
      }
      
      // Add a cache-busting timestamp for auto-refreshes
      if (skipLoadingState) {
        params._t = Date.now();
      }
      
      // Multiple retries built into communityApi
      const response = await communityApi.getCommunityMembers(slug, params);
      
      // Set members and total count
      setMembers(response.results || []);
      setTotalMembers(response.count || 0);
      
      // Reset retry count on success
      setRetryCount(0);
    } catch (error) {
      console.error('Error fetching community members:', error);
      
      // Structured error message
      let errorMessage = 'Failed to load members';
      if (error?.response?.status === 403) {
        errorMessage = 'You do not have permission to view members';
      } else if (error?.response?.status === 404) {
        errorMessage = 'Community not found';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      // Auto-retry logic for network errors (max 3 retries)
      const shouldRetry = retryCount < 3 && 
        (error?.code === 'ECONNABORTED' || error?.message?.includes('Network Error'));
      
      if (shouldRetry) {
        console.log(`Retrying member fetch (${retryCount + 1}/3)...`);
        setRetryCount(prevCount => prevCount + 1);
        
        // Exponential backoff
        const delay = 1000 * Math.pow(2, retryCount);
        setTimeout(() => {
          fetchMembers();
        }, delay);
      }
    } finally {
      setIsLoading(false);
    }
  }, [slug, currentPage, currentRole, pageSize, retryCount]);

  // Setup auto-refresh interval
  useEffect(() => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    
    // Only set up auto-refresh if enabled
    if (autoRefresh && slug) {
      console.log(`Setting up auto-refresh for members (${refreshInterval}ms)`);
      refreshIntervalRef.current = setInterval(() => {
        // Use skipLoadingState=true to avoid showing loading spinner on refresh
        fetchMembers(true);
      }, refreshInterval);
    }
    
    // Clean up interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchMembers, autoRefresh, refreshInterval, slug]);

  // Effect to fetch members when dependencies change
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Page change handler
  const setPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, page));
  }, []);

  // Role change handler
  const setRole = useCallback((role: string | null) => {
    setCurrentRole(role);
    setCurrentPage(1); // Reset to first page when changing filters
  }, []);

  // Calculate if there are next/previous pages
  const hasNextPage = (currentPage * pageSize) < totalMembers;
  const hasPreviousPage = currentPage > 1;

  return {
    members,
    totalMembers,
    isLoading,
    error,
    currentPage,
    currentRole,
    setPage,
    setRole,
    refetch: fetchMembers,
    hasNextPage,
    hasPreviousPage
  };
} 