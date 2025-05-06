import { communityApi } from '@/services/api';
import { useLazyApi } from '../useApi'; // Use lazy version
import { ApiSuccessResponse } from '@/types/api';

/**
 * Hook for leaving a community.
 * Provides an execute function to trigger the leave action.
 *
 * @returns Object containing execute function, loading state, and error state.
 */
export function useLeaveCommunity() {
  const { 
    execute: leaveCommunity, 
    loading: isLeaving, 
    error 
  } = useLazyApi<ApiSuccessResponse, [string]>(
    communityApi.leaveCommunity
  );

  return {
    leaveCommunity, // Function to call with community slug: leaveCommunity(slug)
    isLeaving,
    error
  };
} 