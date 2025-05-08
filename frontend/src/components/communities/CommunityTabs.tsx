"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface CommunityTabsProps {
  communitySlug: string;
  // Add other props as needed, e.g., member status, creator status
}

const CommunityTabs: React.FC<CommunityTabsProps> = ({ communitySlug }) => {
  const pathname = usePathname();

  // Define tabs - adjust based on your actual routes and logic
  const tabs = [
    { name: 'Posts', href: `/communities/${communitySlug}` },
    { name: 'About', href: `/communities/${communitySlug}/about` },
    { name: 'Members', href: `/communities/${communitySlug}/members` },
    // Add conditional tabs like Analytics, Settings based on permissions
    // Example (needs proper permission check):
    // { name: 'Analytics', href: `/communities/${communitySlug}/analytics`, requiresAdmin: true },
  ];

  // Simple active check based on exact path match
  // You might need more sophisticated logic for nested routes
  const isActive = (href: string) => pathname === href;

  return (
    <div className="border-b border-gray-200 bg-white rounded-t-lg shadow-sm overflow-hidden">
      <nav className="-mb-px flex space-x-6 px-4 sm:px-6 lg:px-8" aria-label="Tabs">
        {tabs.map((tab) => (
          // TODO: Add permission checks for conditional tabs
          <Link
            key={tab.name}
            href={tab.href}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              isActive(tab.href)
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.name}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default CommunityTabs; 