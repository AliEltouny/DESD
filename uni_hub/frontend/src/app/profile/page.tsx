"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useUser } from "@/contexts/UserContext";
import { userApi } from "@/services/api/apiClient";
import { UserProfile } from "@/types/user";
import Image from "next/image";

const ProfilePage = () => {
  const { user, isLoadingProfile } = useUser() as { user: UserProfile | null; isLoadingProfile: boolean };

  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    date_of_birth: user?.date_of_birth || "",
    academic_year: user?.academic_year || "",
    bio: user?.bio || "",
    address: user?.address || "",
    phone: user?.phone || "",
    profile_photo: user?.profile_photo || "",
    username: user?.username || "",
    interests: user?.interests || "", // Add interests to the form data
    postal_code: user?.postal_code || "", // Add postal code to the form data
  });

  const academicYears = Array.from({ length: 7 }, (_, i) => i + 1);
  const [imageError, setImageError] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    const updatedFields = Object.keys(formData).filter(
      (field) =>
        formData[field as keyof typeof formData] !== user?.[field as keyof typeof user] &&
        formData[field as keyof typeof formData] !== ""
    );

    if (updatedFields.length === 0) {
      alert("No changes detected.");
      return;
    }

    try {
      const formDataToSend = new FormData();
      updatedFields.forEach((field) => {
        formDataToSend.append(field, formData[field as keyof typeof formData]);
      });

      await userApi.updateProfile(formDataToSend);
      alert(`${updatedFields.map((field) => field.replace("_", " ")).join(", ")} updated successfully!`);
    } catch (error) {
      console.error("Error updating fields:", error);
      alert("Failed to update fields. Please try again.");
    }
  };

  if (isLoadingProfile) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-white shadow rounded-lg">Loading profile...</div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-white shadow rounded-lg">No user data available.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto mt-10 bg-white rounded-xl shadow-md overflow-hidden md:flex">
        <div className="md:flex-shrink-0 flex flex-col items-center justify-center p-6 border-r">
          {user.profile_photo && !imageError ? (
            <Image
              src={user.profile_photo}
              alt="Profile"
              width={120}
              height={120}
              className="rounded-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-[120px] h-[120px] rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
              No Image
            </div>
          )}
          <h2 className="mt-4 font-bold text-lg text-gray-800">{`${user.first_name} ${user.last_name}`}</h2>
          <p className="text-sm text-gray-500">{user.email}</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  setFormData({ ...formData, profile_photo: reader.result as string });
                };
                reader.readAsDataURL(file);
              }
            }}
            className="mt-4 text-xs"
          />
        </div>

        <div className="p-6 w-full">
          <h1 className="text-xl font-semibold mb-4 text-gray-800">Profile Details</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><strong>Username:</strong> {user.username || "Not added"}</div>
            <div><strong>Phone:</strong> {user.phone || "Not added"}</div>
            <div><strong>Date of Birth:</strong> {user.date_of_birth || "Not added"}</div>
            <div><strong>Academic Year:</strong> {user.academic_year || "Not added"}</div>
            <div><strong>Interests:</strong> {user.interests || "Not added"}</div>
            <div><strong>Postal Code:</strong> {user.postal_code || "Not added"}</div>
            <div className="md:col-span-2"><strong>Bio:</strong> {user.bio || "Not added"}</div>
            <div className="md:col-span-2"><strong>Address:</strong> {user.address || "Not added"}</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-6 bg-white shadow rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Update Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter your username"
            />
          </div>
          {Object.keys(formData).map((field) => (
            field !== "username" && (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 capitalize">
                  {field.replace("_", " ")}
                </label>
                {field === "academic_year" ? (
                  <select
                    name={field}
                    value={formData[field as keyof typeof formData]}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                ) : field === "bio" ? (
                  <textarea
                    name={field}
                    value={formData[field as keyof typeof formData]}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder={`Enter your ${field.replace("_", " ")}`}
                  ></textarea>
                ) : (
                  <input
                    type={field === "date_of_birth" ? "date" : "text"}
                    name={field}
                    value={formData[field as keyof typeof formData]}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder={`Enter your ${field.replace("_", " ")}`}
                  />
                )}
              </div>
            )
          ))}
          <button
            onClick={handleSubmit}
            className="mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Save Changes
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
