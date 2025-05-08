import api from '../apiClient';
import { 
  CommentFilters, 
  PostFormRequest,
  CommentFormRequest,
  ApiSuccessResponse,
  Post,
  PostDetail,
  Comment
} from '@/types/api';
import { handleApiError, processApiResponse } from '../../utils/errorHandling';

/**
 * PostAPI - Handles all post-related API operations
 */
class PostAPI {
  /**
   * Get a single post by ID
   */
  async getPost(communitySlug: string, postId: number): Promise<PostDetail> {
    try {
      const response = await api.get<PostDetail>(
        `/api/communities/${communitySlug}/posts/${postId}/`
      );
      
      // Handle paginated response
      // Type guard for paginated response structure
      if (response.data && 
          typeof response.data === 'object' && 
          'results' in response.data && 
          Array.isArray(response.data.results)) { 
        if (response.data.results.length > 0) {
          return response.data.results[0];
        }
        throw new Error("Post not found in API response");
      }
      
      return response.data;
    } catch (error) {
      return handleApiError(error, `post ${postId}`, {
        rethrow: true,
        defaultMessage: "Failed to load post data. Please try again later."
      });
    }
  }

  /**
   * Create a new post
   */
  async createPost(communitySlug: string, data: PostFormRequest): Promise<Post> {
    try {
      console.log("PostAPI.createPost called with data:", data);
      
      // Check if we're dealing with file uploads
      const hasFileUploads = 
        (data.image && data.image instanceof File) || 
        (data.file && data.file instanceof File);
      
      if (hasFileUploads) {
        // Use FormData for file uploads
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === "image" || key === "file") {
              if (value instanceof File) {
                formData.append(key, value);
              }
            } else {
              formData.append(key, value.toString());
            }
          }
        });
        
        // Debug log FormData contents
        console.log("FormData being sent to API:");
        for (const pair of (formData as FormData).entries()) {
          console.log(`${pair[0]}: ${pair[1]}`);
        }
        
        // Verify required fields are present
        if (!formData.get('title')) {
          console.error("Missing required field: title");
        }
        if (!formData.get('content')) {
          console.error("Missing required field: content");
        }
        if (!formData.get('post_type')) {
          console.error("Missing required field: post_type");
        }
        
        console.log(`Sending post creation request to: /api/communities/${communitySlug}/posts/`);
        
        const response = await api.post<Post>(
          `/api/communities/${communitySlug}/posts/`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            }
          }
        );
        
        console.log("Post creation successful:", response.data);
        return response.data;
      } else {
        // For requests without files, use direct JSON
        console.log("Using direct JSON for post creation");
        
        // Ensure required fields are present
        if (!data.title) {
          console.error("Missing required field: title");
        }
        if (!data.content) {
          console.error("Missing required field: content");
        }
        if (!data.post_type) {
          console.error("Missing required field: post_type");
        }
        
        // Send as JSON
        const response = await api.post<Post>(
          `/api/communities/${communitySlug}/posts/`,
          data,
          {
            headers: {
              "Content-Type": "application/json",
            }
          }
        );
        
        console.log("Post creation successful with JSON:", response.data);
        return response.data;
      }
    } catch (error: unknown) {
      console.error("Post creation error:", error);
      
      // Get detailed error information
      const errorDetails = error instanceof Error ? error.message : 'Unknown error';
      console.error("Error details from server:", errorDetails);
      
      // Check for specific validation errors
      if (error instanceof Error && error.message.includes('Validation failed')) {
        return handleApiError(error, "creating post", {
          rethrow: true,
          defaultMessage: error.message
        });
      }
      
      return handleApiError(error, "creating post", {
        rethrow: true,
        defaultMessage: "Failed to create post. Please try again later."
      });
    }
  }

  /**
   * Update an existing post
   */
  async updatePost(
    communitySlug: string,
    postId: number,
    data: Partial<PostFormRequest>
  ): Promise<Post> {
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "image" || key === "file") {
            if (value instanceof File) {
              formData.append(key, value);
            }
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      const response = await api.patch<Post>(
        `/api/communities/${communitySlug}/posts/${postId}/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      return handleApiError(error, `updating post ${postId}`, {
        rethrow: true,
        defaultMessage: "Failed to update post. Please try again later."
      });
    }
  }

  /**
   * Delete a post
   */
  async deletePost(communitySlug: string, postId: number): Promise<void> {
    try {
      await api.delete(
        `/api/communities/${communitySlug}/posts/${postId}/`
      );
    } catch (error) {
      handleApiError(error, `deleting post ${postId}`, {
        rethrow: true,
        defaultMessage: "Failed to delete post. Please try again later."
      });
    }
  }

  /**
   * Upvote a post
   */
  async upvotePost(communitySlug: string, postId: number): Promise<ApiSuccessResponse> {
    try {
      const response = await api.post<ApiSuccessResponse>(
        `/api/communities/${communitySlug}/posts/${postId}/upvote/`
      );
      return response.data;
    } catch (error) {
      return handleApiError(error, `upvoting post ${postId}`, {
        rethrow: true,
        defaultMessage: "Failed to upvote post. Please try again later."
      });
    }
  }

  /**
   * Toggle pin status of a post
   */
  async togglePinPost(communitySlug: string, postId: number): Promise<ApiSuccessResponse> {
    try {
      const response = await api.post<ApiSuccessResponse>(
        `/api/communities/${communitySlug}/posts/${postId}/toggle_pin/`
      );
      return response.data;
    } catch (error) {
      return handleApiError(error, `toggling pin status of post ${postId}`, {
        rethrow: true,
        defaultMessage: "Failed to change pin status. Please try again later."
      });
    }
  }

  /**
   * Join an event post
   */
  async joinEventPost(communitySlug: string, postId: number): Promise<ApiSuccessResponse> {
    try {
      const response = await api.post<ApiSuccessResponse>(
        `/api/communities/${communitySlug}/posts/${postId}/join-event/`
      );
      return response.data;
    } catch (error) {
      return handleApiError(error, `joining event post ${postId}`, {
        rethrow: true,
        defaultMessage: "Failed to join event. Please try again later."
      });
    }
  }

  /**
   * Leave an event post
   */
  async leaveEventPost(communitySlug: string, postId: number): Promise<ApiSuccessResponse> {
    try {
      const response = await api.post<ApiSuccessResponse>(
        `/api/communities/${communitySlug}/posts/${postId}/leave-event/`
      );
      return response.data;
    } catch (error) {
      return handleApiError(error, `leaving event post ${postId}`, {
        rethrow: true,
        defaultMessage: "Failed to leave event. Please try again later."
      });
    }
  }

  /**
   * Get comments for a post
   */
  async getComments(
    communitySlug: string,
    postId: number,
    filters?: CommentFilters
  ): Promise<Comment[]> {
    try {
      const response = await api.get<Comment[]>(
        `/api/communities/${communitySlug}/posts/${postId}/comments/`,
        { params: filters }
      );
      return processApiResponse<Comment>(response.data, 'comments');
    } catch (error) {
      return handleApiError<Comment[]>(error, `comments for post ${postId}`, {
        fallbackValue: [],
        rethrow: false,
      });
    }
  }

  /**
   * Create a comment on a post
   */
  async createComment(
    communitySlug: string,
    postId: number,
    data: CommentFormRequest
  ): Promise<Comment> {
    try {
      const response = await api.post<Comment>(
        `/api/communities/${communitySlug}/posts/${postId}/comments/`,
        data
      );
      return response.data;
    } catch (error) {
      return handleApiError(error, `adding comment to post ${postId}`, {
        rethrow: true,
        defaultMessage: "Failed to add comment. Please try again later."
      });
    }
  }

  /**
   * Update an existing comment
   */
  async updateComment(
    communitySlug: string,
    postId: number,
    commentId: number,
    data: { content: string }
  ): Promise<Comment> {
    try {
      const response = await api.patch<Comment>(
        `/api/communities/${communitySlug}/posts/${postId}/comments/${commentId}/`,
        data
      );
      return response.data;
    } catch (error) {
      return handleApiError(error, `updating comment ${commentId}`, {
        rethrow: true,
        defaultMessage: "Failed to update comment. Please try again later."
      });
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(
    communitySlug: string,
    postId: number,
    commentId: number
  ): Promise<void> {
    try {
      await api.delete(
        `/api/communities/${communitySlug}/posts/${postId}/comments/${commentId}/`
      );
    } catch (error) {
      handleApiError(error, `deleting comment ${commentId}`, {
        rethrow: true,
        defaultMessage: "Failed to delete comment. Please try again later."
      });
    }
  }

  /**
   * Upvote a comment
   */
  async upvoteComment(
    communitySlug: string,
    postId: number,
    commentId: number
  ): Promise<ApiSuccessResponse> {
    try {
      const response = await api.post<ApiSuccessResponse>(
        `/api/communities/${communitySlug}/posts/${postId}/comments/${commentId}/upvote/`
      );
      return response.data;
    } catch (error) {
      return handleApiError(error, `upvoting comment ${commentId}`, {
        rethrow: true,
        defaultMessage: "Failed to upvote comment. Please try again later."
      });
    }
  }
}

// Export singleton instance
export const postApi = new PostAPI();