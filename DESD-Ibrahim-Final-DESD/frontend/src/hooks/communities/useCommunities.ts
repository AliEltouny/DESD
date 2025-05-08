import { useMemo } from 'react';
import { communityApi } from '@/services/api';
import { CommunityFilters } from '@/types/api';
import useApi from '../useApi'; // Adjusted path for useApi

/**
 * Hook for retrieving a list of communities with filters
 */
export function useCommunities(filters?: CommunityFilters) {
  // Convert filters to dependency array to trigger API call when filters change
  const filterDeps = useMemo(() => {
    if (!filters) return [];
    return Object.entries(filters).map(([key, value]) => `${key}:${value}`);
  }, [filters]);

  // Call the API using our generic hook
  const { data, loading, error } = useApi(
    async () => communityApi.getCommunities(filters),
    filterDeps
  );

  return {
    communities: data || [],
    loading,
    error
  };
}

export default useCommunities; // Default export might be useful if this is the primary hook 