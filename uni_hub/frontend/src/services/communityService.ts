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
  community: {
    id: number;
    name: string;
    slug: string;
  };
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
  upvotes: number[];
  upvote_count: number;
  has_upvoted: boolean;
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
  try {
    console.log("Fetching community with slug:", slug);
    // Use axios default config which should include auth headers
    const response = await axios.get<CommunityDetail>(
      `${API_URL}/communities/${slug}/`
    );
    console.log("Community API response status:", response.status);
    return response.data;
  } catch (error) {
    console.error("Error fetching community:", error);
    throw error;
  }
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
    
    // Get token directly from cookies for authorization
    const cookies = document.cookie.split(';');
    const accessTokenCookie = cookies.find(c => c.trim().startsWith('accessToken='));
    const token = accessTokenCookie ? accessTokenCookie.split('=')[1].trim() : null;
    
    console.log("Authorization token found:", !!token);
    console.log("API URL being used:", process.env.NEXT_PUBLIC_API_URL || "/api");

    // Use an absolute URL to avoid any path resolution issues
    const apiUrl = '/api/communities';
    console.log("Full request URL:", apiUrl);

    // Direct fetch implementation with proper headers
    const response = await fetch(apiUrl, {
      method: "POST",
      body: formData,
      credentials: "include",
      headers: token ? { 
        'Authorization': `Bearer ${token}`
      } : {},
    });

    if (!response.ok) {
      console.error("Response status:", response.status);
      console.error("Response status text:", response.statusText);
      
      // Try to get detailed error message
      let errorMsg;
      try {
        const errorData = await response.json();
        console.error("Error response data:", errorData);
        errorMsg = errorData.detail || 
                  (errorData.name && errorData.name[0]) || 
                  `Error ${response.status}: ${response.statusText}`;
      } catch (e) {
        errorMsg = `Error ${response.status}: ${response.statusText}`;
      }
      
      throw new Error(errorMsg);
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
  try {
    console.log(`Fetching posts for community: ${communitySlug}`);
    
    const response = await axios.get<Post[]>(
      `${API_URL}/communities/${communitySlug}/posts/`,
      { params }
    );
    
    // Ensure we're getting an array of posts
    if (Array.isArray(response.data)) {
      console.log(`Retrieved ${response.data.length} posts`);
      return response.data;
    } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
      // Handle paginated response
      console.log(`Retrieved ${response.data.results.length} posts from paginated response`);
      return response.data.results;
    } else {
      console.warn("API didn't return an array for posts:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    return []; // Return empty array on error
  }
};

export const getPost = async (communitySlug: string, postId: number) => {
  const response = await axios.get<PostDetail>(
    `${API_URL}/communities/${communitySlug}/posts/${postId}/`
  );
  return response.data;
};

export const createPost = async (communitySlug: string, formData: FormData) => {
  try {
    console.log(`Creating post in community: ${communitySlug}`);
    
    // Check if community ID is included in the formData
    const communityId = formData.get("community");
    if (!communityId) {
      console.error("No community ID provided in formData");
      throw new Error("Community ID is required to create a post");
    }
    
    console.log(`Using community ID: ${communityId}`);
    
    // Get stored community data to check if user is creator
    let isCreatorFromCache = false;
    try {
      const storedUserData = localStorage.getItem('user');
      const storedCommunityKey = `community_${communitySlug}`;
      const storedCommunityData = localStorage.getItem(storedCommunityKey);
      
      if (storedUserData && storedCommunityData) {
        const userData = JSON.parse(storedUserData);
        const communityData = JSON.parse(storedCommunityData);
        
        if (communityData.creator?.id === userData.id) {
          isCreatorFromCache = true;
          console.log('User is the creator of this community based on cached data');
        }
      }
    } catch (err) {
      console.error("Error checking cached creator status:", err);
    }
    
    // Get auth token manually to ensure it's included
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
    const token = tokenCookie ? tokenCookie.split('=')[1].trim() : null;
    
    const headers: Record<string, string> = {
      "Content-Type": "multipart/form-data",
    };
    
    // Add auth token to headers if it exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      // Try localStorage as fallback
      const localToken = localStorage.getItem('accessToken');
      if (localToken) {
        headers["Authorization"] = `Bearer ${localToken}`;
      } else {
        console.error("No auth token found in cookies or localStorage for post creation");
      }
    }
    
    // Log the authorization header being used
    console.log("Using Authorization header:", headers.Authorization ? 
      `${headers.Authorization.substring(0, 15)}...` : "Not set");
    
    // Print all form data entries for debugging
    console.log("FormData entries:");
    for (const pair of formData.entries()) {
      console.log(`${pair[0]}: ${pair[1]}`);
    }
    
    const response = await axios.post<Post>(
      `${API_URL}/communities/${communitySlug}/posts/`,
      formData,
      {
        headers,
        withCredentials: true  // Ensure cookies are sent with request
      }
    );
    
    console.log(`Post created successfully in ${communitySlug}`);
    return response.data;
  } catch (error: any) {
    console.error('Post creation failed:', error.response?.data || error.message || error);
    
    // If the error is 403 (forbidden) and we suspect the user is the creator,
    // throw a specific error that we can handle in the component
    if (error.response?.status === 403 && isCreatorFromCache) {
      console.error('Creator membership issue detected');
      const enhancedError = new Error('Creator access issue');
      (enhancedError as any).response = error.response;
      (enhancedError as any).isCreatorError = true;
      throw enhancedError;
    }
    
    throw error;
  }
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
  data: { content: string; parent?: number }
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

// Analytics
export const getCommunityAnalytics = async (communitySlug: string) => {
  try {
    const response = await api.get(
      `/communities/${communitySlug}/analytics/`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching community analytics:", error);
    throw error;
  }
};
