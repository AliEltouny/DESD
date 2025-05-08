import React from 'react';
import { User } from '@/types/user';
import { getMediaUrl } from '@/services/api';
import Link from 'next/link';

interface UserCardProps {
  user: User;
  compact?: boolean;
  className?: string;
  onClick?: () => void;
  showCommunities?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  compact = false, 
  className = "",
  onClick,
  showCommunities = false
}) => {
  const handleClick = () => {
    if (onClick) onClick();
  };

  // Display full or compact version based on props
  if (compact) {
    return (
      <div 
        className={`flex items-center p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer ${className}`}
        onClick={handleClick}
      >
        <div className="flex-shrink-0 mr-3">
          {user.profile_picture ? (
            <img 
              src={getMediaUrl(user.profile_picture)}
              alt={user.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
              {user.first_name?.[0] || ''}{user.last_name?.[0] || user.username?.[0] || 'U'}
            </div>
          )}
        </div>
        <div>
          <div className="font-medium text-gray-800">
            {user.first_name} {user.last_name}
          </div>
          <div className="text-sm text-gray-500">@{user.username}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`}>
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-4">
            {user.profile_picture ? (
              <img 
                src={getMediaUrl(user.profile_picture)}
                alt={user.username}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl font-semibold">
                {user.first_name?.[0] || ''}{user.last_name?.[0] || user.username?.[0] || 'U'}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xl font-medium text-gray-800">
              {user.first_name} {user.last_name}
            </h3>
            <p className="text-gray-500">@{user.username}</p>
          </div>
        </div>

        {user.bio && (
          <div className="mt-4">
            <p className="text-gray-600 line-clamp-3">{user.bio}</p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          {user.study_program && (
            <div>
              <span className="text-sm text-gray-500">Program:</span>
              <span className="ml-2 text-sm font-medium">{user.study_program}</span>
            </div>
          )}
          {user.academic_year && (
            <div>
              <span className="text-sm text-gray-500">Year:</span>
              <span className="ml-2 text-sm font-medium">{user.academic_year}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
          <Link 
            href={`/users/${user.username}`} 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Profile
          </Link>
          <button 
            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            onClick={handleClick}
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;