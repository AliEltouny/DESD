"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { communityApi } from '@/services/api';
import { Community } from '@/types/community';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext'; // Import useUser
import AnalyticsChart from '@/components/analytics/AnalyticsChart';
import StatsCards from '@/components/analytics/StatsCards';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';

// Define the structure for analytics data
interface AnalyticsData {
  memberCount: number;
  postCount: number;
  // Add other relevant analytics fields
  dailyActiveUsers?: { date: string; count: number }[];
  weeklyActiveUsers?: { date: string; count: number }[];
  monthlyActiveUsers?: { date: string; count: number }[];
  postsPerDay?: { date: string; count: number }[];
}

export default function CommunityAnalyticsPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth(); // Get auth state and loading status
  const { user, isLoadingProfile } = useUser(); // Get user data and loading status
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  // Combined loading state based on auth and profile loading
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Update combined loading state whenever auth or profile loading changes
    setLoading(isLoadingAuth || isLoadingProfile);
    
    // Don't proceed if initial auth/profile checks are still loading
    if (isLoadingAuth || isLoadingProfile) {
      console.log("Auth or profile state still initializing...");
      return; 
    }
    
    // Redirect if authentication is complete and user is not logged in
    if (!isAuthenticated) {
          console.log("User not authenticated, redirecting to login");
          router.replace(`/login?redirect=/communities/${slug}/analytics`);
          return;
        }
        
    // Proceed to fetch data only if authenticated and slug exists
    if (slug && isAuthenticated) {
       const fetchData = async () => {
         try {
           // Use a different variable name to avoid conflict with state setter
           setLoading(true); // Set loading specifically for data fetching phase
           setError(null);
           
        console.log("Fetching community data for", slug);
           const communityData = await communityApi.getCommunity(slug as string);
        setCommunity(communityData);
           
           console.log("Fetching community analytics for", slug);
           const analyticsData = await communityApi.getCommunityAnalytics(slug as string);
        setAnalytics(analyticsData as AnalyticsData);

      } catch (err) {
        console.error('Failed to load data:', err);
           setError('Failed to load community data or analytics. The community may not exist, you might not have permission, or an error occurred.');
      } finally {
           setLoading(false); // Finish data fetching loading state
      }
    };
      fetchData();
    }
  }, [slug, isAuthenticated, isLoadingAuth, isLoadingProfile, user, router]); // Added loading states and user to dependencies

  // Display loading spinner based on combined loading state
  if (loading) {
    return <LoadingSpinner />; 
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-red-600">{error}</div>;
  }

  if (!community || !analytics) {
    return <div className="container mx-auto px-4 py-8">Community or analytics data not found.</div>;
  }

  // Basic check: Ensure only community admins/mods can see this (adjust logic as needed)
  // This requires the user object to have roles/permissions or a creator field on the community
  // if (user?.id !== community.creator?.id /* && !user.roles.includes('admin') */) {
  //   return <div className="container mx-auto px-4 py-8 text-red-600">Access Denied: You do not have permission to view these analytics.</div>;
  // }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title={`${community.name} - Analytics`}
        breadcrumbs={[
          { name: 'Communities', href: '/communities' },
          { name: community.name, href: `/communities/${slug}` },
          { name: 'Analytics', href: `/communities/${slug}/analytics` },
        ]}
      />
      
      <StatsCards memberCount={analytics.memberCount} postCount={analytics.postCount} />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {analytics.dailyActiveUsers && (
          <AnalyticsChart 
            title="Daily Active Users"
            data={analytics.dailyActiveUsers}
            dataKey="count"
            indexKey="date"
          />
        )}
        {analytics.postsPerDay && (
          <AnalyticsChart 
            title="Posts Per Day"
            data={analytics.postsPerDay}
            dataKey="count"
            indexKey="date"
          />
        )}
        {/* Add more charts as needed */}
      </div>
    </div>
  );
} 