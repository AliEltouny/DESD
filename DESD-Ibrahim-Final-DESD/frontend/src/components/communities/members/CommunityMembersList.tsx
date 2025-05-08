import React, { useState, useEffect, useCallback } from 'react';
import { useCommunityMembers } from '@/hooks/communities/useCommunityMembers';
import { useAuth } from '@/contexts/AuthContext';
import MemberCard from './MemberCard';
import RoleFilter from './RoleFilter';
import { CommunityMember } from '@/types/api';

interface CommunityMembersListProps {
  slug: string;
  onMemberClick?: (member: CommunityMember) => void;
  showRoleFilter?: boolean;
  showJoinDate?: boolean;
  initialRole?: string | null;
  pageSize?: number;
  className?: string;
}

/**
 * Comprehensive community members list with role filtering and pagination
 * Always prioritizes Django backend for data fetching
 */
const CommunityMembersList: React.FC<CommunityMembersListProps> = ({
  slug,
  onMemberClick,
  showRoleFilter = true,
  showJoinDate = true,
  initialRole = null,
  pageSize = 10,
  className = ''
}) => {
  const { 
    members, 
    totalMembers, 
    isLoading, 
    error, 
    currentPage, 
    currentRole,
    setPage, 
    setRole,
    refetch,
    hasNextPage,
    hasPreviousPage
  } = useCommunityMembers({
    slug,
    initialRole,
    pageSize
  });
  
  const { user, isAuthenticated } = useAuth();
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  
  // Calculate member counts by role for the filter sidebar
  // This helps show how many members are in each category
  useEffect(() => {
    // Only update counts when not loading and we have data
    if (!isLoading && members.length > 0) {
      // Get counts by role
      const counts: Record<string, number> = {};
      
      members.forEach(member => {
        const role = member.role || 'unknown';
        if (!counts[role]) {
          counts[role] = 0;
        }
        counts[role]++;
      });
      
      setMemberCounts(counts);
    }
  }, [members, isLoading]);
  
  // Debug helper to diagnose authentication issues
  useEffect(() => {
    // Log authentication info
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1];
    
    console.log('Authentication debug:');
    console.log('- Token exists:', !!token);
    console.log('- Token first 10 chars:', token ? token.substring(0, 10) + '...' : 'N/A');
    console.log('- User object:', user ? `ID: ${user.id}, Username: ${user.username}` : 'No user');
    console.log('- Is authenticated state:', isAuthenticated);
    console.log('- Error state:', error);
  }, [user, isAuthenticated, error]);
  
  // Handle pagination
  const handlePrevPage = () => {
    if (hasPreviousPage) {
      setPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (hasNextPage) {
      setPage(currentPage + 1);
    }
  };

  return (
    <div className={`flex flex-col md:flex-row gap-6 ${className}`}>
      {/* Role filter sidebar */}
      {showRoleFilter && (
        <div className="w-full md:w-64 flex-shrink-0">
          <RoleFilter
            currentRole={currentRole}
            onRoleChange={setRole}
            memberCounts={memberCounts}
            disabled={isLoading}
          />
        </div>
      )}
      
      {/* Members list */}
      <div className="flex-grow">
        {/* Header with total count */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            {currentRole ? 
              `${currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}s` : 
              'All Members'} 
            <span className="text-sm ml-2 text-gray-500">
              ({totalMembers})
            </span>
          </h2>
          
          {/* Refresh button */}
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            disabled={isLoading}
            title="Refresh members"
          >
            <svg 
              className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
        </div>
        
        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {/* Error state */}
        {!isLoading && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
            <button 
              className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
              onClick={() => refetch()}
            >
              Try again
            </button>
          </div>
        )}
        
        {/* Empty state */}
        {!isLoading && !error && members.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <svg 
              className="w-16 h-16 text-gray-400 mx-auto mb-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No members found</h3>
            <p className="text-gray-500">
              {currentRole ? 
                `There are no ${currentRole}s in this community yet.` : 
                'This community has no members yet.'}
            </p>
          </div>
        )}
        
        {/* Members list */}
        {!isLoading && !error && members.length > 0 && (
          <div className="space-y-3">
            {members.map((member) => (
              <MemberCard
                key={member.id || `${member.user.id}-${member.role}`}
                member={member}
                showJoinDate={showJoinDate}
                isCurrentUser={user?.id === member.user.id}
                onClick={onMemberClick ? () => onMemberClick(member) : undefined}
              />
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {!isLoading && !error && totalMembers > 0 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-700">
              Showing {Math.min((currentPage - 1) * pageSize + 1, totalMembers)} to {Math.min(currentPage * pageSize, totalMembers)} of {totalMembers} members
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={!hasPreviousPage}
                className={`p-2 rounded-md border ${
                  hasPreviousPage ? 'border-gray-300 hover:bg-gray-50' : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNextPage}
                disabled={!hasNextPage}
                className={`p-2 rounded-md border ${
                  hasNextPage ? 'border-gray-300 hover:bg-gray-50' : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityMembersList; 