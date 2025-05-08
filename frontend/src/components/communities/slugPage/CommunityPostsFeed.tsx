import React, { memo, useCallback } from 'react';
import Link from 'next/link';
import PostCard from "@/components/communities/PostCard";
import PostTypeSelect from "@/components/ui/PostTypeSelect";
import { Community } from '@/types/community';
import { Post } from '@/types/api';
import { User } from '@/types/user';

interface CommunityPostsFeedProps {
  community: Community;
  posts: Post[];
  user: User | null;
  slug: string;
  isCreator: boolean;
  postType: string;
  searchQuery: string;
  handlePostTypeChange: (value: string) => void;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpvotePost: (postId: number) => Promise<void>;
}

const CommunityPostsFeed: React.FC<CommunityPostsFeedProps> = ({
  community,
  posts,
  user,
  slug,
  isCreator,
  postType,
  searchQuery,
  handlePostTypeChange,
  handleSearchChange,
  handleUpvotePost,
}) => {

  // Post types for filter - memoize this statically
  const postTypes = [
    { value: "", label: "All Posts" },
    { value: "discussion", label: "Discussions" },
    { value: "question", label: "Questions" },
    { value: "event", label: "Events" },
    { value: "announcement", label: "Announcements" },
    { value: "resource", label: "Resources" },
  ];

  // Use callback for dropdown change to optimize renders
  const onPostTypeSelect = useCallback((newType: string) => {
    console.log("Selected type in dropdown:", newType);
    handlePostTypeChange(newType);
  }, [handlePostTypeChange]);

  // Helper function to log posts for debugging
  const logPosts = () => {
    console.log("Posts count:", posts.length);
    if (posts.length > 0) {
      console.log("First post:", posts[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Posts Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Post Header with Filter */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 mb-2 sm:mb-0">
              Posts {posts.length > 0 && `(${posts.length})`}
            </h2>
            <div className="flex space-x-2">
              <PostTypeSelect
                value={postType}
                onChange={onPostTypeSelect}
                options={postTypes}
                placeholder="All Posts"
                className="font-normal"
              />
            </div>
          </div>
          <div className="relative">
            <input
              type="search"
              className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-normal"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={handleSearchChange}
              style={{ fontWeight: "normal" }}
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
          <button 
            onClick={logPosts} 
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
            style={{ display: 'none' }} // Hidden debug button
          >
            Debug: Log Posts
          </button>
        </div>

        {/* Post List */}
        <div>
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
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-normal rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    style={{ fontWeight: "normal" }}
                  >
                    Create a post
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {posts.map((post) => (
                <div key={post.id} className="p-4">
                  <PostCard
                    post={post}
                    communitySlug={slug}
                    onUpvote={() => handleUpvotePost(post.id)}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(CommunityPostsFeed);