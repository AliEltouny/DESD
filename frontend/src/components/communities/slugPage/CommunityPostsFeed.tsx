import React from 'react';
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

  // Post types for filter
  const postTypes = [
    { value: "", label: "All Posts" },
    { value: "discussion", label: "Discussions" },
    { value: "question", label: "Questions" },
    { value: "event", label: "Events" },
    { value: "announcement", label: "Announcements" },
    { value: "resource", label: "Resources" },
  ];

  return (
    <div className="space-y-6">
      {/* START: Remove the quick Create Post Card */}
      {/* {isCreator || (community.is_member && community.membership_status === "approved") ? (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <Link
            href={`/communities/${slug}/posts/create`}
            className="flex items-center space-x-3 text-gray-600 hover:text-gray-900"
          >
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              {user ? (
                <span className="text-lg font-medium text-gray-600">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() :
                   user.username ? user.username.charAt(0).toUpperCase() : "?"}
                </span>
              ) : (
                <span className="text-lg font-medium text-gray-600">?</span>
              )}
            </div>
            <div className="flex-grow py-2 px-4 bg-gray-100 rounded-full font-normal text-gray-500 hover:bg-gray-200 transition-all">
              Create a post...
            </div>
          </Link>
        </div>
      ) : null} */}
      {/* END: Remove the quick Create Post Card */}

      {/* Posts Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Post Header with Filter */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 mb-2 sm:mb-0">Posts</h2>
            <div className="flex space-x-2 items-center">
              {((community.is_member && community.membership_status === "approved") ||
                (community.creator?.id === user?.id)) && (
                <Link
                  href={`/communities/${community.slug || slug}/posts/create`}
                  className="inline-flex items-center px-4 py-2 mr-2 border border-transparent text-sm font-medium rounded-md shadow-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create Post
                </Link>
              )}
              <PostTypeSelect
                value={postType}
                onChange={handlePostTypeChange}
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
        </div>

        {/* Post List */}
        <div className="divide-y divide-gray-100">
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
                    href={`/communities/${community.slug || slug}/posts/create`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Create a post
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {Array.isArray(posts) ? posts.map((post) => (
                <div key={post.id} className="p-4">
                  <PostCard
                    post={post}
                    communitySlug={community.slug || slug}
                    onUpvote={() => handleUpvotePost(post.id)}
                  />
                </div>
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
  );
};

export default CommunityPostsFeed;