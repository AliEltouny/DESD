"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { userApi } from "@/services/api/userApi";
import { UserProfile } from "@/types/user";
import { toast } from "react-hot-toast";

const ProfilePage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    date_of_birth: "",
    academic_year: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        username: user.username || "",
        date_of_birth: user.date_of_birth || "",
        academic_year: user.academic_year ? String(user.academic_year) : "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    // Get the raw form data
    const { academic_year: formAcademicYear, ...restFormData } = formData;

    // Initialize the object for submission (without academic_year initially)
    const dataForApi: Partial<Omit<UserProfile, 'academic_year'>> = { ...restFormData };

    // Convert and add academic_year separately
    let finalAcademicYear: number | undefined = undefined;
    const rawYear = formAcademicYear; // Get the original string value
    if (!(rawYear === null || rawYear === undefined || rawYear.trim() === '')) {
      const parsedYear = parseInt(rawYear, 10);
      if (!isNaN(parsedYear)) {
          finalAcademicYear = parsedYear;
      }
    }

    // Combine base data with the converted academic_year
    const dataToSubmit: Partial<UserProfile> = {
      ...dataForApi,
      academic_year: finalAcademicYear,
      };

    try {
      await userApi.updateProfile(dataToSubmit);
      toast.success("Profile updated successfully!");
      // Optionally refetch user data if needed
      // fetchProfile();
    } catch (err: unknown) {
      console.error("Profile update error:", err);
      let message = "Failed to update profile. Please try again.";
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        message = (err.response.data as { message: string }).message || message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Edit Profile</h1>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md">{error}</div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 text-green-700 rounded-md">
              {successMessage}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                id="first_name"
                name="first_name"
                type="text"
                label="First Name"
                required
                value={formData.first_name}
                onChange={handleChange}
              />
              <Input
                id="last_name"
                name="last_name"
                type="text"
                label="Last Name"
                required
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>

            <Input
              id="username"
              name="username"
              type="text"
              label="Username"
              required
              value={formData.username}
              onChange={handleChange}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                label="Date of Birth"
                value={formData.date_of_birth}
                onChange={handleChange}
              />
              <Input
                id="academic_year"
                name="academic_year"
                type="number"
                label="Academic Year"
                min="1"
                max="7"
                value={formData.academic_year}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={isLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
