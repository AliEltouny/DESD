"use client";

import axios from "axios";

// Detect environment to use correct URL
// In browser context, we need to use a URL that the browser can access (localhost or domain name)
// Server-side rendering would need the Docker service name
// IMPORTANT: Remove the trailing /api from the URL as we'll add it in the endpoint calls
export const API_URL = typeof window !== 'undefined' 
  ? 'http://localhost:8000' // Always use localhost in browser context
  : "http://backend:8000"; // Backend service name in Docker for server-side

// Helper function to get cookie value
const getCookie = (name: string): string | undefined => {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return undefined;
};

const api = axios.create({
  baseURL: API_URL, // Remove trailing /api, API_URL already includes it if needed
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Always send cookies
  timeout: 15000, // Set a reasonable default timeout (15 seconds)
  // Add default retry configuration
  retryConfig: {
    maxRetries: 2,
    retryDelay: 1000,
    retryableStatuses: [408, 429, 500, 502, 503, 504]
  }
});

// Add a axios request identifier generator to track requests for debugging
const requestIdGenerator = () => {
  return `req_${Math.random().toString(36).substring(2, 12)}`;
};

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    // Generate a unique request ID for tracking
    config.requestId = requestIdGenerator();
    
    // Log request details for debugging
    console.log(`[API Request ${config.requestId}]:`, {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      headers: config.headers,
      data: config.data,
    });

    // Add Authorization header from cookie if available
    const token = getCookie("accessToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF token for mutating requests (PUT, POST, DELETE, PATCH)
    if (config.method && ['put', 'post', 'delete', 'patch'].includes(config.method.toLowerCase())) {
      const csrfToken = getCookie("csrftoken");
      if (csrfToken) {
        config.headers = config.headers || {};
        config.headers["X-CSRFToken"] = csrfToken;
      }
    }

    // Add timing info for performance tracking
    config.metadata = { startTime: new Date().getTime() };

    return config;
  },
  (error) => {
    console.error("[API Request Error]:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    try {
      // Calculate request duration for performance monitoring
      const requestDuration = response.config.metadata 
        ? new Date().getTime() - response.config.metadata.startTime 
        : 0;
      
      console.log(`[API Response ${response.config.requestId}] (${requestDuration}ms):`, {
        status: response.status,
        statusText: response.statusText,
        url: response.config.url,
        data: response.data,
      });
    } catch (loggingError) {
      // Don't let logging errors affect the response flow
      console.warn("Error while logging API response:", loggingError);
    }
    return response;
  },
  async (error) => {
    // Enhanced error handling to prevent unhandled rejections
    try {
      // Calculate request duration even for errors
      let requestDuration = 0;
      let requestId = 'unknown';

      try {
        requestDuration = error.config?.metadata 
          ? new Date().getTime() - error.config.metadata.startTime 
          : 0;
        
        // Get request ID for correlation
        requestId = error.config?.requestId || 'unknown';
      } catch (metadataError) {
        console.warn("Error accessing request metadata:", metadataError);
      }
      
      // Safely access error properties with optional chaining
      try {
        console.error(`[API Error ${requestId}] (${requestDuration}ms):`, {
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          url: error?.config?.url,
          data: error?.response?.data,
          message: error?.message,
          code: error?.code || 'UNKNOWN_ERROR',
          name: error?.name || 'Error'
          // Skip stack trace as it may be causing issues
        });
      } catch (loggingError) {
        console.warn("Error while logging API error details:", loggingError);
      }

      // Handle specific error types with clear messages
      try {
        if (error.code === 'ECONNABORTED') {
          console.warn(`[API Timeout ${requestId}] Request took too long to complete`);
          error.userMessage = "Request timed out. Please check your connection and try again.";
        } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
          console.warn(`[API Network Error ${requestId}] Network connectivity issue`);
          error.userMessage = "Network error. Please check your internet connection or verify the server is running.";
        }
      } catch (typeCheckError) {
        console.warn("Error while checking error type:", typeCheckError);
      }

      // Handle network errors specifically (e.g., CORS, connection refused)
      try {
        if (!error.response) {
          console.warn(`[API Network Error ${requestId}]: No response received`);
          // For network errors, create a standardized response format
          error.response = {
            status: 0,
            data: { 
              detail: error.userMessage || 'Network error: Unable to connect to server',
              code: error.code || 'NETWORK_ERROR'
            }
          };
        }
      } catch (responseError) {
        console.warn("Error while handling missing response:", responseError);
      }

      // Skip auth handling if server is unreachable
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        return Promise.reject(error);
      }

      // Handle authentication errors
      try {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          try {
            originalRequest._retry = true;
            console.log(`[API Auth Retry ${requestId}] Attempting token refresh`);

            // Get refreshToken from cookie instead
            const cookies = document.cookie.split(";");
            const refreshTokenCookie = cookies.find((cookie) =>
              cookie.trim().startsWith("refreshToken=")
            );
            const refreshToken = refreshTokenCookie
              ? refreshTokenCookie.split("=")[1]
              : null;

            if (!refreshToken) {
              throw new Error("No refresh token");
            }

            // FIX: Include /api in refresh endpoint
            const response = await axios.post(`${API_URL}/api/token/refresh/`, {
              refresh: refreshToken,
            });

            const { access } = response.data;
            // Don't set in localStorage, let AuthContext handle cookies

            console.log(`[API Auth Refresh ${requestId}] Token refresh successful`);
            
            // Let the request proceed without manually setting header
            return api(originalRequest);
          } catch (refreshError) {
            console.warn(`[API Auth Refresh Error ${requestId}]:`, refreshError);
            // Just redirect to login, AuthContext will handle cookie cleanup
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }

            return Promise.reject(refreshError);
          }
        }
      } catch (authError) {
        console.warn("Error during authentication handling:", authError);
      }
    } catch (handlingError) {
      // Catch any errors that occur during error handling itself
      console.warn("[API Error Handler Error]:", handlingError);
      // Add this information to the original error
      try {
        if (error) {
          error.handlingError = handlingError;
        }
      } catch (propAssignError) {
        console.warn("Error while assigning handlingError property:", propAssignError);
      }
    }

    // Always return a rejected promise with the error
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  signup: (data: any) => api.post("/api/signup/", data),
  verifyOtp: (email: string, otp: string) =>
    api.post(`/api/verify-otp/${email}/`, { otp }),
  login: (email: string, password: string) =>
    api.post("/api/login/", { email, password }),
  refreshToken: (refreshToken: string) =>
    api.post("/api/token/refresh/", { refresh: refreshToken }),
};

// User profile endpoints
export const userApi = {
  getProfile: () => api.get("/api/profile"),
  updateProfile: (data: any) => api.patch("/api/profile", data),
};

// Testimonial endpoints
export const testimonialApi = {
  getTestimonials: () => api.get("/api/testimonials"),
  getTestimonial: (id: number) => api.get(`/api/testimonials/${id}`),
};

// Default placeholder for missing images
const DEFAULT_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23e5e7eb'/%3E%3Cpath d='M36 40a14 14 0 1 1 28 0 14 14 0 0 1-28 0zm33 25.5c0-7.2-15-11-18.5-11-3.5 0-18.5 3.8-18.5 11V70h37v-4.5z' fill='%23a1a1aa'/%3E%3C/svg%3E";

// Media utility function with improved handling for Next.js Image component
export const getMediaUrl = (path: string | null): string => {
  // Return the placeholder for null or empty paths
  if (!path || path === '') {
    return DEFAULT_PLACEHOLDER;
  }

  // Handle complete URLs - just return them directly without processing
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Get base URL from environment with correct default for development
  let baseUrl = 'http://localhost:8000';
  if (typeof window !== 'undefined') {
    // For client-side, detect if we're in development or production
    const hostname = window.location.hostname;
    baseUrl = hostname === 'localhost' ? 'http://localhost:8000' : '/';
  }

  // Clean the path by removing leading slashes and 'media/' if present
  const cleanPath = path.replace(/^\/+/, '').replace(/^media\/+/, '');
  
  // Return the final URL
  return `${baseUrl}/media/${cleanPath}`;
};

export default api;
