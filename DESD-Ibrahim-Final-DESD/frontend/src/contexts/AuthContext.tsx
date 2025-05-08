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
// Removed User type import - managed by UserContext now

// --- TODO: Consider moving API client setup to a dedicated services/api file ---
// This Axios instance setup could live in services/api/apiClient.ts
// and be imported here and in UserContext for consistency.
// ---------------------------------------------------------------------------

// Types
interface AuthContextType {
// Removed user state from here
  isAuthenticated: boolean;
  isLoading: boolean; // Represents initial auth check state
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
  ) => Promise<{message: string, email: string}>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  getAccessToken: () => string | null; // Expose way to get token if needed by API calls outside context
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
  
  // Ensure Secure attribute if using HTTPS (recommended)
  // const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
  const secureFlag = ''; // Add check for HTTPS if applicable
  document.cookie = `${name}=${value}${expires}; path=/; SameSite=Strict${secureFlag}`;
};

// Helper function to delete cookie
const deleteCookie = (name: string) => {
    const secureFlag = ''; // Add check for HTTPS if applicable
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict${secureFlag}`;
};

// --- API client setup (Consider moving as noted above) ---
const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true, // Adjust base URL if necessary ##n0ur was here 
});

// --- Interceptor logic remains the same, but token refresh should only update cookies and internal state, not user ---
apiClient.interceptors.request.use(
  (config) => {
    const token = getCookie("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('AuthContext Request Interceptor: Added auth token.');
    } else {
       console.log('AuthContext Request Interceptor: No token found.');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
       console.log("AuthContext Response Interceptor: 401 detected, attempting token refresh.");
      try {
        const refreshToken = getCookie("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }
        const response = await axios.post("/api/token/refresh/", { refresh: refreshToken });
        const { access } = response.data;
        
        // Determine rememberMe status based on refresh token presence/expiry (if set)
        // Or check a dedicated 'rememberMe' flag if stored elsewhere.
        const rememberMe = true; // Placeholder: Determine this reliably
        const expDays = rememberMe ? 30 : undefined; 
        
        setCookie("accessToken", access, expDays);
        console.log("AuthContext Response Interceptor: Token refreshed, setting new cookie.");

        apiClient.defaults.headers.common.Authorization = `Bearer ${access}`;
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
         console.error("AuthContext Response Interceptor: Token refresh failed.", refreshError);
        // Clear only auth-related data on refresh failure
        deleteCookie("accessToken");
        deleteCookie("refreshToken");
        delete apiClient.defaults.headers.common.Authorization;
         // Redirect to login
        if (typeof window !== 'undefined') {
            window.location.href = "/login"; 
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
// --- End API client setup ---


// Auth Provider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Removed user state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true); // For initial auth check
  const router = useRouter();

  // Function to clear auth tokens (memoized)
  const clearAuthTokens = useCallback(() => {
    deleteCookie("accessToken");
    deleteCookie("refreshToken");
    delete apiClient.defaults.headers.common.Authorization;
    setIsAuthenticated(false);
     console.log("AuthContext: Cleared auth tokens.");
  }, []);

  // Function to handle token refresh (memoized)
  const refreshAuthToken = useCallback(async (rememberMe: boolean): Promise<string | null> => {
    try {
      const refreshToken = getCookie("refreshToken");
      if (!refreshToken) throw new Error("No refresh token available");
      
      const response = await axios.post("/api/token/refresh/", { refresh: refreshToken });
      const { access } = response.data;
      
      const expDays = rememberMe ? 30 : undefined; 
      setCookie("accessToken", access, expDays);
      apiClient.defaults.headers.common.Authorization = `Bearer ${access}`;
      
      console.log("AuthContext: Token refreshed successfully via refreshAuthToken.");
      return access;
    } catch (error) {
      console.error("AuthContext: Failed to refresh token manually:", error);
      clearAuthTokens(); // Clear tokens on failure
      return null;
    }
  }, [clearAuthTokens]);
  
  // Removed fetchAndSetUserProfile helper

  // Check if user is authenticated on initial load (memoized)
  const checkAuth = useCallback(async () => {
     console.log("AuthContext: Performing initial auth check.");
     setIsLoading(true);
     try {
        const accessToken = getCookie("accessToken");
        const refreshToken = getCookie("refreshToken"); // Check refresh token too
        
        if (!accessToken) {
            // No access token, try refreshing if refresh token exists
            if (refreshToken) {
                console.log("AuthContext: No access token, attempting refresh with refresh token.");
                const rememberMe = true; // Assume rememberMe if refresh token exists (adjust if needed)
                const newAccessToken = await refreshAuthToken(rememberMe);
                if (newAccessToken) {
                    setIsAuthenticated(true);
                    console.log("AuthContext: Initial check - Refresh successful.");
                } else {
                    setIsAuthenticated(false); // Refresh failed
                    console.log("AuthContext: Initial check - Refresh failed.");
                }
            } else {
                setIsAuthenticated(false); // No tokens
                 console.log("AuthContext: Initial check - No tokens found.");
            }
        } else {
            // Access token exists, verify it
            try {
                const decodedToken: { exp: number } = jwtDecode(accessToken);
                const currentTime = Date.now() / 1000;

                if (decodedToken.exp < currentTime) {
                    console.log("AuthContext: Initial check - Access token expired, attempting refresh.");
                     const rememberMe = !!refreshToken; // Assume rememberMe if refresh token exists
                     const newAccessToken = await refreshAuthToken(rememberMe);
                     if (newAccessToken) {
                         setIsAuthenticated(true);
                         console.log("AuthContext: Initial check - Refresh successful after expired token.");
                     } else {
                         setIsAuthenticated(false); // Refresh failed
                         console.log("AuthContext: Initial check - Refresh failed after expired token.");
                     }
                } else {
                    // Token is valid
                    setIsAuthenticated(true);
                    apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`; // Ensure axios instance has token
                     console.log("AuthContext: Initial check - Valid access token found.");
                }
            } catch (decodeError) {
                 console.error("AuthContext: Initial check - Error decoding token:", decodeError);
                 clearAuthTokens(); // Invalid token, clear everything
            }
        }
     } catch (error) {
         console.error("AuthContext: Error during initial auth check:", error);
         clearAuthTokens();
     } finally {
         setIsLoading(false);
         console.log("AuthContext: Initial auth check finished.");
     }
  }, [clearAuthTokens, refreshAuthToken]);

  // Run checkAuth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login function
  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean = false) => {
       console.log(`AuthContext: Attempting login for ${email}, rememberMe: ${rememberMe}`);
      try {
        const response = await axios.post("/api/login/", { email, password });
        const { access, refresh } = response.data;

        const expDays = rememberMe ? 30 : undefined; 
        setCookie("accessToken", access, expDays);
        setCookie("refreshToken", refresh, 30); 

        apiClient.defaults.headers.common.Authorization = `Bearer ${access}`;
        setIsAuthenticated(true);
        console.log("AuthContext: Login successful.");
        
        router.push("/dashboard"); 
        
      } catch (error) {
        console.error("AuthContext: Login failed:", error);
        clearAuthTokens();
        if (axios.isAxiosError(error) && error.response?.data) {
            const detail = (error.response.data as any)?.detail;
            throw new Error(detail || "Login failed. Please check credentials.");
        }
        throw new Error("An unknown error occurred during login.");
      }
    },
    [clearAuthTokens, router] 
  );

  // Logout function
  const logout = useCallback(() => {
    console.log("AuthContext: Logging out.");
    clearAuthTokens();
    // User profile clearing is handled by UserContext reacting to isAuthenticated=false
    router.push("/login"); // Redirect to login page after logout
  }, [clearAuthTokens, router]);

  // Signup function
  const signup = useCallback(
    async (
      email: string,
      username: string,
      firstName: string,
      lastName: string,
      password: string,
      password2: string,
      dateOfBirth?: string,
      academicYear?: number
    ): Promise<{message: string, email: string}> => {
      console.log(`AuthContext: Attempting signup for ${email}`);
      try {
        await axios.post("/api/signup/", {
          email,
          username,
          first_name: firstName,
          last_name: lastName,
          password,
          password2,
          date_of_birth: dateOfBirth || null,
          academic_year: academicYear || null,
        });
        console.log("AuthContext: Signup successful, user needs verification.");
        return {message: "Signup successful! Please check your email to verify your account.", email};
        // No automatic login after signup - user needs to verify OTP first
      } catch (error) {
        console.error("AuthContext: Signup failed:", error);
        if (axios.isAxiosError(error) && error.response?.data) {
            // Construct a more informative error message
            const errors = error.response.data;
            let message = "Signup failed: ";
            if (typeof errors === 'object' && errors !== null) {
                 message += Object.entries(errors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ');
            } else {
                message += "An unknown error occurred.";
            }
             console.log("Error details:", errors);
            throw new Error(message);
        }
        throw new Error("An unknown error occurred during signup.");
      }
    },
    []
  );

  // Verify OTP function
  const verifyOtp = useCallback(async (email: string, otp: string) => {
     console.log(`AuthContext: Attempting OTP verification for ${email}`);
    try {
      // Send only the OTP in the request body, not the email (email is in the URL)
      await axios.post(`/api/verify-otp/${email}/`, { otp });
      console.log("AuthContext: OTP verification successful.");
      // Optional: Redirect to login or show success message
      // router.push("/login?verified=true");
    } catch (error) {
      console.error("AuthContext: OTP verification failed:", error);
       if (axios.isAxiosError(error) && error.response?.data) {
            const errorMessage = error.response.data.detail || 
                               error.response.data.message || 
                               "OTP verification failed";
            throw new Error(errorMessage);
        }
      throw new Error("An unknown error occurred during OTP verification.");
    }
  }, []); // Removed router dependency unless redirection is added

   // Function to get current access token
  const getAccessToken = useCallback((): string | null => {
      return getCookie("accessToken") || null;
  }, []);


  // Memoize context value
  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      login,
      logout,
      signup,
      verifyOtp,
      getAccessToken,
    }),
    [isAuthenticated, isLoading, login, logout, signup, verifyOtp, getAccessToken]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// --- Removed getAuthToken - use getAccessToken from useAuth() hook ---
// export const getAuthToken = (): string | null => { ... };
