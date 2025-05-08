import React from 'react';
import { User } from '@/types/user';
import { getMediaUrl } from '@/services/api';
import Link from 'next/link';

interface UserMiniCardProps {
  user: User;
  className?: string;
  onClick?: () => void;
  showActions?: boolean;
}

const UserMiniCard: React.FC<UserMiniCardProps> = ({ 
  user, 
  className = "",
  onClick,
  showActions = true
}) => {
  return (
    <div className={`flex items-center bg-white rounded-lg p-3 shadow-sm ${className}`}>
      <div className="flex-shrink-0 mr-3">
        {user.profile_picture ? (
          <img 
            src={getMediaUrl(user.profile_picture)} 
            alt={user.username} 
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
            {user.first_name?.[0] || ''}{user.last_name?.[0] || user.username?.[0] || 'U'}
          </div>
        )}
      </div>
      
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">
          {user.first_name} {user.last_name}
        </h4>
        <p className="text-sm text-gray-500">@{user.username}</p>
        {user.academic_year && (
          <p className="text-xs text-gray-500">Year {user.academic_year}</p>
        )}
      </div>
      
      {showActions && (
        <div className="flex space-x-2">
          <Link 
            href={`/users/${user.username}`}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Profile
          </Link>
          <button 
            onClick={onClick}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            Message
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMiniCard;