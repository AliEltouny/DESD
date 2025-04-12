"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import CommunityList from "@/components/communities/CommunityList";
import Link from "next/link";

export default function CommunitiesPage() {
  const { isAuthenticated } = useAuth();
  const [memberOnly, setMemberOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Error handler function that can be passed to child components
  const handleError = (errorMessage: string) => {
    console.error("Community page error:", errorMessage);
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
            <p>{error}</p>
            <button
              className="mt-2 text-sm text-red-700 font-medium underline"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <p className="text-lg text-gray-600">
            Join communities that match your interests and connect with fellow
            students. Communities are spaces where you can share resources,
            discuss topics, and organize events.
          </p>
        </div>

        {isAuthenticated && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Your Communities
                  </h2>
                  <Link
                    href="/communities?member_only=true"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View All
                  </Link>
                </div>
                <CommunityList
                  memberOnly={true}
                  maxItems={3}
                  title=""
                  showFilters={false}
                  className="mt-4"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <CommunityList
            title="Discover Communities"
            showFilters={true}
            memberOnly={memberOnly}
          />
        </div>

        {isAuthenticated && (
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="member-only-filter"
              checked={memberOnly}
              onChange={() => setMemberOnly(!memberOnly)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="member-only-filter"
              className="ml-2 block text-sm text-gray-900"
            >
              Show only communities I'm a member of
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
