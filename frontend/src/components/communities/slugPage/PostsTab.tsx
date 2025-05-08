import React, { useState, useMemo, useEffect, useCallback, memo, lazy, Suspense } from "react";
import { Post, CommunityDetail } from "@/types/api";
import { User } from "@/types/user";
import { useRouter } from "next/navigation";
import useDebounce from "@/hooks/useDebounce";

// Lazy load the feed component
const CommunityPostsFeed = lazy(() => import("./CommunityPostsFeed"));

// Loading fallback component
const FeedLoadingSkeleton = () => (
  <div className="space-y-4 p-4 animate-pulse">
    <div className="h-10 bg-gray-200 rounded w-1/4"></div>
    <div className="h-12 bg-gray-200 rounded w-full"></div>
    <div className="space-y-3">
      <div className="h-24 bg-gray-200 rounded w-full"></div>
      <div className="h-24 bg-gray-200 rounded w-full"></div>
      <div className="h-24 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

interface PostsTabProps {
  community: CommunityDetail;
  posts: Post[];
  isLoading: boolean;
  user: User | null;
  slug: string;
  isCreator: boolean;
  isMember: boolean;
  membershipStatus: string | null;
  handlePostTypeChange?: (type: string) => void;
  handleSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpvotePost?: (postId: number) => Promise<void>;
}

const PostsTab: React.FC<PostsTabProps> = ({
  community,
  posts,
  isLoading,
  user,
  slug,
  isCreator,
  isMember,
  membershipStatus,
  handlePostTypeChange: externalHandlePostTypeChange,
  handleSearchChange: externalHandleSearchChange,
  handleUpvotePost,
}) => {
  const router = useRouter();
  const [postType, setPostType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Debounce the search query to avoid filtering on every keystroke
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Determine if user is authenticated based on user object
  const isAuthenticated = !!user;

  // Local state to filter posts based on search query and post type
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);

  // Sanitize posts array to ensure it's always valid
  const sanitizedPosts = useMemo(() => {
    // Ensure posts is an array
    if (!Array.isArray(posts)) {
      console.warn('Posts is not an array:', posts);
      return [];
    }
    
    // Filter out invalid posts
    return posts.filter(post => {
      if (!post || typeof post !== 'object') {
        console.warn('Invalid post object:', post);
        return false;
      }
      
      // Ensure post has required fields
      if (!post.id || !post.title) {
        console.warn('Post missing required fields:', post);
        return false;
      }
      
      return true;
    });
  }, [posts]);

  // Log posts for debugging
  useEffect(() => {
    console.log('Posts received in PostsTab:', posts);
    console.log('Number of posts:', posts?.length || 0);
    console.log('Sanitized posts:', sanitizedPosts.length);
  }, [posts, sanitizedPosts]);

  // Memoized filtering logic - now using debouncedSearchQuery instead of searchQuery
  useEffect(() => {
    if (sanitizedPosts.length > 0) {
      let filtered = [...sanitizedPosts];
      
      // Apply search filter if there's a search query
      if (debouncedSearchQuery) {
        const searchLower = debouncedSearchQuery.toLowerCase();
        filtered = filtered.filter(post => {
          return (
            (post.title && post.title.toLowerCase().includes(searchLower)) ||
            (post.content && post.content.toLowerCase().includes(searchLower)) ||
            (post.author?.username && post.author.username.toLowerCase().includes(searchLower))
          );
        });
        console.log(`After search filter: ${filtered.length} posts`);
      }
      
      // Apply post type filter if a specific type is selected
      if (postType) {
        filtered = filtered.filter(post => {
          // Check both post_type and type properties since API might use either
          const postTypeValue = post.post_type || post.type;
          return postTypeValue === postType;
        });
        console.log(`After type filter: ${filtered.length} posts`);
      }
      
      setFilteredPosts(filtered);
    } else {
      // If no posts or filters, set empty array
      setFilteredPosts([]);
    }
  }, [sanitizedPosts, debouncedSearchQuery, postType]);

  // Callback handlers with memoization
  const onPostTypeChange = useCallback((type: string) => {
    console.log(`Post type changed to: ${type}`);
    setPostType(type);
    if (externalHandlePostTypeChange) {
      externalHandlePostTypeChange(type);
    }
  }, [externalHandlePostTypeChange]);

  const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (externalHandleSearchChange) {
      externalHandleSearchChange(e);
    }
  }, [externalHandleSearchChange]);

  // Determine if the user can create posts
  const showCreatePost = useMemo(() => {
    return isAuthenticated && (isCreator || (isMember && membershipStatus === 'approved'));
  }, [isCreator, isMember, membershipStatus, isAuthenticated]);

  // Create post handler with navigation
  const createPost = useCallback(() => {
    router.push(`/communities/${slug}/posts/create`);
  }, [router, slug]);
  
  // Add prefetch on hover to make post creation faster
  const prefetchCreatePostPage = useCallback(() => {
    // Prefetch the create post page when hovering over the button
    router.prefetch(`/communities/${slug}/posts/create`);
  }, [router, slug]);

  // Use local upvote handler or parent's if provided
  const onUpvotePost = useCallback(async (postId: number) => {
    if (handleUpvotePost) {
      await handleUpvotePost(postId);
    }
  }, [handleUpvotePost]);

  return (
    <div>
      {/* Improved create post field with proper functionality */}
      {showCreatePost && (
        <div id="create-post" className="bg-white p-4 rounded-lg shadow-md mb-4 hover:shadow-lg transition-shadow">
          <div 
            onClick={createPost}
            onMouseEnter={prefetchCreatePostPage}
            className="bg-gray-100 rounded-full p-3 flex items-center cursor-pointer hover:bg-gray-200 transition-colors"
          >
            <img 
              src={user?.profile_image || '/default-avatar.png'} 
              alt="Profile" 
              className="w-10 h-10 rounded-full mr-3 border border-gray-200"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = 'https://ui-avatars.com/api/?name=' + (user?.username || 'User');
              }}
            />
            <span className="text-gray-500">Create a post in {community.name}...</span>
          </div>
        </div>
      )}
      
      {/* Display loading state */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-lg p-4">
          <FeedLoadingSkeleton />
        </div>
      )}

      {/* Display posts feed if not loading */}
      {!isLoading && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <Suspense fallback={<FeedLoadingSkeleton />}>
            <CommunityPostsFeed
              community={community}
              posts={filteredPosts}
              user={user}
              slug={slug}
              isCreator={isCreator}
              postType={postType}
              searchQuery={searchQuery}
              handlePostTypeChange={onPostTypeChange}
              handleSearchChange={onSearchChange}
              handleUpvotePost={onUpvotePost}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default memo(PostsTab); 