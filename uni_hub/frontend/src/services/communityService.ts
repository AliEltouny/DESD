/**
 * @deprecated This file is kept for backward compatibility.
 * 
 * TODO: Phase out this file gradually:
 * 1. Identify all components that import from this file
 * 2. Update those components to import directly from API modules (@/services/api/*)
 * 3. Once all imports are updated, delete this file
 * 
 * Please use the API modules directly from @/services instead:
 * - import { communityApi } from '@/services';  // For community operations
 * - import { postApi } from '@/services';       // For post operations
 */

import { CommunityFormData } from "@/types/community";
// Import from the central services index
import { communityApi, postApi } from '@/services'; 
import apiClient from './apiClient';
// Reexport all types from types/api
import { 
  CommunityDetail, Post, PostDetail, Comment, 
  Membership, CommunityInvitation, PostFormRequest as PostFormData,
  CommentFormRequest as CommentFormData,
  CommunityFilters,
  PostFilters
} from '@/types/api';
import { handleApiError } from "./errorHandling";
import { memoryCache, localStorageCache } from "./cacheManager";

// Re-export the types
export type { 
  CommunityDetail, Post, PostDetail, Comment, 
  Membership, CommunityInvitation, PostFormData, CommentFormData 
};

// API functions - all now use the corresponding API modules

// Communities
export const getCommunities = async (params?: CommunityFilters) => {
  return communityApi.getCommunities(params);
};

export const getCommunity = async (slug: string) => {
  return communityApi.getCommunity(slug);
};

export const createCommunity = async (data: CommunityFormData) => {
  return communityApi.createCommunity(data);
};

export const updateCommunity = async (
  slug: string,
  data: Partial<CommunityFormData>
) => {
  // Forward to community API when implemented 
  try {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === "image" || key === "banner") {
          if (value instanceof File) {
            formData.append(key, value);
          }
        } else if (typeof value === "boolean") {
          formData.append(key, value ? "true" : "false");
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    
    // Invalidate cache
    memoryCache.clear('communities');
    const localCacheKey = `community_${slug}`;
    localStorageCache.clear(localCacheKey);
    
    // TODO: Implement updateCommunity in communityApi
    throw new Error("Not implemented");
  } catch (error) {
    return handleApiError(error, `updating community "${slug}"`, {
      rethrow: true,
      defaultMessage: "Failed to update community."
    });
  }
};

export const deleteCommunity = async (
  slug: string
) => {
  // TODO: Implement deleteCommunity in communityApi
  console.warn(`deleteCommunity for community "${slug}" is not implemented in CommunityAPI class.`);
  // Future implementation:
  // return communityApi.deleteCommunity(slug);
};

export const joinCommunity = async (
  slug: string
) => {
  // TODO: Implement joinCommunity in communityApi
  console.warn(`joinCommunity for community "${slug}" is not implemented in CommunityAPI class.`);
  // Future implementation:
  // return communityApi.joinCommunity(slug);
};

export const leaveCommunity = async (
  slug: string
) => {
  // TODO: Implement leaveCommunity in communityApi
  console.warn(`leaveCommunity for community "${slug}" is not implemented in CommunityAPI class.`);
  // Future implementation:
  // return communityApi.leaveCommunity(slug);
};

export const getCommunityMembers = async (slug: string, role?: string) => {
  return communityApi.getCommunityMembers(slug, role);
};

export const inviteToCommunity = async (
  slug: string,
  inviteeEmail: string,
  message?: string
) => {
  // TODO: Implement inviteToCommunity in communityApi
  console.warn(`inviteToCommunity for community "${slug}" and email "${inviteeEmail}" is not implemented in CommunityAPI class.${message ? ` Message: "${message}"` : ""}`);
  // Future implementation:
  // return communityApi.inviteToCommunity(slug, { email: inviteeEmail, message: message || '' });
};

export const updateMemberRole = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  slug: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  role: string
) => {
  // TODO: Implement updateMemberRole in communityApi
  console.warn("updateMemberRole is not implemented in CommunityAPI class");
  // return communityApi.updateMemberRole(slug, { user_id: userId, role }); // Removed call
};

export const approveMembership = async (communitySlug: string, userId: number) => {
  await apiClient.post(`/communities/${communitySlug}/members/${userId}/approve/`);
};

// Posts
export const getPosts = async (communitySlug: string, params?: PostFilters) => {
  return communityApi.getPosts(communitySlug, params);
};

export const getPost = async (communitySlug: string, postId: number) => {
  return postApi.getPost(communitySlug, postId);
};

export const createPost = async (communitySlug: string, data: PostFormData) => {
  return postApi.createPost(communitySlug, data);
};

export const updatePost = async (
  communitySlug: string,
  postId: number,
  data: Partial<PostFormData>
) => {
  return postApi.updatePost(communitySlug, postId, data);
};

export const deletePost = async (communitySlug: string, postId: number) => {
  return postApi.deletePost(communitySlug, postId);
};

export const upvotePost = async (communitySlug: string, postId: number) => {
  return postApi.upvotePost(communitySlug, postId);
};

export const togglePinPost = async (communitySlug: string, postId: number) => {
  return postApi.togglePinPost(communitySlug, postId);
};

// Comments
export const getComments = async (
  communitySlug: string,
  postId: number,
  parentId?: number
) => {
  const filters = parentId ? { parent: parentId } : undefined;
  return postApi.getComments(communitySlug, postId, filters);
};

export const createComment = async (
  communitySlug: string,
  postId: number,
  data: { content: string; parent?: number }
) => {
  return postApi.createComment(communitySlug, postId, data);
};

export const updateComment = async (
  communitySlug: string,
  postId: number,
  commentId: number,
  data: { content: string }
) => {
  return postApi.updateComment(communitySlug, postId, commentId, data);
};

export const deleteComment = async (
  communitySlug: string,
  postId: number,
  commentId: number
) => {
  return postApi.deleteComment(communitySlug, postId, commentId);
};

export const upvoteComment = async (
  communitySlug: string,
  postId: number,
  commentId: number
) => {
  return postApi.upvoteComment(communitySlug, postId, commentId);
};

export const getCommunityAnalytics = async (communitySlug: string) => {
  return communityApi.getCommunityAnalytics(communitySlug);
};

// Uncomment function, ensure no slug parameter
export const getInvitations = async () => {
  const response = await apiClient.get(`/invitations/pending/`);
  return response.data;
};
