// AuthContext.tsx
"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

import {
  fetchNotifications,
  markSingleNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount,
} from "@/services/notificationService";

import axios from "axios";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

// Types
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  date_of_birth?: string;
  academic_year?: number;
}

// Update the Notification interface in AuthContext.tsx
interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  };
  content_object?: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  notifications: Notification[];
  notificationsLoading: boolean;
  notificationsError: Error | null;
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
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (id: number) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider props
interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to get cookie value
const getCookie = (name: string): string | undefined => {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return undefined;
};

// API client
const api = axios.create({
  baseURL: "/api",
});

// Setup interceptors
api.interceptors.request.use(
  (config) => {
    const accessToken = getCookie("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
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
        if (!refreshToken) throw new Error("No refresh token");

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<Error | null>(null);
  const router = useRouter();

  // Notification functions
  const refreshNotifications = useCallback(async (): Promise<void> => {
    try {
      setNotificationsLoading(true);
      setNotificationsError(null);
      
      const notifications = await fetchNotifications();
      setNotifications(notifications);
    } catch (error) {
      console.error('Notification refresh error:', error);
      setNotificationsError(error as Error);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  const markNotificationAsRead = useCallback(async (id: number): Promise<void> => {
    try {
      await markSingleNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async (): Promise<void> => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }, []);

  // Auth functions
  const login = useCallback(async (
    email: string,
    password: string,
    rememberMe?: boolean
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await api.post("/login", { email, password });
      const { access, refresh, user: userData } = response.data;

      // Set tokens in cookies with appropriate expiration
      const cookieOptions = rememberMe
        ? "; path=/; SameSite=Strict; max-age=2592000" // 30 days
        : "; path=/; SameSite=Strict";

      document.cookie = `accessToken=${access}${cookieOptions}`;
      document.cookie = `refreshToken=${refresh}${cookieOptions}`;

      // Set user data
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      // Update API headers
      api.defaults.headers.common.Authorization = `Bearer ${access}`;

      // Redirect with a slight delay to ensure everything is set
      console.log("Login successful, redirecting to dashboard...");
      setTimeout(() => {
        window.location.replace("/dashboard");
      }, 100);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    // Remove tokens from cookies
    document.cookie =
      "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem("user");

    setUser(null);
    delete api.defaults.headers.common.Authorization;

    router.push("/login");
  }, [router]);

  const signup = useCallback(async (
    email: string,
    username: string,
    firstName: string,
    lastName: string,
    password: string,
    password2: string,
    dateOfBirth?: string,
    academicYear?: number
  ): Promise<string> => {
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

  const verifyOtp = useCallback(async (email: string, otp: string): Promise<void> => {
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
      }

      // Force a direct page reload
      console.log("Redirecting to dashboard...");
      setTimeout(() => {
        window.location.replace("/dashboard");
      }, 500);
    } catch (error: any) {
      console.error("OTP verification error:", error);
      console.error("Error response:", error.response?.data);
      // Clear any partial state
      document.cookie =
        "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie =
        "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      localStorage.removeItem("user");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check auth on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = getCookie("accessToken");
      const userJSON = localStorage.getItem("user");

      if (accessToken && userJSON) {
        try {
          // Verify token is valid (not expired)
          const decodedToken: any = jwtDecode(accessToken);
          const currentTime = Date.now() / 1000;

          if (decodedToken.exp < currentTime) {
            throw new Error("Token expired");
          }

          // Set user from local storage
          const userData = JSON.parse(userJSON);
          setUser(userData);
          api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        } catch (error) {
          console.error("Auth check error:", error);
          document.cookie =
            "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie =
            "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          localStorage.removeItem("user");
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Add notification polling when authenticated
  useEffect(() => {
    if (!isLoading && user) {
      const pollNotifications = async () => {
        await refreshNotifications();
        // You could also fetch unread count separately if needed
      };
      
      pollNotifications();
      const interval = setInterval(pollNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoading, user, refreshNotifications]);

  // Context value
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    notifications,
    notificationsLoading,
    notificationsError,
    login,
    logout,
    signup,
    verifyOtp,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  };

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

// Helper function to get the current auth token
export const getAuthToken = (): string | null => {
  const token = getCookie("accessToken");
  return token || null;
};