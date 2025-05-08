import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

/**
 * Hook that returns the current window dimensions
 * Updates when the window is resized
 */
export function useWindowSize(): WindowSize {
  // Initialize with default values to prevent server-side rendering issues
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Only run this on the client
    if (typeof window === 'undefined') {
      return;
    }

    // Handler to call on window resize
    function handleResize() {
      // Set window dimensions
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures this only runs on mount and unmount

  return windowSize;
} 