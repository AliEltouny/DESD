"use client";

import React from "react";
import EventList from "./EventList";

interface DiscoverEventsSectionProps {
  memberOnly: boolean;
  isAuthenticated: boolean;
  onFilterChange: (checked: boolean) => void;
}

const DiscoverEventsSection: React.FC<DiscoverEventsSectionProps> = ({
  memberOnly,
  isAuthenticated,
  onFilterChange,
}) => {
  return (
    <div className="mb-8">
      <EventList
        title="Discover Events"
        showFilters={true}
        joinedOnly={memberOnly}
      />

      {isAuthenticated && (
        <div className="mt-4 flex items-center">
          <input
            type="checkbox"
            id="discover-member-only-filter"
            checked={memberOnly}
            onChange={(e) => onFilterChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="discover-member-only-filter"
            className="ml-2 block text-sm text-gray-900"
          >
            Show only events I&apos;m attending
          </label>
        </div>
      )}
    </div>
  );
};

export default DiscoverEventsSection;
