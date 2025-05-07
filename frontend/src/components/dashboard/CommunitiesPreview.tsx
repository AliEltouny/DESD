import React from "react";
import Link from "next/link";
import Card from "../ui/Card";

interface Community {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  thumbnail: string;
  lastActivity: string;
}

interface CommunitiesPreviewProps {
  className?: string;
}

const CommunitiesPreview: React.FC<CommunitiesPreviewProps> = ({
  className = "",
}) => {
  // Mock data for communities - in a real app, this would come from an API
  const communities: Community[] = [
    {
      id: 1,
      name: "Computer Science Society",
      description:
        "A community for CS students to collaborate and share knowledge.",
      memberCount: 128,
      thumbnail: "CS",
      lastActivity: "2 hours ago",
    },
    {
      id: 2,
      name: "Business Club",
      description:
        "Connect with like-minded business students and professionals.",
      memberCount: 87,
      thumbnail: "BC",
      lastActivity: "1 day ago",
    },
    {
      id: 3,
      name: "Engineering Network",
      description:
        "For all engineering disciplines to share ideas and projects.",
      memberCount: 156,
      thumbnail: "EN",
      lastActivity: "3 hours ago",
    },
  ];

  return (
    <Card
      title="My Communities"
      className={className}
      headerAction={
        <Link
          href="/communities"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View All
        </Link>
      }
    >
      <div className="space-y-4">
        {communities.map((community) => (
          <div
            key={community.id}
            className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-medium">
              {community.thumbnail}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-medium text-gray-900 truncate">
                {community.name}
              </h4>
              <p className="text-sm text-gray-500 truncate">
                {community.description}
              </p>
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <span>{community.memberCount} members</span>
                <span className="mx-2">•</span>
                <span>Active {community.lastActivity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link
          href="/communities/discover"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <span>Discover New Communities</span>
          <svg
            className="ml-1 w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>
    </Card>
  );
};

export default CommunitiesPreview;
