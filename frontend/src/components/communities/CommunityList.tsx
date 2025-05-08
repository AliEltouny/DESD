"use client";

import { useState, useEffect } from "react";
import { communityApi } from "@/services/api";
import { Community } from "@/types/community";
import CommunityCard from "./CommunityCard";
import { useAuth } from "@/contexts/AuthContext";

interface CommunityListProps {
  initialCommunities?: Community[];
  title?: string;
  maxItems?: number;
  showFilters?: boolean;
  memberOnly?: boolean;
  category?: string;
  searchQuery?: string;
  className?: string;
}

const CommunityList: React.FC<CommunityListProps> = ({
  initialCommunities,
  title = "Communities",
  maxItems,
  showFilters = false,
  memberOnly = false,
  category: initialCategory,
  searchQuery: initialSearchQuery,
  className = "",
}) => {
  const [communities, setCommunities] = useState<Community[]>(
    initialCommunities || []
  );
  const [loading, setLoading] = useState(!initialCommunities);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(initialCategory || "");
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || "");
  const [orderBy, setOrderBy] = useState<string>("created_at");
  const { isAuthenticated } = useAuth();

  // Categories for filter
  const categories = [
    { value: "", label: "All Categories" },
    { value: "academic", label: "Academic" },
    { value: "social", label: "Social" },
    { value: "sports", label: "Sports" },
    { value: "arts", label: "Arts & Culture" },
    { value: "career", label: "Career & Professional" },
    { value: "technology", label: "Technology" },
    { value: "health", label: "Health & Wellness" },
    { value: "service", label: "Community Service" },
    { value: "other", label: "Other" },
  ];

  // Sorting options
  const sortOptions = [
    { value: "created_at", label: "Newest First" },
    { value: "name", label: "Alphabetical" },
    { value: "member_count", label: "Most Members" },
  ];

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, string | boolean | number> = {
          order_by: orderBy,
        };

        if (category) {
          params.category = category;
        }

        if (searchQuery) {
          params.search = searchQuery;
        }

        if (memberOnly) {
          params.member_of = true;
        }

        console.log("Fetching communities with params:", params);
        const data = await communityApi.getCommunities({ ...params });
        console.log("Received communities data:", data);
        
        // Debug log: Check image fields in the API response
        data.forEach(community => {
          console.log(`Community ${community.name} (ID: ${community.id}) image fields:`, {
            image: community.image,
            banner: community.banner,
            logo: community.logo,
            cover_image: community.cover_image
          });
        });
        
        if (Array.isArray(data)) {
          console.log(`Processing ${data.length} communities`);
          setCommunities(maxItems ? data.slice(0, maxItems) : data);
        } else {
          console.error("Non-array response from getCommunities:", data);
          setCommunities([]);
          setError("Invalid data format received from server");
        }
      } catch (err) {
        console.error("Failed to fetch communities:", err);
        setError("Failed to load communities. Please try again later.");
        setCommunities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, [category, searchQuery, orderBy, memberOnly, maxItems]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrderBy(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already triggered by the useEffect when searchQuery changes
  };

  return (
    <div className={className}>
      {title && (
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      )}

      {showFilters && (
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <form
            onSubmit={handleSearchSubmit}
            className="space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4"
          >
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              {/* Search input */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search communities..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Category filter */}
              <div className="w-full sm:w-48">
                <select
                  value={category}
                  onChange={handleCategoryChange}
                  className="w-full py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort order */}
              <div className="w-full sm:w-48">
                <select
                  value={orderBy}
                  onChange={handleOrderChange}
                  className="w-full py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isAuthenticated && (
              <div className="flex items-center mt-4 sm:mt-0">
                <input
                  type="checkbox"
                  id="member-only"
                  checked={memberOnly}
                  // Note: This is read-only because memberOnly is passed as prop
                  onChange={() => {}}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  readOnly
                />
                <label
                  htmlFor="member-only"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Show only communities I&apos;m a member of
                </label>
              </div>
            )}
          </form>
        </div>
      )}

      {loading ? (
        <div className="bg-white shadow rounded-lg p-8 flex flex-col items-center justify-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Loading communities...</h3>
          <p className="mt-1 text-sm text-gray-500">Please wait while we fetch the latest communities</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : communities.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">No communities found.</p>
          {searchQuery || category || memberOnly ? (
            <p className="mt-2 text-gray-500">Try adjusting your filters.</p>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) =>
            community && community.id ? (
              <CommunityCard key={community.id} community={community} />
            ) : null
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityList;
