"use client";

import axios from "axios";

// For requests made from the browser, we need to use localhost
// For SSR and within Docker, we use the environment variable
const isBrowser = typeof window !== 'undefined';
export const API_URL = isBrowser 
  ? "/api" // Browser requests use relative URLs (handled by proxy)
  : (process.env.NEXT_PUBLIC_API_URL || "http://backend:8000/api"); // Server requests use full URLs

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    // Get token from cookie
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
    const token = tokenCookie ? tokenCookie.split('=')[1].trim() : null;
    
    // Add auth header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Added auth token to request:", token.substring(0, 10) + "...");
    } else {
      console.warn("No auth token found in cookies for request to:", config.url);
      
      // Fallback to localStorage if cookie not found
      try {
        const localToken = localStorage.getItem('accessToken');
        if (localToken) {
          config.headers.Authorization = `Bearer ${localToken}`;
          console.log("Used localStorage token fallback for request");
        }
      } catch (e) {
        console.error("Failed to get token from localStorage:", e);
      }
    }
    
    // Always include credentials
    config.withCredentials = true;
    
    // Log request details for debugging
    console.log("API Request:", {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? 
          `${config.headers.Authorization.substring(0, 15)}...` : 
          "Not set"
      },
      withCredentials: config.withCredentials,
      data: config.data,
    });
    
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
  getTestimonials: async () => {
    try {
      const response = await api.get("/testimonials");
      return response.data;
    } catch (err) {
      console.error("Error fetching testimonials:", err);
      return []; // Return empty array instead of throwing
    }
  },
  getTestimonial: async (id: number) => {
    try {
      const response = await api.get(`/testimonials/${id}`);
      return response.data;
    } catch (err) {
      console.error(`Error fetching testimonial ${id}:`, err);
      return null; // Return null instead of throwing
    }
  },
};

// Media utility function
export const getMediaUrl = (path: string | null): string => {
  // Return a placeholder SVG for missing images
  if (!path)
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23e5e7eb'/%3E%3Cpath d='M36 40a14 14 0 1 1 28 0 14 14 0 0 1-28 0zm33 25.5c0-7.2-15-11-18.5-11-3.5 0-18.5 3.8-18.5 11V70h37v-4.5z' fill='%23a1a1aa'/%3E%3C/svg%3E";

  const isBrowser = typeof window !== 'undefined';
  
  // For absolute URLs, just return them as is
  if (path.startsWith("http")) {
    return path;
  }

  // For relative paths, clean them and create absolute URLs
  let cleanPath = path;

  // Remove leading slashes
  cleanPath = cleanPath.replace(/^\/+/, "");

  // Remove 'media/' prefix if already present
  cleanPath = cleanPath.replace(/^media\//, "");

  // In the browser, use relative URLs that will be handled by the Next.js proxy
  if (isBrowser) {
    return `/media/${cleanPath}`;
  }
  
  // For server-side rendering, use the full URL
  const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://backend:8000";
  return `${MEDIA_BASE_URL}/media/${cleanPath}`;
};

export default api;
