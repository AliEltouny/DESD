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
  CommunityDetail
} from '@/types/api';
import { handleApiError, processApiResponse } from '../errorHandling';
import { memoryCache, localStorageCache } from '../cacheManager';

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

      const response = await api.get<Community[]>('/communities/', {
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
      
      const response = await api.get<CommunityDetail>(`/communities/${cleanSlug}`);
      
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
      const response = await api.post('/communities/', formData, {
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
  async getPosts(communitySlug: string, filters?: PostFilters): Promise<Post[]> {
    try {
      const response = await api.get<Post[]>(
        `/communities/${communitySlug}/posts/`,
        { params: filters }
      );
      
      return processApiResponse<Post>(response.data, 'posts');
    } catch (error) {
      return handleApiError<Post[]>(error, `posts for community "${communitySlug}"`, {
        fallbackValue: [],
        rethrow: false
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
        `/communities/${communitySlug}/posts/${postId}/comments/`,
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
  async getCommunityMembers(slug: string, role?: string): Promise<Membership[]> {
    const params = role ? { role } : undefined;
    try {
      const response = await api.get<Membership[]>(
        `/communities/${slug}/members/`,
        { params }
      );
      
      return processApiResponse<Membership>(response.data, 'members');
    } catch (error) {
      return handleApiError<Membership[]>(error, `members for community "${slug}"`, {
        fallbackValue: [],
        rethrow: false
      });
    }
  }

  /**
   * Get analytics for a community
   */
  async getCommunityAnalytics(communitySlug: string): Promise<unknown> {
    // Default analytics structure to return on errors or missing data
    const defaultAnalytics = {
      member_growth: { daily: [], monthly: [] },
      post_activity: { daily: [], monthly: [] },
      engagement_stats: {
        total_members: 0,
        total_posts: 0,
        total_comments: 0,
        total_upvotes: 0,
        posts_per_member: 0,
        comments_per_post: 0,
        upvotes_per_post: 0
      },
      top_contributors: []
    };

    // Define cacheKey here so it's accessible in the outer catch block
    const cacheKey = `analytics_${communitySlug}`;

    try {
      // First check if the analytics data is cached in memory
      if (memoryCache.isValid(cacheKey)) {
        console.log("Using cached analytics data for", communitySlug);
        return memoryCache.get(cacheKey) || defaultAnalytics;
      }
      
      // Instead of making the direct API call which might cause console errors,
      // make a custom fetch using regular fetch API to bypass Axios interceptors
      try {
        // Build the URL manually
        const baseUrl = typeof window !== 'undefined' ? '/api' : API_URL;
        const url = `${baseUrl}/communities/${communitySlug}/analytics/`;
        
        // Get the required auth headers
        const token = document.cookie
          .split(';')
          .find(c => c.trim().startsWith('accessToken='))
          ?.split('=')[1];
        
        // Make the fetch call with quiet error handling
        const response = await fetch(url, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          // For 404s, silently return default data
          if (response.status === 404) {
            console.info(`Analytics not available yet for ${communitySlug}`);
            memoryCache.set(cacheKey, defaultAnalytics, 60); // Cache for 1 minute
            return defaultAnalytics;
          }
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Cache the successful result
        memoryCache.set(cacheKey, data, 300); // Cache for 5 minutes
        
        // Return results or full data as appropriate
        if (data && typeof data === 'object') {
          if ('results' in data && data.results) {
            return data.results;
          }
          return data;
        }
        
        return defaultAnalytics;
      } catch (error) {
        // Log info but not as an error
        console.info(`Analytics not available for ${communitySlug}:`, error instanceof Error ? error.message : "Unknown error");
        memoryCache.set(cacheKey, defaultAnalytics, 60); // Cache for 1 minute
        return defaultAnalytics;
      }
    } catch /* (error) */ {
      // Handle any other unexpected errors
      console.info(`Analytics unavailable for ${communitySlug}`);
      memoryCache.set(cacheKey, defaultAnalytics, 60); // Cache for 1 minute
      return defaultAnalytics;
    }
  }
}

// Export a singleton instance
export const communityApi = new CommunityAPI();
export default communityApi;
