"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
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
import PostCard from "@/components/communities/PostCard";
import { getMediaUrl } from "@/services/api";

export default function CommunityDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [postType, setPostType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Post types for filter
  const postTypes = [
    { value: "", label: "All Posts" },
    { value: "discussion", label: "Discussions" },
    { value: "question", label: "Questions" },
    { value: "event", label: "Events" },
    { value: "announcement", label: "Announcements" },
    { value: "resource", label: "Resources" },
  ];

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
        let userData = null;
        
        // Try to get user data from localStorage if not authenticated yet
        if (!user) {
          try {
            const storedUserData = localStorage.getItem('user');
            if (storedUserData) {
              userData = JSON.parse(storedUserData);
              console.log("Using stored user data:", userData.username);
            }
          } catch (err) {
            console.error("Error loading stored user data:", err);
          }
        } else {
          userData = user;
        }
        
        // Try to get stored community data
        if (userData && slug) {
          try {
            const storedCommunityKey = `community_${slug}`;
            const storedCommunityData = localStorage.getItem(storedCommunityKey);
            
            if (storedCommunityData) {
              const communityData = JSON.parse(storedCommunityData);
              if (communityData.creator?.id === userData.id) {
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
        const communityData = await getCommunity(slug as string);
        console.log("Community data received:", communityData.name);
        
        // Update creator status with actual data from API
        isCreator = (userData?.id === communityData.creator?.id) || isCreator;

        // Store community data in localStorage for quicker access on hard refresh
        try {
          localStorage.setItem(`community_${slug}`, JSON.stringify(communityData));
        } catch (err) {
          console.error("Error storing community data:", err);
        }
        
        // Always ensure creator is recognized as admin member
        if (isCreator || (communityData.creator?.id === userData?.id)) {
          console.log("Creator detected - ensuring admin status");
          communityData.is_member = true;
          communityData.membership_status = "approved";
          communityData.membership_role = "admin";
        }
        
        setCommunity(communityData);

        // Fetch community posts
        const params: Record<string, any> = {};
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
            console.warn("API didn't return an array for posts:", postsData);
            setPosts([]);
          }
        } catch (postsErr) {
          console.error("Failed to fetch posts:", postsErr);
          setPosts([]); // Set empty array if posts request fails
        }
      } catch (err) {
        console.error("Failed to fetch community data:", err);
        setError("Failed to load community. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCommunityData();
    }
  }, [slug, postType, searchQuery, user?.id]);

  const handleJoinCommunity = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/communities/${slug}`);
      return;
    }

    try {
      setJoinLoading(true);
      await joinCommunity(slug as string);

      // Refresh community data to update membership status
      const updatedCommunity = await getCommunity(slug as string);
      setCommunity(updatedCommunity);
    } catch (err: any) {
      console.error("Failed to join community:", err);
      
      // If error is "already a member", we should just refresh the community data
      if (err.response?.status === 400 && err.response?.data?.detail?.includes("already a member")) {
        try {
          // Refresh community data to update membership status
          const updatedCommunity = await getCommunity(slug as string);
          setCommunity(updatedCommunity);
        } catch (refreshErr) {
          console.error("Failed to refresh community data:", refreshErr);
          setError("Failed to update community status. Please refresh the page.");
        }
      } else {
        setError("Failed to join community. Please try again later.");
      }
    } finally {
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
      const params: Record<string, any> = {};
      if (postType) {
        params.type = postType;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const updatedPosts = await getPosts(slug as string, params);
      setPosts(updatedPosts);
    } catch (err) {
      console.error("Failed to upvote post:", err);
    }
  };

  const handlePostTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPostType(e.target.value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already triggered by the useEffect when searchQuery changes
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <p className="text-red-500 text-lg">{error || "Community not found"}</p>
        <div className="mt-6">
          <Link
            href="/communities"
            className="text-blue-600 hover:text-blue-800"
          >
            Browse Communities
          </Link>
        </div>
      </div>
    );
  }

  // Generate community initials if no image
  const getCommunityInitials = () => {
    return community.name
      .split(" ")
      .map((word: string) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Check if the current user is the creator of this community
  const isCreator = community?.creator?.id === user?.id;

  // Join/leave button logic with extra creator check
  const renderMembershipButton = () => {
    // If user is the creator, always show admin status
    if (isCreator) {
      return (
        <div className="flex flex-col space-y-3">
          <div className="px-4 py-2 bg-green-50 text-green-700 rounded-md border border-green-200 text-center">
            You are an Admin
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <button
          onClick={handleJoinCommunity}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Join Community
        </button>
      );
    }

    if (!community.is_member) {
      return (
        <button
          onClick={handleJoinCommunity}
          disabled={joinLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {joinLoading ? (
            <>
              <div className="mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin" />
              Joining...
            </>
          ) : community.requires_approval ? (
            "Request to Join"
          ) : (
            "Join Community"
          )}
        </button>
      );
    }

    if (community.membership_status === "pending") {
      return (
        <div className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-gray-100">
          Membership Pending
        </div>
      );
    }

    return (
      <button
        onClick={handleLeaveCommunity}
        disabled={joinLoading || community.membership_role === "admin"}
        className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          community.membership_role === "admin"
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
        title={
          community.membership_role === "admin"
            ? "You must assign another admin before leaving"
            : ""
        }
      >
        {joinLoading ? (
          <>
            <div className="mr-2 h-4 w-4 border-t-2 border-b-2 border-gray-700 rounded-full animate-spin" />
            Leaving...
          </>
        ) : (
          "Leave Community"
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Community Header/Banner */}
      <div className="relative h-64 sm:h-80 md:h-96 bg-gradient-to-r from-blue-400 to-blue-600 overflow-hidden">
        {community.banner ? (
          <img
            src={getMediaUrl(community.banner)}
            alt={`${community.name} banner`}
            onError={(e) => {
              e.currentTarget.onerror = null; // Prevent infinite loop
              e.currentTarget.style.display = "none"; // Hide the img on error
            }}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
            <h1 className="text-5xl font-bold text-white">
              {getCommunityInitials()}
            </h1>
          </div>
        )}
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-4xl font-bold text-white drop-shadow-md">
              {community.name}
            </h1>
            {community.category && (
              <span className="inline-flex items-center px-3 py-1 mt-2 rounded-full text-sm font-medium bg-white bg-opacity-20 text-white">
                {community.category.charAt(0).toUpperCase() +
                  community.category.slice(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="md:w-1/3 space-y-6">
            {/* Community Card */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="flex items-center p-6 border-b border-gray-100">
                <div className="flex-shrink-0 mr-4">
                  {community.image ? (
                    <img
                      src={getMediaUrl(community.image)}
                      alt={community.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        // Replace with fallback
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement!.innerHTML = `
                          <div class="w-24 h-24 rounded-lg bg-blue-100 flex items-center justify-center">
                            <span class="text-2xl font-semibold text-blue-600">${getCommunityInitials()}</span>
                          </div>
                        `;
                      }}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-blue-100 flex items-center justify-center">
                      <span className="text-2xl font-semibold text-blue-600">
                        {getCommunityInitials()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {community.member_count}{" "}
                    {community.member_count === 1 ? "member" : "members"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Created by{" "}
                    {community.creator?.full_name ||
                      community.creator?.username}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Category:{" "}
                    {community.category.charAt(0).toUpperCase() +
                      community.category.slice(1)}
                  </p>
                </div>
              </div>

              <div className="p-6">
                {/* Join/Leave Button */}
                {isCreator ? (
                  <div className="flex flex-col space-y-3">
                    <div className="px-4 py-2 bg-green-50 text-green-700 rounded-md border border-green-200 text-center">
                      You are an Admin
                    </div>
                  </div>
                ) : !community.is_member && (
                  <button
                    onClick={handleJoinCommunity}
                    disabled={joinLoading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                  >
                    {joinLoading ? (
                      <>
                        <span className="inline-block mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                        {community.requires_approval
                          ? "Requesting to Join..."
                          : "Joining..."}
                      </>
                    ) : community.requires_approval ? (
                      "Request to Join"
                    ) : (
                      "Join Community"
                    )}
                  </button>
                )}

                {!isCreator && community.membership_status === "pending" && (
                  <div className="w-full px-4 py-2 bg-yellow-50 text-yellow-700 rounded-md border border-yellow-200 text-center">
                    Membership Pending Approval
                  </div>
                )}

                {!isCreator && community.is_member &&
                  community.membership_status === "approved" && (
                    <div className="flex flex-col space-y-3">
                      <div className="px-4 py-2 bg-green-50 text-green-700 rounded-md border border-green-200 text-center">
                        {community.membership_role === "admin"
                          ? "You are an Admin"
                          : "You are a Member"}
                      </div>
                      {community.membership_role !== "admin" && (
                        <button
                          onClick={handleLeaveCommunity}
                          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                          Leave Community
                        </button>
                      )}
                    </div>
                  )}
              </div>

              {/* Tags */}
              {community.tags && (
                <div className="px-6 pb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {community.tags
                      .split(",")
                      .map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Community Rules */}
            {community.rules && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Community Rules
                </h2>
                <div className="prose prose-sm max-w-none text-gray-600">
                  {community.rules
                    .split("\n")
                    .map((rule: string, index: number) => (
                      <p key={index}>{rule}</p>
                    ))}
                </div>
              </div>
            )}

            {/* Community Leaders */}
            {community.admins && community.admins.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Community Leaders
                </h2>
                <ul className="space-y-4">
                  {community.admins.map((admin: any) => (
                    <li key={admin.id} className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                        {admin.full_name
                          ? admin.full_name.charAt(0).toUpperCase()
                          : admin.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {admin.full_name || admin.username}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="md:w-2/3">
            {/* About */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                About Community
              </h2>
              <div className="prose max-w-none text-gray-600">
                <p>{community.description}</p>
              </div>
            </div>

            {/* Posts */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Posts</h2>
                {isCreator || (community.is_member && community.membership_status === "approved") ? (
                  <Link
                    href={`/communities/${slug}/posts/create`}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    Create Post
                  </Link>
                ) : null}
              </div>

              {/* Search Posts */}
              <div className="mb-6">
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="search"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Post List */}
              {(!posts || posts.length === 0) ? (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No posts yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Be the first to share something with this community!
                  </p>
                  {((community.is_member && community.membership_status === "approved") || 
                    (community.creator?.id === user?.id)) && (
                    <div className="mt-6">
                      <Link
                        href={`/communities/${slug}/posts/create`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Create a post
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(posts) ? posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      communitySlug={slug as string}
                      onUpvote={() => handleUpvotePost(post.id)}
                    />
                  )) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">Error loading posts. Please refresh the page.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
