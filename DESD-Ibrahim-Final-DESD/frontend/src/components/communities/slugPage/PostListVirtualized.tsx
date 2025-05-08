import React, { useState, useEffect } from 'react';
import { VirtualizedList } from '@/components/common/VirtualizedList';
import { Post, CommunityDetail } from '@/types/api';
import { User } from '@/types/user';

interface PostListVirtualizedProps {
  posts: Post[];
  community: CommunityDetail;
  user: User | null;
  isLoading?: boolean;
  slug: string;
  renderItem?: (post: Post, index: number) => React.ReactNode;
}

/**
 * A virtualized list of posts optimized for performance
 * Only renders posts that are currently visible in the viewport
 */
const PostListVirtualized: React.FC<PostListVirtualizedProps> = ({
  posts,
  community,
  user,
  isLoading = false,
  slug,
  renderItem,
}) => {
  const [postItemHeight, setPostItemHeight] = useState(300); // Default height estimate
  const [containerHeight, setContainerHeight] = useState(800); // Default container height

  // Calculate average post height on mount and when posts change
  useEffect(() => {
    // In a real implementation, we could measure actual post heights
    // For now, we'll just use heuristics
    if (posts.length > 0) {
      // Estimate height based on post content length
      const avgContentLength = posts.reduce((sum, post) => 
        sum + (post.content?.length || 0), 0) / posts.length;
      
      // Adjust height based on content length (simple heuristic)
      const estimatedHeight = Math.max(
        200, // Minimum height
        Math.min(
          500, // Maximum height
          200 + Math.floor(avgContentLength / 100) * 20 // 20px per 100 chars
        )
      );
      
      setPostItemHeight(estimatedHeight);
    }
    
    // Set container height based on viewport
    if (typeof window !== 'undefined') {
      setContainerHeight(window.innerHeight - 250); // Leave space for header and other elements
    }
  }, [posts]);

  // Default post renderer
  const defaultRenderItem = (post: Post, index: number) => (
    <div className="post-item bg-white p-4 rounded-lg shadow-sm mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          <img
            src={post.author?.profile_image || '/default-avatar.png'}
            alt={post.author?.username || 'User'}
            className="w-10 h-10 rounded-full"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${post.author?.username || 'User'}`;
            }}
          />
        </div>
        <div className="flex-1">
          <div className="font-semibold">{post.author?.username || 'Anonymous'}</div>
          <div className="text-sm text-gray-500">
            {new Date(post.created_at).toLocaleDateString()}
          </div>
          <h3 className="text-lg font-semibold mt-2">{post.title}</h3>
          <div className="mt-2 text-gray-700">{post.content?.substring(0, 200)}{post.content?.length > 200 ? '...' : ''}</div>
          {post.media && post.media.length > 0 && (
            <div className="mt-3">
              <img 
                src={post.media[0]} 
                alt="Post media" 
                className="max-h-48 rounded"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="mt-3 flex items-center text-gray-500 space-x-4">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              {post.upvotes || 0}
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {post.comment_count || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // If no posts or loading, show a message
  if (posts.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        {isLoading ? 'Loading posts...' : 'No posts found in this community.'}
      </div>
    );
  }

  return (
    <VirtualizedList
      items={posts}
      height={containerHeight}
      itemSize={postItemHeight}
      renderItem={renderItem || defaultRenderItem}
      className="posts-list-container"
      itemClassName="post-item-container px-2"
      overscanCount={2}
    />
  );
};

export default React.memo(PostListVirtualized); 