import React from "react";
import Link from "next/link";
import Card from "../ui/Card";

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  category: "academic" | "social" | "career" | "other";
}

interface UpcomingEventsProps {
  className?: string;
}

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ className = "" }) => {
  // Mock data for events - in a real app, this would come from an API
  const events: Event[] = [
    {
      id: 1,
      title: "Resume Workshop",
      date: "2024-04-15",
      time: "14:00-16:00",
      location: "Career Center, Building B",
      organizer: "University Career Services",
      category: "career",
    },
    {
      id: 2,
      title: "Algorithm Study Group",
      date: "2024-04-17",
      time: "18:00-20:00",
      location: "CS Lab, Room 301",
      organizer: "Computer Science Society",
      category: "academic",
    },
    {
      id: 3,
      title: "Spring Networking Mixer",
      date: "2024-04-22",
      time: "17:30-19:30",
      location: "Student Union Ballroom",
      organizer: "Business Club",
      category: "social",
    },
  ];

  // Helper function to get category badge style
  const getCategoryStyle = (category: Event["category"]) => {
    switch (category) {
      case "academic":
        return "bg-blue-100 text-blue-800";
      case "social":
        return "bg-purple-100 text-purple-800";
      case "career":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to format date nicely
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  return (
    <Card
      title="Upcoming Events"
      className={className}
      headerAction={
        <Link
          href="/events"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          All Events
        </Link>
      }
    >
      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex flex-col items-center justify-center text-blue-700">
                  <span className="text-xs font-medium">
                    {new Date(event.date).toLocaleDateString("en-US", {
                      month: "short",
                    })}
                  </span>
                  <span className="text-lg font-bold">
                    {new Date(event.date).getDate()}
                  </span>
                </div>
                <div className="ml-4">
                  <h4 className="text-base font-medium text-gray-900">
                    {event.title}
                  </h4>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <span>{formatDate(event.date)}</span>
                    <span className="mx-2">•</span>
                    <span>{event.time}</span>
                  </div>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${getCategoryStyle(
                  event.category
                )}`}
              >
                {event.category.charAt(0).toUpperCase() +
                  event.category.slice(1)}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                {event.location}
              </div>
              <div className="flex items-center mt-1">
                <svg
                  className="w-4 h-4 mr-1 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                {event.organizer}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link
          href="/events/create"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <svg
            className="mr-1 w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>Create Event</span>
        </Link>
      </div>
    </Card>
  );
};

export default UpcomingEvents;
