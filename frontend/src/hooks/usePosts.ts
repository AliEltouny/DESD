import { useMemo } from 'react';
import { postApi } from '@/services/api';
import { CommentFilters } from '@/types/api';
import useApi, { useLazyApi } from './useApi';

/**
 * Hook for getting a single post
 */
export function usePost(communitySlug: string, postId: number) {
  const { data, loading, error } = useApi(
    async () => postApi.getPost(communitySlug, postId),
    [communitySlug, postId]
  );

  return {
    post: data,
    loading,
    error
  };
}

/**
 * Hook for creating a post (lazy execution)
 */
export function useCreatePost() {
  const { loading, error, execute } = useLazyApi(
    postApi.createPost.bind(postApi)
  );

  return {
    createPost: execute,
    isCreating: loading,
    error
  };
}

/**
 * Hook for updating a post (lazy execution)
 */
export function useUpdatePost() {
  const { loading, error, execute } = useLazyApi(
    postApi.updatePost.bind(postApi)
  );

  return {
    updatePost: execute,
    isUpdating: loading,
    error
  };
}

/**
 * Hook for deleting a post (lazy execution)
 */
export function useDeletePost() {
  const { loading, error, execute } = useLazyApi(
    postApi.deletePost.bind(postApi)
  );

  return {
    deletePost: execute,
    isDeleting: loading,
    error
  };
}

/**
 * Hook for upvoting a post (lazy execution)
 */
export function useUpvotePost() {
  const { loading, error, execute } = useLazyApi(
    postApi.upvotePost.bind(postApi)
  );

  return {
    upvotePost: execute,
    isUpvoting: loading,
    error
  };
}

/**
 * Hook for toggling pin status of a post (lazy execution)
 */
export function useTogglePinPost() {
  const { loading, error, execute } = useLazyApi(
    postApi.togglePinPost.bind(postApi)
  );

  return {
    togglePinPost: execute,
    isToggling: loading,
    error
  };
}

/**
 * Hook for getting post comments
 */
export function usePostComments(
  communitySlug: string,
  postId: number,
  filters?: CommentFilters
) {
  // Convert filters to dependency array
  const filterDeps = useMemo(() => {
    if (!filters) return [communitySlug, postId];
    return [
      communitySlug,
      postId,
      ...Object.entries(filters).map(([key, value]) => `${key}:${value}`)
    ];
  }, [communitySlug, postId, filters]);

  const { data, loading, error } = useApi(
    async () => postApi.getComments(communitySlug, postId, filters),
    filterDeps
  );

  return {
    comments: data || [],
    loading,
    error
  };
}

/**
 * Hook for posting a comment (lazy execution)
 */
export function useCreateComment() {
  const { loading, error, execute } = useLazyApi(
    postApi.createComment.bind(postApi)
  );

  return {
    createComment: execute,
    isCreating: loading,
    error
  };
}

const postHooks = {
  usePost,
  useCreatePost,
  useUpdatePost,
  useDeletePost,
  useUpvotePost,
  useTogglePinPost,
  usePostComments,
  useCreateComment
};

export { postHooks }; 