"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import MyEventsSection from "@/components/events/listPage/MyEventsSection";
import DiscoverEventsSection from "@/components/events/listPage/DiscoverEventsSection";
import toast from "react-hot-toast";

export default function EventsPage() {
  const { isAuthenticated } = useAuth();
  const [memberOnly, setMemberOnly] = useState(false);
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const router = useRouter();

  useEffect(() => {
    if (status === "joined" || status === "left" || status === "created") {
      setTimeout(() => {
        if (status === "joined") {
          toast.success("🎉 You joined the event!");
        } else if (status === "left") {
          toast.success("✅ You left the event.");
        } else if (status === "created") {
          toast.success("🎉 Event created successfully!");
        }

        // Clear the query parameter after showing the toast
        router.replace("/events");
      }, 200); // Delay to ensure page loads first
    }
  }, [status, router]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          {isAuthenticated && (
            <Link
              href="/events/create"
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
              Create Event
            </Link>
          )}
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <p className="text-lg text-gray-600">
            Discover and join events across different communities. Whether it's a meetup, workshop, or party — there's something for everyone!
          </p>
        </div>

        {isAuthenticated && <MyEventsSection />}

        <DiscoverEventsSection
          memberOnly={memberOnly}
          isAuthenticated={isAuthenticated}
          onFilterChange={setMemberOnly}
        />
      </div>
    </DashboardLayout>
  );
}
