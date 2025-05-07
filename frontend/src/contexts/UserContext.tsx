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
import { User } from "@/types/user";
import { useAuth } from "./AuthContext"; // Import useAuth to access authentication status

// --- TODO: Move API client setup to a dedicated services/api file ---
// This Axios instance setup could live in services/api/apiClient.ts
// and be imported here and in AuthContext for consistency.
const apiClient = axios.create({
  baseURL: "/api", // Adjust base URL if necessary
});
// Add interceptors if needed for specific user endpoints, 
// but authentication headers should be handled by the instance in AuthContext
// or a shared instance.
// --- End API client setup consideration ---

interface UserContextType {
  user: User | null;
  isLoadingProfile: boolean;
  fetchUserProfile: () => Promise<User | null>; // Make fetch callable if needed elsewhere
  clearUserProfile: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { isAuthenticated, getAccessToken } = useAuth(); // Get auth status and token getter
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);

  // Helper to clear user data from state and storage
  const clearUserProfile = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    console.log("UserContext: Cleared user profile data.");
  }, []);

  // Helper function to fetch user profile and set state
  const fetchUserProfile = useCallback(async (): Promise<User | null> => {
    setIsLoadingProfile(true);
    console.log("UserContext: Attempting to fetch user profile...");
    try {
      // Ensure the token is attached for this request
      const token = getAccessToken();
      if (!token) {
          throw new Error("UserContext: No access token available for fetching profile.");
      }
      
      console.log(`UserContext: Fetching profile with token: ${token.substring(0, 15)}...`);
      
      const profileResponse = await apiClient.get("/profile", {
          headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("UserContext: Profile API response:", profileResponse.data);
      const userData = profileResponse.data as User;

      // Determine if rememberMe was used (e.g., by checking localStorage persistence)
      // For simplicity, we check if data was previously in localStorage.
      // A more robust way might involve a dedicated flag or checking refresh token expiry.
      const wasRemembered = localStorage.getItem("user") !== null;

      if (wasRemembered) {
        localStorage.setItem("user", JSON.stringify(userData));
        sessionStorage.removeItem("user"); // Clear session if remembered
      } else {
        sessionStorage.setItem("user", JSON.stringify(userData));
        localStorage.removeItem("user"); // Clear local if not remembered
      }

      setUser(userData);
      console.log("UserContext: User profile fetched successfully.");
      return userData;
    } catch (profileError) {
      console.error("UserContext: Failed to fetch profile:", profileError);
      // Clear potentially stale data on error
      clearUserProfile();
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  }, [getAccessToken, clearUserProfile]); // Added clearUserProfile dependency

  // Effect to load user from storage or fetch when authenticated
  useEffect(() => {
    if (isAuthenticated) {
       console.log("UserContext: Auth detected, checking for stored/fetching user profile.");
       // Check local/session storage first
       const userJSONFromLocal = localStorage.getItem("user");
       const userJSONFromSession = sessionStorage.getItem("user");
       const userJSON = userJSONFromLocal || userJSONFromSession;
       
       if (userJSON) {
            try {
                const userData = JSON.parse(userJSON);
                setUser(userData);
                console.log("UserContext: Restored user from storage.");
            } catch (e) {
                console.error("UserContext: Failed to parse stored user data.", e);
                localStorage.removeItem("user"); // Clear potentially corrupt data
                sessionStorage.removeItem("user");
                fetchUserProfile(); // Fetch fresh if stored data is corrupt
            }
       } else {
           // No user data in storage, fetch it
           fetchUserProfile();
       }
    } else {
      // If not authenticated, ensure user state is cleared
      clearUserProfile();
    }
  }, [isAuthenticated, fetchUserProfile, clearUserProfile]); // Added clearUserProfile

  const contextValue = useMemo(
    () => ({
      user,
      isLoadingProfile,
      fetchUserProfile, // Expose fetch function
      clearUserProfile, // Expose clear function
    }),
    [user, isLoadingProfile, fetchUserProfile, clearUserProfile]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};