"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCommunity,
  joinCommunity,
  leaveCommunity,
  getPosts,
  upvotePost,
  Post,
} from "@/services/communityService";
import { Community } from "@/types/community";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import CommunityHeader from '@/components/communities/slugPage/CommunityHeader';
import CommunityNav from '@/components/communities/slugPage/CommunityNav';
import CommunityPostsFeed from '@/components/communities/slugPage/CommunityPostsFeed';
import CommunitySidebar from '@/components/communities/slugPage/CommunitySidebar';

export default function CommunityDetailPage(): React.ReactElement {
  const { slug } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [postType, setPostType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Add a delay to allow auth to be restored on hard refresh
        if (!isAuthenticated) {
          console.log("Auth not ready, waiting for potential restoration...");
          // Wait a short time before continuing
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Check if user is the community creator from localStorage if auth is still loading
        let isCreator = false;
        let localUserData: { id: number; username: string } | null = null;
        
        // Try to get user data from localStorage if not authenticated yet
        if (!user) {
          try {
            const storedUserData = localStorage.getItem('user');
            if (storedUserData) {
              localUserData = JSON.parse(storedUserData);
              console.log("Using stored user data:", localUserData?.username);
            }
          } catch (err) {
            console.error("Error loading stored user data:", err);
          }
        }
        
        // Determine the user ID to use for creator check (prefer authenticated user)
        const userIdToCheck = user?.id ?? localUserData?.id;
        
        // Try to get stored community data
        if (userIdToCheck && slug) {
          try {
            const storedCommunityKey = `community_${slug}`;
            const storedCommunityData = localStorage.getItem(storedCommunityKey);
            
            if (storedCommunityData) {
              const communityData = JSON.parse(storedCommunityData);
              if (communityData.creator?.id === userIdToCheck) {
                isCreator = true;
                console.log("User identified as creator from stored data");
              }
            }
          } catch (err) {
            console.error("Error checking stored creator status:", err);
          }
        }

        // Fetch community details
        console.log("Fetching community data for:", slug);
        try {
          const communityData = await getCommunity(slug as string);
          console.log("Community data received:", communityData);
          
          // Update creator status with actual data from API
          isCreator = (userIdToCheck === communityData.creator?.id) || isCreator;

          // Ensure image properties are properly set
          // If cover_image is missing but banner exists, use banner
          if (!communityData.cover_image && communityData.banner) {
            communityData.cover_image = communityData.banner;
          }
          // If logo is missing but image exists, use image
          if (!communityData.logo && communityData.image) {
            communityData.logo = communityData.image;
          }

          // Ensure required membership properties exist
          communityData.is_member = communityData.is_member || false;
          communityData.is_moderator = communityData.is_moderator || 
            (communityData.membership_role === 'moderator');
          communityData.is_admin = communityData.is_admin || 
            (communityData.membership_role === 'admin');
          
          // Store community data in localStorage for quicker access on hard refresh
          try {
            localStorage.setItem(`community_${slug}`, JSON.stringify(communityData));
          } catch (err) {
            console.error("Error storing community data:", err);
          }
          
          // Always ensure creator is recognized as admin member
          if (isCreator || (communityData.creator?.id === userIdToCheck)) {
            console.log("Creator detected - ensuring admin status");
            communityData.is_member = true;
            communityData.membership_status = "approved";
            communityData.membership_role = "admin";
            communityData.is_admin = true;
          }
          
          setCommunity(communityData);

          // Fetch community posts
          const params: { type?: string; search?: string } = {};
          if (postType) {
            params.type = postType;
          }
          if (searchQuery) {
            params.search = searchQuery;
          }

          try {
            const postsData = await getPosts(slug as string, params);
            console.log("Posts data received:", postsData ? postsData.length : "undefined", "posts");
            // Ensure posts is always an array, even if API returns null, undefined or an object
            if (Array.isArray(postsData)) {
              setPosts(postsData);
            } else {
              console.warn("API didn&apos;t return an array for posts:", postsData);
              setPosts([]);
            }
          } catch (postsErr) {
            // Type error as unknown
            console.error("Failed to fetch posts:", postsErr);
            setPosts([]); // Set empty array if posts request fails
          }
        } catch (communityErr: unknown) {
          console.error("Failed to fetch community:", communityErr);
          
          let message = "Failed to load community. Please try again later.";
          if (communityErr instanceof Error) {
            if (communityErr.message?.includes("not found")) {
              message = `Community \"${slug}\" not found. It may have been deleted or never existed.`;
            } else if (communityErr.message?.includes("permission")) {
              message = "You don&apos;t have permission to access this community.";
            }
          }
          setError(message);
          
          // Clear any locally stored data for this community since it's invalid
          try {
            localStorage.removeItem(`community_${slug}`);
          } catch (err) {
            console.error("Error removing invalid community data from storage:", err);
          }
        }
      } catch (err: unknown) {
        console.error("Failed to fetch community data:", err);
        setError("Failed to load community. Please try again later.");
      }
      setLoading(false);
    };

    if (slug) {
      fetchCommunityData();
    }
  }, [slug, postType, searchQuery, user, isAuthenticated]);

  const handleJoinCommunity = async () => {
    if (!isAuthenticated) return;

    try {
      setJoinLoading(true);
      await joinCommunity(slug as string);

      // Refresh community data to update membership status
      const updatedCommunity = await getCommunity(slug as string);

      // Manually update status locally for immediate UI feedback
      setCommunity(prev => prev ? { ...prev, is_member: true, membership_status: updatedCommunity.requires_approval ? 'pending' : 'approved' } : null);

      setJoinLoading(false);
    } catch (err) {
      console.error("Failed to join community:", err);
      setError("Failed to join community. Please try again later.");
      setJoinLoading(false);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!isAuthenticated) return;

    try {
      setJoinLoading(true);
      await leaveCommunity(slug as string);

      // Refresh community data to update membership status
      const updatedCommunity = await getCommunity(slug as string);
      setCommunity(updatedCommunity);
    } catch (err) {
      console.error("Failed to leave community:", err);
      setError("Failed to leave community. Please try again later.");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleUpvotePost = async (postId: number) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    try {
      await upvotePost(slug as string, postId);

      // Refresh posts to update upvote status
      const params: { type?: string; search?: string } = {};
      if (postType) {
        params.type = postType;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const updatedPosts = await getPosts(slug as string, params);
      // Ensure posts is always an array
       if (Array.isArray(updatedPosts)) {
          setPosts(updatedPosts);
       } else {
          console.warn("API didn't return an array for posts after upvote:", updatedPosts);
          setPosts([]);
       }
    } catch (err) {
      console.error("Failed to upvote post:", err);
      // Optionally show a toast notification for error
    }
  };

  const handlePostTypeChange = (value: string) => {
    setPostType(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Simplified isCreator check
  const isCreator = community?.creator?.id === user?.id;

  if (loading) {
      return (
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Loading community...</p>
          </div>
        </DashboardLayout>
      );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-lg w-full text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {error.includes("not found") ? "Community Not Found" : "Error"}
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/communities"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-normal"
                style={{ fontWeight: "normal" }}
              >
                Browse Communities
              </Link>
              <button
                onClick={() => window.location.reload()} // Or better: retry fetchCommunityData
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-normal"
                style={{ fontWeight: "normal" }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Ensure community is loaded before rendering main content
  if (!community) {
     // This case should ideally be covered by loading/error states,
     // but added as a safeguard. Could return a specific message or null.
     return (
        <DashboardLayout>
           <div className="text-center py-10">Community data unavailable.</div>
        </DashboardLayout>
     );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Render Header */}
        <CommunityHeader
          community={community}
          isCreator={isCreator}
          handleJoinCommunity={handleJoinCommunity}
          joinLoading={joinLoading}
        />

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
          {/* Render Navigation */}
          <CommunityNav slug={slug as string} isCreator={isCreator} community={community} />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Render Main Content Column (Posts Feed) */}
            <div className="lg:col-span-3">
              <CommunityPostsFeed
                community={community}
                posts={posts}
                user={user}
                slug={slug as string}
                isCreator={isCreator}
                postType={postType}
                searchQuery={searchQuery}
                handlePostTypeChange={handlePostTypeChange}
                handleSearchChange={handleSearchChange}
                handleUpvotePost={handleUpvotePost}
              />
            </div>

            {/* Render Sidebar Column */}
            <div className="lg:col-span-1">
              <CommunitySidebar
                community={community}
                isCreator={isCreator}
                isAuthenticated={isAuthenticated}
                slug={slug as string}
                handleJoinCommunity={handleJoinCommunity}
                handleLeaveCommunity={handleLeaveCommunity}
                joinLoading={joinLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
