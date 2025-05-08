import React from "react";
import Link from "next/link";
import { CommunityDetail } from "@/types/api";
import { CommunityMembersList } from "@/components/communities/members";

interface MembersTabProps {
  community: CommunityDetail;
  slug: string;
}

const MembersTab: React.FC<MembersTabProps> = ({ community, slug }) => {
  // Limit to 5 members on the main community page
  // Users can click to see full members page if needed
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Members</h2>
        <Link 
          href={`/communities/${slug}/members`}
          className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
        >
          View All
          <svg className="w-4 h-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
      
      {/* Render our new component with limited settings for this view */}
      <CommunityMembersList 
        slug={slug}
        showRoleFilter={false}
        showJoinDate={false}
        pageSize={5}
      />
    </div>
  );
};

export default React.memo(MembersTab); 