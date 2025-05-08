import api, { API_URL } from '../apiClient';
import axios from 'axios';
import { handleApiError } from '../../utils/errorHandling';

interface AuthCredentials {
  email: string;
  password: string;
}

interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string;
}

interface TokenResponse {
  access: string;
  refresh: string;
}

/**
 * AuthAPI - Handles all authentication related API operations
 */
class AuthAPI {
  /**
   * Register a new user
   */
  async signup(data: SignupData): Promise<unknown> {
    try {
      // Convert to snake_case for Django
      const payload = {
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        username: data.username || data.email
      };
      
      const response = await api.post('/signup', payload);
      return response.data;
    } catch (error) {
      return handleApiError(error, "signing up", {
        rethrow: true,
        defaultMessage: "Failed to create account. Please try again later."
      });
    }
  }

  /**
   * Verify OTP code sent to user
   */
  async verifyOtp(email: string, otp: string): Promise<unknown> {
    try {
      const response = await api.post(`/verify-otp/${email}`, { otp });
      return response.data;
    } catch (error) {
      return handleApiError(error, "verifying OTP", {
        rethrow: true,
        defaultMessage: "Failed to verify code. Please try again."
      });
    }
  }

  /**
   * Log in a user
   */
  async login(credentials: AuthCredentials): Promise<TokenResponse> {
    try {
      const response = await api.post<TokenResponse>('/login', credentials);
      return response.data;
    } catch (error) {
      return handleApiError(error, "logging in", {
        rethrow: true,
        defaultMessage: "Login failed. Please check your credentials and try again."
      });
    }
  }

  /**
   * Refresh an access token using a refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      // Use axios directly to avoid adding the expired access token
      const response = await axios.post<TokenResponse>(
        `${API_URL}/token/refresh/`, 
        { refresh: refreshToken }
      );
      return response.data;
    } catch (error) {
      return handleApiError(error, "refreshing token", {
        rethrow: true,
        defaultMessage: "Session expired. Please login again."
      });
    }
  }

  /**
   * Log out a user (invalidate tokens on server)
   */
  async logout(): Promise<void> {
    try {
      await api.post('/logout');
    } catch (error) {
      // Just log the error but don't rethrow
      console.error("Logout error:", error);
    }
  }
}

// Export singleton instance
export const authApi = new AuthAPI();
export default authApi; 