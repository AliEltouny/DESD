import React, { memo, useCallback } from 'react';
import CommunityList from '../CommunityList'; // Adjust path relative to CommunityList

interface DiscoverCommunitiesSectionProps {
  memberOnly: boolean;
  isAuthenticated: boolean; // Needed to conditionally show the filter checkbox
  onFilterChange: (checked: boolean) => void;
}

/**
 * Displays communities for discovery with filtering options
 * Memoized to prevent unnecessary re-renders
 */
const DiscoverCommunitiesSection: React.FC<DiscoverCommunitiesSectionProps> = memo(({ 
  memberOnly, 
  isAuthenticated, 
  onFilterChange 
}) => {
  // Memoize the change handler to prevent recreating on each render
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange(e.target.checked);
  }, [onFilterChange]);

  return (
    <section className="mb-8 community-card-container">
      {/* CommunityList component for discovering communities */}
      <CommunityList
        title="Discover Communities"
        showFilters={true} // Assuming filters are handled within CommunityList or globally
        memberOnly={memberOnly}
      />

      {/* Filter Checkbox - only shown if authenticated */}
      {isAuthenticated && (
        <div className="mt-4 flex items-center">
          <input
            type="checkbox"
            id="discover-member-only-filter" // Unique ID
            checked={memberOnly}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            aria-label="Show only my communities"
          />
          <label
            htmlFor="discover-member-only-filter"
            className="ml-2 block text-sm text-gray-900"
          >
            Show only communities I&apos;m a member of
          </label>
        </div>
      )}
    </section>
  );
});

DiscoverCommunitiesSection.displayName = 'DiscoverCommunitiesSection';

export default DiscoverCommunitiesSection; 