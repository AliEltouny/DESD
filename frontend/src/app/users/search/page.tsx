"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { userApi } from "@/services/api";
import { User } from "@/types/user";
import { UserCard } from "@/components/users";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortOption, setSortOption] = useState("name");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchType, setSearchType] = useState("all");
  const router = useRouter();

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentUserSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  // Save search query to recent searches
  const saveSearchQuery = (query: string) => {
    if (!query.trim() || recentSearches.includes(query)) return;
    
    const updatedSearches = [query, ...recentSearches].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentUserSearches', JSON.stringify(updatedSearches));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    saveSearchQuery(searchQuery);

    try {
      // Pass searchType to API call
      const results = await userApi.searchUsersByQuery(searchQuery, searchType);
      setUsers(results);
      
      if (results.length === 0) {
        console.log("No users found matching query:", searchQuery);
      } else {
        console.log(`Found ${results.length} users matching query:`, searchQuery);
      }
    } catch (err) {
      console.error("Error searching users:", err);
      setError("Failed to search users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = (user: User) => {
    // Navigate to user profile
    router.push(`/users/${user.username}`);
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentUserSearches');
  };

  // Filter users based on selected filter
  const filteredUsers = users.filter(user => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'students' && user.academic_year) return true;
    if (selectedFilter === 'staff' && user.is_staff) return true;
    if (selectedFilter === 'with_communities' && user.communities?.length > 0) return true;
    return false;
  });

  // Sort users based on selected sort option
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortOption === 'name') {
      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
    }
    if (sortOption === 'username') {
      return a.username.localeCompare(b.username);
    }
    if (sortOption === 'academic_year') {
      const yearA = a.academic_year || 0;
      const yearB = b.academic_year || 0;
      return yearB - yearA;
    }
    return 0;
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find People</h1>
        <p className="text-gray-600 mb-6">Search for other students and staff members</p>

        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search by ${searchType === 'all' ? 'name, username, or interest' : searchType}`}
                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
            >
              <option value="all">All Fields</option>
              <option value="username">Username</option>
              <option value="name">Name</option>
              <option value="full_name">Full Name</option>
              <option value="interest">Interest</option>
            </select>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
              disabled={isLoading || !searchQuery.trim()}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Searching...
                </>
              ) : (
                <>Search</>
              )}
            </button>
          </form>

          {recentSearches.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Recent searches:</p>
                <button 
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {recentSearches.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(query);
                      handleSearch({ preventDefault: () => {} } as React.FormEvent);
                    }}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 animate-fade-in">
            {error}
          </div>
        )}

        {users.length > 0 && !isLoading && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <p className="text-gray-600">Found <span className="font-semibold">{users.length}</span> users for "<span className="italic">{searchQuery}</span>"</p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Users</option>
                  <option value="students">Students</option>
                  <option value="staff">Staff</option>
                  <option value="with_communities">With Communities</option>
                </select>
                
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name">Sort by Name</option>
                  <option value="username">Sort by Username</option>
                  <option value="academic_year">Sort by Academic Year</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedUsers.map((user) => (
                <UserCard 
                  key={user.id} 
                  user={user} 
                  onClick={() => handleUserClick(user)}
                  showCommunities={true}
                  className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                />
              ))}
            </div>
          </div>
        )}

        {users.length === 0 && searchQuery && !isLoading && !error && (
          <div className="bg-white shadow-sm rounded-lg p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
            <p className="text-gray-500 mb-4">No users matching "{searchQuery}" were found.</p>
            <p className="text-gray-500 text-sm">Try different keywords or check your spelling.</p>
          </div>
        )}

        {!searchQuery && !isLoading && users.length === 0 && (
          <div className="bg-white shadow-sm rounded-lg p-8 text-center">
            <div className="text-blue-400 mb-4">
              <svg className="mx-auto h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Search for Users</h3>
            <p className="text-gray-500 mb-6">Enter a name, username, or interest to find people.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-700 mb-2">Find Classmates</h4>
                <p className="text-sm text-gray-600">Search for other students in your academic program.</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-700 mb-2">Connect with Staff</h4>
                <p className="text-sm text-gray-600">Find university staff and faculty members.</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-700 mb-2">Explore Communities</h4>
                <p className="text-sm text-gray-600">
                  <Link href="/communities" className="underline">Browse communities</Link> to find people with similar interests.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}