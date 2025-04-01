import axios from "axios";
import { Community, CommunityFormData } from "@/types/community";
import api, { API_URL } from "./api";
import { getAuthToken } from "@/contexts/AuthContext";

// Types
export interface CommunityDetail extends Community {
  recent_posts: Post[];
  admins: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  }[];
}

export interface Post {
  id: number;
  title: string;
  content: string;
  community: number;
  author: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  };
  post_type: string;
  event_date: string | null;
  event_location: string | null;
  image: string | null;
  file: string | null;
  is_pinned: boolean;
  upvote_count: number;
  has_upvoted: boolean;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface PostDetail extends Post {
  comments: Comment[];
}

export interface Comment {
  id: number;
  post: number;
  author: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  };
  content: string;
  parent: number | null;
  upvote_count: number;
  has_upvoted: boolean;
  reply_count: number;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  };
  community: number;
  role: string;
  status: string;
  joined_at: string;
}

export interface CommunityInvitation {
  id: number;
  community: number;
  community_name: string;
  inviter: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  };
  invitee_email: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PostFormData {
  title: string;
  content: string;
  post_type: string;
  event_date?: string | null;
  event_location?: string | null;
  image?: File | null;
  file?: File | null;
}

export interface CommentFormData {
  content: string;
  parent?: number | null;
}

// API functions

// Communities
export const getCommunities = async (params?: any) => {
  try {
    const response = await axios.get<Community[]>(`${API_URL}/communities/`, {
      params,
    });

    // Ensure we always return an array
    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      console.warn(
        "API did not return an array for communities:",
        response.data
      );
      return []; // Return empty array if response is not an array
    }
  } catch (error) {
    console.error("Failed to fetch communities:", error);
    return []; // Return empty array on error
  }
};

export const getCommunity = async (slug: string) => {
  const response = await axios.get<CommunityDetail>(
    `${API_URL}/communities/${slug}/`
  );
  return response.data;
};

export const createCommunity = async (data: CommunityFormData) => {
  try {
    // Create FormData for file uploads
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Convert camelCase to snake_case for Django
        const djangoKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();

        if (key === "image" || key === "banner") {
          if (value instanceof File) {
            formData.append(djangoKey, value);
          }
        } else if (typeof value === "boolean") {
          // Convert boolean to string 'true'/'false'
          formData.append(djangoKey, value ? "true" : "false");
        } else {
          formData.append(djangoKey, value.toString());
        }
      }
    });

    // Log the request for debugging
    console.log(
      "Creating community with data:",
      Object.fromEntries(formData.entries())
    );

    // Direct fetch implementation to bypass potential issues
    const response = await fetch(`/api/communities`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || `Error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error: any) {
    console.error(
      "Community creation error:",
      error.response?.data || error.message || error
    );
    throw error;
  }
};

export const updateCommunity = async (
  slug: string,
  data: Partial<CommunityFormData>
) => {
  // Create FormData for file uploads
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key === "image" || key === "banner") {
        if (value instanceof File) {
          formData.append(key, value);
        }
      } else {
        formData.append(key, value.toString());
      }
    }
  });

  const response = await axios.patch<Community>(
    `${API_URL}/communities/${slug}/`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const deleteCommunity = async (slug: string) => {
  await axios.delete(`${API_URL}/communities/${slug}/`);
};

export const joinCommunity = async (slug: string) => {
  const response = await axios.post<{ detail: string }>(
    `${API_URL}/communities/${slug}/join/`
  );
  return response.data;
};

export const leaveCommunity = async (slug: string) => {
  const response = await axios.post<{ detail: string }>(
    `${API_URL}/communities/${slug}/leave/`
  );
  return response.data;
};

export const getCommunityMembers = async (slug: string, role?: string) => {
  const params = role ? { role } : undefined;
  const response = await axios.get<Membership[]>(
    `${API_URL}/communities/${slug}/members/`,
    { params }
  );
  return response.data;
};

export const inviteToCommunity = async (
  slug: string,
  inviteeEmail: string,
  message?: string
) => {
  const response = await axios.post<{ detail: string }>(
    `${API_URL}/communities/${slug}/invite/`,
    { invitee_email: inviteeEmail, message }
  );
  return response.data;
};

export const updateMemberRole = async (
  slug: string,
  userId: number,
  role: string
) => {
  const response = await axios.put<{ detail: string }>(
    `${API_URL}/communities/${slug}/update_member_role/`,
    { user_id: userId, role }
  );
  return response.data;
};

export const approveMembership = async (
  slug: string,
  userId: number,
  approve: boolean = true
) => {
  const response = await axios.put<{ detail: string }>(
    `${API_URL}/communities/${slug}/approve_membership/`,
    { user_id: userId, approve }
  );
  return response.data;
};

// Posts
export const getPosts = async (communitySlug: string, params?: any) => {
  const response = await axios.get<Post[]>(
    `${API_URL}/communities/${communitySlug}/posts/`,
    { params }
  );
  return response.data;
};

export const getPost = async (communitySlug: string, postId: number) => {
  const response = await axios.get<PostDetail>(
    `${API_URL}/communities/${communitySlug}/posts/${postId}/`
  );
  return response.data;
};

export const createPost = async (communitySlug: string, data: PostFormData) => {
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

  const response = await axios.post<Post>(
    `${API_URL}/communities/${communitySlug}/posts/`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const updatePost = async (
  communitySlug: string,
  postId: number,
  data: Partial<PostFormData>
) => {
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

  const response = await axios.patch<Post>(
    `${API_URL}/communities/${communitySlug}/posts/${postId}/`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const deletePost = async (communitySlug: string, postId: number) => {
  await axios.delete(
    `${API_URL}/communities/${communitySlug}/posts/${postId}/`
  );
};

export const upvotePost = async (communitySlug: string, postId: number) => {
  const response = await axios.post<{ detail: string }>(
    `${API_URL}/communities/${communitySlug}/posts/${postId}/upvote/`
  );
  return response.data;
};

export const togglePinPost = async (communitySlug: string, postId: number) => {
  const response = await axios.post<{ detail: string }>(
    `${API_URL}/communities/${communitySlug}/posts/${postId}/toggle_pin/`
  );
  return response.data;
};

// Comments
export const getComments = async (
  communitySlug: string,
  postId: number,
  parentId?: number
) => {
  const params = parentId ? { parent: parentId } : undefined;
  const response = await axios.get<Comment[]>(
    `${API_URL}/communities/${communitySlug}/posts/${postId}/comments/`,
    { params }
  );
  return response.data;
};

export const createComment = async (
  communitySlug: string,
  postId: number,
  data: CommentFormData
) => {
  const response = await axios.post<Comment>(
    `${API_URL}/communities/${communitySlug}/posts/${postId}/comments/`,
    data
  );
  return response.data;
};

export const updateComment = async (
  communitySlug: string,
  postId: number,
  commentId: number,
  data: { content: string }
) => {
  const response = await axios.patch<Comment>(
    `${API_URL}/communities/${communitySlug}/posts/${postId}/comments/${commentId}/`,
    data
  );
  return response.data;
};

export const deleteComment = async (
  communitySlug: string,
  postId: number,
  commentId: number
) => {
  await axios.delete(
    `${API_URL}/communities/${communitySlug}/posts/${postId}/comments/${commentId}/`
  );
};

export const upvoteComment = async (
  communitySlug: string,
  postId: number,
  commentId: number
) => {
  const response = await axios.post<{ detail: string }>(
    `${API_URL}/communities/${communitySlug}/posts/${postId}/comments/${commentId}/upvote/`
  );
  return response.data;
};
