import React from "react";
import { CommunityDetail } from "@/types/api";
import Link from "next/link";

interface AboutTabProps {
  community: CommunityDetail;
  isCreator: boolean;
}

const AboutTab: React.FC<AboutTabProps> = ({ community, isCreator }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">About {community.name}</h2>
      
      {community.description && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">Description</h3>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">{community.description}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">Community Details</h3>
          <ul className="space-y-3">
            <li className="flex items-center text-gray-700">
              <span className="flex-shrink-0 bg-blue-100 text-blue-600 p-1 rounded mr-3">👥</span>
              <span><strong>{community.member_count || 0}</strong> members</span>
            </li>
            {community.category && (
              <li className="flex items-center text-gray-700">
                <span className="flex-shrink-0 bg-purple-100 text-purple-600 p-1 rounded mr-3">🏷️</span>
                <span>Category: <strong className="capitalize">{community.category}</strong></span>
              </li>
            )}
            <li className="flex items-center text-gray-700">
              <span className="flex-shrink-0 bg-green-100 text-green-600 p-1 rounded mr-3">📅</span>
              <span>Created: <strong>{new Date(community.created_at).toLocaleDateString()}</strong></span>
            </li>
            {community.creator && (
              <li className="flex items-center text-gray-700">
                <span className="flex-shrink-0 bg-yellow-100 text-yellow-600 p-1 rounded mr-3">👤</span>
                <span>Created by: <strong>{community.creator.username || community.creator.email}</strong></span>
              </li>
            )}
            <li className="flex items-center text-gray-700">
              <span className="flex-shrink-0 bg-gray-100 text-gray-600 p-1 rounded mr-3">{community.is_private ? '🔒' : '🌐'}</span>
              <span><strong>{community.is_private ? 'Private' : 'Public'}</strong> community</span>
            </li>
          </ul>
        </div>
        
        {community.rules && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Community Rules</h3>
            <div className="text-gray-700 whitespace-pre-line leading-relaxed">{community.rules}</div>
          </div>
        )}
      </div>
      
      {isCreator && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Admin Options</h3>
          <p className="text-gray-700 mb-3">As the creator of this community, you have access to additional management options.</p>
          <Link href={`/communities/${community.slug}/manage`} className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Manage Community
          </Link>
        </div>
      )}
    </div>
  );
};

export default React.memo(AboutTab); 