"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Link from "next/link";
import { baseApi } from "@/services/api"; // Use baseApi for generic HTTP requests
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";

interface MessageGroup {
  id: number;
  name: string | null;
  is_direct: boolean;
  members: { id: number; username: string; full_name: string }[];
}

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<MessageGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();

  // Fetch groups whenever the route changes (to keep sidebar in sync)
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await baseApi.get("/api/message-groups/");
        // Ensure groups is always an array, even if API returns something else
        if (res.data && Array.isArray(res.data)) {
          setGroups(res.data);
        } else if (res.data && typeof res.data === 'object' && Array.isArray(res.data.results)) {
          // Handle paginated response format
          setGroups(res.data.results);
        } else {
          // If data is not in expected format, set empty array
          console.error("Unexpected data format from API:", res.data);
          setGroups([]);
        }
      } catch (err: any) {
        console.error("Error fetching message groups:", err);
        setError("Failed to load message groups.");
        setGroups([]); // Ensure groups is always an array even after error
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [pathname]);

  const handleUserSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      const res = await baseApi.get("/api/users/search/", { params: { q: searchQuery } });
      setSearchResults(res.data);
    } catch (err: any) {
      setSearchError("Failed to search users.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Function to get the display name for a message group
  const getGroupDisplayName = (group: MessageGroup) => {
    // If it has a name, use it
    if (group.name) return group.name;
    
    // For direct messages, show the other person's name (receiver)
    if (group.members && group.members.length > 0) {
      // Since we know the current user is "rayen", filter them out
      const otherMembers = group.members.filter(member => 
        member.username !== "rayen" && 
        member.username !== user?.username
      );
      
      // If we found other members, show their name
      if (otherMembers.length > 0) {
        return otherMembers[0].full_name || otherMembers[0].username;
      }
    }
    
    // Fallback: If we can't find other members, show "Chat"
    return "Chat";
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-8 px-2 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          {/* Sidebar: Groups */}
          <aside className="md:w-72 w-full md:sticky md:top-8 bg-white rounded-xl shadow-lg p-5 border border-gray-100 h-fit self-start transition-all">
            <h2 className="font-semibold mb-4 text-lg text-blue-700">Your Groups</h2>
            {/* User Search */}
            <form onSubmit={handleUserSearch} className="mb-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-2 focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
              />
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold transition">Search</button>
            </form>
            {searchLoading && <div className="text-sm text-gray-500">Searching...</div>}
            {searchError && <div className="text-red-500 text-sm">{searchError}</div>}
            {searchResults.length > 0 && (
              <ul className="mb-4 divide-y divide-gray-100 rounded-lg overflow-hidden bg-gray-50">
                {searchResults.map((user: any) => (
                  <li key={user.id} className="py-2 px-2 flex items-center justify-between hover:bg-blue-50 transition">
                    <span>
                      <span className="font-medium">{user.username}</span>
                      {user.full_name && <span className="text-gray-500 ml-1">({user.full_name})</span>}
                    </span>
                    <button
                      className="ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs font-semibold shadow-sm"
                      onClick={async () => {
                        try {
                          const res = await baseApi.post("/api/dm/start/", { user_id: user.id });
                          const groupId = res.data.group_id || res.data.id;
                          router.push(`/messages/${groupId}`);
                        } catch (err) {
                          alert("Failed to start chat.");
                        }
                      }}
                    >
                      Message
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-gray-100 my-4" />
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : error ? (
              <div className="text-red-500 text-sm">{error}</div>
            ) : groups.length === 0 ? (
              <div className="text-gray-400 text-sm">No groups found.</div>
            ) : (
              <ul className="space-y-1">
                {groups.map((group) => (
                  <li key={group.id}>
                    <Link
                      href={`/messages/${group.id}`}
                      className="block px-3 py-2 rounded-lg hover:bg-blue-50 transition font-medium text-gray-700"
                    >
                      {getGroupDisplayName(group)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </aside>
          {/* Main content */}
          <div className="flex-1 min-w-0 bg-white rounded-xl shadow-lg p-6 border border-gray-100 overflow-auto transition-all">
            {children}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
