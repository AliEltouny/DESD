import React from "react";
import Link from "next/link";
import Card from "../ui/Card";

interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
  category: "general" | "academic" | "events" | "maintenance" | "emergency";
  isImportant: boolean;
}

interface CampusAnnouncementsProps {
  className?: string;
}

const CampusAnnouncements: React.FC<CampusAnnouncementsProps> = ({
  className = "",
}) => {
  // Mock data for announcements - in a real app, this would come from an API
  const announcements: Announcement[] = [
    {
      id: 1,
      title: "Campus Wifi Upgrade",
      content:
        "The campus wifi network will be upgraded this weekend. Expect intermittent connectivity.",
      date: "2024-04-10",
      category: "maintenance",
      isImportant: false,
    },
    {
      id: 2,
      title: "Final Exam Schedule Posted",
      content:
        "The final examination schedule for the Spring semester has been posted. Please check your student portal.",
      date: "2024-04-08",
      category: "academic",
      isImportant: true,
    },
    {
      id: 3,
      title: "Student Government Elections",
      content:
        "Vote for your student representatives next week. Polling stations will be available in all major buildings.",
      date: "2024-04-05",
      category: "events",
      isImportant: false,
    },
    {
      id: 4,
      title: "Library Extended Hours",
      content:
        "The main library will extend its hours during the final exam period, staying open until midnight.",
      date: "2024-04-03",
      category: "general",
      isImportant: false,
    },
  ];

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  // Helper function to get category badge style
  const getCategoryStyle = (category: Announcement["category"]) => {
    switch (category) {
      case "academic":
        return "bg-blue-100 text-blue-800";
      case "events":
        return "bg-purple-100 text-purple-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "emergency":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card
      title="Campus Announcements"
      className={className}
      headerAction={
        <Link
          href="/announcements"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          All Announcements
        </Link>
      }
    >
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0"
          >
            <div className="flex justify-between items-start mb-1">
              <h4 className="text-base font-medium text-gray-900 flex items-center">
                {announcement.title}
                {announcement.isImportant && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Important
                  </span>
                )}
              </h4>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${getCategoryStyle(
                    announcement.category
                  )}`}
                >
                  {announcement.category.charAt(0).toUpperCase() +
                    announcement.category.slice(1)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(announcement.date)}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {announcement.content}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-2 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          Stay updated with the latest campus news and announcements.
        </p>
      </div>
    </Card>
  );
};

export default CampusAnnouncements;
