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
 * Hook for leaving a community.
 * Provides an execute function to trigger the leave action with enhanced error handling.
 *
 * @returns Object containing execute function, loading state, error state, and retry function.
 */
export function useLeaveCommunity() {
  const [leaveStatus, setLeaveStatus] = useState<'idle' | 'leaving' | 'success' | 'error'>('idle');
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
    execute: executeLeave, 
    loading: isLeaving, 
    error: apiError 
  } = useLazyApi<ApiSuccessResponse, [string]>(
    communityApi.leaveCommunity
  );

  // Clear error when component unmounts or when slug changes
  const clearError = useCallback(() => {
    setError(null);
    setStatusMessage(null);
  }, []);

  // Enhanced leave function with pre/post processing
  const leaveCommunity = useCallback(async (slug: string) => {
    try {
      // Reset states
      clearError();
      setLeaveStatus('leaving');
      lastSlugRef.current = slug;

      // Display user-friendly message
      setStatusMessage("Leaving community...");

      // Call the API
      const response = await executeLeave(slug);

      // Update status
      if (response) {
        setLeaveStatus('success');
        setStatusMessage(response.detail || "Successfully left community");
        
        // Cache invalidation - but no page refresh
        try {
          // Update local membership cache to reflect new status
          const localCacheKey = `membership_${slug}`;
          cacheUtils.set(localCacheKey, {
            is_member: false,
            status: null,
            role: null
          });
          
          // Clear community cache to force reload of data with new membership status
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
        
        // Refresh the page to ensure all components reload with updated membership status
        // This is important for handling visibility-specific content
        if (typeof window !== 'undefined') {
          // Force a complete page refresh by changing the URL
          // This ensures all data is fetched fresh from the server
          const currentUrl = window.location.href;
          const baseUrl = currentUrl.split('?')[0]; // Remove any query parameters
          window.location.href = baseUrl; // Force complete page reload
        }
        
        return response;
      } else {
        throw new Error("No response received");
      }
    } catch (err) {
      console.error("Error leaving community:", err);
      
      // Handle "not a member" error as success
      if (err?.response?.status === 400 && 
          err?.response?.data?.detail && 
          (err.response.data.detail.includes("not a member") || 
           err.response.data.detail.includes("You are not a member"))) {
        console.log("User is not a member - treating as success");
        
        // Update local membership cache to reflect non-membership status
        try {
          const localCacheKey = `membership_${slug}`;
          cacheUtils.set(localCacheKey, {
            is_member: false,
            status: null,
            role: null
          });
        } catch (cacheError) {
          console.warn("Failed to update membership cache:", cacheError);
        }
        
        // Set success state
        setLeaveStatus('success');
        setStatusMessage("You are not a member of this community.");
        
        // Return a success response
        return {
          detail: "You are not a member of this community.",
          success: true
        };
      }
      
      // Handle admin-only error and show it in UI
      if (err?.response?.status === 400 && 
          err?.response?.data?.detail && 
          err.response.data.detail.includes("only admin")) {
        const errorMessage = "You cannot leave as you are the only admin. Please make another user an admin first.";
        setError(errorMessage);
        setStatusMessage("Leave failed: " + errorMessage);
        setLeaveStatus('error');
        
        // Return a special response to indicate admin error
        return {
          detail: errorMessage,
          success: false,
          adminError: true
        };
      }
      
      setLeaveStatus('error');
      
      // Set user-friendly error message
      const errorMessage = err.userMessage || err.message || "Failed to leave community";
      setError(errorMessage);
      setStatusMessage("Leave failed. " + errorMessage);
      
      return null;
    }
  }, [executeLeave, clearError, queryClient]);

  // Function to retry the last leave attempt
  const retry = useCallback(() => {
    if (lastSlugRef.current) {
      return leaveCommunity(lastSlugRef.current);
    }
    return Promise.resolve(null);
  }, [leaveCommunity]);

  return {
    leaveCommunity,
    isLeaving,
    leaveStatus,
    statusMessage,
    error: error || apiError,
    retry,
    clearError
  };
} 