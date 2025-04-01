import React from "react";
import Link from "next/link";
import Card from "../ui/Card";

interface Activity {
  id: number;
  type: "message" | "post" | "event" | "assignment" | "announcement";
  title: string;
  description: string;
  timestamp: string;
  source: {
    name: string;
    link: string;
  };
  user?: {
    name: string;
    avatar?: string;
  };
  isNew: boolean;
}

interface RecentActivityFeedProps {
  className?: string;
}

const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  className = "",
}) => {
  // Mock data for activities - in a real app, this would come from an API
  const activities: Activity[] = [
    {
      id: 1,
      type: "post",
      title: "New post in Computer Science Society",
      description:
        "Sarah posted 'Looking for study group partners for the upcoming exam'",
      timestamp: "30 minutes ago",
      source: {
        name: "Computer Science Society",
        link: "/communities/1",
      },
      user: {
        name: "Sarah Johnson",
      },
      isNew: true,
    },
    {
      id: 2,
      type: "event",
      title: "Event reminder: Resume Workshop",
      description: "Event starting tomorrow at 2:00 PM",
      timestamp: "2 hours ago",
      source: {
        name: "Career Services",
        link: "/events/1",
      },
      isNew: true,
    },
    {
      id: 3,
      type: "message",
      title: "New message from Alex",
      description: "Hey, do you have the notes from yesterday's lecture?",
      timestamp: "Yesterday",
      source: {
        name: "Direct Messages",
        link: "/messages/3",
      },
      user: {
        name: "Alex Williams",
      },
      isNew: false,
    },
    {
      id: 4,
      type: "announcement",
      title: "University Closure Notice",
      description:
        "Campus will be closed on Friday due to scheduled maintenance",
      timestamp: "2 days ago",
      source: {
        name: "University Admin",
        link: "/announcements/4",
      },
      isNew: false,
    },
  ];

  // Helper function to get icon for activity type
  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "message":
        return (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
          </svg>
        );
      case "post":
        return (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3v-3h6a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "event":
        return (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "assignment":
        return (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path
              fillRule="evenodd"
              d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "announcement":
        return (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  // Helper function to get background color for activity type
  const getActivityColor = (type: Activity["type"]) => {
    switch (type) {
      case "message":
        return "bg-purple-100 text-purple-600";
      case "post":
        return "bg-blue-100 text-blue-600";
      case "event":
        return "bg-green-100 text-green-600";
      case "assignment":
        return "bg-yellow-100 text-yellow-600";
      case "announcement":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <Card
      title="Recent Activity"
      className={className}
      headerAction={
        <Link
          href="/notifications"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View All
        </Link>
      }
    >
      <div className="space-y-4">
        {activities.map((activity) => (
          <Link key={activity.id} href={activity.source.link}>
            <div
              className={`p-3 rounded-lg transition-colors ${
                activity.isNew
                  ? "bg-blue-50 hover:bg-blue-100"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(
                    activity.type
                  )}`}
                >
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      {activity.title}
                      {activity.isNew && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          New
                        </span>
                      )}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {activity.timestamp}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {activity.description}
                  </p>
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <span>via {activity.source.name}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
};

export default RecentActivityFeed;
