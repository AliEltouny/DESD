import api from '../apiClient';
import { handleApiError } from '../errorHandling';
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
      const response = await api.get('/users/me');
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
      const response = await api.get(`/users/${username}/profile`);
      return response.data;
    } catch (error) {
      return handleApiError(error, "fetching user profile", {
        rethrow: true,
        defaultMessage: `Failed to fetch profile for ${username}.`
      });
    }
  }

  /**
   * Update the current user's profile
   */
  async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await api.patch('/users/me/profile', profileData);
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
      const response = await api.get('/users', {
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
      const response = await api.get('/users/search', {
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
}

// Export singleton instance
export const userApi = new UserAPI(); 