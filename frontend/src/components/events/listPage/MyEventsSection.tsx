"use client";

import React from "react";
import Link from "next/link";
import EventList from "./EventList";

const MyEventsSection: React.FC = () => {
  return (
    <div className="mb-8">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Events
            </h2>
            <Link
              href="/events/my"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All
            </Link>
          </div>
          <EventList
            joinedOnly={true}
            maxItems={3}
            showFilters={false}
            title=""
            className="mt-4"
          />
        </div>
      </div>
    </div>
  );
};

export default MyEventsSection;
