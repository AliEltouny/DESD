import useSWR from 'swr';
import { CommunityDetail } from '@/types/api';
import { communityApi } from '@/services/api';

const fetcher = async (slug: string): Promise<CommunityDetail> => {
  return await communityApi.getCommunity(slug);
};

/**
 * Enhanced hook for retrieving a specific community by slug using SWR
 * Provides automatic caching, revalidation, and error handling
 */
export function useCommunityWithSWR(slug: string | undefined) {
  const {
    data: community,
    error,
    isLoading,
    isValidating,
    mutate
  } = useSWR(
    slug ? `community-${slug}` : null,
    () => (slug ? fetcher(slug) : null),
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 60000, // 1 minute
      errorRetryCount: 3,
      errorRetryInterval: 3000,
      suspense: false, // We'll handle the loading state ourselves
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Only retry on 429, 500, 502, 503, 504
        if (error.status === 404) return;
        
        // Retry with exponential backoff
        const waitTime = Math.min(1000 * 2 ** retryCount, 15000);
        setTimeout(() => revalidate({ retryCount }), waitTime);
      }
    }
  );

  return {
    community,
    loading: isLoading,
    isValidating,
    error: error?.message || (error ? 'Failed to load community' : null),
    refresh: mutate
  };
} 