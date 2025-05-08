/**
 * Navigation priority utility
 * Helps prioritize the loading and prefetching of routes based on frequency of use
 */

// Routes organized by priority for efficient loading
export const NAVIGATION_PRIORITIES = {
  // Critical paths that should be loaded immediately
  critical: [
    '/communities',
    '/dashboard'
  ],
  
  // High priority routes that should load soon after initial render
  high: [
    '/profile',
    '/events',
    '/messages'
  ],
  
  // Medium priority routes that can be loaded after high priority ones
  medium: [
    '/users/search',
    '/settings'
  ],
  
  // Low priority routes that can be loaded last
  low: [
    '/help',
    '/about',
    '/terms'
  ]
};

// Time delays for different priority levels (in milliseconds)
export const PREFETCH_DELAYS = {
  critical: 0,      // Immediate
  high: 1000,       // 1 second after page load
  medium: 2500,     // 2.5 seconds after page load 
  low: 5000         // 5 seconds after page load
};

// Get all navigation routes as a flat array
export const getAllRoutes = (): string[] => {
  return [
    ...NAVIGATION_PRIORITIES.critical,
    ...NAVIGATION_PRIORITIES.high,
    ...NAVIGATION_PRIORITIES.medium,
    ...NAVIGATION_PRIORITIES.low
  ];
};

// Get only critical and high priority routes for immediate prefetching
export const getEssentialRoutes = (): string[] => {
  return [
    ...NAVIGATION_PRIORITIES.critical,
    ...NAVIGATION_PRIORITIES.high
  ];
};

// Determine the priority level of a given route
export const getRoutePriority = (route: string): 'critical' | 'high' | 'medium' | 'low' => {
  if (NAVIGATION_PRIORITIES.critical.includes(route)) return 'critical';
  if (NAVIGATION_PRIORITIES.high.includes(route)) return 'high';
  if (NAVIGATION_PRIORITIES.medium.includes(route)) return 'medium';
  return 'low';
};

export default NAVIGATION_PRIORITIES; 