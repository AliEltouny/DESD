"use client";

import React, { memo, useEffect, useRef } from 'react';
import Link from 'next/link';
import useOptimizedNavigation from '@/hooks/useOptimizedNavigation';
import { getRoutePriority } from './NavigationPriority';

interface NavigationItemProps {
  name: string;
  href: string;
  isActive: boolean;
  isMobile?: boolean;
  onClick?: () => void;
}

/**
 * Memoized individual navigation item component
 * Only re-renders when its active state changes or when route changes
 */
const NavigationItem: React.FC<NavigationItemProps> = memo(({ 
  name, 
  href, 
  isActive, 
  isMobile = false,
  onClick 
}) => {
  const { prefetchRoute } = useOptimizedNavigation();
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  
  // Determine the route's priority for handling
  const priority = getRoutePriority(href);
  
  // Use IntersectionObserver to prefetch routes when they come into view
  useEffect(() => {
    // Skip if the link is already active or if it's a critical route (already prefetched)
    if (isActive || priority === 'critical') return;
    
    // Setup intersection observer to prefetch when visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Prefetch the route when it becomes visible
            prefetchRoute(href);
            
            // Disconnect observer after prefetching
            if (intersectionObserverRef.current) {
              intersectionObserverRef.current.disconnect();
            }
          }
        });
      },
      { threshold: 0.1 } // Trigger when 10% of the element is visible
    );
    
    // Start observing the link element
    if (linkRef.current) {
      observer.observe(linkRef.current);
      intersectionObserverRef.current = observer;
    }
    
    return () => {
      // Clean up observer on unmount
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, [href, isActive, prefetchRoute, priority]);

  // Generate appropriate class names based on whether item is active and mobile/desktop view
  const className = isMobile
    ? `block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${
        isActive
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800'
      }`
    : `inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
        isActive
          ? 'border-blue-500 text-gray-900'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
      }`;

  return (
    <Link
      ref={linkRef}
      href={href}
      prefetch={priority === 'critical' || priority === 'high'} // Only set prefetch for high priority routes
      className={className}
      onClick={onClick}
      onMouseEnter={() => prefetchRoute(href)}
      data-priority={priority} // Add data attribute for debugging
    >
      {name}
    </Link>
  );
});

NavigationItem.displayName = 'NavigationItem';

export default NavigationItem; 