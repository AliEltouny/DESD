import useSWR from 'swr';
import { Post, PaginatedResponse, PostFilters } from '@/types/api';
import { communityApi } from '@/services/api';

const fetcher = async (key: string) => {
  try {
    const [_, slug, filtersString, cacheBuster] = key.split('::');
    const filters = filtersString && filtersString !== 'undefined' ? JSON.parse(filtersString) : {};
    
    // Add timestamp to prevent caching
    const params = {
      ...filters,
      _t: cacheBuster || Date.now()
    };
    
    // Build URL with parameters
    let url = `http://localhost:8000/api/communities/${slug}/posts/?`;
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url += `${key}=${encodeURIComponent(String(value))}&`;
      }
    });
    
    // Remove trailing &
    url = url.slice(0, -1);
    
    console.log('Fetching posts with URL:', url);
    
    // Use promise with XMLHttpRequest to avoid CORS issues
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.withCredentials = true;
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      xhr.setRequestHeader('Pragma', 'no-cache');
      xhr.setRequestHeader('Expires', '0');
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (e) {
            console.error('Error parsing JSON response:', e);
            resolve({ results: [], count: 0, next: null, previous: null });
          }
        } else {
          console.error('XHR request failed:', xhr.status, xhr.statusText);
          resolve({ results: [], count: 0, next: null, previous: null });
        }
      };
      
      xhr.onerror = function() {
        console.error('XHR network error');
        resolve({ results: [], count: 0, next: null, previous: null });
      };
      
      xhr.send();
    });
  } catch (error) {
    console.error('Error in fetcher:', error);
    // Return empty results to avoid crashing the UI
    return { results: [], count: 0, next: null, previous: null };
  }
};

/**
 * Enhanced hook for retrieving posts for a specific community using SWR
 * Provides automatic caching, revalidation, and error handling
 */
export function useCommunityPostsWithSWR(
  slug: string | undefined, 
  filters?: PostFilters,
  cacheBuster?: string | number
) {
  // Create a stable key for SWR based on slug and filters
  const filtersKey = filters ? JSON.stringify(filters) : '';
  // Add timestamp for cache busting if provided
  const cacheKey = slug ? `posts::${slug}::${filtersKey}::${cacheBuster || ''}` : null;
  
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  } = useSWR<PaginatedResponse<Post>>(
    cacheKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 30000, // 30 seconds
      errorRetryCount: 1, // Reduce retry count to 1
      suspense: false,
      fallbackData: { results: [], count: 0, next: null, previous: null }, // Provide a fallback
      shouldRetryOnError: (err) => {
        // Don't retry on 403 errors (permission issues)
        if (err && typeof err === 'object' && 'status' in err && err.status === 403) {
          return false;
        }
        // Retry on network errors and server errors
        return true;
      },
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Don't retry on 404s or 403s
        if (error.status === 404 || error.status === 403) return;
        
        // Retry only once with 2 second delay
        if (retryCount >= 1) return;
        
        // Use a fixed 2-second retry delay
        setTimeout(() => revalidate({ retryCount }), 2000);
      }
    }
  );

  return {
    posts: data?.results || [],
    count: data?.count || 0,
    next: data?.next || null,
    previous: data?.previous || null,
    loading: isLoading,
    isValidating,
    error: error?.message || (error ? 'Failed to load posts' : null),
    refresh: mutate
  };
} 