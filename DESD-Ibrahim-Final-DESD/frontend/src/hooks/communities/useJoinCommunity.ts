import { useState, useCallback, useRef } from 'react';
import { communityApi } from '@/services/api';
import { useLazyApi } from '../useApi'; // Use lazy version
import { ApiSuccessResponse } from '@/types/api';

// Make React Query optional to avoid errors when QueryClientProvider isn't available
let useQueryClient;
try {
  // Dynamic import to avoid breaking when React Query is not available
  useQueryClient = require('@tanstack/react-query').useQueryClient;
} catch (err) {
  // Create a mock version if React Query is not available
  useQueryClient = () => null;
}

// Simple cache utility functions to avoid direct localStorage reference
const cacheUtils = {
  set: (key: string, value: any, expiryMs = 5 * 60 * 1000) => {
    if (typeof window === 'undefined') return;
    try {
      const item = {
        ...value,
        _cacheTime: new Date().getTime()
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.error(`Error caching item ${key}:`, e);
    }
  },
  
  get: (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;
      return JSON.parse(itemStr);
    } catch (error) {
      return null;
    }
  },
  
  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing cached item ${key}:`, e);
    }
  },
  
  clear: (prefix: string) => {
    if (typeof window === 'undefined') return;
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.error(`Error clearing cache with prefix ${prefix}:`, e);
    }
  }
};

/**
 * Hook for joining a community.
 * Provides an execute function to trigger the join action with enhanced error handling.
 *
 * @returns Object containing execute function, loading state, error state, and retry function.
 */
export function useJoinCommunity() {
  const [joinStatus, setJoinStatus] = useState<'idle' | 'joining' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastSlugRef = useRef<string | null>(null);
  
  // Make React Query usage optional to avoid errors
  let queryClient;
  try {
    queryClient = useQueryClient?.(); // Use optional chaining
  } catch (err) {
    // Silently fail if React Query is not properly set up
    console.log('React Query not available for cache invalidation');
    queryClient = null;
  }

  // Use the underlying API hook
  const { 
    execute: executeJoin, 
    loading: isJoining, 
    error: apiError 
  } = useLazyApi<ApiSuccessResponse, [string]>(
    communityApi.joinCommunity
  );

  // Clear error when component unmounts or when slug changes
  const clearError = useCallback(() => {
    setError(null);
    setStatusMessage(null);
  }, []);

  // Enhanced join function with pre/post processing
  const joinCommunity = useCallback(async (slug: string) => {
    try {
      // Reset states
      clearError();
      setJoinStatus('joining');
      lastSlugRef.current = slug;

      // Display user-friendly message
      setStatusMessage("Joining community...");

      // Call the API
      const response = await executeJoin(slug);

      // Update status
      if (response) {
        setJoinStatus('success');
        setStatusMessage(response.detail || "Successfully joined community");
        
        // Cache invalidation - but no page refresh
        try {
          // Update local membership cache to reflect new status
          const localCacheKey = `membership_${slug}`;
          cacheUtils.set(localCacheKey, {
            is_member: true,
            status: 'approved',
            role: 'member'
          });
          
          // Clear other related caches
          cacheUtils.clear(`community_${slug}`);
          cacheUtils.clear('communities');
          
          // Also use React Query if available
          if (queryClient) {
            // Invalidate relevant queries
            queryClient.invalidateQueries(['community', slug]);
            queryClient.invalidateQueries(['membershipStatus', slug]);
            queryClient.invalidateQueries(['communities']);
            queryClient.invalidateQueries(['members', slug]);
          }
        } catch (cacheError) {
          console.warn('Error during cache invalidation:', cacheError);
          // Continue with the success path even if cache clearing fails
        }
        
        return response;
      } else {
        throw new Error("No response received");
      }
    } catch (err) {
      console.error("Error joining community:", err);
      
      // Handle "already a member" error as success
      if (err?.response?.status === 400 && 
          err?.response?.data?.detail && 
          (err.response.data.detail.includes("already a member") || 
           err.response.data.detail.includes("already joined"))) {
        console.log("User is already a member - treating as success");
        
        // Update local membership cache to reflect membership status
        try {
          const localCacheKey = `membership_${slug}`;
          cacheUtils.set(localCacheKey, {
            is_member: true,
            status: 'approved',
            role: 'member'
          });
        } catch (cacheError) {
          console.warn("Failed to update membership cache:", cacheError);
        }
        
        // Set success state
        setJoinStatus('success');
        setStatusMessage("You are already a member of this community.");
        
        // Return a success response
        return {
          detail: "You are already a member of this community.",
          success: true
        };
      }
      
      setJoinStatus('error');
      
      // Set user-friendly error message
      const errorMessage = err.userMessage || err.message || "Failed to join community";
      setError(errorMessage);
      setStatusMessage("Join failed. " + errorMessage);
      
      return null;
    }
  }, [executeJoin, clearError, queryClient]);

  // Function to retry the last join attempt
  const retry = useCallback(() => {
    if (lastSlugRef.current) {
      return joinCommunity(lastSlugRef.current);
    }
    return Promise.resolve(null);
  }, [joinCommunity]);

  return {
    joinCommunity,
    isJoining,
    joinStatus,
    statusMessage,
    error: error || apiError,
    retry,
    clearError
  };
} 