import React from 'react';

interface PostCardSkeletonProps {
  className?: string;
}

/**
 * A skeleton loader for post cards that displays while content is loading
 * Matches the visual structure of the PostCard component for a smooth transition
 */
const PostCardSkeleton: React.FC<PostCardSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-5 overflow-hidden animate-pulse ${className}`}>
      {/* Header skeleton */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          {/* Avatar skeleton */}
          <div className="w-10 h-10 rounded-full bg-gray-200"></div>
          <div>
            {/* Author name skeleton */}
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            {/* Date skeleton */}
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
        {/* Type badge skeleton */}
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      </div>
      
      {/* Title and content skeleton */}
      <div className="mt-4">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
        
        {/* Content skeleton - 3 lines */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
      
      {/* Optional image skeleton - shown ~30% of the time */}
      {Math.random() > 0.7 && (
        <div className="mt-4 h-48 bg-gray-200 rounded-lg"></div>
      )}
      
      {/* Footer skeleton */}
      <div className="mt-4 flex justify-between">
        <div className="h-5 bg-gray-200 rounded w-20"></div>
        <div className="h-5 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  );
};

export default PostCardSkeleton; 