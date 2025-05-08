"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Navbar from "./Navbar";
import LinkPrefetcher from "./LinkPrefetcher";
import AssetPreloader from "./AssetPreloader";

interface DashboardLayoutProps {
  children: ReactNode;
}

// Navigation items defined outside component to prevent recreation
const NAVIGATION_ITEMS = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Communities", href: "/communities" },
  { name: "Events", href: "/events" },       
  { name: "Messages", href: "/messages" },   
  { name: "Users", href: "/users/search" },  
  { name: "Profile", href: "/profile" },     
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { logout, isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const { user, isLoadingProfile } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isLoading = isLoadingAuth || isLoadingProfile;
  
  // Use the predefined navigation items
  const navigation = NAVIGATION_ITEMS;

  useEffect(() => {
    setIsClient(true);
    // Redirect if not loading and not authenticated
    if (!isLoading && !isAuthenticated) {
      console.log("DashboardLayout: Not authenticated, redirecting to login");
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show spinner during server-side rendering or loading
  if (!isClient || isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  // If loading is finished and still not authenticated, return null (redirect will handle it)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Optimization components */}
      <LinkPrefetcher />
      <AssetPreloader />
      
      {/* Top Navigation Bar */}
      <Navbar 
        navigation={navigation}
        pathname={pathname}
        user={user}
        logout={logout}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
