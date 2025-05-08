import { communityApi } from '@/services/api';
import useApi from '../useApi'; // Adjusted path for useApi

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