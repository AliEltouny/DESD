import api, { API_URL } from '../apiClient';
import { 
  Community, 
  CommunityFormData 
} from '@/types/community';
import { 
  CommunityFilters, 
  PostFilters, 
  CommentFilters, 
  Post,
  Comment,
  Membership,
  CommunityDetail,
  ApiSuccessResponse,
  MembershipStatus,
  PaginatedResponse,
  CommunityMember,
  CommunityAnalytics
} from '@/types/api';
import { handleApiError, processApiResponse } from '../../utils/errorHandling';
import { memoryCache, localStorageCache } from '../../utils/cacheManager';
import axios from 'axios';

/**
 * CommunityAPI - Handles all community-related API operations
 */
class CommunityAPI {
  /**
   * Get communities with optional filtering
   */
  async getCommunities(filters?: CommunityFilters): Promise<Community[]> {
    try {
      // Use cached data if available and no specific filters requested
      if (!filters && memoryCache.isValid('communities')) {
        console.log("Using cached communities data");
        return memoryCache.get('communities') || [];
      }

      const response = await api.get<Community[]>('/api/communities/', {
        params: filters,
      });

      // Process response (handle pagination, etc.)
      const communityData = processApiResponse<Community>(response.data, 'communities');
      
      // Cache the data if no specific filters were requested
      if (!filters) {
        memoryCache.set('communities', communityData);
        console.log("Cached communities data");
      }
      
      return communityData;
    } catch (error) {
      return handleApiError<Community[]>(error, "fetching communities", {
        fallbackValue: [],
        rethrow: false
      });
    }
  }

  /**
   * Get a specific community by slug with caching
   */
  async getCommunity(slug: string): Promise<CommunityDetail> {
    // Clean up the slug to remove any unwanted characters
    const cleanSlug = slug.trim();
    
    console.log("Fetching community with slug:", cleanSlug);

    // First check memory cache
    if (memoryCache.isValid('communities')) {
      console.log("Checking memory cache for community");
      const communities = memoryCache.get<Community[]>('communities');
      if (communities) {
        const cachedCommunity = communities.find(
          (community) => community.slug === cleanSlug
        );
        
        if (cachedCommunity) {
          console.log("Found community in memory cache:", cachedCommunity.name);
          return cachedCommunity as CommunityDetail;
        }
      }
    }

    // Then check localStorage cache
    const localCacheKey = `community_${cleanSlug}`;
    const cachedCommunity = localStorageCache.getWithExpiry<CommunityDetail>(localCacheKey);
    if (cachedCommunity) {
      console.log("Using locally cached community data:", cachedCommunity.name);
      return cachedCommunity;
    }

    try {
      // Get from communities list first (most reliable method)
      console.log("Getting community from communities list");
      const communities = await this.getCommunities();
      
      // Find the community with matching slug
      const foundCommunity = communities.find((community) => 
        community.slug === cleanSlug || community.slug === `${cleanSlug}/`
      );
      
      if (foundCommunity) {
        console.log("Found community in list:", foundCommunity.name);
        
        // Cache in localStorage
        localStorageCache.setWithExpiry(localCacheKey, foundCommunity);
        
        return foundCommunity as CommunityDetail;
      }
      
      // Only try direct API access as last resort
      console.log("Community not found in list, trying direct API access");
      
      const response = await api.get<CommunityDetail>(`/api/communities/${cleanSlug}`);
      
      // Handle different response formats
      let communityData;
      // Type guard for paginated response structure
      if (response.data && 
          typeof response.data === 'object' && 
          'results' in response.data && 
          Array.isArray(response.data.results)) {
        if (response.data.results.length > 0) {
          communityData = response.data.results[0];
        } else {
          throw new Error("Community not found in API response");
        }
      } else {
        communityData = response.data;
      }
      
      // Cache the result
      localStorageCache.setWithExpiry(localCacheKey, communityData);
      return communityData;
    } catch (error) {
      // Use standardized error handler
      return handleApiError<CommunityDetail>(error, `community "${cleanSlug}"`, {
        rethrow: true,
        defaultMessage: "Failed to load community data. Please try again later."
      });
    }
  }

  /**
   * Create a new community
   */
  async createCommunity(data: CommunityFormData): Promise<Community> {
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

      // Use the api instance with proper config
      const response = await api.post('/api/communities/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Clear communities cache since we've added a new one
      memoryCache.clear('communities');
      
      return response.data;
    } catch (error) {
      console.error(
        "Community creation error:",
        error instanceof Error ? error.message : error
      );
      throw new Error(error instanceof Error ? error.message : "Failed to create community.");
    }
  }

  /**
   * Get posts for a community
   */
  async getPosts(slug: string, filters?: PostFilters): Promise<PaginatedResponse<Post>> {
    try {
      const response = await api.get<PaginatedResponse<Post>>(
        `/api/communities/${slug}/posts/`,
        { params: filters }
      );
      
      return response.data;
    } catch (error) {
      return handleApiError<PaginatedResponse<Post>>(error, `posts for community "${slug}"`, {
        fallbackValue: { results: [] },
        rethrow: true,
        defaultMessage: "Failed to load posts."
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
        rethrow: false
      });
    }
  }

  /**
   * Get members of a community
   */
  async getCommunityMembers(slug: string, role?: string): Promise<CommunityMember[]> {
    const params: Record<string, string> = {};
    if (role) {
      params.role = role;
    }
    try {
      const response = await api.get<CommunityMember[]>(
        `/api/communities/${slug}/members/`,
        { params }
      );
      
      return response.data;
    } catch (error) {
      return handleApiError<CommunityMember[]>(error, `members for community "${slug}"`, {
        fallbackValue: [],
        rethrow: false
      });
    }
  }

  /**
   * Get analytics for a community
   */
  async getCommunityAnalytics(communitySlug: string): Promise<unknown> {
    try {
      const response = await api.get(`/api/communities/${communitySlug}/analytics`);
      return response.data;
    } catch (error) {
      return handleApiError<unknown>(error, `analytics for community "${communitySlug}"`, {
        fallbackValue: {},
        rethrow: false
      });
    }
  }

  /**
   * Get current user's membership status for a community.
   */
  async getMembershipStatus(slug: string): Promise<MembershipStatus> {
    try {
      // Ensure the slug is not undefined
      if (!slug) {
        throw new Error("Community slug is required for membership status");
      }
      
      // Clean up the slug
      const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '');
      
      // Use a leading slash like all other working API methods
      // IMPORTANT: Include leading slash to be consistent with other endpoints
      // Note trailing slash is intentionally omitted since Django uses trailing_slash=False
      const endpoint = `/api/communities/${cleanSlug}/membership_status`;
      
      // Log for debugging
      console.log(`Making membership status request to: ${endpoint}`);
      
      const response = await api.get<MembershipStatus>(endpoint);
      return response.data;
    } catch (error) {
      console.error("Membership status error:", error);
      return handleApiError(error, `fetching membership status for ${slug}`, {
        rethrow: true,
        defaultMessage: "Failed to get membership status."
      });
    }
  }

  /**
   * Join a community.
   */
  async joinCommunity(slug: string): Promise<ApiSuccessResponse> {
    try {
      // Clean the slug first
      const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '');
      
      // Backend uses POST for join (without trailing slash)
      const response = await api.post<ApiSuccessResponse>(
        `/api/communities/${cleanSlug}/join`
      );
      return response.data;
    } catch (error) {
      return handleApiError(error, `joining community ${slug}`, {
        rethrow: true,
        defaultMessage: "Failed to join community."
      });
    }
  }

  /**
   * Leave a community.
   */
  async leaveCommunity(slug: string): Promise<ApiSuccessResponse> {
    try {
      // Clean the slug first
      const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '');
      
      // Backend uses POST for leave (without trailing slash)
      const response = await api.post<ApiSuccessResponse>(
        `/api/communities/${cleanSlug}/leave`
      );
      return response.data;
    } catch (error) {
      return handleApiError(error, `leaving community ${slug}`, {
        rethrow: true,
        defaultMessage: "Failed to leave community."
      });
    }
  }
}

// Export singleton instance
export const communityApi = new CommunityAPI();
export default communityApi;