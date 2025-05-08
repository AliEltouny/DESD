"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { userApi } from "@/services/api";
import { User } from "@/types/user";
import { UserCard } from "@/components/users";
import { useRouter } from "next/navigation";

export default function UserSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const results = await userApi.searchUsersByQuery(searchQuery);
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
    // Navigate to messages with this user
    router.push(`/messages?user=${user.id}`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Find People</h1>

        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or username"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={isLoading || !searchQuery.trim()}
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {users.length === 0 && searchQuery && !isLoading && !error ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No users found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((user) => (
              <UserCard 
                key={user.id} 
                user={user} 
                onClick={() => handleUserClick(user)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}