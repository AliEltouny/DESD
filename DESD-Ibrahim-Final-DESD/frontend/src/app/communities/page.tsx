"use client";

import { useState, useCallback, memo, Suspense, lazy } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { usePathname } from "next/navigation";

// Lazy load components for better initial load performance
const YourCommunitiesSection = lazy(() => import("@/components/communities/listPage/YourCommunitiesSection"));
const DiscoverCommunitiesSection = lazy(() => import("@/components/communities/listPage/DiscoverCommunitiesSection"));

// Create fallback components
const SectionSkeleton = memo(() => (
  <div className="bg-white shadow-sm rounded-lg p-6 animate-pulse">
    <div className="flex justify-between mb-4">
      <div className="h-7 bg-gray-200 rounded w-1/3"></div>
      <div className="h-7 bg-gray-200 rounded w-24"></div>
    </div>
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-gray-100 h-64 rounded-xl"></div>
        ))}
      </div>
    </div>
  </div>
));

SectionSkeleton.displayName = 'SectionSkeleton';

// Optimize CreateCommunityButton with memo
const CreateCommunityButton = memo(() => (
  <Link
    href="/communities/create"
    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
  >
    <svg
      className="mr-2 -ml-1 h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
      />
    </svg>
    Create Community
  </Link>
));

CreateCommunityButton.displayName = 'CreateCommunityButton';

// Main page component
export default function CommunitiesPage() {
  const { isAuthenticated } = useAuth();
  const [memberOnly, setMemberOnly] = useState(false);
  const pathname = usePathname();

  const handleFilterChange = useCallback((checked: boolean) => {
    setMemberOnly(checked);
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Communities</h1>
          {isAuthenticated && <CreateCommunityButton />}
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <p className="text-lg text-gray-600">
            Join communities that match your interests and connect with fellow
            students. Communities are spaces where you can share resources,
            discuss topics, and organize events.
          </p>
        </div>

        {isAuthenticated && (
          <Suspense fallback={<SectionSkeleton />}>
            <YourCommunitiesSection />
          </Suspense>
        )}

        <Suspense fallback={<SectionSkeleton />}>
          <DiscoverCommunitiesSection 
            memberOnly={memberOnly} 
            isAuthenticated={isAuthenticated}
            onFilterChange={handleFilterChange}
          />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
