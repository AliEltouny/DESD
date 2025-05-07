import { communityApi } from '@/services/api';
import { useLazyApi } from '../useApi'; // Use lazy version
import { ApiSuccessResponse } from '@/types/api';

/**
 * Hook for joining a community.
 * Provides an execute function to trigger the join action.
 *
 * @returns Object containing execute function, loading state, and error state.
 */
export function useJoinCommunity() {
  const { 
    execute: joinCommunity, 
    loading: isJoining, 
    error 
  } = useLazyApi<ApiSuccessResponse, [string]>(
    communityApi.joinCommunity
  );

  return {
    joinCommunity, // Function to call with community slug: joinCommunity(slug)
    isJoining,
    error
  };
} 