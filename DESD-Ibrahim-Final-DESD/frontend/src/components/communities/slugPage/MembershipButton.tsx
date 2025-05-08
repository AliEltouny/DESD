import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MembershipStatus } from '@/types/api';

interface MembershipButtonProps {
  slug: string;
  isMember: boolean;
  membershipStatus: string | null;
  isProcessing: boolean;
  requiresApproval?: boolean;
  onJoinLeave: () => void;
  variant?: 'header' | 'sidebar' | 'mobile'; // Different display variants
  isLoadingAuth?: boolean; // New prop for auth/profile loading
  errorMessage?: string; // Add error message prop
}

/**
 * A dedicated button component for community membership actions
 * Handles all states: join, leave, pending, loading, unauthorized
 */
const MembershipButton: React.FC<MembershipButtonProps> = ({
  slug,
  isMember,
  membershipStatus,
  isProcessing,
  requiresApproval = false,
  onJoinLeave,
  variant = 'sidebar',
  isLoadingAuth,
  errorMessage
}) => {
  const { isAuthenticated } = useAuth();
  
  // Determine button style based on variant and membership state
  const getButtonClasses = () => {
    const baseClasses = "transition-all font-medium";
    
    // If not a member (join button)
    if (!isMember) {
      if (variant === 'header') {
        return `${baseClasses} px-6 py-2 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700`;
      } else if (variant === 'mobile') {
        return `${baseClasses} w-full py-3 rounded-full text-center shadow-md bg-blue-600 text-white hover:bg-blue-700`;
      } else {
        // Sidebar default
        return `${baseClasses} w-full py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700`;
      }
    }
    
    // If member (leave button) or pending
    if (variant === 'header') {
      return `${baseClasses} px-4 py-2 rounded-md text-sm bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30`;
    } else if (variant === 'mobile') {
      return `${baseClasses} w-full py-2.5 rounded-full text-center bg-gray-200 text-gray-700 hover:bg-gray-300`;
    } else {
      // Sidebar default
      return `${baseClasses} w-full py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300`;
    }
  };
  
  // For states where we should disable the button
  const isDisabled = isProcessing || isLoadingAuth || (isMember && membershipStatus === 'pending');
  
  // Button text based on state
  const getButtonText = () => {
    if (isLoadingAuth) {
      return (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      );
    }
    if (isProcessing) {
      return (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      );
    }
    
    if (!isMember) {
      return requiresApproval ? 'Request to Join' : 'Join Community';
    }
    
    if (membershipStatus === 'pending') {
      return 'Pending Approval';
    }
    
    return 'Leave Community';
  };
  
  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <>
      <button
        onClick={onJoinLeave}
        disabled={isDisabled}
        className={`${getButtonClasses()} ${isDisabled ? 'opacity-75 cursor-not-allowed' : ''}`}
        data-testid={`membership-button-${slug}`}
      >
        {getButtonText()}
      </button>
      {/* Show error message if provided */}
      {errorMessage && (
        <div className="text-xs text-red-600 mt-1">{errorMessage}</div>
      )}
    </>
  );
};

export default MembershipButton; 