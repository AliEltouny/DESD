import React from 'react';

interface MembershipStatusProps {
  isMember: boolean;
  status: string | null;
  role: string | null;
  showRole?: boolean;
  variant?: 'default' | 'compact' | 'sidebar';
}

/**
 * Component to display a user's membership status in a community
 * Shows appropriate badges for status and optional role using native Tailwind classes
 */
const MembershipStatus: React.FC<MembershipStatusProps> = ({
  isMember,
  status,
  role,
  showRole = true,
  variant = 'default'
}) => {
  if (!isMember) {
    return null;
  }

  // Status badge styling and text
  const getStatusBadge = () => {
    if (!status) return null;

    let bgColor = '';
    let textColor = '';
    let statusText = '';

    switch (status.toLowerCase()) {
      case 'approved':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        statusText = 'Member';
        break;
      case 'pending':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        statusText = 'Pending Approval';
        break;
      case 'rejected':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        statusText = 'Rejected';
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
        statusText = status;
    }

    const badgeClasses = `${bgColor} ${textColor} font-medium ${variant === 'compact' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'} inline-flex items-center rounded-full transition-colors`;

    return (
      <span className={badgeClasses}>
        {statusText}
      </span>
    );
  };

  // Role badge styling and text
  const getRoleBadge = () => {
    if (!role || !showRole) return null;

    let bgColor = '';
    let textColor = '';
    let iconElement = null;

    switch (role.toLowerCase()) {
      case 'admin':
        bgColor = 'bg-purple-100';
        textColor = 'text-purple-800';
        iconElement = (
          <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
        break;
      case 'moderator':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        iconElement = (
          <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        );
        break;
      default:
        return null; // Don't show badge for regular members
    }

    const badgeClasses = `${bgColor} ${textColor} font-medium flex items-center ${variant === 'compact' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'} ml-2 inline-flex rounded-full transition-colors`;

    return (
      <span className={badgeClasses}>
        {iconElement}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  // Layout based on variant
  if (variant === 'sidebar') {
    return (
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-500 mb-2">Membership Status</p>
        <div className="flex flex-wrap gap-2">
          {getStatusBadge()}
          {getRoleBadge()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center flex-wrap">
      {getStatusBadge()}
      {getRoleBadge()}
    </div>
  );
};

export default MembershipStatus; 