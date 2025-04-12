"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
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

// API client
const api = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true,
});


// Setup interceptors to refresh token on 401
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
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated on initial load
    const checkAuth = async () => {
      const accessToken = getCookie("accessToken");
      const userJSON = localStorage.getItem("user");

      console.log("Initial auth check - token present:", !!accessToken);
      console.log("Initial auth check - user data present:", !!userJSON);

      if (accessToken && userJSON) {
        try {
          // Verify token is valid (not expired)
          const decodedToken: any = jwtDecode(accessToken);
          const currentTime = Date.now() / 1000;

          console.log(
            "Token expiration:",
            new Date(decodedToken.exp * 1000).toISOString()
          );
          console.log("Current time:", new Date().toISOString());

          if (decodedToken.exp < currentTime) {
            console.log("Token expired");
            throw new Error("Token expired");
          }

          // Set user from local storage
          const userData = JSON.parse(userJSON);
          setUser(userData);
          console.log("User set from localStorage:", userData);
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

  const login = async (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => {
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
  };

  const logout = () => {
    // Remove tokens from cookies
    document.cookie =
      "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem("user");

    setUser(null);
    delete api.defaults.headers.common.Authorization;

    router.push("/login");
  };

  const signup = async (
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
  };

  const verifyOtp = async (email: string, otp: string) => {
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
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    signup,
    verifyOtp,
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

// Add a function to get the current auth token
export const getAuthToken = (): string | null => {
  const token = getCookie("accessToken");
  return token || null;
};
