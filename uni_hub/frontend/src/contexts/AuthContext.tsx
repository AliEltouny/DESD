"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { User } from '@/types/user'; // Import User type

// Types
// interface User { ... }

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<void>;
  logout: () => void;
  signup: (
    email: string,
    username: string,
    firstName: string,
    lastName: string,
    password: string,
    password2: string,
    dateOfBirth?: string,
    academicYear?: number
  ) => Promise<string>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider props
interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to get cookie value
const getCookie = (name: string): string | undefined => {
  if (typeof document === "undefined") return undefined; // Handle SSR

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return undefined;
};

// Helper function to set cookie with expiration
const setCookie = (name: string, value: string, days?: number) => {
  let expires = "";
  
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; expires=${date.toUTCString()}`;
  }
  
  document.cookie = `${name}=${value}${expires}; path=/; SameSite=Strict`;
};

// Helper function to delete cookie
const deleteCookie = (name: string) => {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
};

// API client
const api = axios.create({
  baseURL: "/api",
});

// Setup interceptors to refresh token on 401
api.interceptors.request.use(
  (config) => {
    // Get the access token from cookie
    const cookies = document.cookie.split(';');
    const accessTokenCookie = cookies.find(c => c.trim().startsWith('accessToken='));
    const token = accessTokenCookie ? accessTokenCookie.split('=')[1].trim() : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Request interceptor: Added auth token to request');
    } else {
      console.log('Request interceptor: No token found in cookies');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = getCookie("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const response = await axios.post("/api/token/refresh/", {
          refresh: refreshToken,
        });

        const { access } = response.data;
        document.cookie = `accessToken=${access}; path=/; SameSite=Strict`;

        api.defaults.headers.common.Authorization = `Bearer ${access}`;
        originalRequest.headers.Authorization = `Bearer ${access}`;

        return api(originalRequest);
      } catch (refreshError) {
        document.cookie =
          "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie =
          "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Auth Provider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Function to clear all auth data (memoized)
  const clearAuthData = useCallback(() => {
    deleteCookie("accessToken");
    deleteCookie("refreshToken");
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    delete api.defaults.headers.common.Authorization;
  }, []);

  // Function to handle token refresh (memoized)
  const refreshAuthToken = useCallback(async (): Promise<string | null> => {
    try {
      const refreshToken = getCookie("refreshToken");
      
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }
      
      const response = await axios.post("/api/token/refresh/", {
        refresh: refreshToken,
      });
      
      const { access } = response.data;
      
      // Store the new access token
      const rememberMe = localStorage.getItem("user") !== null;
      const expDays = rememberMe ? 30 : undefined; // 30 days if remember me is enabled
      setCookie("accessToken", access, expDays);
      
      // Update API headers
      api.defaults.headers.common.Authorization = `Bearer ${access}`;
      
      console.log("Token refreshed successfully");
      return access;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      // Clear auth data on refresh failure
      clearAuthData();
      return null;
    }
  }, [clearAuthData]);
  
  // Helper function to fetch user profile and set state (memoized)
  const fetchAndSetUserProfile = useCallback(async (rememberMe: boolean) => {
    try {
      console.log("Fetching user profile...");
      const profileResponse = await api.get("/profile");
      const userData = profileResponse.data;
      
      if (rememberMe) {
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        sessionStorage.setItem("user", JSON.stringify(userData));
      }
      
      setUser(userData);
      return userData;
    } catch (profileError) {
      console.error("Failed to fetch profile:", profileError);
      throw new Error("Failed to get user data");
    }
  }, []);

  // Check if user is authenticated on initial load (memoized)
  const checkAuth = useCallback(async () => {
    try {
      const accessToken = getCookie("accessToken");
      const userJSONFromLocal = localStorage.getItem("user");
      const userJSONFromSession = sessionStorage.getItem("user");
      const userJSON = userJSONFromLocal || userJSONFromSession;

      console.log("Initial auth check - token present:", !!accessToken);
      console.log("Initial auth check - user data present:", !!userJSON);
      console.log("Initial auth check - remember me enabled:", !!userJSONFromLocal);

      if (accessToken) {
        try {
          // Verify token is valid (not expired)
          const decodedToken: { exp: number; [key: string]: unknown } = jwtDecode(accessToken);
          const currentTime = Date.now() / 1000;

          console.log(
            "Token expiration:",
            new Date(decodedToken.exp * 1000).toISOString()
          );
          console.log("Current time:", new Date().toISOString());

          if (decodedToken.exp < currentTime) {
            console.log("Token expired, attempting refresh");
            // Token expired, try refreshing
            const newToken = await refreshAuthToken();
            
            if (!newToken) {
              throw new Error("Failed to refresh expired token");
            }
            
            // Successfully refreshed token
            if (userJSON) {
              const userData = JSON.parse(userJSON);
              setUser(userData);
              console.log("User restored after token refresh");
            } else {
              await fetchAndSetUserProfile(userJSONFromLocal !== null);
            }
          } else if (userJSON) {
            // Token is valid, set user from storage
            const userData = JSON.parse(userJSON);
            setUser(userData);
            console.log("User set from storage:", userData);
            api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          } else {
            // Token valid but no user data, fetch profile
            await fetchAndSetUserProfile(userJSONFromLocal !== null);
          }
        } catch (error) {
          console.error("Auth check error:", error);
          // Clear invalid auth data
          clearAuthData();
        }
      } else if (userJSON) {
        // We have user data but no token - try to refresh token
        console.log("User data found but no token, attempting refresh");
        const refreshToken = getCookie("refreshToken");
        
        if (refreshToken) {
          try {
            const newToken = await refreshAuthToken();
            
            if (newToken) {
              const userData = JSON.parse(userJSON);
              setUser(userData);
              console.log("Session restored via refresh token");
            } else {
              throw new Error("Failed to refresh token");
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            clearAuthData();
          }
        } else {
          // No refresh token, clear the orphaned user data
          console.log("No refresh token available, clearing user data");
          clearAuthData();
        }
      }
    } catch (error) {
      console.error("Fatal auth check error:", error);
      // Clear all auth data on fatal error
      clearAuthData();
    } finally {
      // Always finish initialization, even if there's an error
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [refreshAuthToken, clearAuthData, fetchAndSetUserProfile]);

  useEffect(() => {
    // Add a shorter timeout (2 seconds is reasonable) to ensure initialization 
    // completes even if there are network issues
    const initTimeout = setTimeout(() => {
      if (!isInitialized) {
        console.warn("Auth initialization timed out, completing anyway");
        setIsLoading(false);
        setIsInitialized(true);
      }
    }, 2000);

    checkAuth();
    
    // Clean up timeout on unmount
    return () => {
      clearTimeout(initTimeout);
    };
    // Run when checkAuth changes or isInitialized changes
  }, [checkAuth, isInitialized]);
  
  // Setup token refresh interval in a separate effect that runs after initialization
  useEffect(() => {
    // Only setup refresh interval when initialized and authenticated
    if (!isInitialized || !user) return;
    
    console.log("Setting up token refresh interval");
    const tokenRefreshInterval = setInterval(async () => {
      const accessToken = getCookie("accessToken");
      if (accessToken) {
        try {
          const decodedToken: { exp: number; [key: string]: unknown } = jwtDecode(accessToken);
          const currentTime = Date.now() / 1000;
          
          // Refresh token when it's 5 minutes from expiring
          if (decodedToken.exp - currentTime < 300) {
            console.log("Token expiring soon, refreshing");
            await refreshAuthToken();
          }
        } catch (error) {
          console.error("Error in token refresh interval:", error);
        }
      }
    }, 60000); // Check every minute
    
    return () => {
      clearInterval(tokenRefreshInterval);
    };
  }, [isInitialized, user, refreshAuthToken]);

  // Login function (memoized)
  const login = useCallback(async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ) => {
    setIsLoading(true);
    try {
      // Clear previous auth data
      clearAuthData();

      const response = await axios.post("/api/login/", {
        email,
        password,
      });
      
      const { access, refresh } = response.data;

      // Set tokens
      const expDays = rememberMe ? 30 : undefined; // 30 days if remember me
      setCookie("accessToken", access, expDays);
      setCookie("refreshToken", refresh, expDays);
      
      // Fetch and set user profile
      api.defaults.headers.common.Authorization = `Bearer ${access}`;
      await fetchAndSetUserProfile(rememberMe);

      // Redirect to dashboard or intended page
      const callbackUrl = sessionStorage.getItem('loginRedirect') || "/dashboard";
      sessionStorage.removeItem('loginRedirect');
      router.push(callbackUrl);
    } catch (error: unknown) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthData, fetchAndSetUserProfile, router]);

  // Logout function (memoized)
  const logout = useCallback(() => {
    // Clear all auth data
    clearAuthData();
    setUser(null);
    router.push("/login");
  }, [clearAuthData, router]);

  // Signup function (memoized)
  const signup = useCallback(async (
    email: string,
    username: string,
    firstName: string,
    lastName: string,
    password: string,
    password2: string,
    dateOfBirth?: string,
    academicYear?: number
  ) => {
    setIsLoading(true);
    try {
      const response = await api.post("/signup", {
        email,
        username,
        first_name: firstName,
        last_name: lastName,
        password,
        password2,
        date_of_birth: dateOfBirth,
        academic_year: academicYear,
      });

      setIsLoading(false);
      return response.data.email;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  // Verify OTP function (memoized)
  const verifyOtp = useCallback(async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      console.log("Verifying OTP for email:", email);
      const response = await api.post(`/verify-otp/${email}`, { otp });
      console.log("OTP verification response:", response.data);

      const { access, refresh } = response.data;

      // Set tokens in cookies with proper attributes
      document.cookie = `accessToken=${access}; path=/; SameSite=Strict`;
      document.cookie = `refreshToken=${refresh}; path=/; SameSite=Strict`;
      console.log("Tokens set in cookies");

      // Update API headers
      api.defaults.headers.common.Authorization = `Bearer ${access}`;
      console.log("API headers updated");

      // After OTP verification, fetch user profile
      console.log("Fetching user profile...");
      try {
        const profileResponse = await api.get("/profile");
        console.log("Profile response:", profileResponse.data);

        const userData = profileResponse.data;

        // Set user data
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        console.log("User data set");
      } catch (profileError) {
        console.error("Error fetching profile:", profileError);
        // Continue even if profile fetch fails
      }

      // Force a direct page reload
      console.log("Redirecting to dashboard...");
      // For debugging, add a small delay to make sure logs appear
      setTimeout(() => {
        window.location.replace("/dashboard");
      }, 500);
    } catch (err: unknown) {
      console.error("OTP verification error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoized context value
  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    signup,
    verifyOtp,
  }), [user, isLoading, login, logout, signup, verifyOtp]);

  // Only render children when authentication is initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;

// Add a function to get the current auth token
export const getAuthToken = (): string | null => {
  const token = getCookie("accessToken");
  return token || null;
};
