import api from '../apiClient';
import { handleApiError } from '../../utils/errorHandling';
import { PaginatedResponse } from '@/types/api';
import { User, UserProfile } from '@/types/user';

/**
 * UserAPI - Handles user-related API operations
 */
class UserAPI {
  /**
   * Get the profile of the currently logged in user
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/api/profile/');
      return response.data;
    } catch (error) {
      return handleApiError(error, "fetching current user", {
        rethrow: true,
        defaultMessage: "Failed to fetch user profile."
      });
    }
  }

  /**
   * Get a user profile by username
   */
  async getUserProfile(username: string): Promise<UserProfile> {
    try {
      // First try to get the profile by username endpoint
      const response = await api.get(`/api/users/profile/${username}/`);
      return response.data;
    } catch (error) {
      // Log the error but don't throw yet - we'll try a fallback approach
      console.warn(`Error fetching profile by username endpoint: ${error}`);
      
      try {
        // Fallback: search for user by username
        const searchResults = await this.searchUsersByQuery(username);
        const userProfile = searchResults.find(user => user.username === username);
        
        if (!userProfile) {
          throw new Error(`User profile not found for ${username}`);
        }
        
        // Get detailed profile by user ID
        const detailedResponse = await api.get(`/api/users/${userProfile.id}/`);
        return detailedResponse.data;
      } catch (fallbackError) {
        return handleApiError(fallbackError, "fetching user profile", {
          rethrow: true,
          defaultMessage: `Failed to fetch profile for ${username}.`
        });
      }
    }
  }

  /**
   * Update the current user's profile
   */
  async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await api.patch('/api/profile/', profileData);
      return response.data;
    } catch (error) {
      return handleApiError(error, "updating profile", {
        rethrow: true,
        defaultMessage: "Failed to update your profile."
      });
    }
  }

  /**
   * Update the current user's profile with FormData (for file uploads)
   */
  async updateProfileWithFormData(formData: FormData): Promise<UserProfile> {
    try {
      const response = await api.patch('/api/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, "updating profile", {
        rethrow: true,
        defaultMessage: "Failed to update your profile."
      });
    }
  }

  /**
   * Get a list of all users (paginated)
   */
  async getUsers(page = 1, pageSize = 10): Promise<PaginatedResponse<User>> {
    try {
      const response = await api.get('/api/users', {
        params: { page, page_size: pageSize }
      });
      return response.data as PaginatedResponse<User>;
    } catch (error) {
      return handleApiError<PaginatedResponse<User>>(error, "fetching users", {
        rethrow: true,
        defaultMessage: "Failed to load users."
      });
    }
  }

  /**
   * Search for users by name or username
   */
  async searchUsers(query: string, page = 1, pageSize = 10): Promise<PaginatedResponse<User>> {
    try {
      const response = await api.get('/api/users/search', {
        params: { query, page, page_size: pageSize }
      });
      return response.data as PaginatedResponse<User>;
    } catch (error) {
      return handleApiError<PaginatedResponse<User>>(error, "searching users", {
        rethrow: true,
        defaultMessage: "Failed to search users."
      });
    }
  }

  /**
   * Search for users by query string
   */
  async searchUsersByQuery(q: string, searchType: string = 'all'): Promise<User[]> {
    try {
      const response = await api.get('/api/users/search/', {
        params: { q, search_type: searchType }
      });
      return response.data;
    } catch (error) {
      return handleApiError<User[]>(error, "searching users", {
        rethrow: true,
        fallbackValue: [],
        defaultMessage: "Failed to search users."
      });
    }
  }
}

// Export singleton instance
export const userApi = new UserAPI();
export default userApi;