import { useMemo } from 'react';
import { communityApi } from '@/services/api'; // Assuming communityApi has getPosts
import { PostFilters } from '@/types/api';
import useApi from '../useApi'; // Adjusted path for useApi

/**
 * Hook for community posts with filters
 */
export function useCommunityPosts(slug: string, filters?: PostFilters) {
  // Convert filters to dependency array
  const filterDeps = useMemo(() => {
    if (!filters) return [slug];
    // Ensure slug is always part of the dependency array
    return [slug, ...Object.entries(filters).map(([key, value]) => `${key}:${value}`)];
  }, [slug, filters]);

  const { data, loading, error } = useApi(
    // Assuming communityApi.getPosts fetches posts for a specific community slug
    async () => communityApi.getPosts(slug, filters), 
    filterDeps
  );

  return {
    // Assuming the API returns an object with a results array like { results: Post[] }
    // Adjust parsing based on actual API response structure from communityApi.getPosts
    posts: data?.results || data || [], 
    loading,
    error
  };
} 