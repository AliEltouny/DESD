import React, { useState } from 'react';
import { User } from '@/types/user';
import { UserCard } from '@/components/users';
import { userApi } from '@/services/api';

interface UserSearchComponentProps {
  onUserSelect?: (user: User) => void;
  className?: string;
}

const UserSearchComponent: React.FC<UserSearchComponentProps> = ({ 
  onUserSelect,
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      // Using the correct searchUsersByQuery method instead of the incorrect endpoint
      const searchResults = await userApi.searchUsersByQuery(query);
      console.log(`Found ${searchResults.length} users in search component for query:`, query);
      setResults(searchResults);
    } catch (err) {
      console.error("Error searching users:", err);
      setError("Failed to search for users");
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserClick = (user: User) => {
    if (onUserSelect) {
      onUserSelect(user);
    }
    // Clear search after selection
    setQuery('');
    setResults([]);
  };

  return (
    <div className={`${className}`}>
      <form onSubmit={handleSearch} className="flex gap-2 mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for users..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          disabled={isSearching || !query.trim()}
        >
          {isSearching ? "..." : "Search"}
        </button>
      </form>

      {error && (
        <div className="text-red-500 text-sm mb-2">{error}</div>
      )}

      {results.length > 0 && (
        <div className="mt-3 border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
          {results.map(user => (
            <UserCard
              key={user.id}
              user={user}
              compact
              onClick={() => handleUserClick(user)}
            />
          ))}
        </div>
      )}

      {query && results.length === 0 && !isSearching && !error && (
        <div className="text-sm text-gray-500 p-2">
          No users found matching "{query}"
        </div>
      )}
    </div>
  );
};

export default UserSearchComponent;