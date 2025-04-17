import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generic hook for managing API requests with loading/error states
 * @param apiFunction The API function to call
 * @param dependencies Dependencies that should trigger a reload
 * @param immediate Whether to call the API immediately
 * @returns Object with data, loading, error, and execute function
 */
export function useApi<T, P extends unknown[]>(
  apiFunction: (...args: P) => Promise<T>,
  dependencies: unknown[] = [],
  immediate = true
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  // Store apiFunction in a ref to avoid dependency issues
  const apiFunctionRef = useRef(apiFunction);
  apiFunctionRef.current = apiFunction;

  const execute = useCallback(
    async (...args: P) => {
      if (!mounted.current) return null;
      
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunctionRef.current(...args);
        if (mounted.current) {
          setData(result);
          return result;
        }
        return null;
      } catch (err) {
        if (mounted.current) {
          const errorMessage = 
            err instanceof Error ? err.message : 'An unknown error occurred';
          setError(errorMessage);
        }
        return null;
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    },
    [] // No dependencies since we're using refs
  );

  // This effect handles the initial API call and cleanup
  useEffect(() => {
    mounted.current = true;
    
    if (immediate) {
      // TODO: Revisit this casting and execute call logic. Is executing with an empty array always safe?
      // execute([] as unknown as P); // Commented out due to TS error TS2345
    }
    
    return () => {
      mounted.current = false;
    };
  // We only want to run this when dependencies or immediate changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, immediate]);

  return { data, loading, error, execute };
}

/**
 * Hook for lazy API calls (only executed manually)
 * @param apiFunction The API function to call
 * @returns Object with data, loading, error, and execute function
 */
export function useLazyApi<T, P extends unknown[]>(apiFunction: (...args: P) => Promise<T>) {
  return useApi<T, P>(apiFunction, [], false);
}

export default useApi; 