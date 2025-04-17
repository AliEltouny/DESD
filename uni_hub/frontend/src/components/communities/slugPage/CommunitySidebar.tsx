import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Community } from '@/types/community';

interface CommunitySidebarProps {
  community: Community;
  isCreator: boolean;
  isAuthenticated: boolean;
  slug: string;
  handleJoinCommunity: () => Promise<void>;
  handleLeaveCommunity: () => Promise<void>;
  joinLoading: boolean;
}

const CommunitySidebar: React.FC<CommunitySidebarProps> = ({
  community,
  isCreator,
  isAuthenticated,
  slug,
  handleJoinCommunity,
  handleLeaveCommunity,
  joinLoading,
}) => {
  const router = useRouter();

  const renderSidebarLinks = () => {
    if (!isAuthenticated || !(community?.is_member ?? false) || !community) return null;

    const isAdmin = isCreator || community.membership_role === "admin";
    const isModerator = community.membership_role === "moderator";

    return (
      <>
        {(isAdmin || isModerator) && (
           <Link href={`/communities/${slug}/manage/members`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Manage Members
          </Link>
        )}
         {(isAdmin || isModerator) && (
           <Link href={`/communities/${slug}/manage/content`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Manage Content
          </Link>
        )}
        {isAdmin && (
           <Link href={`/communities/${slug}/settings`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Community Settings
          </Link>
        )}
         {isAdmin && (
           <Link href={`/communities/${slug}/analytics`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Analytics
          </Link>
        )}
      </>
    );
  };

  const renderJoinLeaveButton = () => {
    if (!isAuthenticated) {
      return (
        <button
          onClick={() => router.push(`/login?redirect=/communities/${slug}`)}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          Log in to Join
        </button>
      );
    }

    if (isCreator) return null;

    if (community?.is_member) {
      if (community.membership_status === "pending") {
        return (
          <button
            disabled
            className="w-full bg-yellow-500 text-white px-4 py-2 rounded-md cursor-not-allowed flex items-center justify-center"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Request Pending
          </button>
        );
      } else {
        return (
          <button
            onClick={handleLeaveCommunity}
            disabled={joinLoading}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            {joinLoading ? "Leaving..." : "Leave Community"}
          </button>
        );
      }
    } else {
      return (
        <button
          onClick={handleJoinCommunity}
          disabled={joinLoading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          {joinLoading ? "Joining..." : community?.requires_approval ? "Request to Join" : "Join Community"}
        </button>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-4">
         {renderJoinLeaveButton()}
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">About Community</h3>
        <p className="text-sm text-gray-600 mb-4">{community.description}</p>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span>{community.member_count ?? 0} Members</span>
          </li>
          <li className="flex items-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0115 11h1V9h-1a7 7 0 00-1.28-4.285 3 3 0 00-2.82-2.079V3a1 1 0 10-2 0v-.364A3 3 0 006.1 4.715 7 7 0 005 9v2h1a5 5 0 013.43 1.67 6.97 6.97 0 00-1.5 4.33c0 .34.024.673.07 1H2a1 1 0 00-1 1v3a1 1 0 001 1h16a1 1 0 001-1v-3a1 1 0 00-1-1h-7.07z" />
            </svg>
            <span>Category: {community.category}</span>
          </li>
           <li className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span>Created: {new Date(community.created_at).toLocaleDateString()}</span>
          </li>
          {(community.is_member ?? false) && community.membership_role && (
             <li className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Your role: <span className="font-medium">{community.membership_role.charAt(0).toUpperCase() + community.membership_role.slice(1)}</span></span>
            </li>
          )}
        </ul>
      </div>

       <div className="bg-white shadow rounded-lg overflow-hidden">
         <div className="p-4">
           <h3 className="text-lg font-semibold mb-3">Community Actions</h3>
           {renderSidebarLinks()}
         </div>
       </div>

      {community.rules && (
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Rules</h3>
          <div className="prose prose-sm max-w-none text-gray-600">
             <ReactMarkdown>{community.rules}</ReactMarkdown>
          </div>
        </div>
      )}

      {community.admins && community.admins.length > 0 && (
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Administrators</h3>
          <ul className="space-y-2">
            {community.admins.map(admin => (
              <li key={admin.id} className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600">
                   {admin.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-700">{admin.full_name || admin.username}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CommunitySidebar; 