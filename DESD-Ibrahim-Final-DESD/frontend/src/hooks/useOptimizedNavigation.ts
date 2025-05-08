"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { NAVIGATION_PRIORITIES, getRoutePriority } from '@/components/layouts/NavigationPriority';

// Interface for navigation performance metrics
interface NavigationMetrics {
  routePath: string;
  timeToLoad: number;
  timestamp: number;
}

// Cache for prefetched routes
const prefetchedRoutesCache = new Set<string>();

// Navigation history for predictive prefetching
const navigationHistory: string[] = [];
const MAX_HISTORY_LENGTH = 10;

/**
 * Enhanced custom hook for optimized navigation
 * Provides methods to navigate with optimal performance settings
 * Includes advanced features like:
 * - Performance tracking
 * - Predictive prefetching
 * - Cache management
 * - Intelligent resource prioritization
 */
const useOptimizedNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const initialPrefetchDone = useRef(false);
  const navigationStartTime = useRef<number>(0);
  const [metrics, setMetrics] = useState<NavigationMetrics[]>([]);
  
  // Record navigation timing for performance analysis
  useEffect(() => {
    // Skip the initial load
    if (navigationStartTime.current === 0) {
      navigationStartTime.current = Date.now();
      return;
    }
    
    // Record navigation completion time
    const timeToLoad = Date.now() - navigationStartTime.current;
    
    // Add to navigation history for predictive prefetching
    if (pathname && !navigationHistory.includes(pathname)) {
      navigationHistory.unshift(pathname);
      // Keep history at a reasonable size
      if (navigationHistory.length > MAX_HISTORY_LENGTH) {
        navigationHistory.pop();
      }
    }
    
    // Update metrics
    setMetrics(prev => [
      ...prev,
      {
        routePath: pathname || '',
        timeToLoad,
        timestamp: Date.now()
      }
    ]);
    
    // Reset timer for next navigation
    navigationStartTime.current = Date.now();
  }, [pathname]);
  
  // Simplified prediction based on navigation history
  const predictNextRoutes = useCallback(() => {
    // Simple prediction: look at routes that frequently follow the current path
    if (navigationHistory.length < 2) return [];
    
    // Find routes that typically follow the current route
    const currentRouteIndex = navigationHistory.indexOf(pathname || '');
    if (currentRouteIndex > 0 && currentRouteIndex < navigationHistory.length - 1) {
      return [navigationHistory[currentRouteIndex - 1]];
    }
    
    return [];
  }, [pathname]);
  
  // Prefetch with caching to avoid redundant requests
  const prefetchRoute = useCallback((href: string) => {
    if (!href || href === pathname) return;
    
    // Skip if already prefetched
    if (prefetchedRoutesCache.has(href)) return;
    
    try {
      // Mark as prefetched to prevent duplicate prefetching
      prefetchedRoutesCache.add(href);
      
      // Use Next.js router to prefetch the page
      router.prefetch(href);
    } catch (error) {
      // Remove from cache if prefetch failed
      prefetchedRoutesCache.delete(href);
      console.error('Error prefetching route:', error);
    }
  }, [router, pathname]);
  
  // Enhanced navigation function
  const navigateTo = useCallback((href: string) => {
    // Start timing the navigation
    navigationStartTime.current = Date.now();
    
    // Record in history before navigation
    if (pathname && !navigationHistory.includes(pathname)) {
      navigationHistory.unshift(pathname);
      if (navigationHistory.length > MAX_HISTORY_LENGTH) {
        navigationHistory.pop();
      }
    }
    
    // Navigate
    router.push(href);
  }, [router, pathname]);
  
  // Prefetch critical routes based on priorities
  useEffect(() => {
    if (initialPrefetchDone.current) return;
    
    // Prefetch critical routes first (immediately)
    NAVIGATION_PRIORITIES.critical.forEach(route => {
      if (route !== pathname) {
        prefetchRoute(route);
      }
    });
    
    // High priority routes after a short delay
    const highPriorityTimer = setTimeout(() => {
      NAVIGATION_PRIORITIES.high.forEach(route => {
        if (route !== pathname) {
          prefetchRoute(route);
        }
      });
    }, 1000);
    
    initialPrefetchDone.current = true;
    
    return () => {
      clearTimeout(highPriorityTimer);
    };
  }, [pathname, prefetchRoute]);

  return {
    navigateTo,
    prefetchRoute,
    currentPath: pathname,
    navigationMetrics: metrics,
    isRoutePrefetched: (href: string) => prefetchedRoutesCache.has(href),
    getRoutePriority: (href: string) => getRoutePriority(href)
  };
};

export default useOptimizedNavigation; 