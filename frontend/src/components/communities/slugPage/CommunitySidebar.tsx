import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Community } from '@/types/community';
import MembershipButton from './MembershipButton';
import MembershipStatus from './MembershipStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';

interface CommunitySidebarProps {
  community: Community | null;
  isAuthenticated: boolean;
  isMember: boolean;
  membershipStatus: string | null;
  onJoinLeave: () => void;
  isProcessing: boolean;
  errorMessage?: string;
}

const CommunitySidebar: React.FC<CommunitySidebarProps> = ({
  community,
  isAuthenticated,
  isMember,
  membershipStatus,
  onJoinLeave,
  isProcessing,
  errorMessage,
}) => {
  const router = useRouter();
  const { isLoading: isLoadingAuth } = useAuth();
  const { isLoadingProfile } = useUser();
  const isLoading = isLoadingAuth || isLoadingProfile;

  // Don't render sidebar if no community data is available
  if (!community) return null;

  const renderSidebarLinks = () => {
    if (!isAuthenticated || !(community?.is_member ?? false)) return null;

    const isAdmin = community.membership_role === "admin";
    const isModerator = community.membership_role === "moderator";

    return (
      <>
        {(isAdmin || isModerator) && (
          <Link href={`/communities/${community.slug}/manage`} className="block px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 bg-blue-50 rounded mb-1">
            Community Dashboard
          </Link>
        )}
        {isAdmin && (
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
          <Link href={`/communities/${community.slug}/manage/settings`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Community Settings
          </Link>
        )}
        {(isAdmin || isModerator) && community.requires_approval && (
          <Link href={`/communities/${community.slug}/manage/approvals`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Pending Approvals
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
      {/* Community Membership Section */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-medium text-gray-900 mb-3">Membership</h3>
        
        {/* Membership status display */}
        {isAuthenticated && isMember && (
          <MembershipStatus
            isMember={isMember}
            status={membershipStatus}
            role={community.membership_role}
            variant="sidebar"
          />
        )}
        
        {/* Join/Leave button */}
        {isAuthenticated && (
          <div className="mt-2">
            <MembershipButton
              slug={community.slug}
              isMember={isMember}
              membershipStatus={membershipStatus}
              isProcessing={isProcessing}
              requiresApproval={community.requires_approval}
              onJoinLeave={onJoinLeave}
              isLoadingAuth={isLoading}
              errorMessage={errorMessage}
            />
          </div>
        )}
        
        {/* Login to join message if not authenticated */}
        {!isAuthenticated && (
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600 mb-2">
              Sign in to join this community
            </p>
            <Link 
              href="/login" 
              className="w-full py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 block text-center text-sm font-medium"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
      
      {/* Community Management Section (if applicable) */}
      {isAuthenticated && isMember && (community.membership_role === 'admin' || community.membership_role === 'moderator') && (
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-900 mb-2">Manage Community</h3>
          <div className="space-y-1 mt-2">
            {renderSidebarLinks()}
          </div>
        </div>
      )}

      {/* About Section */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-medium text-gray-900 mb-2">About</h3>
        <p className="text-sm text-gray-600">
          {community.description || "No description available"}
        </p>
        
        {/* Additional community metadata */}
        <div className="mt-4 space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <span className="text-gray-500">📅 Created:</span>
            <span className="text-gray-700">
              {new Date(community.created_at).toLocaleDateString()}
            </span>
          </div>
          
          {community.category && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-gray-500">🏷️ Category:</span>
              <span className="text-gray-700 capitalize">{community.category}</span>
            </div>
          )}
          
          <div className="flex items-start gap-2 text-sm">
            <span className="text-gray-500">👥 Members:</span>
            <span className="text-gray-700">{community.member_count || 0}</span>
          </div>
          
          {community.is_private && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-gray-500">🔒 Visibility:</span>
              <span className="text-gray-700">Private community</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Rules Section (if available) */}
      {community.rules && (
        <div className="p-4">
          <h3 className="font-medium text-gray-900 mb-2">Community Rules</h3>
          <div className="text-sm text-gray-600">
            {Array.isArray(community.rules) ? (
              <ul className="list-disc list-inside space-y-1">
                {community.rules.map((rule, index) => (
                  <li key={index}>{rule}</li>
                ))}
              </ul>
            ) : (
              <p>{community.rules}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunitySidebar; 