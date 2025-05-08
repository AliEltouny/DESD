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
import { communityApi, postApi } from '@/services/api'; // Add postApi import
import { toast } from 'react-hot-toast'; // Add toast import
import { mutate } from 'swr'; // Add mutate import

import DashboardLayout from '@/components/layouts/DashboardLayout'; // Import DashboardLayout
import CommunityHeader from '@/components/communities/slugPage/CommunityHeader';
import CommunityPostsFeed from '@/components/communities/slugPage/CommunityPostsFeed';
import CreatePostForm from '@/components/communities/CreatePostForm';
import CommunitySidebar from '@/components/communities/slugPage/CommunitySidebar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CommunityTabs from '@/components/communities/CommunityTabs';
import { User } from '@/types/user';
import { UserMiniCard, UserSearchComponent } from '@/components/users';

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

const MembersTab = ({ community }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch members
        const memberData = await communityApi.getCommunityMembers(community.slug);
        setMembers(memberData);
      } catch (err) {
        console.error("Error fetching community members:", err);
        setError("Failed to load members. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (community?.slug) {
      fetchMembers();
    }
  }, [community?.slug]);

  const handleMessageUser = (user: User) => {
    router.push(`/messages?user=${user.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading members...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Find Members</h2>
            <UserSearchComponent
              onUserSelect={(user) => handleMessageUser(user)}
            />
          </div>

          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                All Members ({members.length})
              </h2>
            </div>

            {members.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                This community has no members yet.
              </p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <UserMiniCard
                    key={member.user.id}
                    user={member.user}
                    onClick={() => handleMessageUser(member.user)}
                    className="hover:bg-gray-50 transition duration-150"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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
    community: fetchedCommunity, // Rename to avoid conflict with local state if needed
    loading: loadingCommunity, 
    error: communityError,
    refreshCommunity // Add the refresh function
  } = useCommunity(slug as string);
  
  const { 
    posts: communityPosts,
    loading: loadingPosts, 
    error: postsError 
  } = useCommunityPosts(slug as string);

  const { 
    membershipStatus, 
    isLoading: isLoadingMembership, 
    error: membershipError,
    refreshMembershipStatus // Add the refresh function
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
      
      // Force update UI state to reflect server state
      setIsMember(membershipStatus.is_member === true);
      setDerivedStatus(membershipStatus.status ?? null);
      
      // Handle case where we're a member but UI might not be updated
      if (membershipStatus.is_member === true && !isMember) {
        console.log("Fixing UI state: Server says user is a member, updating local state");
      }
    } else {
      // If no status is returned (e.g., initial load or error), assume not member
      setIsMember(false); 
      setDerivedStatus(null);
    }
  }, [membershipStatus, isLoadingMembership, isAuthenticated, isMember]);

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
    try {
      // First, refresh membership status to check if we're already a member
      await refreshMembershipStatus();
      
      if (membershipStatus?.is_member) {
        console.log("User is already a member, updating UI state");
        setIsMember(true);
        setDerivedStatus(membershipStatus.status || 'approved');
        return;
      }
      
      const response = await joinCommunity(slug);
      if (response) {
        // Optimistic update
        setIsMember(true);
        setDerivedStatus('approved'); // Default to approved unless response indicates pending

        // Wait for both refresh operations to complete
        await refreshMembershipStatus();
        await refreshCommunity();
        
        console.log("Join successful:", response.detail);
      }
    } catch (err: any) {
      console.error("Join error:", err);
      // Check if the error is "already a member" - in this case we should update UI accordingly
      if (err.message?.toLowerCase().includes('already a member')) {
        console.log("Error indicates user is already a member, fixing UI state");
        setIsMember(true);
        setDerivedStatus('approved');
        // Refresh data from server
        await refreshMembershipStatus();
      }
    }
  };

  const handleLeave = async () => {
    if (!slug || isJoining || isLeaving) return;
    setActionError(null);
    try {
      const response = await leaveCommunity(slug);
      if (response) {
        // Optimistic update
        setIsMember(false);
        setDerivedStatus(null);
        
        // Wait for both refresh operations to complete
        await refreshMembershipStatus();
        await refreshCommunity();
        
        console.log("Leave successful:", response.detail);
      }
    } catch (err) {
      console.error("Leave error:", err);
      // Refresh status to ensure UI is accurate no matter what error occurred
      await refreshMembershipStatus();
    }
  };

  // Add this function near the other handler functions in the component
  const handleUpvotePost = async (postId: number) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/communities/${slug}`);
      return;
    }

    try {
      // Call the API to upvote the post
      await postApi.upvotePost(slug as string, postId);
      
      // Trigger a refetch of the data to ensure consistency across the entire page
      // This will update the state for all posts in the list
      mutate(`/api/communities/${slug}/posts`);
      
      toast.success("Vote recorded successfully");
    } catch (error) {
      console.error("Failed to upvote post:", error);
      toast.error("Failed to record vote. Please try again.");
    }
  };

  // --- Render ---
  if (initialPageLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Show error state if community failed to load
  if (communityError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Community Not Found</h1>
          <p className="text-gray-600 mb-6">
            The community "{slug}" could not be found. It may have been deleted or never existed.
          </p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => router.push('/communities')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Communities
            </button>
            <button
              onClick={() => router.back()}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-100 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main content render
  return (
    <div className="bg-gray-100 min-h-screen -mt-10 -mb-10"> {/* Negative margins to eliminate gaps */}
      {/* Display Action Errors */}
      {actionError && (
         <div className="fixed top-20 right-4 z-50 p-4 bg-red-100 border border-red-400 text-red-700 rounded shadow-lg">
           <p>Error: {actionError}</p>
         </div>
      )}

      {/* Show loading state if community is null */}
      {!community ? (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-32 h-32 bg-gray-300 rounded-full mb-4"></div>
            <div className="h-6 bg-gray-300 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-64"></div>
            <p className="mt-4 text-gray-500">Loading community...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Full-width header component with fixed props */}
          <CommunityHeader
            community={community}
            isMember={isMember ?? false}
            membershipStatus={derivedStatus}
            isAuthenticated={isAuthenticated}
            onJoin={handleJoin}
            onLeave={handleLeave}
            joinLoading={isJoining}
            leaveLoading={isLeaving}
            actionError={actionError}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          
          {/* Quick Links - always show on top */}
          <QuickLinks 
            community={community} 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />
          
          {/* Tabs for Posts, About, Members */}
          <div className="mt-6">
            <CommunityTabs 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
              community={community}
              isMember={isMember}
              onJoin={handleJoin}
              onLeave={handleLeave}
              joinLoading={isJoining}
              leaveLoading={isLeaving}
            />
          </div>

          {/* Tab Content */}
          <div className="mt-4">
            {activeTab === 'posts' && (
              <CommunityPostsFeed 
                posts={displayPosts} 
                loading={loadingPosts} 
                error={postsError} 
                community={community}
                // Pass down handlers and state as needed
                isMember={isMember}
                onJoin={handleJoin}
                onLeave={handleLeave}
                joinLoading={isJoining}
                leaveLoading={isLeaving}
                localPosts={localPosts}
                setLocalPosts={setLocalPosts}
                handleUpvotePost={handleUpvotePost}
              />
            )}

            {activeTab === 'about' && (
              <AboutTab community={community} isCreator={user?.id === community.creator_id} />
            )}

            {activeTab === 'members' && (
              <MembersTab community={community} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function CommunityDetailPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner />}>
        <CommunityDetailContent />
      </Suspense>
    </DashboardLayout>
  );
}
