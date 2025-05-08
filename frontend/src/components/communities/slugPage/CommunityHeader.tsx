import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Community } from '@/types/community';
import { getMediaUrl } from '@/services/api';

interface CommunityHeaderProps {
  community: Community;
  isMember: boolean;
  membershipStatus?: string | null;
  isAuthenticated?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
  joinLoading?: boolean;
  leaveLoading?: boolean;
  actionError?: string | null;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onJoinLeave?: () => void; // Support for backward compatibility
}

const CommunityHeader: React.FC<CommunityHeaderProps> = ({
  community,
  isMember,
  membershipStatus,
  isAuthenticated = true,
  onJoin,
  onLeave,
  joinLoading = false,
  leaveLoading = false,
  actionError,
  activeTab,
  onTabChange,
  onJoinLeave
}) => {
  const [imageError, setImageError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  
  // Detect which method to use for join/leave
  const isUsingJoinLeave = !!onJoinLeave;
  const isProcessing = joinLoading || leaveLoading;

  const getCommunityInitials = () => {
    if (!community?.name) return "";
    return community.name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  // Handle different possible image property names
  const getCoverImage = () => {
    try {
      // Try cover_image first, then banner, then image
      const imagePath = community?.cover_image || community?.banner || community?.image;
      return imagePath ? getMediaUrl(imagePath) : null;
    } catch (err) {
      console.error("Error getting cover image:", err);
      return null;
    }
  };

  // Handle different possible logo property names
  const getLogo = () => {
    try {
      // Try logo first, then image as fallback
      const logoPath = community?.logo || community?.image;
      return logoPath ? getMediaUrl(logoPath) : null;
    } catch (err) {
      console.error("Error getting logo image:", err);
      return null;
    }
  };

  const handleJoinClick = () => {
    if (isUsingJoinLeave) {
      onJoinLeave?.();
    } else {
      onJoin?.();
    }
  };

  const handleLeaveClick = () => {
    if (isUsingJoinLeave) {
      onJoinLeave?.();
    } else {
      onLeave?.();
    }
  };

  return (
    <>
      {/* Full screen banner that guarantees edge to edge coverage */}
      <div className="w-full relative">
        <div 
          className="absolute left-0 right-0 h-80 md:h-96 w-[100vw]" 
          style={{ 
            left: "50%",
            transform: "translateX(-50%)",
            marginLeft: "0",
            marginRight: "0"
          }}
        >
          {getCoverImage() && !imageError ? (
            <div className="absolute inset-0 w-full h-full">
              <Image
                src={getCoverImage() as string}
                alt={`${community?.name || 'Community'} banner`}
                fill
                style={{ objectFit: "cover" }}
                priority
                onError={() => setImageError(true)}
                className="object-center"
              />
            </div>
          ) : (
            <div className="absolute inset-0 w-full h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-800 via-purple-700 to-pink-600"></div>
              <div className="absolute inset-0 opacity-10" 
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`
                  }}>
              </div>
            </div>
          )}
          
          {/* Darker overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent"></div>
        </div>
        
        {/* Fixed-height container for consistent spacing */}
        <div className="relative h-80 md:h-96">
          {/* Community info positioned over the banner */}
          <div className="container mx-auto px-4 relative h-full flex flex-col justify-end pb-8">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              {/* Community logo/avatar with fixed position */}
              <div className="absolute" style={{ bottom: '-60px', left: '12px' }}>
                <div className="h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden border-4 border-white bg-white shadow-2xl relative z-30">
                  {getLogo() && !logoError ? (
                    <img
                      src={getLogo() as string}
                      alt={`${community?.name || 'Community'} logo`}
                      className="w-full h-full object-cover"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                      <span className="text-5xl font-bold text-white">
                        {getCommunityInitials()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Community details */}
              <div className="flex-grow text-white pb-6 z-10 text-center md:text-left ml-0 md:ml-44 mt-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-lg">
                      {community?.name || 'Loading...'}
                    </h1>
                    <p className="text-gray-200 text-sm md:text-base mb-3 max-w-3xl drop-shadow">
                      {community?.short_description || community?.description?.substring(0, 150) || 'No description available'}
                      {community?.description?.length > 150 && "..."}
                    </p>
                    
                    {/* Community stats */}
                    <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start mb-4">
                      <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <span className="mr-2">👥</span>
                        <span>{community?.member_count || 0} members</span>
                      </div>
                      {community?.category && (
                        <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <span className="mr-2">🏷️</span>
                          <span className="capitalize">{community.category}</span>
                        </div>
                      )}
                      {community?.is_private && (
                        <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <span className="mr-2">🔒</span>
                          <span>Private community</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Leave Community button moved to top right */}
                  {isAuthenticated && isMember && (
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={handleLeaveClick}
                        disabled={isProcessing}
                        className={`px-4 py-2 rounded-md font-medium text-sm transition-all bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30 ${
                          isProcessing ? 'opacity-75 cursor-not-allowed' : ''
                        }`}
                      >
                        {isProcessing ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : membershipStatus === 'pending' ? 
                          'Pending Approval' : 
                          'Leave Community'
                        }
                      </button>
                    </div>
                  )}
                  
                  {/* Join button for non-members */}
                  {isAuthenticated && !isMember && (
                    <div className="hidden md:block ml-auto mt-4 md:mt-0">
                      <button
                        onClick={handleJoinClick}
                        disabled={isProcessing}
                        className={`px-6 py-2 rounded-full font-medium transition-all shadow-lg bg-blue-600 text-white hover:bg-blue-700 ${
                          isProcessing ? 'opacity-75 cursor-not-allowed' : ''
                        }`}
                      >
                        {isProcessing ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          community.requires_approval ? 'Request to Join' : 'Join Community'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ENHANCED ELEVATED NAVIGATION that matches the screenshot - positioned above the profile picture */}
        {onTabChange && activeTab && (
          <div className="absolute left-0 right-0 mx-auto" style={{ bottom: "-28px", zIndex: 40 }}>
            <div className="container mx-auto px-4">
              <div className="flex justify-center">
                <div className="bg-white rounded-full shadow-lg border border-gray-100 overflow-hidden max-w-md mx-auto">
                  <div className="flex">
                    <button
                      onClick={() => onTabChange('posts')}
                      className={`flex items-center justify-center relative px-6 py-3.5 font-medium transition-colors ${
                        activeTab === 'posts' 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-2" fill={activeTab === 'posts' ? 'white' : '#4b5563'} viewBox="0 0 24 24">
                        <path d="M8.51 20h-.08a10.87 10.87 0 0 1-4.65-1.09A1.38 1.38 0 0 1 3 17.47V5.33a1.36 1.36 0 0 1 1.33-1.33h7.34A1.36 1.36 0 0 1 13 5.33v1.34h1.33a4 4 0 0 1 4 4v3.53l.8.8a1.77 1.77 0 0 1 0 2.5l-1.8 1.8a6.91 6.91 0 0 1-2.4 5.05 1 1 0 0 1-1.09.19 1 1 0 0 1-.61-.93v-2" stroke={activeTab === 'posts' ? 'white' : '#4b5563'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"/>
                      </svg>
                      Posts
                    </button>
                    <button 
                      onClick={() => onTabChange('about')}
                      className={`flex items-center justify-center relative px-6 py-3.5 font-medium transition-colors ${
                        activeTab === 'about' 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke={activeTab === 'about' ? 'white' : '#4b5563'}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      About
                    </button>
                    <button
                      onClick={() => onTabChange('members')}
                      className={`flex items-center justify-center relative px-6 py-3.5 font-medium transition-colors ${
                        activeTab === 'members' 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke={activeTab === 'members' ? 'white' : '#4b5563'}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Members
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Spacer div to push content below the profile pic */}
      <div className="h-20 md:h-16 bg-transparent"></div>
      
      {/* Mobile Join button - only visible on smaller screens for non-members */}
      {isAuthenticated && !isMember && (
        <div className="md:hidden px-4 pt-2 pb-4 flex justify-center">
          <button
            onClick={handleJoinClick}
            disabled={isProcessing}
            className={`w-full py-3 rounded-full font-medium text-center shadow-md bg-blue-600 text-white hover:bg-blue-700 ${
              isProcessing ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              community.requires_approval ? 'Request to Join' : 'Join Community'
            )}
          </button>
        </div>
      )}
      
      {/* Show error message if there is one */}
      {actionError && (
        <div className="fixed top-20 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md">
          <p>{actionError}</p>
        </div>
      )}
    </>
  );
};

export default CommunityHeader;