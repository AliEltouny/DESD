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
  timeout: 30000, // 30 seconds timeout
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
    let authHeaderDisplay = "Bearer ???";
    if (config.headers?.Authorization) {
      const authHeader = config.headers.Authorization;
      // Check if it's a string before using substring
      if (typeof authHeader === 'string') {
         authHeaderDisplay = `${authHeader.substring(0, 15)}...`;
      }
    }

    console.log(
      `--> ${config.method?.toUpperCase()} ${config.url}`,
      `Authorization: ${authHeaderDisplay}`,
      config.data ? { data: config.data } : ""
    );
    
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

        // Use axios directly to avoid adding the expired access token again
        // This request should not use the interceptor instance 'api'
        const refreshResponse = await axios.post(`${API_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        // Assuming the refresh endpoint returns new tokens in response.data
        // You might need to store the new accessToken from refreshResponse.data.access
        // into cookies/localStorage here if your backend doesn't set HttpOnly cookies.
        
        // If using HttpOnly cookies set by the backend, this retry should just work
        // as the new accessToken cookie will be sent automatically.
        
        // Retry the original request with the same config, potentially updated headers if needed
        // The interceptor will now pick up the new token from the cookie/localStorage
        return api(originalRequest); 

      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Just redirect to login, AuthContext/Middleware should handle cookie cleanup
        if (typeof window !== "undefined") {
          // Consider using router.push('/login') if using Next.js router
          window.location.href = "/login"; 
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Media utility function with memoization for better performance
const urlCache = new Map<string, string>();

export const getMediaUrl = (path: string | null): string => {
  // Return a placeholder for missing images
  if (!path) {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23e5e7eb'/%3E%3Cpath d='M36 40a14 14 0 1 1 28 0 14 14 0 0 1-28 0zm33 25.5c0-7.2-15-11-18.5-11-3.5 0-18.5 3.8-18.5 11V70h37v-4.5z' fill='%23a1a1aa'/%3E%3C/svg%3E";
  }

  // Check cache first
  if (urlCache.has(path)) {
    return urlCache.get(path)!;
  }

  const isBrowser = typeof window !== 'undefined';
  let result: string;

  // ALWAYS return relative path for browser use (to leverage rewrites)
  if (isBrowser) {
    if (path.startsWith("http")) {
      try {
        // Attempt to parse the absolute URL and extract the pathname
        const url = new URL(path);
        // Ensure it's actually a media path before returning relative
        if (url.pathname.startsWith('/media/')) {
          result = url.pathname; // e.g., /media/communities/images/foo.jpg
        } else {
          result = path; // If not a media path, return original absolute URL
        }
      } catch (e) {
        // If URL parsing fails, return the original path
        console.warn("Could not parse URL in getMediaUrl:", path, e);
        result = path;
      }
    } else {
      // Handle relative paths (ensure it starts with /media/)
      const cleanPath = path.replace(/^\/+/, "");
      result = cleanPath.startsWith('media/') ? `/${cleanPath}` : `/media/${cleanPath}`;
    }
  } else {
    // Server-side rendering: construct the correct absolute URL
     if (path.startsWith("http")) {
        // If it includes localhost, replace with backend service name for SSR context
        if (path.includes("localhost:8000")) {
           result = path.replace("localhost:8000", "backend:8000");
        } else {
           result = path; // Assume other absolute URLs are correct for SSR context
        }
     } else {
        const cleanPath = path.replace(/^\/+/, "").replace(/^media\//, "");
        // Use internal backend URL for SSR fetch
        // Ensure NEXT_PUBLIC_BACKEND_URL is correctly set in the environment if needed
        const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://backend:8000"; 
        result = `${MEDIA_BASE_URL}/media/${cleanPath}`;
     }
  }

  // Cache the result for future use
  urlCache.set(path, result);
  return result;
};

export default api; 