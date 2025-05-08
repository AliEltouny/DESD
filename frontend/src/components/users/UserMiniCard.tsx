import React, { useState, useEffect } from 'react';
import { User } from '@/types/user';
import { getMediaUrl, communityApi } from '@/services/api';
import Link from 'next/link';

interface UserMiniCardProps {
  user: User;
  className?: string;
  onClick?: () => void;
  showActions?: boolean;
  showCommunities?: boolean;
}

const UserMiniCard: React.FC<UserMiniCardProps> = ({ 
  user, 
  className = "",
  onClick,
  showActions = true,
  showCommunities = false
}) => {
  const [userCommunities, setUserCommunities] = useState<any[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);

  useEffect(() => {
    // Only fetch communities if the prop is enabled
    if (showCommunities && user?.id) {
      fetchUserCommunities();
    }
  }, [user?.id, showCommunities]);

  const fetchUserCommunities = async () => {
    try {
      setLoadingCommunities(true);
      // We'll pass the user ID to a backend endpoint that supports filtering by user
      // This is a placeholder implementation - will need proper backend support
      const communities = await communityApi.getCommunities({ 
        member_id: user.id,
        limit: 3 // Limit to 3 communities for the card
      });
      setUserCommunities(communities);
    } catch (err) {
      console.error("Failed to load user communities:", err);
    } finally {
      setLoadingCommunities(false);
    }
  };

  return (
    <div className={`flex flex-col bg-white rounded-lg p-3 shadow-sm ${className}`}>
      <div className="flex items-center">
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
      
      {showCommunities && (
        <>
          {loadingCommunities ? (
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <div className="animate-spin h-3 w-3 border-t-2 border-blue-500 rounded-full mr-2"></div>
              Loading communities...
            </div>
          ) : userCommunities.length > 0 ? (
            <div className="mt-2 border-t pt-2">
              <h5 className="text-xs font-medium text-gray-700">Communities</h5>
              <div className="flex flex-wrap gap-1 mt-1">
                {userCommunities.map(community => (
                  <Link 
                    key={community.id}
                    href={`/communities/${community.slug}`}
                    className="text-xs bg-gray-100 rounded-full px-2 py-0.5 hover:bg-gray-200 transition-colors"
                  >
                    {community.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default UserMiniCard;