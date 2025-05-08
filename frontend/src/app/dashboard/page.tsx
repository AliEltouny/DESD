"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";

// Import dashboard components
import ProfileCard from "@/components/dashboard/ProfileCard";
import StatsSummary from "@/components/dashboard/StatsSummary";
import CommunitiesPreview from "@/components/dashboard/CommunitiesPreview";
import UpcomingEvents from "@/components/dashboard/UpcomingEvents";
import RecentActivityFeed from "@/components/dashboard/RecentActivityFeed";
import QuickLinks from "@/components/dashboard/QuickLinks";
import CampusAnnouncements from "@/components/dashboard/CampusAnnouncements";
import RecommendedConnections from "@/components/dashboard/RecommendedConnections";
import CommunityRecommendations from "@/components/dashboard/CommunityRecommendations";

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [router, isAuthenticated, isLoading]);

  // Don't render anything server-side or if not authenticated
  if (!isClient || !isAuthenticated || isLoading) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6">
            <ProfileCard />
            <StatsSummary />
            <QuickLinks />
          </div>

          {/* Middle Column */}
          <div className="space-y-6">
            <RecentActivityFeed />
            <UpcomingEvents />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <CampusAnnouncements />
            <CommunitiesPreview />
            <CommunityRecommendations />
            <RecommendedConnections />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
