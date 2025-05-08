"use client";

import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
// import { Community, Post } from '@/types/community'; // Types likely come from useCommunity/useCommunityPosts now
import { Post } from '@/types/api'; // Keep Post type if needed for handlePostCreated
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
// import { communityApi, postApi } from '@/services/api'; // No longer needed directly for fetching
import {
  useCommunityWithSWR, 
  useCommunityPostsWithSWR, 
  useMembershipStatus,
  useJoinCommunity,
  useLeaveCommunity
} from '@/hooks/communities'; 

import DashboardLayout from '@/components/layouts/DashboardLayout'; // Import DashboardLayout
import CommunityHeader from '@/components/communities/slugPage/CommunityHeader';
import CommunityPostsFeed from '@/components/communities/slugPage/CommunityPostsFeed';
import CreatePostForm from '@/components/communities/CreatePostForm';
import CommunitySidebar from '@/components/communities/slugPage/CommunitySidebar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CommunityTabs from '@/components/communities/CommunityTabs';
import { CommunityMembersList } from '@/components/communities/members';
import TabSkeleton from '@/components/communities/slugPage/TabSkeleton';
import PerformanceMonitor from '@/components/performance/PerformanceMonitor';
import NavigationPrefetcher from '@/components/communities/slugPage/NavigationPrefetcher';
import QuickLinks from '@/components/communities/slugPage/QuickLinks';
import AdminOptionsPanel from '@/components/communities/slugPage/AdminOptionsPanel';

// Lazy-load tab components for better performance and code-splitting
const AboutTab = lazy(() => import('@/components/communities/slugPage/AboutTab'));
const MembersTab = lazy(() => import('@/components/communities/slugPage/MembersTab'));
const PostsTab = lazy(() => import('@/components/communities/slugPage/PostsTab'));

// Define component logic within a client component
function CommunityDetailContent() {
  const { slug: rawSlug } = useParams();
  const slug = typeof rawSlug === 'string' ? rawSlug : undefined;
  console.log('[CommunityDetailContent] Slug extracted from params:', slug);
  const router = useRouter();
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const { user, isLoadingProfile } = useUser();

  // Get the refresh parameter from URL
  const [shouldRefresh, setShouldRefresh] = useState(false);
  
  // Check for refresh parameter on initial load
  useEffect(() => {
    const url = new URL(window.location.href);
    const refreshParam = url.searchParams.get('refresh');
    
    if (refreshParam === 'true') {
      setShouldRefresh(true);
      // Remove the refresh parameter to prevent infinite refreshes
      url.searchParams.delete('refresh');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Initialize activeTab state with 'posts' as default
  const [activeTab, setActiveTab] = useState('posts');
  // Add a cache buster state for posts
  const [postsCacheBuster, setPostsCacheBuster] = useState<number>(Date.now());

  // Use the SWR hooks for data fetching with better caching
  const { 
    community: fetchedCommunity,
    loading: loadingCommunity, 
    error: communityError,
    refresh: refreshCommunity
  } = useCommunityWithSWR(slug);
  
  const { 
    posts: communityPosts,
    loading: loadingPosts, 
    error: postsError,
    refresh: refreshPosts
  } = useCommunityPostsWithSWR(slug, undefined, postsCacheBuster);

  const { 
    membershipStatus, 
    isLoading: isLoadingMembership, 
    error: membershipError 
  } = useMembershipStatus(slug);

  // --- Action Hooks ---
  const { joinCommunity, isJoining, error: joinStatus } = useJoinCommunity();
  const { leaveCommunity, isLeaving, error: leaveError } = useLeaveCommunity();

  // --- Local State ---
  // Local state for newly created posts and membership (if implemented later)
  const [localPosts, setLocalPosts] = useState<Post[]>([]); // For optimistic updates
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [derivedStatus, setDerivedStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null); // For displaying join/leave errors

  // Combine posts from hook and local state for display
  const displayPosts = [...localPosts, ...communityPosts];

  // Combine loading states
  const initialPageLoading = isLoadingAuth || isLoadingProfile || loadingCommunity || (isAuthenticated && isLoadingMembership);

  // Update local community state when fetched data changes
  const [community, setCommunity] = useState(fetchedCommunity); // Local state for potential optimistic updates
  useEffect(() => {
    if (fetchedCommunity) {
      setCommunity(fetchedCommunity);
    }
  }, [fetchedCommunity]);

  // Determine membership based on the hook result
  useEffect(() => {
    // Wrap everything in a try-catch to ensure it never crashes the UI
    try {
      if (!isAuthenticated) {
        setIsMember(false);
        setDerivedStatus(null);
        // Reset cache buster to force posts refresh when authentication status changes
        setPostsCacheBuster(Date.now());
        return;
      }
      
      if (isLoadingMembership) {
        // Keep previous state while loading new status
        return; 
      }
      
      // Handle membership status safely, with fallback values
      try {
        if (membershipStatus) {
          console.log("Membership Status Received:", membershipStatus);
          // Use nullish coalescing for all values to ensure defaults even if API returns invalid data
          const newIsMember = membershipStatus.is_member ?? false;
          const newStatus = membershipStatus.status ?? null;
          
          // If membership status has changed, refresh posts
          if (newIsMember !== isMember || newStatus !== derivedStatus) {
            console.log("Membership status changed, refreshing posts");
            setPostsCacheBuster(Date.now());
          }
          
          setIsMember(newIsMember);
          setDerivedStatus(newStatus);
        } else {
          // If no status is returned (e.g., initial load or error), assume not member
          console.log("No membership status data, assuming not a member");
          setIsMember(false); 
          setDerivedStatus(null);
          // Force posts refresh
          setPostsCacheBuster(Date.now());
        }
      } catch (processingError) {
        console.error("Error processing membership status data:", processingError);
        // Always default to safe values
        setIsMember(false);
        setDerivedStatus(null);
        // Force posts refresh on error
        setPostsCacheBuster(Date.now());
      }
    } catch (outerError) {
      // Catch-all to ensure any error doesn't crash the component
      console.error("Critical error in membership status effect:", outerError);
      setIsMember(false);
      setDerivedStatus(null);
      // Force posts refresh on error
      setPostsCacheBuster(Date.now());
    }
  }, [membershipStatus, isLoadingMembership, isAuthenticated]);

  // Add a global error boundary effect to rescue from any membership-related errors
  useEffect(() => {
    // If there's a membership error, log it but don't break the UI
    if (membershipError) {
      console.warn("Membership status error detected:", membershipError);
      // No need to show this to the user - the UI should work regardless
    }
  }, [membershipError]);

  // Clear action error when join/leave error changes
  useEffect(() => {
    setActionError(joinStatus || leaveError || null);
    // Optional: Clear error after a few seconds
    if (joinStatus || leaveError) {
        const timer = setTimeout(() => setActionError(null), 5000);
        return () => clearTimeout(timer);
    }
  }, [joinStatus, leaveError]);

  // Add a refresh function that updates all data
  const refreshAllData = useCallback(async () => {
    await Promise.all([
      refreshCommunity(),
      refreshPosts()
    ]);
  }, [refreshCommunity, refreshPosts]);
  
  // Refresh data when shouldRefresh is true
  useEffect(() => {
    if (shouldRefresh) {
      console.log('Refreshing community data due to refresh parameter');
      refreshAllData();
      setShouldRefresh(false);
    }
  }, [shouldRefresh, refreshAllData]);

  // --- Action Handlers ---
  const handleJoin = async () => {
    if (!slug || isJoining || isLeaving) return;
    if (isLoadingAuth || isLoadingProfile) {
      setActionError('Please wait, authentication is still loading.');
      return;
    }
    if (!isAuthenticated) {
      setActionError('You must be logged in to join this community.');
      return;
    }
    
    setActionError(null);
    
    // Optimistic UI update - immediately show as joined
    setIsMember(true);
    setDerivedStatus('approved');
    
    const response = await joinCommunity(slug);
    
    if (!response) {
      // Only revert UI state if there was a true error (not including "already member" which is handled in the hook)
      if (joinStatus === 'error') {
        // Revert optimistic update if there was an error
        setIsMember(false);
        setDerivedStatus(null);
        setActionError('Failed to join community. Please try again.');
      }
    } else {
      // Show success message that automatically dismisses
      setActionError(null);
      
      // Update members count if available
      if (community) {
        setCommunity({
          ...community,
          members_count: (community.members_count || 0) + 1
        });
      }
    }
  };

  const handleLeave = async () => {
    if (!slug || isJoining || isLeaving) return;
    
    setActionError(null);
    
    // Optimistic UI update - immediately show as left
    setIsMember(false);
    setDerivedStatus(null);
    
    // Force posts to refresh with a new timestamp
    setPostsCacheBuster(Date.now());
    
    const response = await leaveCommunity(slug);
    
    if (!response) {
      // Error occurred (leaveCommunity returned null)
      // Revert optimistic update
      setIsMember(true);
      setDerivedStatus('approved');
      setActionError('Failed to leave community. Please try again.');
    } else if (response.adminError) {
      // Special case: can't leave as only admin
      // Revert optimistic update
      setIsMember(true);
      setDerivedStatus('approved');
      setActionError(response.detail);
    } else {
      // Success or already left
      setActionError(null);
      
      // Update members count if available
      if (community) {
        setCommunity({
          ...community,
          members_count: Math.max(0, (community.members_count || 1) - 1)
        });
      }
    }
  };

  // Combined handler for components expecting one prop
  const handleToggleMembership = () => {
      if (isMember) {
          handleLeave();
      } else {
          handleJoin();
      }
  };

  const handlePostCreated = (newPost: Post) => {
    // Add the new post to local state for immediate display
    setLocalPosts(prevPosts => [newPost, ...prevPosts]);
    
    // Also refresh the posts data from the server to ensure consistency
    refreshPosts();
  };

  // Handler for create post
  const createPost = () => {
    router.push(`/communities/${slug}/posts/create`);
  };

  if (initialPageLoading) {
    return <LoadingSpinner fullScreen />;
  }

  // Prioritize community error
  if (communityError && !community) {
    return <div className="container mx-auto px-4 py-8 text-center text-red-600">{communityError}</div>;
  }
  
  if (!community) {
      return <div className="container mx-auto px-4 py-8 text-center text-gray-500">Community not found or failed to load.</div>;
  }

  // Handle posts error separately - might still show community info
  if (postsError) {
      console.error("Error loading posts:", postsError);
      // Optionally render an error message for the posts section only
  }

  // Determine if user is the creator (needed for some UI elements)
  const isCreator = user?.id === community?.creator?.id;
  // Determine effective membership for UI (creator is always effectively a member)
  const effectiveMember = isCreator || isMember;

  return (
    <PerformanceMonitor componentName="CommunityDetailPage" enabled={process.env.NODE_ENV === 'development'}>
    <div className="bg-gray-100 min-h-screen -mt-10 -mb-10"> {/* Negative margins to eliminate gaps */}
        {/* Performance optimization - prefetch likely navigation paths */}
        <NavigationPrefetcher 
          communitySlug={slug as string}
          currentTab={activeTab}
          userIsMember={effectiveMember ?? false}
        />
        
      {/* Display Action Errors */}
      {actionError && (
         <div className="fixed top-20 right-4 z-50 p-4 bg-red-100 border border-red-400 text-red-700 rounded shadow-lg">
           <p>Error: {actionError}</p>
         </div>
      )}

      {/* Full-width header component */}
      <CommunityHeader
        community={community}
        isMember={effectiveMember ?? false}
        membershipStatus={derivedStatus}
        onJoinLeave={handleToggleMembership} 
        isProcessing={isJoining || isLeaving}
        isAuthenticated={isAuthenticated}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        errorMessage={actionError}
      />

      <div className="container mx-auto px-2 sm:px-4 py-6 max-w-7xl">
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Show message if pending approval */}
            {isAuthenticated && effectiveMember && derivedStatus === 'pending' && (
                 <div className="bg-white p-4 rounded-md shadow-lg text-center text-gray-600 border-l-4 border-yellow-500">
                    <p className="font-medium">Your request to join is pending approval.</p>
                    <p className="text-sm text-gray-500 mt-1">You'll be able to create posts once approved.</p>
                </div>
            )}
            
            {/* Show prompt to join if authenticated but not a member */}
            {isAuthenticated && !effectiveMember && (
                 <div className="bg-white p-4 rounded-md shadow-lg text-center text-gray-600 border-l-4 border-blue-500">
                    <p className="font-medium">Join the community to create posts and participate in discussions.</p>
                </div>
            )}

              {/* Posts tab content with Suspense and error boundary */}
            {activeTab === 'posts' && (
                <Suspense fallback={<TabSkeleton type="posts" />}>
                  <PostsTab
                    community={community}
                    posts={displayPosts}
                    isLoading={loadingPosts}
                    user={user}
                    slug={slug as string}
                    isCreator={isCreator}
                    isMember={effectiveMember ?? false} 
                    membershipStatus={derivedStatus}
                    handleUpvotePost={async () => console.log('Upvote handler not implemented yet.')}
                  />
                </Suspense>
              )}
              
              {/* About tab content with Suspense */}
              {activeTab === 'about' && (
                <Suspense fallback={<TabSkeleton type="about" />}>
                  <AboutTab community={community} isCreator={isCreator} />
                </Suspense>
              )}
              
              {/* Members tab content with Suspense */}
              {activeTab === 'members' && (
                <Suspense fallback={<TabSkeleton type="members" />}>
                  <MembersTab community={community} slug={slug as string} />
                </Suspense>
              )}
                
                {/* Display posts loading error if it occurred */}
              {postsError && activeTab === 'posts' && (
                    <div className="text-center text-red-500 p-4 bg-red-50 rounded-md shadow-lg border border-red-200">
                        <p className="font-medium">Error loading posts:</p>
                        <p>{postsError}</p>
                    </div>
              )}
          </div>

          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Admin Options Panel for community creators */}
              {isCreator && <AdminOptionsPanel communitySlug={slug as string} />}
              
              {/* Use the QuickLinks component with all required props */}
              <QuickLinks 
                community={community}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>
          </div>
          
          {/* Admin Options section for mobile and small screens */}
          {isCreator && (
            <div className="lg:hidden col-span-3 mt-6">
              <AdminOptionsPanel communitySlug={slug as string} />
            </div>
          )}
        </div>
      </div>
    </div>
    </PerformanceMonitor>
  );
}

export default function CommunityDetailPage(): React.ReactElement {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <DashboardLayout>
        <CommunityDetailContent />
      </DashboardLayout>
    </Suspense>
  );
}
