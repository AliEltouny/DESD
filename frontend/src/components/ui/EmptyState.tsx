import React, { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Reusable empty state component with optional action button
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  action,
  className = '',
}) => {
  return (
    <div className={`text-center px-4 py-8 ${className}`}>
      {icon && (
        <div className="flex justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-800 mb-1">{title}</h3>
      {message && (
        <p className="text-sm text-gray-600 mb-4">{message}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

/**
 * Default empty state for communities
 */
export const CommunityEmptyState: React.FC<{ 
  memberOnly?: boolean;
  className?: string;
}> = ({ memberOnly = false, className = '' }) => {
  return (
    <EmptyState
      title={memberOnly ? "No communities joined" : "No communities found"}
      message={
        memberOnly
          ? "You haven't joined any communities yet."
          : "No communities match your search criteria."
      }
      icon={
        <svg 
          className="w-12 h-12 text-gray-400" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
          />
        </svg>
      }
      className={className}
    />
  );
};

export default EmptyState; 