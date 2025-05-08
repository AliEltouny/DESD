import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PrefetchPath {
  path: string;
  priority: 'high' | 'medium' | 'low';
  prefetchData?: boolean;
}

interface NavigationPrefetcherProps {
  communitySlug: string;
  currentTab: string;
  userIsMember: boolean;
}

/**
 * Prefetches navigation paths for better performance
 * Prioritizes likely navigation paths based on the current tab and user state
 */
const NavigationPrefetcher: React.FC<NavigationPrefetcherProps> = ({
  communitySlug,
  currentTab,
  userIsMember,
}) => {
  const router = useRouter();

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') {
      return;
    }

    // List of paths to prefetch with priorities
    const pathsToPrefetch: PrefetchPath[] = [];

    // Add basic paths that are always likely to be navigated to
    pathsToPrefetch.push({ 
      path: `/communities/${communitySlug}`, 
      priority: 'high' 
    });

    // If user is viewing posts, they might navigate to a specific post or create one
    if (currentTab === 'posts') {
      if (userIsMember) {
        pathsToPrefetch.push({ 
          path: `/communities/${communitySlug}/posts/create`, 
          priority: 'medium' 
        });
      }
    } 
    // If user is viewing about tab, they might want to see members
    else if (currentTab === 'about') {
      pathsToPrefetch.push({ 
        path: `/communities/${communitySlug}/members`, 
        priority: 'medium' 
      });
    }
    // If user is viewing members tab, they might want to see the about page
    else if (currentTab === 'members') {
      pathsToPrefetch.push({ 
        path: `/communities/${communitySlug}?tab=about`, 
        priority: 'medium' 
      });
    }

    // Always prefetch the communities landing page as a common "back" path
    pathsToPrefetch.push({ 
      path: '/communities', 
      priority: 'low' 
    });

    // Prefetch paths with a small delay and according to priority
    const prefetchPaths = async () => {
      // High priority - prefetch immediately
      const highPriority = pathsToPrefetch.filter(p => p.priority === 'high');
      highPriority.forEach(({ path }) => {
        router.prefetch(path);
        console.log(`[Prefetcher] High priority prefetch: ${path}`);
      });

      // Medium priority - prefetch after a short delay
      if (pathsToPrefetch.some(p => p.priority === 'medium')) {
        setTimeout(() => {
          const mediumPriority = pathsToPrefetch.filter(p => p.priority === 'medium');
          mediumPriority.forEach(({ path }) => {
            router.prefetch(path);
            console.log(`[Prefetcher] Medium priority prefetch: ${path}`);
          });
        }, 200);
      }

      // Low priority - prefetch after user has been on page for a while
      if (pathsToPrefetch.some(p => p.priority === 'low')) {
        setTimeout(() => {
          const lowPriority = pathsToPrefetch.filter(p => p.priority === 'low');
          lowPriority.forEach(({ path }) => {
            router.prefetch(path);
            console.log(`[Prefetcher] Low priority prefetch: ${path}`);
          });
        }, 1000);
      }
    };

    // Start prefetching
    prefetchPaths();
  }, [communitySlug, currentTab, userIsMember, router]);

  // This component doesn't render anything
  return null;
};

export default NavigationPrefetcher; 