import { useEffect, useRef, useState, useCallback } from 'react';

interface IntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean;
}

/**
 * A hook that observes when an element intersects with the viewport
 * Useful for implementing lazy loading, infinite scroll, etc.
 * 
 * @param options The IntersectionObserver options
 * @returns An object with the ref to attach and whether the element is visible
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>({
  root = null,
  rootMargin = '0px',
  threshold = 0,
  once = false
}: IntersectionObserverOptions = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef<T | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Create a callback for when the element is intersecting
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      
      // Check if the element is intersecting with the viewport
      const isElementVisible = entry.isIntersecting;
      
      // If we've already seen the element and we only want to trigger once, don't update
      if (once && hasBeenVisible) {
        return;
      }
      
      // Update visibility state
      setIsVisible(isElementVisible);
      
      // If it's visible now and we only need to track it once, mark it as seen
      if (isElementVisible && once) {
        setHasBeenVisible(true);
      }
    },
    [once, hasBeenVisible]
  );

  // Set up and clean up the observer
  useEffect(() => {
    const currentElement = elementRef.current;
    
    // Skip if no element to observe yet
    if (!currentElement) return;
    
    // Clean up existing observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // Create a new observer
    observerRef.current = new IntersectionObserver(handleIntersect, {
      root,
      rootMargin,
      threshold
    });
    
    // Start observing the current element
    observerRef.current.observe(currentElement);
    
    // Clean up observer on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersect, root, rootMargin, threshold]);

  return { ref: elementRef, isVisible };
}

export default useIntersectionObserver; 