"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { communityApi } from "@/services/api";
import { Community } from "@/types/community";
import CommunityCard from "./CommunityCard";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSkeleton from "./LoadingSkeleton";

// Debounce function for search input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

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

// Memoized community card grid
const CommunityGrid = memo(({ communities }: { communities: Community[] }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {communities.map((community) =>
      community && community.id ? (
        <CommunityCard key={community.id} community={community} />
      ) : null
    )}
  </div>
));

CommunityGrid.displayName = 'CommunityGrid';

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

  // Debounce search query to avoid too frequent API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Memoize these arrays to prevent unnecessary re-renders
  const categories = useMemo(() => [
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
  ], []);

  const sortOptions = useMemo(() => [
    { value: "created_at", label: "Newest First" },
    { value: "name", label: "Alphabetical" },
    { value: "member_count", label: "Most Members" },
  ], []);

  // Memoize the fetch function to prevent unnecessary recreations
  const fetchCommunities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | boolean | number> = {
        order_by: orderBy,
      };

      if (category) {
        params.category = category;
      }

      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery;
      }

      if (memberOnly) {
        params.member_of = true;
      }

      const data = await communityApi.getCommunities({ ...params });
      
      if (Array.isArray(data)) {
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
  }, [category, debouncedSearchQuery, orderBy, memberOnly, maxItems]);

  // Effect to fetch communities when dependencies change
  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleOrderChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrderBy(e.target.value);
  }, []);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Debounced search is already triggered by the useEffect
  }, []);

  // Use intersection observer after the communities are rendered
  useEffect(() => {
    // Skip if no communities or if running on server
    if (typeof window === 'undefined' || communities.length === 0 || loading) return;

    // Set up observer with a delay to ensure DOM elements are available
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '200px' }
      );

      // Target community card containers
      const cardElements = document.querySelectorAll('.community-card-container');
      if (cardElements.length > 0) {
        cardElements.forEach(card => observer.observe(card));
      }

      return () => {
        if (cardElements.length > 0) {
          cardElements.forEach(card => observer.unobserve(card));
        }
        observer.disconnect();
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [communities, loading]);

  // Memoize the rendered content for better performance
  const renderContent = useMemo(() => {
    if (loading) {
      return <LoadingSkeleton count={maxItems || 6} />;
    }

    if (error) {
      return (
        <div className="py-12 text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => fetchCommunities()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (communities.length === 0) {
      return (
        <div className="py-12 text-center">
          <p className="text-gray-500">No communities found.</p>
          {(debouncedSearchQuery || category || memberOnly) && (
            <p className="mt-2 text-gray-500">Try adjusting your filters.</p>
          )}
        </div>
      );
    }

    return <CommunityGrid communities={communities} />;
  }, [loading, error, communities, debouncedSearchQuery, category, memberOnly, fetchCommunities, maxItems]);

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
                    aria-label="Search communities"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
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
                  aria-label="Filter by category"
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
                  aria-label="Sort communities"
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

      {/* Main content area */}
      <div className="community-list-container">
        {renderContent}
      </div>
    </div>
  );
};

export default CommunityList;
