import { communityApi } from '@/services/api';
import useApi from '../../useApi'; // Adjusted path for useApi relative to new subfolder

/**
 * Hook for creating a new community (lazy execution)
 */
export function useCreateCommunity() {
  const { loading, error, execute } = useApi(
    communityApi.createCommunity.bind(communityApi),
    [],
    false // Set immediate to false for lazy execution
  );

  return {
    createCommunity: execute,
    isCreating: loading,
    error
  };
} 