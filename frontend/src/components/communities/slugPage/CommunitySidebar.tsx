import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Community } from '@/types/community';

interface CommunitySidebarProps {
  community: Community;
  isAuthenticated: boolean;
  isMember: boolean;
  membershipStatus: string | null;
  onJoinLeave: () => void;
  isProcessing: boolean;
}

const CommunitySidebar: React.FC<CommunitySidebarProps> = ({
  community,
  isAuthenticated,
  isMember,
  membershipStatus,
  onJoinLeave,
  isProcessing,
}) => {
  const router = useRouter();

  const renderSidebarLinks = () => {
    if (!isAuthenticated || !(community?.is_member ?? false) || !community) return null;

    const isAdmin = community.membership_role === "admin";
    const isModerator = community.membership_role === "moderator";

    return (
      <>
        {(isAdmin || isModerator) && (
           <Link href={`/communities/${community.slug}/manage/members`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Manage Members
          </Link>
        )}
         {(isAdmin || isModerator) && (
           <Link href={`/communities/${community.slug}/manage/content`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Manage Content
          </Link>
        )}
        {isAdmin && (
           <Link href={`/communities/${community.slug}/settings`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Community Settings
          </Link>
        )}
         {isAdmin && (
           <Link href={`/communities/${community.slug}/analytics`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
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
          onClick={() => router.push(`/login?redirect=/communities/${community.slug}`)}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          Log in to Join
        </button>
      );
    }

    let buttonText = "Join Community";
    let buttonDisabled = isProcessing;
    let buttonAction = onJoinLeave;
    let buttonClass = "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"; // Default join style
    let Icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
        </svg>
    );

    if (isMember) {
        if (membershipStatus === 'pending') {
            buttonText = "Request Pending";
            buttonDisabled = true; // Cannot cancel request from sidebar
            buttonClass = "bg-yellow-500 cursor-not-allowed"; // Pending style
            Icon = (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        } else {
            buttonText = "Leave Community";
            buttonClass = "bg-red-600 hover:bg-red-700 focus:ring-red-500"; // Leave style
            // buttonAction remains onJoinLeave (which triggers handleLeave in parent)
            Icon = (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
            );
        }
    } else {
         if (community.requires_approval) {
            buttonText = "Request to Join";
         }
        // buttonAction remains onJoinLeave (which triggers handleJoin in parent)
    }
    
    return (
        <button
          onClick={buttonAction}
          disabled={buttonDisabled}
          className={`w-full text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center disabled:opacity-50 transition-all ${buttonClass}`}
        >
           {Icon}
           {isProcessing ? "Processing..." : buttonText}
        </button>
    );
  };

  // Format date to a readable string
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="space-y-4">
      {/* Community actions */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Community Actions</h2>
        </div>
        <div className="p-4 space-y-3">
          <Link href={`/communities/${community.slug}/posts/create`} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center shadow-md transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create Post
          </Link>
          {isMember && (
            <button className="w-full bg-gray-100 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-200 transition duration-200 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              Share Community
            </button>
          )}
        </div>
      </div>

      {/* Quick Info */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Community Info</h2>
        </div>
        <div className="p-4">
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="flex-shrink-0 bg-blue-100 text-blue-600 p-1 rounded mr-3 mt-0.5">
                👥
              </span>
              <div>
                <p className="font-medium text-gray-900">{community.member_count || 0} members</p>
                <p className="text-sm text-gray-500">Join to connect with others</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 bg-green-100 text-green-600 p-1 rounded mr-3 mt-0.5">
                📅
              </span>
              <div>
                <p className="font-medium text-gray-900">Created {formatDate(community.created_at)}</p>
                <p className="text-sm text-gray-500">Community founding date</p>
              </div>
            </li>
            {community.category && (
              <li className="flex items-start">
                <span className="flex-shrink-0 bg-purple-100 text-purple-600 p-1 rounded mr-3 mt-0.5">
                  🏷️
                </span>
                <div>
                  <p className="font-medium text-gray-900 capitalize">{community.category}</p>
                  <p className="text-sm text-gray-500">Community category</p>
                </div>
              </li>
            )}
            <li className="flex items-start">
              <span className="flex-shrink-0 bg-yellow-100 text-yellow-600 p-1 rounded mr-3 mt-0.5">
                {community.is_private ? '🔒' : '🌐'}
              </span>
              <div>
                <p className="font-medium text-gray-900">{community.is_private ? 'Private' : 'Public'} Community</p>
                <p className="text-sm text-gray-500">
                  {community.is_private
                    ? 'Content is only visible to members'
                    : 'Content is visible to anyone'}
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Quick links section */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Quick Links</h2>
        </div>
        <div className="p-4">
          <nav className="space-y-2">
            <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition duration-150">
              Latest Posts
            </a>
            <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition duration-150">
              Community Guidelines
            </a>
            <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition duration-150">
              Contact Moderators
            </a>
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 px-2">
        <p>© {new Date().getFullYear()} Uni Hub</p>
        <p className="mt-1">Building university communities together</p>
      </div>
    </div>
  );
};

export default CommunitySidebar;