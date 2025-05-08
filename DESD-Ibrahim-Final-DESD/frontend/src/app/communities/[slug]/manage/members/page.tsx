"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useMemberManagement } from "@/hooks/communities/useMemberManagement";
import MemberManagement from "@/components/communities/members/MemberManagement";
import { useCommunity } from "@/hooks/communities";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ManageCommunityMembersPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  // Fetch community data to check permissions
  const { 
    community, 
    loading: isLoadingCommunity, 
    error: communityError 
  } = useCommunity(slug);
  
  // Use the member management hook
  const {
    members,
    totalMembers,
    isLoading: isLoadingMembers,
    error: membersError,
    isUpdating,
    updateMemberRole,
    refetchMembers
  } = useMemberManagement(slug);
  
  // Combined loading state
  const isLoading = isAuthLoading || isLoadingCommunity || isLoadingMembers;
  
  // Check if user is an admin
  const isAdmin = community?.membership_role === 'admin';
  
  // Redirect if not admin after loading completes
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      // Not an admin, redirect to community page
      router.push(`/communities/${slug}`);
    }
  }, [isLoading, isAuthenticated, isAdmin, router, slug]);
  
  // Handle all errors
  const error = communityError || membersError;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Breadcrumb navigation */}
        <div className="flex items-center mb-6 text-sm">
          <Link 
            href={`/communities/${slug}`}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Community
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-600">Manage Members</span>
        </div>
        
        {/* Loading state for the header */}
        {isLoading ? (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Manage Members - {community?.name}
            </h1>
            <p className="text-gray-600 mb-4">
              As an admin, you can change the roles of members in this community. Admins have full control over the community, 
              while moderators can manage content but not community settings.
            </p>
            
            {/* Important note for admin who want to leave */}
            <div className="bg-blue-50 p-4 rounded-md text-blue-700 mb-4">
              <p className="font-semibold">Important Note:</p>
              <p>If you want to leave this community, you must first promote at least one other member to admin. 
              A community cannot exist without at least one admin.</p>
            </div>
          </div>
        )}
        
        {/* Error state */}
        {!isLoading && error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            <p className="font-medium">Error: {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-sm underline mt-2"
            >
              Reload page
            </button>
          </div>
        )}
        
        {/* Permission denied */}
        {!isLoading && isAuthenticated && !isAdmin && (
          <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md mb-6">
            <p className="font-medium">You need admin permissions to manage members.</p>
            <Link 
              href={`/communities/${slug}`}
              className="text-sm underline mt-2 inline-block"
            >
              Return to community
            </Link>
          </div>
        )}
        
        {/* Main content - member management */}
        {!error && isAdmin && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <MemberManagement
              members={members}
              onRoleChange={updateMemberRole}
              slug={slug}
              refetchMembers={refetchMembers}
              currentUserRole={community?.membership_role}
              isLoading={isLoadingMembers}
            />
          </div>
        )}
        
        {/* Return to community */}
        <div className="mt-6 text-center">
          <Link 
            href={`/communities/${slug}`}
            className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-md transition-colors"
          >
            Return to Community
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
} 