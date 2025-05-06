import { useState, useEffect, useCallback, useRef } from 'react';
import { AxiosError } from 'axios';

/**
 * Generic hook for managing API requests with loading/error states
 * @param apiFunction The API function to call
 * @param dependencies Dependencies that should trigger a reload
 * @param immediate Whether to call the API immediately
 * @returns Object with data, loading, error, and execute function
 */
export function useApi<T, P extends unknown[]>(
  apiFunction: (...args: P) => Promise<T>,
  dependencies: P,
  immediate = true
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  // Store apiFunction in a ref to avoid dependency issues
  const apiFunctionRef = useRef(apiFunction);
  apiFunctionRef.current = apiFunction;

  // useCallback depends on the dependencies array now
  const execute = useCallback(
    // Restore ...args parameter for lazy calls
    async (...args: P) => { 
      if (!mounted.current) return null;
      
      // Determine arguments: use passed args if available, otherwise use hook dependencies
      // This supports both lazy calls (with args) and immediate useEffect calls (without args)
      const executionArgs = args.length > 0 ? args : dependencies;

      // Check if dependencies/arguments are valid before calling API
      // Example check: ensure first arg is not null/undefined if required
      // This specific check might need adjustment based on your API function needs
      if (executionArgs.length === 0 && dependencies.length === 0) {
         // Avoid calling if no args and no dependencies (potentially lazy init)
         // Or handle based on specific API needs
         // console.warn('useApi execute called with no arguments or dependencies.');
         // return null; // Or proceed if apiFunction handles it
      }

      try {
        setLoading(true);
        setError(null);
        // Use the determined arguments
        const result = await apiFunctionRef.current(...executionArgs);
        if (mounted.current) {
          setData(result);
          return result;
        }
        return null; // If unmounted during async call
      } catch (err) {
        if (mounted.current) {
          let errorMessage = 'An unknown error occurred';
          console.error("Raw API Error:", err);

          if (err instanceof AxiosError) {
            console.error("Axios Error Response Data:", err.response?.data);
            
            const responseData = err.response?.data;
            if (responseData) {
                if (typeof responseData === 'string') {
                    errorMessage = responseData;
                } else if (typeof responseData === 'object') {
                    if (responseData.detail) {
                        errorMessage = responseData.detail;
                    } else if (Object.keys(responseData).length > 0) {
                         errorMessage = Object.entries(responseData)
                            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                            .join('; ');
                    } else {
                         errorMessage = `Request failed with status ${err.response?.status || 'unknown'}`;
                    }
                } else {
                    errorMessage = err.message || `Request failed with status ${err.response?.status || 'unknown'}`;
                }
            } else {
              errorMessage = err.message;
            }
          } else if (err instanceof Error) {
            errorMessage = err.message;
          }
          
          setError(errorMessage);
        }
        return null; // Indicate error by returning null
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    },
    // IMPORTANT: Add dependencies back here so execute updates when they change
    [dependencies] 
  );

  // This effect handles the initial API call and cleanup
  useEffect(() => {
    mounted.current = true;
    
    if (immediate) {
      // Call execute WITHOUT arguments for immediate calls.
      // It will use the 'dependencies' array internally.
      execute(); 
    }
    
    return () => {
      mounted.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...dependencies]); // Re-add dependencies here too

  return { data, loading, error, execute };
}

/**
 * Hook for lazy API calls (only executed manually)
 * @param apiFunction The API function to call
 * @returns Object with data, loading, error, and execute function
 */
export function useLazyApi<T, P extends unknown[]>(apiFunction: (...args: P) => Promise<T>) {
  // Pass empty array typed as P for initial dependencies
  return useApi<T, P>(apiFunction, [] as unknown as P, false);
}

export default useApi; 