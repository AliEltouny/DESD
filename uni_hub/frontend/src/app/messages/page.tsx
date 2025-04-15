"use client";

import React from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function MessagesPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
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
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Messaging Coming Soon</h2>
          <p className="text-gray-600 mb-6">
            We're waiting for Anes to integrate the messaging system.
          </p>

          <p className="text-gray-600 mb-6">
            In the meantime, you can interact with peers through community posts and discussions.
          </p>
          
          <div className="mt-6 flex justify-center">
            <span className="inline-flex rounded-md shadow-sm">
              <button 
                disabled
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 opacity-50 cursor-not-allowed"
              >
                Coming Soon
              </button>
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 