"use client";

import React, { memo, useEffect } from 'react';
import Link from 'next/link';
import { getEssentialRoutes, PREFETCH_DELAYS, NAVIGATION_PRIORITIES } from './NavigationPriority';
import { useRouter } from 'next/navigation';

/**
 * Component that preloads common routes to improve navigation performance
 * It creates hidden links that Next.js will prefetch automatically
 * Using memo to prevent unnecessary re-renders
 */
const LinkPrefetcher: React.FC = memo(() => {
  const router = useRouter();
  
  // Set up staggered prefetching based on priority
  useEffect(() => {
    // Prefetch critical routes immediately
    NAVIGATION_PRIORITIES.critical.forEach(route => {
      router.prefetch(route);
    });
    
    // Prefetch high priority routes after a short delay
    const highPriorityTimer = setTimeout(() => {
      NAVIGATION_PRIORITIES.high.forEach(route => {
        router.prefetch(route);
      });
    }, PREFETCH_DELAYS.high);
    
    // Prefetch medium priority routes after a longer delay
    const mediumPriorityTimer = setTimeout(() => {
      NAVIGATION_PRIORITIES.medium.forEach(route => {
        router.prefetch(route);
      });
    }, PREFETCH_DELAYS.medium);
    
    // Prefetch low priority routes last
    const lowPriorityTimer = setTimeout(() => {
      NAVIGATION_PRIORITIES.low.forEach(route => {
        router.prefetch(route);
      });
    }, PREFETCH_DELAYS.low);
    
    // Cleanup timers to prevent memory leaks
    return () => {
      clearTimeout(highPriorityTimer);
      clearTimeout(mediumPriorityTimer);
      clearTimeout(lowPriorityTimer);
    };
  }, [router]);
  
  // Only render links for essential (critical and high) routes in the DOM
  // Other routes will be prefetched programmatically above
  const essentialRoutes = getEssentialRoutes();

  return (
    <div className="hidden" aria-hidden="true">
      {essentialRoutes.map(route => (
        <Link 
          key={route} 
          href={route} 
          prefetch={true}
        >
          <span className="sr-only">{route}</span>
        </Link>
      ))}
    </div>
  );
});

LinkPrefetcher.displayName = 'LinkPrefetcher';

export default LinkPrefetcher; 