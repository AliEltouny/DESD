import React from 'react';
import Link from 'next/link';
import CommunityList from '../CommunityList'; // Adjust path relative to CommunityList

const YourCommunitiesSection: React.FC = () => {
  return (
    <div className="mb-8">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Communities
            </h2>
            {/* Link might need adjustment based on routing strategy for viewing all member communities */}
            <Link
              href="/communities?member_only=true" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All
            </Link>
          </div>
          <CommunityList
            memberOnly={true} // Hardcoded for this section
            maxItems={3}       // Limit to 3 for preview
            title=""           // No separate title needed here
            showFilters={false}  // No filters needed here
            className="mt-4"
          />
        </div>
      </div>
    </div>
  );
};

export default YourCommunitiesSection; 