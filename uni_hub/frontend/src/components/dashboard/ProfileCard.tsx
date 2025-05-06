import React from "react";
import Card from "../ui/Card";
import { useUser } from "@/contexts/UserContext";

interface ProfileCardProps {
  className?: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ className = "" }) => {
  const { user, isLoadingProfile } = useUser();

  if (isLoadingProfile) {
    return (
      <Card title="Your Profile" className={className}>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </Card>
    );
  }

  if (!user) return null;

  const profileFields = [
    user.first_name,
    user.last_name,
    user.username,
    user.email,
    user.date_of_birth,
    user.academic_year,
    user.bio,
    user.address,
    user.phone,
    user.profile_photo,
    user.interests,
    user.postal_code,
  ];

  const filledFields = profileFields.filter(Boolean).length;
  const totalFields = profileFields.length;
  const completionPercentage = Math.round((filledFields / totalFields) * 100);

  const handleEditClick = () => {
    window.location.href = "/profile";
  };

  return (
    <Card
      title="Your Profile"
      className={className}
      headerAction={
        <span
          className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
          onClick={handleEditClick}
        >
          Edit
        </span>
      }
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Profile Image */}
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl font-semibold">
          {user.first_name?.[0] || ''}
          {user.last_name?.[0] || user.username?.[0] || 'U'}
        </div>

        {/* User Details */}
        <div className="flex-1">
          <h4 className="text-xl font-medium text-gray-900 text-center sm:text-left">
            {user.username}
          </h4>

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
