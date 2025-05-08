"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCommunity } from "@/hooks/communities";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Management card component
interface ManagementCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  permissions: string[];
  currentRole?: string;
}

const ManagementCard: React.FC<ManagementCardProps> = ({
  title,
  description,
  icon,
  link,
  permissions,
  currentRole = 'member'
}) => {
  const hasPermission = permissions.includes(currentRole);
  
  if (!hasPermission) return null;
  
  return (
    <Link 
      href={link}
      className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 transition-transform duration-200"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-gray-600">{description}</p>
        </div>
      </div>
    </Link>
  );
};

export default function ManageCommunityPage() {
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
  
  // Combined loading state
  const isLoading = isAuthLoading || isLoadingCommunity;
  
  // Check if user has permission to access management dashboard
  const isAdmin = community?.membership_role === 'admin';
  const isModerator = community?.membership_role === 'moderator';
  const hasAccess = isAdmin || isModerator;
  
  // Redirect if not authorized after loading completes
  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasAccess) {
      // Not authorized, redirect to community page
      router.push(`/communities/${slug}`);
    }
  }, [isLoading, isAuthenticated, hasAccess, router, slug]);
  
  // All possible management cards
  const managementCards = [
    {
      title: "Member Management",
      description: "Add, remove, or change roles of community members",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      link: `/communities/${slug}/manage/members`,
      permissions: ['admin']
    },
    {
      title: "Content Moderation",
      description: "Review and moderate community posts and comments",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      link: `/communities/${slug}/manage/content`,
      permissions: ['admin', 'moderator']
    },
    {
      title: "Community Settings",
      description: "Update community details, rules, and privacy settings",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      link: `/communities/${slug}/manage/settings`,
      permissions: ['admin']
    },
    {
      title: "Appearance",
      description: "Customize community banner, logo, and colors",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      link: `/communities/${slug}/manage/appearance`,
      permissions: ['admin']
    },
    {
      title: "Analytics",
      description: "View community growth, engagement and activity metrics",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      link: `/communities/${slug}/analytics`,
      permissions: ['admin']
    },
    {
      title: "Pending Approvals",
      description: "Review and approve pending join requests",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      link: `/communities/${slug}/manage/approvals`,
      permissions: ['admin', 'moderator']
    }
  ];

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (communityError || !community) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            <h2 className="text-lg font-medium">Error</h2>
            <p>{communityError || "Failed to load community data"}</p>
            <Link 
              href={`/communities/${slug}`}
              className="text-sm underline mt-2 inline-block"
            >
              Return to community
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Display unauthorized message if needed
  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md mb-6">
            <h2 className="text-lg font-medium">Access Denied</h2>
            <p>You don't have permission to manage this community.</p>
            <Link 
              href={`/communities/${slug}`}
              className="text-sm underline mt-2 inline-block"
            >
              Return to community
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
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
          <span className="text-gray-600">Manage Community</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage {community.name}</h1>
          <p className="text-gray-600">
            Use these tools to manage your community settings, members, and content.
          </p>
        </div>

        {/* Management Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {managementCards.map((card, index) => (
            <ManagementCard
              key={index}
              title={card.title}
              description={card.description}
              icon={card.icon}
              link={card.link}
              permissions={card.permissions}
              currentRole={community.membership_role}
            />
          ))}
        </div>

        {/* Quick Tips Section */}
        <div className="bg-blue-50 p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Community Management Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 mr-3">
                <span className="text-lg font-bold">1</span>
              </div>
              <div>
                <h3 className="font-medium text-blue-800">Establish Clear Rules</h3>
                <p className="text-blue-700 text-sm">Well-defined community guidelines help prevent conflicts.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 mr-3">
                <span className="text-lg font-bold">2</span>
              </div>
              <div>
                <h3 className="font-medium text-blue-800">Delegate Responsibilities</h3>
                <p className="text-blue-700 text-sm">Appoint trusted moderators to help manage the community.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 mr-3">
                <span className="text-lg font-bold">3</span>
              </div>
              <div>
                <h3 className="font-medium text-blue-800">Encourage Engagement</h3>
                <p className="text-blue-700 text-sm">Create regular content and respond to member contributions.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 mr-3">
                <span className="text-lg font-bold">4</span>
              </div>
              <div>
                <h3 className="font-medium text-blue-800">Monitor Analytics</h3>
                <p className="text-blue-700 text-sm">Track engagement to understand what content resonates with members.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Return to community */}
        <div className="text-center">
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