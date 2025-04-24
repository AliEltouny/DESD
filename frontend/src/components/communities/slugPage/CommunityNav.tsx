import React from 'react';
import Link from 'next/link';
import { Community } from '@/types/community'; // Assuming Community type needed for roles

interface CommunityNavProps {
  slug: string;
  isCreator: boolean;
  community: Community | null; // Pass community for role checks
}

const CommunityNav: React.FC<CommunityNavProps> = ({ slug, isCreator, community }) => {
  // Check if community exists and user is a member before showing certain links
  const canViewAdminLinks = isCreator || (community?.is_member && community.membership_role === "admin");

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="flex overflow-x-auto">
        <Link
          href={`/communities/${slug}`}
          className="px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600 flex-shrink-0"
        >
          Posts
        </Link>
        <Link
          href={`/communities/${slug}/about`}
          className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 transition-all flex-shrink-0"
        >
          About
        </Link>
        <Link
          href={`/communities/${slug}/members`}
          className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 transition-all flex-shrink-0"
        >
          Members
        </Link>
        {canViewAdminLinks && (
          <Link
            href={`/communities/${slug}/analytics`}
            className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 transition-all flex-shrink-0"
          >
            Analytics
          </Link>
        )}
        {/* Add other admin/moderator links here if needed based on roles */}
      </div>
    </div>
  );
};

export default CommunityNav; 