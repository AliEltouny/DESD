"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
// import { Community, Post } from '@/types/community'; // Types likely come from useCommunity/useCommunityPosts now
import { Post } from '@/types/api'; // Keep Post type if needed for handlePostCreated
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
// import { communityApi, postApi } from '@/services/api'; // No longer needed directly for fetching
import {
  useCommunity, 
  useCommunityPosts, 
  useMembershipStatus, // Import new hook
  useJoinCommunity,    // Import new hook
  useLeaveCommunity    // Import new hook
} from '@/hooks/communities'; 

import DashboardLayout from '@/components/layouts/DashboardLayout'; // Import DashboardLayout
import CommunityHeader from '@/components/communities/slugPage/CommunityHeader';
import CommunityPostsFeed from '@/components/communities/slugPage/CommunityPostsFeed';
import CreatePostForm from '@/components/communities/CreatePostForm';
import CommunitySidebar from '@/components/communities/slugPage/CommunitySidebar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CommunityTabs from '@/components/communities/CommunityTabs';

// Tab components
const AboutTab = ({ community, isCreator }) => (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <h2 className="text-2xl font-bold mb-4 text-gray-900">About {community.name}</h2>
    
    {community.description && (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">Description</h3>
        <p className="text-gray-700 whitespace-pre-line leading-relaxed">{community.description}</p>
      </div>
    )}
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">Community Details</h3>
        <ul className="space-y-3">
          <li className="flex items-center text-gray-700">
            <span className="flex-shrink-0 bg-blue-100 text-blue-600 p-1 rounded mr-3">👥</span>
            <span><strong>{community.member_count || 0}</strong> members</span>
          </li>
          {community.category && (
            <li className="flex items-center text-gray-700">
              <span className="flex-shrink-0 bg-purple-100 text-purple-600 p-1 rounded mr-3">🏷️</span>
              <span>Category: <strong className="capitalize">{community.category}</strong></span>
            </li>
          )}
          <li className="flex items-center text-gray-700">
            <span className="flex-shrink-0 bg-green-100 text-green-600 p-1 rounded mr-3">📅</span>
            <span>Created: <strong>{new Date(community.created_at).toLocaleDateString()}</strong></span>
          </li>
          {community.creator && (
            <li className="flex items-center text-gray-700">
              <span className="flex-shrink-0 bg-yellow-100 text-yellow-600 p-1 rounded mr-3">👤</span>
              <span>Created by: <strong>{community.creator.username || community.creator.email}</strong></span>
            </li>
          )}
          <li className="flex items-center text-gray-700">
            <span className="flex-shrink-0 bg-gray-100 text-gray-600 p-1 rounded mr-3">{community.is_private ? '🔒' : '🌐'}</span>
            <span><strong>{community.is_private ? 'Private' : 'Public'}</strong> community</span>
          </li>
        </ul>
      </div>
      
      {community.rules && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">Community Rules</h3>
          <div className="text-gray-700 whitespace-pre-line leading-relaxed">{community.rules}</div>
        </div>
      )}
    </div>
    
    {isCreator && (
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Admin Options</h3>
        <p className="text-gray-700 mb-3">As the creator of this community, you have access to additional management options.</p>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Manage Community
        </button>
      </div>
    )}
  </div>
);

const MembersTab = ({ community }) => (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <h2 className="text-2xl font-bold mb-4 text-gray-900">Members</h2>
    <p className="text-gray-500 italic">Members list functionality will be implemented soon.</p>
    <div className="mt-4 bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-blue-600 font-semibold">👥</span>
        <span className="font-medium">{community.member_count || 0} total members</span>
      </div>
    </div>
  </div>
);

// Quick Links Component with actual functionality
const QuickLinks = ({ community, activeTab, onTabChange }) => (
  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
      <h2 className="text-lg font-semibold text-white">Quick Links</h2>
    </div>
    <div className="p-4">
      <nav className="space-y-2">
        {/* Latest Posts - switches to Posts tab */}
        <button 
          onClick={() => onTabChange('posts')}
          className={`block w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition-colors flex items-center ${activeTab === 'posts' ? 'bg-blue-50 text-blue-700' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
          </svg>
          Latest Posts
        </button>

        {/* Community Guidelines - switches to About tab */}
        <button 
          onClick={() => onTabChange('about')}
          className={`block w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition-colors flex items-center ${activeTab === 'about' ? 'bg-blue-50 text-blue-700' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
          Community Guidelines
        </button>

        {/* Members List - switches to Members tab */}
        <button 
          onClick={() => onTabChange('members')}
          className={`block w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition-colors flex items-center ${activeTab === 'members' ? 'bg-blue-50 text-blue-700' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          Members
        </button>

        {/* Share Community */}
        <button
          onClick={() => {
            // Create a shareable URL for the community
            const communityUrl = window.location.href;
            
            // Try to use the Web Share API if available
            if (navigator.share) {
              navigator.share({
                title: `Join ${community.name} on UniHub`,
                text: community.short_description || `Check out the ${community.name} community on UniHub!`,
                url: communityUrl,
              }).catch(err => {
                console.error('Error sharing:', err);
                // Fallback to clipboard
                navigator.clipboard.writeText(communityUrl);
                alert('Link copied to clipboard!');
              });
            } else {
              // Fallback for browsers that don't support Web Share API
              navigator.clipboard.writeText(communityUrl);
              alert('Link copied to clipboard!');
            }
          }}
          className="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          Share Community
        </button>
        
        {/* Report Community */}
        <button
          onClick={() => alert('Report functionality will be implemented soon.')}
          className="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Report Community
        </button>
      </nav>
    </div>
    
    {/* Footer with copyright info */}
    <div className="text-xs text-gray-500 px-4 py-3 border-t border-gray-100">
      <p>© {new Date().getFullYear()} Uni Hub</p>
      <p className="mt-1">Building university communities together</p>
    </div>
  </div>
);

// Define component logic within a client component
function CommunityDetailContent() {
  const { slug: rawSlug } = useParams();
  const slug = typeof rawSlug === 'string' ? rawSlug : undefined;
  console.log('[CommunityDetailContent] Slug extracted from params:', slug);
  const router = useRouter();
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const { user, isLoadingProfile } = useUser();

  // Initialize activeTab state with 'posts' as default
  const [activeTab, setActiveTab] = useState('posts');

  // Use the custom hooks for data fetching
  const { 
    community: fetchedCommunity, // Rename to avoid conflict with local state if needed later
    loading: loadingCommunity, 
    error: communityError 
  } = useCommunity(slug as string);
  
  const { 
    posts: communityPosts,
    loading: loadingPosts, 
    error: postsError 
  } = useCommunityPosts(slug as string);

  const { 
    membershipStatus, 
    isLoading: isLoadingMembership, 
    error: membershipError 
  } = useMembershipStatus(slug); // Fetch membership status

  // --- Action Hooks ---
  const { joinCommunity, isJoining, error: joinError } = useJoinCommunity();
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
    if (!isAuthenticated) {
      setIsMember(false);
      setDerivedStatus(null);
      return;
    }
    if (isLoadingMembership) {
      // Keep previous state while loading new status
      return; 
    }
    if (membershipStatus) {
        console.log("Membership Status Received:", membershipStatus);
        setIsMember(membershipStatus.is_member);
        setDerivedStatus(membershipStatus.status ?? null);
            } else {
       // If no status is returned (e.g., initial load or error), assume not member
       setIsMember(false); 
       setDerivedStatus(null);
    }
  }, [membershipStatus, isLoadingMembership, isAuthenticated]);

  // Clear action error when join/leave error changes
  useEffect(() => {
    setActionError(joinError || leaveError || null);
    // Optional: Clear error after a few seconds
    if (joinError || leaveError) {
        const timer = setTimeout(() => setActionError(null), 5000);
        return () => clearTimeout(timer);
    }
  }, [joinError, leaveError]);

  // --- Action Handlers ---
  const handleJoin = async () => {
    if (!slug || isJoining || isLeaving) return;
    setActionError(null);
    const response = await joinCommunity(slug);
    if (response) {
      // Optimistic update
      setIsMember(true);
      setDerivedStatus(response.detail?.includes('pending') ? 'pending' : 'approved'); // Infer status from message
      // TODO: Optimistically update member count if needed
      // setCommunity(prev => prev ? { ...prev, member_count: prev.member_count + 1 } : null);
      // TODO: Trigger refetch of membershipStatus or community data
      console.log("Join successful:", response.detail);
    } else {
        console.error("Join failed"); // Error is set in actionError state via useEffect
    }
  };

  const handleLeave = async () => {
    if (!slug || isJoining || isLeaving) return;
    setActionError(null);
    const response = await leaveCommunity(slug);
    if (response) {
      // Optimistic update
      setIsMember(false);
      setDerivedStatus(null);
      // TODO: Optimistically update member count if needed
      // setCommunity(prev => prev ? { ...prev, member_count: Math.max(0, prev.member_count - 1) } : null);
      // TODO: Trigger refetch of membershipStatus or community data
      console.log("Leave successful:", response.detail);
    } else {
      console.error("Leave failed"); // Error is set in actionError state via useEffect
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
    setLocalPosts(prevPosts => [newPost, ...prevPosts]);
  };

  // Handler for create post
  const createPost = () => {
    alert("Create post functionality will be implemented soon!");
    // In a real implementation, this would:
    // 1. Open a modal or navigate to a create post page
    // 2. Set up form state for creating a new post
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
    <div className="bg-gray-100 min-h-screen -mt-10 -mb-10"> {/* Negative margins to eliminate gaps */}
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

            {/* Posts tab content */}
            {activeTab === 'posts' && (
              <div>
                {/* Improved create post field with proper functionality */}
                {isAuthenticated && (effectiveMember || isCreator) && derivedStatus !== 'pending' && (
                  <div id="create-post" className="bg-white p-4 rounded-lg shadow-md mb-4 hover:shadow-lg transition-shadow">
                    <div 
                      onClick={createPost}
                      className="bg-gray-100 rounded-full p-3 flex items-center cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      <img 
                        src={user?.profile_image || '/default-avatar.png'} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-full mr-3 border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + (user?.username || 'User');
                        }}
                      />
                      <span className="text-gray-500">Create a post in {community.name}...</span>
                    </div>
                  </div>
                )}
                
                {/* Posts feed */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <CommunityPostsFeed
                    community={community}
                    posts={displayPosts}
                    isLoading={loadingPosts}
                    user={user}
                    slug={slug as string}
                    isCreator={isCreator}
                    isMember={effectiveMember ?? false} 
                    membershipStatus={derivedStatus}
                    postType="" 
                    searchQuery="" 
                    handlePostTypeChange={() => console.log('Post type change handler not implemented yet.')}
                    handleSearchChange={() => console.log('Search change handler not implemented yet.')}
                    handleUpvotePost={async () => console.log('Upvote handler not implemented yet.')}
                  />
                </div>
                
                {/* Display posts loading error if it occurred */}
                {postsError && (
                    <div className="text-center text-red-500 p-4 bg-red-50 rounded-md shadow-lg border border-red-200">
                        <p className="font-medium">Error loading posts:</p>
                        <p>{postsError}</p>
                    </div>
                )}

                {/* Hidden create post button that can be triggered by the header */}
                <button 
                  className="create-post-btn hidden"
                  onClick={createPost}
                ></button>
              </div>
            )}
            
            {/* About tab content */}
            {activeTab === 'about' && (
              <AboutTab community={community} isCreator={isCreator} />
            )}
            
            {/* Members tab content */}
            {activeTab === 'members' && (
              <MembersTab community={community} />
            )}
          </div>

          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Use the QuickLinks component with all required props */}
              <QuickLinks 
                community={community}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
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
