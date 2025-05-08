"use client";

import React, { memo } from 'react';

interface LoadingSkeletonProps {
  count?: number;
}

// Individual card skeleton for loading state
const CardSkeleton = memo(() => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
    {/* Banner skeleton */}
    <div className="h-32 w-full bg-gray-200"></div>
    
    {/* Avatar skeleton */}
    <div className="relative -mt-10 ml-5">
      <div className="h-20 w-20 rounded-xl bg-gray-300 border-4 border-white"></div>
    </div>
    
    {/* Content skeleton */}
    <div className="p-5 pt-3">
      <div className="flex justify-between items-start">
        <div className="h-6 bg-gray-200 rounded w-2/3"></div>
        <div className="h-5 bg-gray-200 rounded-full w-20"></div>
      </div>
      
      <div className="mt-2 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
      
      <div className="mt-4 flex space-x-4">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  </div>
));

CardSkeleton.displayName = 'CardSkeleton';

// Grid of skeleton cards
const SkeletonGrid = memo(({ count = 6 }: { count: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <CardSkeleton key={index} />
    ))}
  </div>
));

SkeletonGrid.displayName = 'SkeletonGrid';

// Main spinner for initial load
const MainSpinner = memo(() => (
  <div className="bg-white shadow rounded-lg p-8 flex flex-col items-center justify-center">
    <div className="relative w-24 h-24">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg className="w-8 h-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
    </div>
    <h3 className="mt-4 text-lg font-medium text-gray-900">Loading communities...</h3>
    <p className="mt-1 text-sm text-gray-500">Please wait while we fetch the latest communities</p>
  </div>
));

MainSpinner.displayName = 'MainSpinner';

// Combined loading skeleton component
const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ count = 6 }) => {
  // For smaller screens or initial loads, show the spinner
  // For larger screens or subsequent loads, show skeleton cards
  return (
    <div className="w-full">
      <div className="block lg:hidden">
        <MainSpinner />
      </div>
      <div className="hidden lg:block">
        <SkeletonGrid count={count} />
      </div>
    </div>
  );
};

export default memo(LoadingSkeleton); 