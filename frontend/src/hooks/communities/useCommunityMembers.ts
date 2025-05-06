import { communityApi } from '@/services/api';
import useApi from '../useApi'; // Adjusted path for useApi

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