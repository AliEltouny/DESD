"use client";

import React, { memo, useEffect, useRef } from 'react';
import useOptimizedNavigation from '@/hooks/useOptimizedNavigation';

/**
 * A minimal performance monitor that only uses native browser APIs
 */
const PerformanceMonitor = memo(() => {
  const { navigationMetrics } = useOptimizedNavigation();
  const metricsRef = useRef<{[key: string]: number[]}>({});

  // Basic route timing tracking
  useEffect(() => {
    if (!navigationMetrics.length) return;
    
    // Track route navigation times
    navigationMetrics.forEach(metric => {
      const route = metric.routePath;
      if (!metricsRef.current[route]) {
        metricsRef.current[route] = [];
      }
      metricsRef.current[route].push(metric.timeToLoad);
    });
    
    // Every 5 navigations, log a summary
    if (navigationMetrics.length % 5 === 0) {
      console.log('📊 Navigation stats:', 
        Object.entries(metricsRef.current).map(([route, times]) => ({
          route,
          avg: Math.round(times.reduce((sum, t) => sum + t, 0) / times.length)
        }))
      );
    }
  }, [navigationMetrics]);

  return null; // Nothing to render
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

export default PerformanceMonitor; 