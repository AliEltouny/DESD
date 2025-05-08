import { useMemo } from 'react';
import { communityApi } from '@/services/api';
import { CommunityFilters, PostFilters } from '@/types/api';
import useApi from './useApi';

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

/**
 * Hook for retrieving a specific community by slug
 */
export function useCommunity(slug: string) {
  const { data, loading, error } = useApi(
    async () => communityApi.getCommunity(slug),
    [slug]
  );

  return {
    community: data,
    loading,
    error
  };
}

/**
 * Hook for creating a new community (lazy execution)
 */
export function useCreateCommunity() {
  const { loading, error, execute } = useApi(
    communityApi.createCommunity.bind(communityApi),
    [],
    false
  );

  return {
    createCommunity: execute,
    isCreating: loading,
    error
  };
}

/**
 * Hook for community members
 */
export function useCommunityMembers(slug: string, role?: string) {
  const { data, loading, error } = useApi(
    async () => communityApi.getCommunityMembers(slug, role),
    [slug, role]
  );

  return {
    members: data || [],
    loading,
    error
  };
}

/**
 * Hook for community posts with filters
 */
export function useCommunityPosts(slug: string, filters?: PostFilters) {
  // Convert filters to dependency array
  const filterDeps = useMemo(() => {
    if (!filters) return [slug];
    return [slug, ...Object.entries(filters).map(([key, value]) => `${key}:${value}`)];
  }, [slug, filters]);

  const { data, loading, error } = useApi(
    async () => communityApi.getPosts(slug, filters),
    filterDeps
  );

  return {
    posts: data || [],
    loading,
    error
  };
}

export default useCommunities; 