"use client";

import axios from "axios";

export const API_URL = "/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
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
    console.error("API Error Response:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: error.config,
    });

    const originalRequest = error.config;

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

        const response = await axios.post(`${API_URL}/token/refresh/`, {
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
  signup: (data: any) => api.post("/signup", data),
  verifyOtp: (email: string, otp: string) =>
    api.post(`/verify-otp/${email}`, { otp }),
  login: (email: string, password: string) =>
    api.post("/login", { email, password }),
  refreshToken: (refreshToken: string) =>
    api.post("/token/refresh", { refresh: refreshToken }),
};

// User profile endpoints
export const userApi = {
  getProfile: () => api.get("/profile"),
  updateProfile: (data: any) => api.patch("/profile", data),
};

// Testimonial endpoints
export const testimonialApi = {
  getTestimonials: () => api.get("/testimonials"),
  getTestimonial: (id: number) => api.get(`/testimonials/${id}`),
};

// Media utility function
export const getMediaUrl = (path: string | null): string => {
  // Return a placeholder SVG for missing images
  if (!path)
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23e5e7eb'/%3E%3Cpath d='M36 40a14 14 0 1 1 28 0 14 14 0 0 1-28 0zm33 25.5c0-7.2-15-11-18.5-11-3.5 0-18.5 3.8-18.5 11V70h37v-4.5z' fill='%23a1a1aa'/%3E%3C/svg%3E";

  // Production-ready approach using environment variables
  // In development: Gets NEXT_PUBLIC_MEDIA_BASE_URL from .env or uses default value
  // In production: Will use the environment variable set in the production environment
  const MEDIA_BASE_URL =
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "http://localhost:8000";

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

  // Remove 'media/' prefix if present
  cleanPath = cleanPath.replace(/^media\//, "");

  // Construct the full URL
  return `${MEDIA_BASE_URL}/media/${cleanPath}`;
};

export default api;
