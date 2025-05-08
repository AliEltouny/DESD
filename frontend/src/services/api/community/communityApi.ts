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
    if (!slug) {
      console.error("Cannot fetch community: slug is undefined");
      throw new Error("Community slug is required");
    }
    
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
      
      const response = await api.get<CommunityDetail>(`/api/communities/${cleanSlug}/`);
      
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
      console.error(`Error fetching community ${cleanSlug}:`, error);
      
      // For 404 errors, we want to rethrow so the UI can show "community not found"
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error(`Community "${cleanSlug}" not found`);
      }
      
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
      console.time('create-community');
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

      // Clear all communities-related cache to avoid stale data
      memoryCache.clear('communities');
      // Clear any potential cached lists that might contain this community
      const newSlug = response.data.slug;
      if (newSlug) {
        // Use clear instead of remove (correct method name)
        localStorageCache.clear(`community_${newSlug}`);
      }
      
      console.timeEnd('create-community');
      return response.data;
    } catch (error) {
      console.timeEnd('create-community');
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
    // Ensure the slug is not undefined
    if (!slug) {
      console.warn("getMembershipStatus called with empty slug");
      return {
        is_member: false,
        status: null,
        role: null
      };
    }
    
    // Clean up the slug
    const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '');
    
    try {
      // Use a leading slash like all other working API methods
      // IMPORTANT: Include leading slash to be consistent with other endpoints
      // Add trailing slash to match Django URL configuration
      const endpoint = `/api/communities/${cleanSlug}/membership_status/`;
      
      // Log for debugging with more detailed information
      console.log(`Making membership status request to: ${endpoint}, slug: ${cleanSlug}`);
      
      const response = await api.get<MembershipStatus>(endpoint);
      return response.data;
    } catch (error) {
      // Default value for when API fails - prevent UI errors by returning a valid object
      const defaultStatus: MembershipStatus = {
        is_member: false,
        status: null,
        role: null
      };

      // Enhanced error logging - but suppress 404 errors for newly created communities
      if (axios.isAxiosError(error)) {
        // Only log non-404 errors to prevent console spam
        if (error.response?.status !== 404) {
          console.error("Membership status error details:", {
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url,
            slug: cleanSlug
          });
        } else {
          // Just log quietly for 404s
          console.log(`Community "${cleanSlug}" not found or membership endpoint unavailable`);
        }
        
        // For 404 errors (community not found or endpoint not available)
        if (error.response?.status === 404) {
          return defaultStatus;
        }
        
        // For 401 errors (not authenticated) - handle gracefully
        if (error.response?.status === 401) {
          console.warn("User not authenticated for membership status check");
          return defaultStatus;
        }
      } else {
        // For non-Axios errors
        console.error("Non-Axios membership status error:", error);
      }
      
      return handleApiError(error, `fetching membership status for ${slug}`, {
        fallbackValue: defaultStatus,
        rethrow: false  // Don't rethrow to prevent UI crashes
      });
    }
  }

  /**
   * Join a community.
   */
  async joinCommunity(slug: string): Promise<ApiSuccessResponse> {
    // Handle empty slug
    if (!slug) {
      console.error("joinCommunity called with empty slug");
      throw new Error("Community slug is required for joining");
    }
    
    // Clean the slug first
    const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '');
    
    try {
      // Add logging for debugging
      console.time(`joinCommunity-${cleanSlug}`);
      console.log(`Joining community: ${cleanSlug}`);
      
      // Backend uses POST for join (with trailing slash)
      const response = await api.post<ApiSuccessResponse>(
        `/api/communities/${cleanSlug}/join/`
      );
      
      console.timeEnd(`joinCommunity-${cleanSlug}`);
      console.log(`Successfully joined community: ${cleanSlug}`, response.data);
      
      // Clear cached data after joining to force refresh
      memoryCache.clear(`community_${cleanSlug}`);
      // Use clear instead of remove (correct method name)
      localStorageCache.clear(`community_${cleanSlug}`);
      memoryCache.clear('communities'); // Also clear the communities list
      
      return response.data;
    } catch (error: any) {
      console.timeEnd(`joinCommunity-${cleanSlug}`); // End timing even on error
      
      // Enhanced error logging
      if (axios.isAxiosError(error)) {
        console.error("Join community error details:", {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
          slug: cleanSlug
        });
      }
      
      // Special handling for "already a member" case - treat as success
      if (axios.isAxiosError(error) && 
          error.response?.status === 400 && 
          (error.response?.data?.detail?.includes('already a member') || 
           error.response?.data?.message?.includes('already a member'))) {
        console.log("Already a member of community, treating as success");
        return { detail: "You are already a member of this community." };
      }
      
      // For authorization errors - provide a clear message
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error("You need to be logged in to join a community");
      }
      
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
    // Handle empty slug
    if (!slug) {
      console.error("leaveCommunity called with empty slug");
      throw new Error("Community slug is required for leaving");
    }
    
    // Clean the slug first
    const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '');
    
    try {
      // Add logging for debugging
      console.time(`leaveCommunity-${cleanSlug}`);
      console.log(`Leaving community: ${cleanSlug}`);
      
      // Backend uses POST for leave (with trailing slash)
      const response = await api.post<ApiSuccessResponse>(
        `/api/communities/${cleanSlug}/leave/`
      );
      
      console.timeEnd(`leaveCommunity-${cleanSlug}`);
      console.log(`Successfully left community: ${cleanSlug}`, response.data);
      
      // Clear cached data after leaving to force refresh
      memoryCache.clear(`community_${cleanSlug}`);
      // Use clear instead of remove (correct method name)
      localStorageCache.clear(`community_${cleanSlug}`);
      memoryCache.clear('communities'); // Also clear the communities list
      
      return response.data;
    } catch (error: any) {
      console.timeEnd(`leaveCommunity-${cleanSlug}`); // End timing even on error
      
      // Enhanced error logging
      if (axios.isAxiosError(error)) {
        console.error("Leave community error details:", {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
          slug: cleanSlug
        });
        
        // For authorization errors - provide a clear message
        if (error.response?.status === 401) {
          throw new Error("You need to be logged in to leave a community");
        }
        
        // For not found errors
        if (error.response?.status === 404) {
          throw new Error(`Community "${cleanSlug}" not found or you're not a member`);
        }
      }
      
      return handleApiError(error, `leaving community ${slug}`, {
        rethrow: true,
        defaultMessage: "Failed to leave community."
      });
    }
  }

  /**
   * Get communities a user is a member of by username
   */
  async getUserCommunities(username: string): Promise<Community[]> {
    if (!username) {
      console.error("getUserCommunities called with empty username");
      throw new Error("Username is required to fetch user communities");
    }
    
    try {
      // This uses the existing getCommunities method with a filter for the specific user
      // The backend needs to support filtering by username
      const response = await api.get<Community[]>('/api/communities/', {
        params: { 
          username: username,
          member_of: true
        }
      });
      
      return processApiResponse<Community>(response.data, 'user communities');
    } catch (error) {
      return handleApiError<Community[]>(error, `communities for user ${username}`, {
        fallbackValue: [],
        rethrow: false,
        defaultMessage: "Failed to load user communities."
      });
    }
  }
}

// Export singleton instance
export const communityApi = new CommunityAPI();
export default communityApi;