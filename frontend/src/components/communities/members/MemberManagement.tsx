import React, { useState, useEffect } from 'react';
import { CommunityMember } from '@/types/api';
import MemberCard from './MemberCard';
import { useAuth } from '@/contexts/AuthContext';

interface MemberManagementProps {
  members: CommunityMember[];
  onRoleChange: (userId: number, newRole: string) => Promise<boolean>;
  slug: string;
  refetchMembers: () => void;
  currentUserRole?: string;
  isLoading?: boolean;
}

const VALID_ROLES = ['admin', 'moderator', 'member'];

/**
 * Component for managing community members with role change functionality
 * Enhanced with better UI for loading states and transitions
 */
const MemberManagement: React.FC<MemberManagementProps> = ({
  members,
  onRoleChange,
  slug,
  refetchMembers,
  currentUserRole = 'member',
  isLoading = false
}) => {
  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const [isUpdating, setIsUpdating] = useState<Record<number, boolean>>({});
  const [adminCount, setAdminCount] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Calculate admin count for safety checks
  useEffect(() => {
    const count = members.filter(m => m.role === 'admin').length;
    setAdminCount(count);
  }, [members]);

  // Clear success message after a delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (!VALID_ROLES.includes(newRole)) {
      setActionError('Invalid role selected');
      return;
    }

    // Safety checks
    const targetMember = members.find(m => m.user.id === userId);
    const isLastAdmin = adminCount <= 1 && targetMember?.role === 'admin' && newRole !== 'admin';
    const isCurrentUser = userId === user?.id;
    
    // Prevent demoting the last admin
    if (isLastAdmin) {
      setActionError("You cannot change the role of the last admin. Make someone else an admin first.");
      return;
    }

    // Start update - track by userId for individual loading states
    setIsUpdating(prev => ({ ...prev, [userId]: true }));
    setActionError(null);
    
    try {
      const success = await onRoleChange(userId, newRole);
      if (success) {
        setActionError(null);
        setSelectedMember(null);
        setSuccessMessage(`Role updated to ${newRole} successfully`);
      } else {
        setActionError('Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      setActionError('An error occurred while updating the role');
    } finally {
      setIsUpdating(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    }
  };

  // Custom function to get role label with color
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="font-medium text-purple-700">Admin</span>;
      case 'moderator':
        return <span className="font-medium text-blue-700">Moderator</span>;
      default:
        return <span className="font-medium text-green-700">Member</span>;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Manage Members</h2>
      
      {/* Success message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 animate-fadeIn">
          <p className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </p>
        </div>
      )}
      
      {/* Error message */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 animate-fadeIn">
          <p className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {actionError}
          </p>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && members.length === 0 && (
        <div className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-center text-gray-500 mt-4">Loading members...</p>
        </div>
      )}
      
      {/* Members list with transition effects */}
      <div className="space-y-3">
        {members.map((member) => (
          <div 
            key={member.user.id} 
            className="flex items-center space-x-4 transition-all duration-200 hover:shadow-md rounded-lg p-1"
          >
            <div className="flex-grow">
              <MemberCard
                member={member}
                showJoinDate={true}
                isCurrentUser={user?.id === member.user.id}
              />
            </div>
            
            {/* Role management dropdown with loading state */}
            <div className="flex-shrink-0 relative">
              <select
                className={`block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-sm transition-colors ${
                  isUpdating[member.user.id] ? 'bg-gray-100 text-gray-400' : ''
                }`}
                value={member.role || 'member'}
                onChange={(e) => handleRoleChange(member.user.id, e.target.value)}
                disabled={isUpdating[member.user.id] || 
                  // Prevent changing own role if last admin
                  (user?.id === member.user.id && member.role === 'admin' && adminCount <= 1)}
                title={
                  user?.id === member.user.id && member.role === 'admin' && adminCount <= 1
                    ? "You cannot change your role as the only admin"
                    : `Change ${member.user.username}'s role`
                }
              >
                <option value="member">Member</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
              
              {/* Loading indicator */}
              {isUpdating[member.user.id] && (
                <div className="absolute top-1/2 right-3 transform -translate-y-1/2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isLoading && members.length === 0 && (
        <div className="p-4 bg-gray-50 rounded-md text-center text-gray-500">
          No members found
        </div>
      )}

      {/* Helper text */}
      <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-md text-sm">
        <p className="font-medium mb-1">Role management guidelines:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><span className="font-semibold">Admin:</span> Full community control, can manage members and settings</li>
          <li><span className="font-semibold">Moderator:</span> Can manage content but not community settings</li>
          <li><span className="font-semibold">Member:</span> Regular member with basic access</li>
          <li className="text-red-600 font-medium pt-2">Note: A community must always have at least one admin</li>
        </ul>
      </div>
    </div>
  );
};

export default MemberManagement; 