import { useState, useCallback, useEffect } from 'react';
import { communityApi } from '@/services/api';
import { CommunityDetail } from '@/types/api';

/**
 * Hook for retrieving a specific community by slug with manual refresh capability
 */
export function useCommunity(slug: string) {
  const [data, setData] = useState<CommunityDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchCommunity = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const community = await communityApi.getCommunity(slug);
      setData(community);
      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching community:", err);
      setError(err.message || "Failed to load community");
      setLoading(false);
    }
  }, [slug]);
  
  // Initial fetch
  useEffect(() => {
    fetchCommunity();
  }, [fetchCommunity]);
  
  return {
    community: data,
    loading,
    error,
    refreshCommunity: fetchCommunity
  };
}