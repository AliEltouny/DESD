"use client";

import { useEffect, useState } from "react";
import { Event } from "@/types/events";
import { fetchEvents, fetchMyEvents } from "@/services/api/events/eventService";
import EventCard from "../EventCard";
import EventCardSkeleton from "../EventCardSkeleton";

interface EventListProps {
  title?: string;
  joinedOnly?: boolean;
  maxItems?: number;
  showFilters?: boolean;
  className?: string;
}

const EventList: React.FC<EventListProps> = ({
  title = "Events",
  joinedOnly = false,
  maxItems,
  showFilters = false,
  className = "",
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderBy, setOrderBy] = useState("date_time");

  const sortOptions = [
    { value: "date_time", label: "Upcoming" },
    { value: "title", label: "Title A-Z" },
  ];

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = joinedOnly ? await fetchMyEvents() : await fetchEvents();
        let data = response.data.results || response.data;

        if (searchQuery) {
          data = data.filter((event: Event) =>
            event.title.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        if (orderBy === "title") {
          data.sort((a: Event, b: Event) => a.title.localeCompare(b.title));
        } else {
          data.sort((a: Event, b: Event) =>
            new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
          );
        }

        setEvents(maxItems ? data.slice(0, maxItems) : data);
      } catch (err) {
        setError("Failed to load events. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [joinedOnly, searchQuery, orderBy, maxItems]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrderBy(e.target.value);
  };

  return (
    <div className={className}>
      {title && <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>}

      {showFilters && (
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4 space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search events..."
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={orderBy}
            onChange={handleSortChange}
            className="w-full sm:w-48 py-2 px-3 border border-gray-300 rounded-lg"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center text-red-500">
          {error}
          <button onClick={() => window.location.reload()} className="ml-4 text-blue-600 underline">
            Retry
          </button>
        </div>
      ) : events.length === 0 ? (
        <p className="text-center text-gray-500">No events found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((e) => (
            <EventCard key={joinedOnly ? e.event.id : e.id} event={joinedOnly ? e.event : e} />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;
