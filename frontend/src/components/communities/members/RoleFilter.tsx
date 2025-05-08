import React from 'react';

interface RoleFilterProps {
  currentRole: string | null;
  onRoleChange: (role: string | null) => void;
  memberCounts?: Record<string, number>;
  disabled?: boolean;
}

/**
 * Component for filtering community members by role
 */
const RoleFilter: React.FC<RoleFilterProps> = ({
  currentRole,
  onRoleChange,
  memberCounts = {},
  disabled = false
}) => {
  // Role definitions with icons and text
  const roles = [
    { 
      id: null, 
      name: 'All', 
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 20H22V18C22 16.3431 20.6569 15 19 15C18.0444 15 17.1931 15.4468 16.6438 16.1429M17 20H7M17 20V18C17 17.3438 16.8736 16.717 16.6438 16.1429M7 20H2V18C2 16.3431 3.34315 15 5 15C5.95561 15 6.80686 15.4468 7.35625 16.1429M7 20V18C7 17.3438 7.12642 16.717 7.35625 16.1429M7.35625 16.1429C8.0935 14.301 9.89482 13 12 13C14.1052 13 15.9065 14.301 16.6438 16.1429M15 7C15 8.65685 13.6569 10 12 10C10.3431 10 9 8.65685 9 7C9 5.34315 10.3431 4 12 4C13.6569 4 15 5.34315 15 7ZM21 10C21 11.1046 20.1046 12 19 12C17.8954 12 17 11.1046 17 10C17 8.89543 17.8954 8 19 8C20.1046 8 21 8.89543 21 10ZM7 10C7 11.1046 6.10457 12 5 12C3.89543 12 3 11.1046 3 10C3 8.89543 3.89543 8 5 8C6.10457 8 7 8.89543 7 10Z" 
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      id: 'admin', 
      name: 'Admins', 
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 12L11 14L15 10M12 3L4 10V20H9V16C9 15.4477 9.44772 15 10 15H14C14.5523 15 15 15.4477 15 16V20H20V10L12 3Z" 
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      id: 'moderator', 
      name: 'Moderators', 
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.5 7L18.5 10M13.5 9L15.5 11M11.5 11L13.5 13M9.5 13L11.5 15M7.5 15L9.5 17M5.5 17L7.5 19M19 6L8 17L4 13" 
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      id: 'member', 
      name: 'Members', 
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" 
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" 
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      id: 'pending', 
      name: 'Pending', 
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 8V12L15 15M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z" 
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <h3 className="px-4 py-2 font-medium text-gray-700 bg-gray-50 border-b border-gray-200">
        Filter by Role
      </h3>
      <div className="p-2">
        <div className="flex flex-col space-y-1">
          {roles.map((role) => {
            const isActive = currentRole === role.id;
            const count = role.id === null 
              ? Object.values(memberCounts).reduce((a, b) => a + b, 0) || 0
              : memberCounts[role.id] || 0;
              
            return (
              <button
                key={role.id || 'all'}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => onRoleChange(role.id)}
                disabled={disabled}
                data-testid={`role-filter-${role.id || 'all'}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                    {role.icon}
                  </div>
                  <span>{role.name}</span>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RoleFilter; 