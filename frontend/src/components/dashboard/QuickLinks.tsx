import React from "react";
import Link from "next/link";
import Card from "../ui/Card";

interface QuickLink {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  url: string;
  color: string;
}

interface QuickLinksProps {
  className?: string;
}

const QuickLinks: React.FC<QuickLinksProps> = ({ className = "" }) => {
  // Mock data for quick links - in a real app, this would come from an API or user preferences
  const links: QuickLink[] = [
    {
      id: 1,
      title: "Learning Management System",
      description: "Access courses, assignments, and grades",
      icon: (
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
        </svg>
      ),
      url: "https://lms.university.edu",
      color: "bg-blue-100 text-blue-700",
    },
    {
      id: 2,
      title: "Library Resources",
      description: "Access digital resources, journals, and books",
      icon: (
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
        </svg>
      ),
      url: "https://library.university.edu",
      color: "bg-green-100 text-green-700",
    },
    {
      id: 3,
      title: "Career Services",
      description: "Job listings, internships, and career resources",
      icon: (
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
          <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
        </svg>
      ),
      url: "https://careers.university.edu",
      color: "bg-purple-100 text-purple-700",
    },
    {
      id: 4,
      title: "Academic Calendar",
      description: "Important dates and deadlines",
      icon: (
        <svg
          className="w-6 h-6"
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
      ),
      url: "https://university.edu/calendar",
      color: "bg-yellow-100 text-yellow-700",
    },
  ];

  return (
    <Card title="Quick Links" className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {links.map((link) => (
          <Link
            key={link.id}
            href={link.url}
            className="block p-4 rounded-lg border border-gray-100 transition-all hover:shadow-md hover:border-blue-200 hover:bg-blue-50"
          >
            <div className="flex items-start">
              <div
                className={`flex-shrink-0 p-2 mr-4 rounded-lg ${link.color}`}
              >
                {link.icon}
              </div>
              <div>
                <h4 className="text-base font-medium text-gray-900">
                  {link.title}
                </h4>
                <p className="mt-1 text-sm text-gray-600">{link.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
};

export default QuickLinks;
