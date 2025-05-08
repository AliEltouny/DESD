import React, { useEffect, useState } from 'react';

/**
 * Performance Monitor Component
 * 
 * Tracks and displays various metrics about component performance:
 * - Component render time
 * - First Contentful Paint
 * - Largest Contentful Paint
 * - Time to Interactive
 * 
 * Note: This should only be used in development and testing, not in production
 */
const PerformanceMonitor: React.FC<{
  componentName: string;
  enabled?: boolean;
  children?: React.ReactNode;
}> = ({ componentName, enabled = false, children }) => {
  const [metrics, setMetrics] = useState<Record<string, number | null>>({
    renderTime: null,
    firstPaint: null,
    firstContentfulPaint: null,
    largestContentfulPaint: null,
    timeToInteractive: null,
  });

  // Only run this in the browser
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || typeof performance === 'undefined') {
      return;
    }

    const startTime = performance.now();

    // When component mounts, record metrics
    const recordMetrics = () => {
      try {
        // Basic render time
        const endTime = performance.now();
        const renderTime = endTime - startTime;

        // Get more detailed metrics if available
        let firstPaint = null;
        let firstContentfulPaint = null;
        let largestContentfulPaint = null;

        // Get paint timing entries
        const paintEntries = performance.getEntriesByType('paint');
        for (const entry of paintEntries) {
          if (entry.name === 'first-paint') {
            firstPaint = entry.startTime;
          } else if (entry.name === 'first-contentful-paint') {
            firstContentfulPaint = entry.startTime;
          }
        }

        // Update metrics
        setMetrics({
          renderTime,
          firstPaint,
          firstContentfulPaint,
          largestContentfulPaint,
          timeToInteractive: null, // This is hard to measure accurately
        });

        // Log for developers
        console.log(`[Performance] ${componentName}:`, {
          renderTime: `${renderTime.toFixed(2)}ms`,
          firstPaint: firstPaint ? `${firstPaint.toFixed(2)}ms` : 'N/A',
          firstContentfulPaint: firstContentfulPaint ? `${firstContentfulPaint.toFixed(2)}ms` : 'N/A',
        });
      } catch (error) {
        console.error('[Performance Monitor] Error:', error);
      }
    };

    // Set a timeout to ensure we measure after component has rendered
    const timeoutId = setTimeout(recordMetrics, 0);

    // Observer for Largest Contentful Paint
    let lcpObserver: PerformanceObserver | null = null;
    try {
      if (PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
        lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            setMetrics(prev => ({
              ...prev,
              largestContentfulPaint: lastEntry.startTime,
            }));
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      }
    } catch (e) {
      console.warn('[Performance Monitor] LCP Observer error:', e);
    }

    return () => {
      clearTimeout(timeoutId);
      if (lcpObserver) {
        lcpObserver.disconnect();
      }
    };
  }, [componentName, enabled]);

  // Don't render anything additional in production or if disabled
  if (!enabled || process.env.NODE_ENV === 'production') {
    return <>{children}</>;
  }

  return (
    <div className="performance-monitor">
      {children}
      
      <div className="fixed bottom-0 right-0 z-50 p-2 bg-black bg-opacity-75 text-white text-xs font-mono">
        <div className="text-green-300 font-bold">{componentName} Metrics:</div>
        <div>Render: {metrics.renderTime ? `${metrics.renderTime.toFixed(2)}ms` : 'N/A'}</div>
        <div>FCP: {metrics.firstContentfulPaint ? `${metrics.firstContentfulPaint.toFixed(2)}ms` : 'N/A'}</div>
        <div>LCP: {metrics.largestContentfulPaint ? `${metrics.largestContentfulPaint.toFixed(2)}ms` : 'N/A'}</div>
      </div>
    </div>
  );
};

export default PerformanceMonitor; 