import React from "react";
import Link from "next/link";
import Image from "next/image";
import Card from "../ui/Card";

interface Connection {
  id: number;
  name: string;
  role: string;
  department: string;
  avatar?: string;
  mutualConnections: number;
}

interface RecommendedConnectionsProps {
  className?: string;
}

const RecommendedConnections: React.FC<RecommendedConnectionsProps> = ({
  className = "",
}) => {
  // Mock data for recommended connections - in a real app, this would come from an API
  const connections: Connection[] = [
    {
      id: 1,
      name: "David Wilson",
      role: "Student",
      department: "Computer Science",
      mutualConnections: 8,
    },
    {
      id: 2,
      name: "Emily Chen",
      role: "Student",
      department: "Business Administration",
      mutualConnections: 5,
    },
    {
      id: 3,
      name: "Dr. Michael Brown",
      role: "Professor",
      department: "Engineering",
      mutualConnections: 3,
    },
  ];

  // Helper function to get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card
      title="People You May Know"
      className={className}
      headerAction={
        <Link
          href="/connections"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View All
        </Link>
      }
    >
      <div className="space-y-3">
        {connections.map((connection) => (
          <div
            key={connection.id}
            className="flex items-center justify-between py-2"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium relative overflow-hidden">
                {connection.avatar ? (
                  <Image
                    src={connection.avatar}
                    alt={connection.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  getInitials(connection.name)
                )}
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">
                  {connection.name}
                </h4>
                <p className="text-xs text-gray-500">
                  {connection.role}, {connection.department}
                </p>
                {connection.mutualConnections > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {connection.mutualConnections} mutual connection
                    {connection.mutualConnections !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
            <button className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-blue-500 text-xs font-medium rounded-full text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Connect
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link
          href="/connections/find"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <svg
            className="mr-1 w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
          <span>Find More Connections</span>
        </Link>
      </div>
    </Card>
  );
};

export default RecommendedConnections;
