"use client";

import axios from "axios";

// Detect environment to use correct URL
// In browser context, we need to use a URL that the browser can access (localhost or domain name)
// Server-side rendering would need the Docker service name
// IMPORTANT: Remove the trailing /api from the URL as we'll add it in the endpoint calls
export const API_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL?.replace('http://backend:8000/api', 'http://localhost:8000') || 'http://localhost:8000')
  : "http://backend:8000"; // Backend service name in Docker

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
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    // Log request details for debugging
    console.log("API Request:", {
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

    // Don't try to get token from localStorage, let the cookies be sent automatically
    // The browser will automatically include cookies in the request
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    console.log("API Response:", {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });
    return response;
  },
  async (error) => {
    // Don't log membership status errors to avoid console spam
    const isMembershipStatusEndpoint = error.config?.url?.includes('/membership_status/');
    const is404Error = error.response?.status === 404;
    
    // Only log errors that aren't 404s on membership_status endpoints
    if (!(isMembershipStatusEndpoint && is404Error)) {
      console.error("API Error Response:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n') // Include first 3 lines of stack trace
      });
    }

    const originalRequest = error.config;

    // Handle 401 unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
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

        // Let the request proceed without manually setting header
        return api(originalRequest);
      } catch (refreshError) {
        // Just redirect to login, AuthContext will handle cookie cleanup
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

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

// Media utility function
export const getMediaUrl = (path: string | null): string => {
  // Return a placeholder SVG for missing images
  if (!path)
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23e5e7eb'/%3E%3Cpath d='M36 40a14 14 0 1 1 28 0 14 14 0 0 1-28 0zm33 25.5c0-7.2-15-11-18.5-11-3.5 0-18.5 3.8-18.5 11V70h37v-4.5z' fill='%23a1a1aa'/%3E%3C/svg%3E";

  // Log received path for debugging
  console.log("Processing media path:", path);

  // Use same environment detection as API_URL
  const MEDIA_BASE_URL = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace('http://backend:8000', 'http://localhost:8000') || 'http://localhost:8000')
    : "http://backend:8000";

  // For absolute URLs, normalize them to ensure they use the correct domain
  if (path.startsWith("http")) {
    // Replace any environment-specific domains with the appropriate one
    // This handles cases where URLs might come from different environments
    const url = new URL(path);

    // If URL contains a domain we know needs to be replaced (like backend:8000)
    if (url.host === "backend:8000" || url.host.includes("localhost")) {
      // Create a new URL using our base URL but maintaining the path
      return `${MEDIA_BASE_URL}${url.pathname}`;
    }

    // If it's already a proper external URL, leave it as is
    return path;
  }

  // For relative paths, clean them and create absolute URLs
  // This handles cases where paths might be in different formats
  let cleanPath = path;

  // Remove leading slashes
  cleanPath = cleanPath.replace(/^\/+/, "");

  // If path already includes 'media/', don't add it again
  if (cleanPath.startsWith("media/")) {
    return `${MEDIA_BASE_URL}/${cleanPath}`;
  }
  
  // If path starts with 'communities/' or other subdirectories, assume it's already relative to media directory
  if (cleanPath.startsWith("communities/") || 
      cleanPath.startsWith("profiles/") || 
      cleanPath.startsWith("event_images/")) {
    return `${MEDIA_BASE_URL}/media/${cleanPath}`;
  }

  // For other paths, check if they might be full paths from Django storage
  if (cleanPath.includes("/media/")) {
    const parts = cleanPath.split("/media/");
    return `${MEDIA_BASE_URL}/media/${parts[1]}`;
  }

  // Default case: add media prefix
  return `${MEDIA_BASE_URL}/media/${cleanPath}`;
};

export default api;
