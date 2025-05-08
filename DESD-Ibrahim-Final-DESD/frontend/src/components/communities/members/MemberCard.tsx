import React from 'react';
import Image from 'next/image';
import { CommunityMember } from '@/types/api';
import { getMediaUrl } from '@/services/api';

interface MemberCardProps {
  member: CommunityMember;
  onClick?: () => void;
  showJoinDate?: boolean;
  isCurrentUser?: boolean;
  className?: string;
}

/**
 * Component to display a community member with role badge and optional join date
 */
const MemberCard: React.FC<MemberCardProps> = ({
  member,
  onClick,
  showJoinDate = false,
  isCurrentUser = false,
  className = '',
}) => {
  if (!member?.user) return null;

  // Format join date nicely if we have it
  const formatJoinDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get role badge styling and text
  const getRoleBadge = () => {
    if (!member.role) return null;

    let badgeClass = '';
    let badgeText = '';

    switch (member.role.toLowerCase()) {
      case 'admin':
        badgeClass = 'bg-purple-100 text-purple-800';
        badgeText = 'Admin';
        break;
      case 'moderator':
        badgeClass = 'bg-blue-100 text-blue-800';
        badgeText = 'Moderator';
        break;
      case 'member':
        badgeClass = 'bg-green-100 text-green-800';
        badgeText = 'Member';
        break;
      default:
        badgeClass = 'bg-gray-100 text-gray-800';
        badgeText = member.role;
    }

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badgeClass}`}>
        {badgeText}
      </span>
    );
  };

  // Get status badge if not approved
  const getStatusBadge = () => {
    if (!member.status || member.status === 'approved') return null;

    let badgeClass = '';
    let badgeText = '';

    switch (member.status.toLowerCase()) {
      case 'pending':
        badgeClass = 'bg-yellow-100 text-yellow-800';
        badgeText = 'Pending';
        break;
      case 'rejected':
        badgeClass = 'bg-red-100 text-red-800';
        badgeText = 'Rejected';
        break;
      default:
        badgeClass = 'bg-gray-100 text-gray-800';
        badgeText = member.status;
    }

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badgeClass}`}>
        {badgeText}
      </span>
    );
  };

  // Get avatar URL with fallback
  const getAvatarUrl = () => {
    return member.user.avatar 
      ? getMediaUrl(member.user.avatar) 
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user.username)}&background=random`;
  };

  return (
    <div 
      className={`p-3 rounded-lg border border-gray-200 flex items-center ${isCurrentUser ? 'bg-blue-50' : 'bg-white'} ${onClick ? 'cursor-pointer hover:border-blue-300 transition-colors' : ''} ${className}`}
      onClick={onClick}
      data-testid="member-card"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mr-4">
        <div className="h-12 w-12 rounded-full overflow-hidden border border-gray-200">
          <img 
            src={getAvatarUrl()} 
            alt={member.user.username}
            className="h-full w-full object-cover" 
          />
        </div>
      </div>

      {/* User info */}
      <div className="flex-grow">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="font-medium text-gray-900">{member.user.full_name || member.user.username}</h3>
          {isCurrentUser && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              You
            </span>
          )}
          {getRoleBadge()}
          {getStatusBadge()}
        </div>
        <p className="text-sm text-gray-500">@{member.user.username}</p>
        
        {/* Join date (optional) */}
        {showJoinDate && member.joined_at && (
          <p className="text-xs text-gray-500 mt-1">
            Joined {formatJoinDate(member.joined_at)}
          </p>
        )}
      </div>
      
      {/* Action indicator */}
      {onClick && (
        <div className="flex-shrink-0 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default MemberCard; 