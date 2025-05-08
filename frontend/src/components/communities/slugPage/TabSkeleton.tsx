import React from "react";

interface TabSkeletonProps {
  type?: 'about' | 'members' | 'posts';
}

const TabSkeleton: React.FC<TabSkeletonProps> = ({ type = 'posts' }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
      {type === 'posts' && (
        <div className="space-y-8">
          <div className="h-12 bg-gray-200 rounded-lg w-full mb-8"></div>
          {/* Multiple post skeletons */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-40"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-40 bg-gray-100 rounded-lg w-full"></div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {type === 'about' && (
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-100 rounded-lg p-4 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-40"></div>
                </div>
              ))}
            </div>
            <div className="bg-gray-100 rounded-lg p-4 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      )}
      
      {type === 'members' && (
        <div className="space-y-6">
          <div className="flex justify-between">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-40"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(TabSkeleton); 