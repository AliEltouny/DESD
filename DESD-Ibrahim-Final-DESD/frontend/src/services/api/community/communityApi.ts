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
import { 
  mockMembershipStatus, 
  mockJoinCommunity, 
  mockLeaveCommunity, 
  shouldUseMockServices,
  recordApiError,
  recordApiSuccess
} from './mockFallbacks';

// Helper function to get cookie value (duplicated from apiClient to avoid circular dependencies)
const getCookie = (name: string): string | undefined => {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return undefined;
};

/**
 * CommunityAPI - Handles all community-related API operations
 * Prioritizes communication with Django backend
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
      console.time('createCommunity');
      
      // Create FormData for file uploads with optimized processing
      const formData = new FormData();
      
      // Process non-image fields first (faster to process)
      const textFields = ['name', 'description', 'short_description', 'category', 'tags', 'rules'];
      const booleanFields = ['is_private', 'requires_approval'];
      
      // Add text fields in a single loop
      textFields.forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          // Convert camelCase to snake_case for Django
          const djangoKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
          formData.append(djangoKey, data[key].toString());
        }
      });
      
      // Add boolean fields in a single loop
      booleanFields.forEach(key => {
        if (data[key] !== undefined) {
          // Convert camelCase to snake_case for Django
          const djangoKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
          formData.append(djangoKey, data[key] ? "true" : "false");
        }
      });
      
      // Process image fields last (potentially slower)
      // Reduced file upload size and improved efficiency
      const imageFields = ['image', 'banner'];
      for (const key of imageFields) {
        const file = data[key];
        if (file instanceof File) {
          const djangoKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
          formData.append(djangoKey, file);
        }
      }

      console.time('apiRequest');
      
      // Use the api instance with proper config and connection optimization
      const response = await api.post('/api/communities/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        // Increase timeout for image upload (important for slower connections)
        timeout: 30000,
        // Add progress monitoring
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });
      
      console.timeEnd('apiRequest');

      // Clear communities cache since we've added a new one - do this after request completes
      setTimeout(() => {
        memoryCache.clear('communities');
      }, 0);
      
      console.timeEnd('createCommunity');
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
      // Validate the slug
      if (!slug || typeof slug !== 'string') {
        console.error("Invalid community slug provided to getPosts:", slug);
        return { results: [], count: 0, next: null, previous: null };
      }
      
      // Clean the slug
      const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '');
      
      // Add timestamp to prevent caching
      const params = {
        ...filters,
        _t: filters?._t || Date.now() // Add cache busting parameter
      };
      
      // Set up headers with cache control
      const headers = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      const response = await api.get<PaginatedResponse<Post>>(
        `/api/communities/${cleanSlug}/posts/`,
        { params, headers }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching posts for community "${slug}":`, error);
      
      // Return a valid empty response structure instead of throwing
      return handleApiError<PaginatedResponse<Post>>(error, `posts for community "${slug}"`, {
        fallbackValue: { results: [], count: 0, next: null, previous: null },
        rethrow: false,
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
   * @param slug Community slug
   * @param params Optional parameters (role, limit, offset)
   * @returns Paginated list of community members
   */
  async getCommunityMembers(
    slug: string, 
    params?: Record<string, any>
  ): Promise<PaginatedResponse<CommunityMember>> {
    // Ensure the slug is valid
    if (!slug) {
      throw new Error('Community slug is required');
    }
    
    // Clean the slug
    const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '');
    
    // Prepare request parameters
    const requestParams: Record<string, any> = { ...params };
    
    // Ensure we have default pagination values if not specified
    if (!requestParams.limit) {
      requestParams.limit = 10;
    }
    
    try {
      console.log(`Fetching members for community: ${cleanSlug}`);
      
      // Get auth token from cookie for explicit auth header
      const getCookie = (name: string): string | undefined => {
        if (typeof document === "undefined") return undefined;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift();
        return undefined;
      };
      
      const token = getCookie('accessToken');
      console.log('Using auth token:', token ? `${token.substring(0, 10)}...` : 'No token');
      
      // Set up headers with auth token explicitly
      const headers: Record<string, string> = {
        'X-Request-Type': 'community-members',
        'X-Community-Slug': cleanSlug
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Use the standard API endpoint (trailing slash is important)
      const response = await api.get<PaginatedResponse<CommunityMember>>(
        `/api/communities/${cleanSlug}/members/`,
        { 
          params: requestParams,
          timeout: 8000,
          headers
        }
      );
      
      console.log(`Successfully fetched ${response.data.results?.length || 0} members from ${response.data.count} total`);
      
      // Cache successful response
      try {
        const cacheKey = `community_members_${cleanSlug}_${JSON.stringify(requestParams)}`;
        localStorageCache.setWithExpiry(cacheKey, response.data, 60 * 5); // 5 minute expiry
      } catch (cacheError) {
        console.warn("Failed to cache members data:", cacheError);
      }
      
      return response.data;
    } catch (error) {
      console.error("Error fetching community members:", error);
      
      // Try to get cached data if available
      try {
        const cacheKey = `community_members_${cleanSlug}_${JSON.stringify(requestParams)}`;
        const cachedMembers = localStorageCache.getWithExpiry<PaginatedResponse<CommunityMember>>(cacheKey);
        if (cachedMembers) {
          console.log("Using cached members data");
          return cachedMembers;
        }
      } catch (cacheError) {
        console.warn("Error accessing cached members data:", cacheError);
      }
      
      // Use error handler with fallback empty response
      return handleApiError<PaginatedResponse<CommunityMember>>(
        error, 
        `members for community "${slug}"`, 
        {
          fallbackValue: { 
            count: 0, 
            next: null, 
            previous: null, 
            results: [] 
          },
          rethrow: false
        }
      );
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
      
      // Use the standard API endpoint with trailing slash
      const endpoint = `/api/communities/${cleanSlug}/membership_status/`;
      
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
   * Join a community (always prioritizes Django backend)
   */
  async joinCommunity(slug: string): Promise<ApiSuccessResponse> {
    // Ensure the slug is valid
    if (!slug) {
      throw new Error("Community slug is required to join a community");
    }
    
    // Clean the slug first
    const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '');
    
    // Maximum retries for Django
    const MAX_RETRIES = 3;
    let attempts = 0;
    
    // First, always try Django backend with multiple retries
    console.log(`Attempting to join community via Django API: '${cleanSlug}'`);
    
    while (attempts < MAX_RETRIES) {
      try {
        // Create a direct URL with the absolute path to backend
        const fullUrl = `${API_URL}/api/communities/${cleanSlug}/join/`;
        console.log(`Making join request to: ${fullUrl}`);
        
        // Backend uses POST for join (with trailing slash)
        const response = await axios.post<ApiSuccessResponse>(
          fullUrl,
          // Add empty data and timeout for reliability
          {},
          { 
            timeout: 10000,
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              'X-Request-Type': 'join-community',
              'X-Community-Slug': cleanSlug,
              'Authorization': `Bearer ${getCookie('accessToken')}`
            }
          }
        );
        
        // Django request succeeded!
        console.log(`Successfully joined community via Django: '${cleanSlug}'`, response.data);
        
        // Record successful API call
        recordApiSuccess();
        
        // Update local membership cache to reflect new status
        try {
          const localCacheKey = `membership_${cleanSlug}`;
          localStorageCache.setWithExpiry(localCacheKey, {
            is_member: true,
            status: 'approved',
            role: 'member'
          }, 60 * 5); // 5 minute expiry
        } catch (cacheError) {
          console.warn("Failed to update membership cache:", cacheError);
        }
        
        // Clear community cache to force reload of data with new membership status
        memoryCache.clear(`community_${cleanSlug}`);
        memoryCache.clear('communities');
        localStorageCache.remove(`community_${cleanSlug}`);
        
        return response.data;
      } catch (err) {
        attempts++;
        console.warn(`Django join attempt ${attempts} failed for '${cleanSlug}'`, err);
        
        // Check if this is a "already a member" error - treat as success
        if (err?.response?.status === 400 && 
            err?.response?.data?.detail && 
            (err.response.data.detail.includes("already a member") || 
             err.response.data.detail.includes("already joined"))) {
          console.log("User is already a member - treating as success");
          
          // Update local membership cache to reflect membership status
          try {
            const localCacheKey = `membership_${cleanSlug}`;
            localStorageCache.setWithExpiry(localCacheKey, {
              is_member: true,
              status: 'approved',
              role: 'member'
            }, 60 * 5); // 5 minute expiry
          } catch (cacheError) {
            console.warn("Failed to update membership cache:", cacheError);
          }
          
          // Return a success response
          return {
            detail: "You are already a member of this community.",
            success: true
          };
        }
        
        // Record the API error
        recordApiError(err);
        
        // Check if it's a condition where a retry would help
        if (
          attempts < MAX_RETRIES && 
          (!err.response || // Network error
           err.response.status >= 500 || // Server error
           err.code === 'ECONNABORTED') // Timeout
        ) {
          // Wait a bit before retrying (exponential backoff)
          const delay = 1000 * Math.pow(2, attempts - 1);
          console.log(`Waiting ${delay}ms before retry to Django...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If we reach here, the error isn't retryable or we've exhausted attempts
        // Fall through to try mock services if appropriate
        break;
      }
    }
    
    // Only as an absolute last resort, use mock services
    if (shouldUseMockServices()) {
      console.warn(`Django backend unreachable after ${MAX_RETRIES} retries - using mock join`);
      try {
        const mockResponse = mockJoinCommunity(cleanSlug);
        return mockResponse;
      } catch (mockError) {
        console.error("Even mock join failed:", mockError);
      }
    }
    
    // If we reach here, both Django and mock failed
    throw new Error(`Failed to join community after ${attempts} attempts to Django backend`);
  }

  /**
   * Leave a community (always prioritizes Django backend)
   */
  async leaveCommunity(slug: string): Promise<ApiSuccessResponse> {
    // Ensure the slug is valid
    if (!slug) {
      throw new Error("Community slug is required to leave a community");
    }
    
    // Clean the slug first
    const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '');
    
    // Maximum retries for Django
    const MAX_RETRIES = 3;
    let attempts = 0;
    
    // Always try Django backend first with multiple retries
    console.log(`Attempting to leave community via Django API: '${cleanSlug}'`);
    
    while (attempts < MAX_RETRIES) {
      try {
        // Create a direct URL with the absolute path to backend
        const fullUrl = `${API_URL}/api/communities/${cleanSlug}/leave/`;
        console.log(`Making leave request to: ${fullUrl}`);
        
        // Backend uses POST for leave (with trailing slash)
        const response = await axios.post<ApiSuccessResponse>(
          fullUrl,
          // Add empty data and timeout for reliability
          {},
          { 
            timeout: 10000,
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              'X-Request-Type': 'leave-community',
              'X-Community-Slug': cleanSlug,
              'Authorization': `Bearer ${getCookie('accessToken')}`
            }
          }
        );
        
        // Django request succeeded!
        console.log(`Successfully left community via Django: '${cleanSlug}'`, response.data);
        
        // Record successful API call
        recordApiSuccess();
        
        // Update local membership cache to reflect new status
        try {
          const localCacheKey = `membership_${cleanSlug}`;
          localStorageCache.setWithExpiry(localCacheKey, {
            is_member: false,
            status: null,
            role: null
          }, 60 * 5); // 5 minute expiry
        } catch (cacheError) {
          console.warn("Failed to update membership cache:", cacheError);
        }
        
        // Clear community cache to force reload of data with new membership status
        memoryCache.clear(`community_${cleanSlug}`);
        memoryCache.clear('communities');
        localStorageCache.remove(`community_${cleanSlug}`);
        
        return response.data;
      } catch (err) {
        attempts++;
        console.warn(`Django leave attempt ${attempts} failed for '${cleanSlug}'`, err);
        
        // Check if this is a "not a member" error - treat as success
        if (err?.response?.status === 400 && 
            err?.response?.data?.detail && 
            (err.response.data.detail.includes("not a member") || 
             err.response.data.detail.includes("You are not a member"))) {
          console.log("User is not a member - treating as success");
          
          // Update local membership cache to reflect non-membership status
          try {
            const localCacheKey = `membership_${cleanSlug}`;
            localStorageCache.setWithExpiry(localCacheKey, {
              is_member: false,
              status: null,
              role: null
            }, 60 * 5); // 5 minute expiry
          } catch (cacheError) {
            console.warn("Failed to update membership cache:", cacheError);
          }
          
          // Return a success response
          return {
            detail: "You are not a member of this community.",
            success: true
          };
        }
        
        // Record the API error
        recordApiError(err);
        
        // Check if it's a condition where a retry would help
        if (
          attempts < MAX_RETRIES && 
          (!err.response || // Network error
           err.response.status >= 500 || // Server error
           err.code === 'ECONNABORTED') // Timeout
        ) {
          // Wait a bit before retrying (exponential backoff)
          const delay = 1000 * Math.pow(2, attempts - 1);
          console.log(`Waiting ${delay}ms before retry to Django...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If we reach here, the error isn't retryable or we've exhausted attempts
        // Fall through to try mock services if appropriate
        break;
      }
    }
    
    // Only as an absolute last resort, use mock services
    if (shouldUseMockServices()) {
      console.warn(`Django backend unreachable after ${MAX_RETRIES} retries - using mock leave`);
      try {
        const mockResponse = mockLeaveCommunity(cleanSlug);
        return mockResponse;
      } catch (mockError) {
        console.error("Even mock leave failed:", mockError);
      }
    }
    
    // If we reach here, both Django and mock failed
    throw new Error(`Failed to leave community after ${attempts} attempts to Django backend`);
  }

  /**
   * Update a member's role in a community
   * @param slug Community slug
   * @param userId User ID to update
   * @param newRole New role to assign (admin, moderator, member)
   */
  async updateMemberRole(slug: string, userId: number, newRole: string): Promise<ApiSuccessResponse> {
    // Ensure the slug is valid
    if (!slug) {
      throw new Error("Community slug is required to update member role");
    }
    
    // Clean the slug first
    const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '');
    
    // Maximum retries for Django
    const MAX_RETRIES = 2;
    let attempts = 0;
    
    console.log(`Attempting to update role for user ${userId} to ${newRole} in community: '${cleanSlug}'`);
    
    while (attempts < MAX_RETRIES) {
      try {
        // Create a direct URL with the absolute path to backend
        const fullUrl = `${API_URL}/api/communities/${cleanSlug}/update_member_role/`;
        console.log(`Making update role request to: ${fullUrl}`);
        
        // Backend uses PUT for role updates
        const response = await axios.put<ApiSuccessResponse>(
          fullUrl,
          {
            user_id: userId,
            role: newRole
          },
          { 
            timeout: 10000,
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              'X-Request-Type': 'update-member-role',
              'X-Community-Slug': cleanSlug,
              'Authorization': `Bearer ${getCookie('accessToken')}`
            }
          }
        );
        
        // Request succeeded!
        console.log(`Successfully updated role to ${newRole}`, response.data);
        
        // Clear community caches to force reload of data with new roles
        memoryCache.clear(`community_${cleanSlug}`);
        memoryCache.clear('communities');
        localStorageCache.remove(`community_${cleanSlug}`);
        
        return response.data;
      } catch (err) {
        attempts++;
        console.warn(`Update role attempt ${attempts} failed for '${cleanSlug}'`, err);
        
        // Record the API error
        recordApiError(err);
        
        // Check if it's a condition where a retry would help
        if (
          attempts < MAX_RETRIES && 
          (!err.response || // Network error
           err.response.status >= 500 || // Server error
           err.code === 'ECONNABORTED') // Timeout
        ) {
          // Wait a bit before retrying (exponential backoff)
          const delay = 1000 * Math.pow(2, attempts - 1);
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If we reach here, the error isn't retryable or we've exhausted attempts
        throw err;
      }
    }
    
    // This should never be reached due to the throw in the catch block
    throw new Error(`Failed to update member role after ${attempts} attempts`);
  }

  /**
   * Update a community
   * @param slug Community slug
   * @param data Form data with updated community information
   */
  async updateCommunity(slug: string, data: FormData): Promise<Community> {
    try {
      console.log(`[updateCommunity] Updating community with slug: ${slug}`);
      
      // Log form data for debugging
      for (const pair of data.entries()) {
        if (pair[1] instanceof File) {
          console.log(`[updateCommunity] ${pair[0]}: [File: ${pair[1].name}, size: ${pair[1].size} bytes]`);
        } else {
          console.log(`[updateCommunity] ${pair[0]}: ${pair[1]}`);
        }
      }
      
      // Clear caches BEFORE making request
      memoryCache.clear('communities');
      memoryCache.clear(`community_${slug}`);
      try {
        localStorageCache.clear(`community_${slug}`);
      } catch (cacheError) {
        console.warn("[updateCommunity] Cache clear error:", cacheError);
      }
      
      // Ensure we're using localhost URL for client-side requests (avoiding Docker container name)
      const apiUrl = 'http://localhost:8000';
      
      // Clean the slug
      const cleanSlug = slug.replace(/^\/+|\/+$/g, '');
      
      // Fixed full URL - avoid using API_URL which may contain backend:8000
      const fullUrl = `${apiUrl}/api/communities/${cleanSlug}/`;
      console.log(`[updateCommunity] Making fetch request to: ${fullUrl}`);
      
      // Simple direct fetch to avoid any issues with middlewares or interceptors
      const response = await fetch(fullUrl, {
        method: 'PUT',
        body: data,
        credentials: 'include' // Include cookies
      });
      
      console.log(`[updateCommunity] Response status: ${response.status} ${response.statusText}`);
      
      // Handle non-OK responses
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorDetail = 'Unknown error occurred';
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('[updateCommunity] Error response data:', errorData);
          errorDetail = errorData.detail || JSON.stringify(errorData);
        } else {
          errorDetail = await response.text();
          console.error('[updateCommunity] Error response text:', errorDetail);
        }
        
        throw new Error(`Server error (${response.status}): ${errorDetail}`);
      }
      
      // Parse success response
      const responseData = await response.json();
      console.log('[updateCommunity] Success:', responseData);
      
      return responseData;
    } catch (error) {
      console.error("[updateCommunity] Error details:", error);
      
      // Let the calling code handle the error
      throw error;
    }
  }

  /**
   * Get pending join requests for a community
   * @param slug Community slug
   * @returns Paginated response of pending member requests
   */
  async getPendingRequests(slug: string): Promise<PaginatedResponse<CommunityMember>> {
    // Ensure the slug is valid
    if (!slug) {
      throw new Error('Community slug is required');
    }
    
    // Clean the slug
    const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '');
    
    try {
      console.log(`Fetching pending requests for community: ${cleanSlug}`);
      
      // Get auth token from cookie
      const token = getCookie('accessToken');
      
      // Set up headers with auth token explicitly
      const headers: Record<string, string> = {
        'X-Request-Type': 'pending-requests',
        'X-Community-Slug': cleanSlug
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Use the standard API endpoint (trailing slash is important)
      const response = await api.get<PaginatedResponse<CommunityMember>>(
        `/api/communities/${cleanSlug}/pending_requests/`,
        { 
          timeout: 8000,
          headers
        }
      );
      
      console.log(`Successfully fetched ${response.data.results?.length || 0} pending requests from ${response.data.count} total`);
      
      return response.data;
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      
      // Use error handler with fallback empty response
      return handleApiError<PaginatedResponse<CommunityMember>>(
        error, 
        `pending requests for community "${slug}"`, 
        {
          fallbackValue: { 
            count: 0, 
            next: null, 
            previous: null, 
            results: [] 
          },
          rethrow: false
        }
      );
    }
  }

  /**
   * Approve a membership request
   * @param slug Community slug
   * @param userId User ID to approve
   * @returns Success response
   */
  async approveMemberRequest(slug: string, userId: number): Promise<ApiSuccessResponse> {
    // Ensure the slug is valid
    if (!slug) {
      throw new Error("Community slug is required to approve member request");
    }
    
    // Clean the slug first
    const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '');
    
    try {
      // Create a direct URL with the absolute path to backend
      const fullUrl = `${API_URL}/api/communities/${cleanSlug}/approve_request/`;
      console.log(`Making approve request to: ${fullUrl}`);
      
      // Backend uses POST for request approval
      const response = await axios.post<ApiSuccessResponse>(
        fullUrl,
        {
          user_id: userId
        },
        { 
          timeout: 10000,
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Type': 'approve-request',
            'X-Community-Slug': cleanSlug,
            'Authorization': `Bearer ${getCookie('accessToken')}`
          }
        }
      );
      
      // Request succeeded!
      console.log(`Successfully approved request for user ${userId}`, response.data);
      
      // Clear community caches to force reload of data
      memoryCache.clear(`community_${cleanSlug}`);
      memoryCache.clear('communities');
      localStorageCache.remove(`community_${cleanSlug}`);
      
      return response.data;
    } catch (error) {
      console.error("Error approving member request:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to approve member request."
      );
    }
  }

  /**
   * Reject a membership request
   * @param slug Community slug
   * @param userId User ID to reject
   * @returns Success response
   */
  async rejectMemberRequest(slug: string, userId: number): Promise<ApiSuccessResponse> {
    // Ensure the slug is valid
    if (!slug) {
      throw new Error("Community slug is required to reject member request");
    }
    
    // Clean the slug first
    const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '');
    
    try {
      // Create a direct URL with the absolute path to backend
      const fullUrl = `${API_URL}/api/communities/${cleanSlug}/reject_request/`;
      console.log(`Making reject request to: ${fullUrl}`);
      
      // Backend uses POST for request rejection
      const response = await axios.post<ApiSuccessResponse>(
        fullUrl,
        {
          user_id: userId
        },
        { 
          timeout: 10000,
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Type': 'reject-request',
            'X-Community-Slug': cleanSlug,
            'Authorization': `Bearer ${getCookie('accessToken')}`
          }
        }
      );
      
      // Request succeeded!
      console.log(`Successfully rejected request for user ${userId}`, response.data);
      
      // Clear community caches to force reload of data
      memoryCache.clear(`community_${cleanSlug}`);
      memoryCache.clear('communities');
      localStorageCache.remove(`community_${cleanSlug}`);
      
      return response.data;
    } catch (error) {
      console.error("Error rejecting member request:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to reject member request."
      );
    }
  }
}

// Export singleton instance
export const communityApi = new CommunityAPI();
export default communityApi;