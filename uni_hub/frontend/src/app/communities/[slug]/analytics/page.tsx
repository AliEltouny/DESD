"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getCommunity, getCommunityAnalytics } from '@/services/communityService';
import { Community } from '@/types/community'; // Import Community type from its source

// Define Types for Analytics Data
interface EngagementStats {
  total_posts: number;
  total_comments: number;
  total_upvotes: number;
  active_members: number;
}

interface GrowthMetrics {
  new_members_past_week: number;
  new_members_past_month: number;
  total_members: number;
}

interface PostActivity {
  most_active_day: string | null;
  posts_per_day: Record<string, number>; // Date string to count
}

interface AnalyticsData {
  community_id: number;
  engagement: EngagementStats;
  growth: GrowthMetrics;
  activity: PostActivity;
}

// Function to calculate bar height percentage
const calculateBarHeight = (count: number, maxCount: number): string => {
  const percentage = Number(count / Math.max(maxCount, 1)) * 100;
  return `${Math.max(20, percentage)}%`;
};

export default function CommunityAnalyticsPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't do anything until auth state is fully initialized
    if (typeof isAuthenticated === 'undefined') {
      console.log("Auth state still initializing...");
      return; // Wait for auth state to be determined
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Only redirect if we're sure authentication has completed and user is not authenticated
        if (isAuthenticated === false) {
          console.log("User not authenticated, redirecting to login");
          router.replace(`/login?redirect=/communities/${slug}/analytics`);
          return;
        }
        
        // Fetch community data first
        console.log("Fetching community data for", slug);
        const [communityData, analyticsData] = await Promise.all([
          getCommunity(slug as string),
          getCommunityAnalytics(slug as string)
        ]);
        setCommunity(communityData);
        // Assert the type before setting state
        setAnalytics(analyticsData as AnalyticsData);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load community data. The community may not exist or has been deleted.');
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch data if we have a slug and user is authenticated
    if (slug && isAuthenticated) {
      fetchData();
    }
  }, [slug, isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-6">
              <Link 
                href={`/communities/${slug}`}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Back to Community
              </Link>
            </div>
            
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="mt-2 text-lg font-medium text-gray-900">Access Error</h2>
              <p className="mt-1 text-gray-500">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Link 
                href={`/communities/${slug}`}
                className="text-blue-600 hover:text-blue-800 flex items-center mr-4"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Back
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {community?.name} Analytics
              </h1>
            </div>
            <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              Admin View
            </span>
          </div>
          
          <p className="text-gray-600">
            View detailed analytics and insights for your community.
          </p>
        </div>
        
        {/* Analytics Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Community Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Total Members</h3>
              <div className="text-3xl font-bold text-blue-900">{community?.member_count || 0}</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800 mb-1">Total Posts</h3>
              <div className="text-3xl font-bold text-green-900">
                {analytics?.engagement?.total_posts || 0}
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-purple-800 mb-1">Total Engagement</h3>
              <div className="text-3xl font-bold text-purple-900">
                {(analytics?.engagement?.total_upvotes || 0) + 
                 (analytics?.engagement?.total_comments || 0)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Engagement Metrics */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Engagement Metrics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Average Per Post</h3>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Upvotes</span>
                <span className="font-semibold">
                  {analytics?.engagement?.active_members?.toFixed(1) || '0.0'}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, (analytics?.engagement?.active_members || 0) * 10)}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center mt-4 mb-2">
                <span className="text-gray-600">Comments</span>
                <span className="font-semibold">
                  {analytics?.engagement?.total_comments?.toFixed(1) || '0.0'}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, (analytics?.engagement?.total_comments || 0) * 10)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Total Engagement</h3>
              
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Upvotes</span>
                <span className="text-sm font-medium text-gray-900">
                  {analytics?.engagement?.total_upvotes || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ 
                    width: `${Math.min(100, ((analytics?.engagement?.total_upvotes || 0) / ((analytics?.engagement?.total_upvotes || 0) + (analytics?.engagement?.total_comments || 0) || 1) * 100) || 0)}%` 
                  }}
                ></div>
              </div>
              
              <div className="flex justify-between mt-3 mb-1">
                <span className="text-sm text-gray-600">Comments</span>
                <span className="text-sm font-medium text-gray-900">
                  {analytics?.engagement?.total_comments || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full"
                  style={{ 
                    width: `${Math.min(100, ((analytics?.engagement?.total_comments || 0) / ((analytics?.engagement?.total_upvotes || 0) + (analytics?.engagement?.total_comments || 0) || 1) * 100) || 0)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Growth & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Member Growth */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Member Growth</h2>
            {(analytics?.growth?.new_members_past_week || 0) > 0 ? (
              <div className="h-64 flex items-end space-x-1">
                    <div 
                      className="w-full bg-blue-500 hover:bg-blue-600 transition-colors rounded-t-sm"
                      style={{ 
                    height: `${Math.max(20, ((analytics?.growth?.new_members_past_week || 0) / (analytics?.growth?.total_members || 1) * 100) || 0)}%`,
                    minHeight: '20px'
                      }}
                    ></div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg">
                <p className="text-gray-500">No member growth data available</p>
              </div>
            )}
          </div>
          
          {/* Post Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Post Activity</h2>
            {analytics?.activity?.posts_per_day && Object.keys(analytics.activity.posts_per_day).length > 0 ? (
              <div className="h-64 flex items-end space-x-1">
                {Object.entries(analytics.activity.posts_per_day).map(([date, count]) => (
                  <div key={date} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-green-500 hover:bg-green-600 transition-colors rounded-t-sm"
                      style={{ 
                        height: calculateBarHeight(count, Math.max(...Object.values(analytics.activity.posts_per_day))),
                        minHeight: count > 0 ? '20px' : '2px'
                      }}
                    ></div>
                    <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left truncate w-10 overflow-hidden">
                      {date}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg">
                <p className="text-gray-500">No post activity data available</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Top Contributors */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Contributors</h2>
          
          {(analytics?.growth?.total_members || 0) > 0 ? (
            <div className="overflow-x-auto">
              <h3 className="text-md font-medium text-gray-700 mb-3">Most Active (Posts)</h3>
              <table className="min-w-full divide-y divide-gray-200 mb-6">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contributions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(analytics?.activity?.posts_per_day || {}).map(([date, count], index) => (
                    <tr key={date}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 border border-gray-200 rounded-lg">
              <p className="text-gray-500">No contributor data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 