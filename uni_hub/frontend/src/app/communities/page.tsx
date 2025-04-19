"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import YourCommunitiesSection from "@/components/communities/listPage/YourCommunitiesSection";
import DiscoverCommunitiesSection from "@/components/communities/listPage/DiscoverCommunitiesSection";

export default function CommunitiesPage() {
  const { isAuthenticated } = useAuth();
  const [memberOnly, setMemberOnly] = useState(false);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Communities</h1>
          {isAuthenticated && (
            <Link
              href="/communities/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="mr-2 -ml-1 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
          )}
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <p className="text-lg text-gray-600">
            Join communities that match your interests and connect with fellow
            students. Communities are spaces where you can share resources,
            discuss topics, and organize events.
          </p>
        </div>

        {isAuthenticated && (
          <YourCommunitiesSection />
        )}

        <DiscoverCommunitiesSection 
          memberOnly={memberOnly} 
          isAuthenticated={isAuthenticated}
          onFilterChange={setMemberOnly}
        />
      </div>
    </DashboardLayout>
  );
}
