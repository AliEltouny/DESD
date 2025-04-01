import React from "react";
import Card from "../ui/Card";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileCardProps {
  className?: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ className = "" }) => {
  const { user } = useAuth();

  if (!user) return null;

  // Calculate completion percentage based on filled optional fields
  const totalFields = 6; // id, email, username, first_name, last_name + optional fields
  const optionalFields = [user.date_of_birth, user.academic_year].filter(
    Boolean
  ).length;
  const requiredFields = 5; // The fields that should always be present
  const completionPercentage = Math.round(
    ((requiredFields + optionalFields) / totalFields) * 100
  );

  return (
    <Card
      title="Your Profile"
      className={className}
      headerAction={
        <span className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
          Edit
        </span>
      }
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Profile Image */}
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl font-semibold">
          {user.first_name[0]}
          {user.last_name[0]}
        </div>

        {/* User Details */}
        <div className="flex-1">
          <h4 className="text-xl font-medium text-gray-900 text-center sm:text-left">
            {user.first_name} {user.last_name}
          </h4>
          <p className="text-gray-500 text-center sm:text-left">
            {user.username}
          </p>

          {/* Profile Completion */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Profile Completion</span>
              <span className="text-sm text-blue-600 font-medium">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Additional Fields */}
          <div className="mt-4 grid grid-cols-1 gap-2">
            {user.academic_year && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Academic Year:</span>
                <span className="text-sm font-medium">
                  {user.academic_year}
                </span>
              </div>
            )}
            {user.date_of_birth && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Date of Birth:</span>
                <span className="text-sm font-medium">
                  {new Date(user.date_of_birth).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Email:</span>
              <span className="text-sm font-medium">{user.email}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfileCard;
