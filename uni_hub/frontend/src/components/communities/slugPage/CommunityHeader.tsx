import React, { useState } from 'react';
import Image from 'next/image';
import { Community } from '@/types/community';
import { getMediaUrl } from '@/services/api';

interface CommunityHeaderProps {
  community: Community;
  isCreator: boolean;
  handleJoinCommunity: () => Promise<void>;
  joinLoading: boolean;
}

const CommunityHeader: React.FC<CommunityHeaderProps> = ({
  community,
  isCreator,
  handleJoinCommunity,
  joinLoading,
}) => {
  const [imageError, setImageError] = useState(false);
  const [logoError, setLogoError] = useState(false);

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
    // Try cover_image first, then banner, then image
    const imagePath = community.cover_image || community.banner || community.image;
    return imagePath ? getMediaUrl(imagePath) : null;
  };

  // Handle different possible logo property names
  const getLogo = () => {
    // Try logo first, then image as fallback
    const logoPath = community.logo || community.image;
    return logoPath ? getMediaUrl(logoPath) : null;
  };

  return (
    <div className="relative h-60 sm:h-80 bg-gradient-to-r from-blue-500 to-indigo-600 overflow-hidden">
      {/* Cover Image Container */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-r from-cyan-500 to-blue-500">
        {/* Fallback Avatar for Cover */}
        {(!getCoverImage() || imageError) && (
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500 text-4xl font-bold">
            {getCommunityInitials()}
          </div>
        )}
        {/* Community Cover Image */}
        {getCoverImage() && !imageError && (
          <Image
            src={getCoverImage() as string}
            alt={`${community.name} cover`}
            fill
            style={{ objectFit: "cover" }}
            onError={() => setImageError(true)}
            priority // Consider priority for LCP images
          />
        )}
      </div>
      
      {/* Banner Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-8">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 mr-4 bg-white rounded-lg shadow-md overflow-hidden p-1">
            {/* Community Logo */}
            <div className="relative w-16 h-16 rounded-full border-4 border-white bg-gray-200 flex-shrink-0 flex items-center justify-center text-xl font-medium text-gray-600 overflow-hidden">
              {(getLogo() && !logoError) ? (
                <Image
                  src={getLogo() as string}
                  alt={`${community.name} logo`}
                  fill
                  style={{ objectFit: "cover" }}
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span>{getCommunityInitials()}</span>
              )}
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-sm mb-1">
              {community.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {community.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-white bg-opacity-20 text-white">
                  {community.category.charAt(0).toUpperCase() + community.category.slice(1)}
                </span>
              )}
              <span className="text-sm text-white">
                {community.member_count} {community.member_count === 1 ? "member" : "members"}
              </span>
            </div>
          </div>
        </div>
        
        {/* Community Actions - Shown on Banner */}
        <div className="max-w-xl">
          {!isCreator && !community.is_member && (
            <button
              onClick={handleJoinCommunity}
              disabled={joinLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-normal rounded-md shadow-md text-white bg-blue-600 bg-opacity-90 hover:bg-opacity-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 disabled:opacity-50 transition-all"
              style={{ fontWeight: "normal" }}
            >
              {joinLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                  {community.requires_approval ? "Requesting..." : "Joining..."}
                </>
              ) : community.requires_approval ? (
                "Request to Join"
              ) : (
                "Join Community"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityHeader; 