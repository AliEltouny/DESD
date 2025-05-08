"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { communityApi } from "@/services/api";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { CommunityMembersList } from "@/components/communities/members";
import { useAuth } from "@/contexts/AuthContext";

export default function CommunityMembersPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [isLoading, setIsLoading] = useState(true);
  const [community, setCommunity] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch just the community info for the header
  useEffect(() => {
    const fetchCommunity = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch community details
        const communityData = await communityApi.getCommunity(slug);
        setCommunity(communityData);
      } catch (err) {
        console.error("Error fetching community details:", err);
        setError("Failed to load community information. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchCommunity();
    }
  }, [slug]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header with breadcrumb */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <Link
            href={`/communities/${slug}`}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Community
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex-grow">
            {isLoading ? "Loading..." : `${community?.name} - Members`}
          </h1>
          
          {/* Only show admin actions for community admins */}
          {community?.membership_role === 'admin' && (
            <div className="flex">
              <Link 
                href={`/communities/${slug}/manage/members`}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Manage Members
              </Link>
            </div>
          )}
        </div>

        {/* Error message if applicable */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            {error}
            <button 
              className="ml-2 underline"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {/* Members list with full functionality */}
        {!error && (
          <CommunityMembersList 
            slug={slug}
            showRoleFilter={true}
            showJoinDate={true}
            className="mb-6"
          />
        )}
      </div>
    </DashboardLayout>
  );
}