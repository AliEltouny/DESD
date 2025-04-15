"use client";

import React from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Link from "next/link";

export default function EventsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
        </div>

        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="w-24 h-24 bg-blue-100 flex items-center justify-center rounded-full mx-auto mb-6">
            <svg
              className="w-12 h-12 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Events Coming Soon</h2>
          <p className="text-gray-600 mb-6">
          We're waiting for Rayan to integrate the events platform.
          </p>
          
          <p className="text-gray-600 mb-6">
            In the meantime, check out community events in the communities section!
          </p>

          <Link
            href="/communities"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Browse Communities
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
} 