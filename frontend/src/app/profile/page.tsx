"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";
import { userApi, getMediaUrl, communityApi } from "@/services/api";
import { UserProfile } from "@/types/user";
import { toast } from "react-hot-toast";
import { FileUpload } from "@/components/ui";
import { Select } from "@/components/ui";
import Link from "next/link";

const ProfilePage = () => {
  const { isAuthenticated } = useAuth();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditMode, setIsEditMode] = useState(false);
  const [userCommunities, setUserCommunities] = useState<any[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    date_of_birth: "",
    academic_year: "",
    address: "",
    post_code: "",
    study_program: "",
    interests: "",
    bio: "",
    profile_picture: null as File | null,
    current_profile_picture: "",
    rewards: {},
    achievements: {}
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        username: user.username || "",
        date_of_birth: user.date_of_birth || "",
        academic_year: user.academic_year ? String(user.academic_year) : "",
        address: user.address || "",
        post_code: user.post_code || "",
        study_program: user.study_program || "",
        interests: user.interests || "",
        bio: user.bio || "",
        profile_picture: null,
        current_profile_picture: user.profile_picture || "",
        rewards: user.rewards || {},
        achievements: user.achievements || {}
      });
      
      // Fetch user communities
      if (activeTab === 'communities') {
        fetchUserCommunities();
      }
    }
  }, [user, activeTab]);

  // Function to fetch user communities
  const fetchUserCommunities = async () => {
    if (!user) return;
    
    try {
      setLoadingCommunities(true);
      const communities = await communityApi.getCommunities({ member_of: true });
      setUserCommunities(communities);
    } catch (err) {
      console.error("Failed to load user communities:", err);
    } finally {
      setLoadingCommunities(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, profile_picture: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    // Get the raw form data
    const { 
      academic_year: formAcademicYear, 
      profile_picture,
      current_profile_picture,
      ...restFormData 
    } = formData;

    // Initialize form data for submission with file
    const formDataForApi = new FormData();
    
    // Add all text fields
    for (const [key, value] of Object.entries(restFormData)) {
      if (key === 'rewards' || key === 'achievements') {
        // Convert objects to JSON strings
        formDataForApi.append(key, JSON.stringify(value));
      } else {
        formDataForApi.append(key, value as string);
      }
    }
    
    // Convert and add academic_year separately
    if (formAcademicYear && formAcademicYear.trim() !== '') {
      const parsedYear = parseInt(formAcademicYear, 10);
      if (!isNaN(parsedYear)) {
        formDataForApi.append('academic_year', parsedYear.toString());
      }
    }
    
    // Add profile picture if it exists
    if (profile_picture) {
      formDataForApi.append('profile_picture', profile_picture);
    }

    try {
      await userApi.updateProfileWithFormData(formDataForApi);
      toast.success("Profile updated successfully!");
      // Exit edit mode after successful update
      setIsEditMode(false);
      // Refresh page to show updated profile
      window.location.reload();
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

  const studyProgramOptions = [
    { value: "", label: "Select a program" },
    { value: "architecture", label: "Architecture" },
    { value: "computer_science", label: "Computer Science" },
    { value: "engineering", label: "Engineering" },
    { value: "business", label: "Business" },
    { value: "medicine", label: "Medicine" },
    { value: "law", label: "Law" },
    { value: "arts", label: "Arts" },
    { value: "humanities", label: "Humanities" },
    { value: "sciences", label: "Sciences" },
    { value: "other", label: "Other" },
  ];

  // Format date to display in a readable format
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not provided";
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Get the label for study program
  const getStudyProgramLabel = (value?: string) => {
    if (!value) return "Not specified";
    const option = studyProgramOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  // Render view mode for personal info
  const renderPersonalInfoView = () => (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 mr-6 flex-shrink-0">
          {formData.current_profile_picture ? (
            <img 
              src={getMediaUrl(formData.current_profile_picture)} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl font-semibold">
              {formData.first_name?.[0]}{formData.last_name?.[0]}
            </div>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {formData.first_name} {formData.last_name}
          </h2>
          <p className="text-gray-600">@{formData.username}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Email</h3>
          <p className="mt-1 text-base text-gray-900">{user?.email || "Not provided"}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
          <p className="mt-1 text-base text-gray-900">{formData.date_of_birth ? formatDate(formData.date_of_birth) : "Not provided"}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Address</h3>
          <p className="mt-1 text-base text-gray-900">{formData.address || "Not provided"}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Post Code</h3>
          <p className="mt-1 text-base text-gray-900">{formData.post_code || "Not provided"}</p>
        </div>
      </div>
    </div>
  );

  // Render view mode for academic info
  const renderAcademicInfoView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Academic Year</h3>
          <p className="mt-1 text-base text-gray-900">
            {formData.academic_year ? `Year ${formData.academic_year}` : "Not specified"}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Study Program</h3>
          <p className="mt-1 text-base text-gray-900">{getStudyProgramLabel(formData.study_program)}</p>
        </div>
      </div>
    </div>
  );

  // Render view mode for profile data
  const renderProfileDataView = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-500">Bio</h3>
        <p className="mt-1 text-base text-gray-900 whitespace-pre-line">
          {formData.bio || "No bio provided"}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">Interests</h3>
        {formData.interests ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.interests.split(',').map((interest, index) => (
              <span 
                key={index} 
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {interest.trim()}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-base text-gray-900">No interests specified</p>
        )}
      </div>
    </div>
  );

  // Render view mode for achievements
  const renderAchievementsView = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Rewards</h3>
        {Object.keys(formData.rewards).length > 0 ? (
          <div className="space-y-2 bg-gray-50 p-4 rounded-md">
            {Object.entries(formData.rewards).map(([key, value]) => (
              <div key={key} className="flex justify-between border-b pb-2">
                <span className="text-gray-700 capitalize">{key.replace('_', ' ')}</span>
                <span className="font-medium">{typeof value === 'object' ? JSON.stringify(value) : value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-base text-gray-500 italic">No rewards earned yet</p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Achievements</h3>
        {Object.keys(formData.achievements).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(formData.achievements).map(([key, value]) => (
              <div key={key} className={`p-3 rounded-md flex items-center ${value ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-100'}`}>
                <div className={`w-4 h-4 rounded-full mr-2 ${value ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-gray-700 capitalize">{key.replace('_', ' ')}</span>
                <span className={`ml-auto text-sm ${value ? 'text-green-600' : 'text-gray-400'}`}>
                  {value ? "Completed" : "Not completed"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-base text-gray-500 italic">No achievements unlocked yet</p>
        )}
      </div>
    </div>
  );

  // Render edit form for each tab
  const renderEditForm = () => {
    switch(activeTab) {
      case "personal":
        return (
          <div className="space-y-6">
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

            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              label="Date of Birth"
              value={formData.date_of_birth}
              onChange={handleChange}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                id="address"
                name="address"
                type="text"
                label="Address"
                value={formData.address}
                onChange={handleChange}
              />
              <Input
                id="post_code"
                name="post_code"
                type="text"
                label="Post Code"
                value={formData.post_code}
                onChange={handleChange}
              />
            </div>
          </div>
        );
      
      case "academic":
        return (
          <div className="space-y-6">
            <Input
              id="academic_year"
              name="academic_year"
              type="number"
              label="Academic Year"
              min="1"
              max="7"
              value={formData.academic_year}
              onChange={handleChange}
              helperText="Current year of study (1-7)"
            />
            <Select
              id="study_program"
              name="study_program"
              label="Study Program"
              value={formData.study_program}
              onChange={handleChange}
              options={studyProgramOptions}
            />
          </div>
        );
      
      case "profile":
        return (
          <div className="space-y-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Picture
              </label>
              <div className="flex items-center space-x-4">
                {(formData.current_profile_picture || formData.profile_picture) && (
                  <div className="w-20 h-20 relative rounded-full overflow-hidden">
                    <img 
                      src={formData.profile_picture 
                        ? URL.createObjectURL(formData.profile_picture) 
                        : getMediaUrl(formData.current_profile_picture)
                      } 
                      alt="Profile Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <FileUpload
                  id="profile_picture"
                  onFileChange={handleFileChange}
                  acceptedFormats="image/*"
                  maxSize="5MB"
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={handleChange}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-1">
                Interests
              </label>
              <textarea
                id="interests"
                name="interests"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="What are your hobbies and interests?"
                value={formData.interests}
                onChange={handleChange}
              />
              <p className="mt-1 text-sm text-gray-500">
                Separate interests with commas (e.g., "Programming, Reading, Travel")
              </p>
            </div>
          </div>
        );
      
      case "achievements":
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-md mb-4">
              <p className="text-blue-700 text-sm">
                Achievements and rewards will be automatically updated as you participate in the platform.
              </p>
            </div>

            <div className="border rounded-md p-4">
              <h3 className="font-medium text-gray-800 mb-2">Rewards</h3>
              {Object.keys(formData.rewards).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(formData.rewards).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 capitalize">{key.replace('_', ' ')}</span>
                      <span className="font-medium">{typeof value === 'object' ? JSON.stringify(value) : value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No rewards earned yet</p>
              )}
            </div>

            <div className="border rounded-md p-4">
              <h3 className="font-medium text-gray-800 mb-2">Achievements</h3>
              {Object.keys(formData.achievements).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(formData.achievements).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 capitalize">{key.replace('_', ' ')}</span>
                      <span className={value ? "text-green-600" : "text-gray-400"}>
                        {value ? "Completed" : "Not completed"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No achievements unlocked yet</p>
              )}
            </div>
          </div>
        );
      
      case "communities":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">My Communities</h3>
              {loadingCommunities ? (
                <div className="flex justify-center items-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">Loading communities...</span>
                </div>
              ) : userCommunities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {userCommunities.map((community) => (
                    <Link 
                      key={community.id} 
                      href={`/communities/${community.slug}`}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all flex items-center"
                    >
                      <div className="flex-shrink-0 mr-3">
                        {community.image ? (
                          <img 
                            src={getMediaUrl(community.image)} 
                            alt={community.name} 
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                            {community.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{community.name}</h4>
                        <p className="text-sm text-gray-500">
                          {community.membership_role ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {community.membership_role.charAt(0).toUpperCase() + community.membership_role.slice(1)}
                            </span>
                          ) : 'Member'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600 mb-4">You haven't joined any communities yet.</p>
                  <Link 
                    href="/communities" 
                    className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    Browse Communities
                  </Link>
                </div>
              )}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Render the appropriate content based on active tab and edit mode
  const renderTabContent = () => {
    if (isEditMode) {
      return renderEditForm();
    }

    switch(activeTab) {
      case "personal":
        return renderPersonalInfoView();
      case "academic":
        return renderAcademicInfoView();
      case "profile":
        return renderProfileDataView();
      case "achievements":
        return renderAchievementsView();
      case "communities":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">My Communities</h3>
              {loadingCommunities ? (
                <div className="flex justify-center items-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">Loading communities...</span>
                </div>
              ) : userCommunities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {userCommunities.map((community) => (
                    <Link 
                      key={community.id} 
                      href={`/communities/${community.slug}`}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all flex items-center"
                    >
                      <div className="flex-shrink-0 mr-3">
                        {community.image ? (
                          <img 
                            src={getMediaUrl(community.image)} 
                            alt={community.name} 
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                            {community.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{community.name}</h4>
                        <p className="text-sm text-gray-500">
                          {community.membership_role ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {community.membership_role.charAt(0).toUpperCase() + community.membership_role.slice(1)}
                            </span>
                          ) : 'Member'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600 mb-4">You haven't joined any communities yet.</p>
                  <Link 
                    href="/communities" 
                    className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    Browse Communities
                  </Link>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
              <p className="text-gray-600">Your personal information and account settings</p>
            </div>
            {!isEditMode ? (
              <Button
                onClick={() => setIsEditMode(true)}
                variant="primary"
                className="shadow-sm"
              >
                Edit Profile
              </Button>
            ) : (
              <Button
                onClick={() => setIsEditMode(false)}
                variant="outline"
                className="shadow-sm"
              >
                Cancel
              </Button>
            )}
          </div>

          {error && (
            <div className="p-4 mx-6 mt-4 bg-red-50 text-red-700 rounded-md">{error}</div>
          )}

          {successMessage && (
            <div className="p-4 mx-6 mt-4 bg-green-50 text-green-700 rounded-md">
              {successMessage}
            </div>
          )}

          <div className="flex border-b border-gray-200">
            <button 
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'personal' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('personal')}
            >
              Personal Information
            </button>
            <button 
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'academic' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('academic')}
            >
              Academic Information
            </button>
            <button 
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile Data
            </button>
            <button 
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'communities' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('communities')}
            >
              Communities
            </button>
            <button 
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'achievements' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('achievements')}
            >
              Achievements
            </button>
          </div>

          {isEditMode ? (
            <form className="p-6" onSubmit={handleSubmit}>
              {renderTabContent()}

              <div className="mt-8 flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsEditMode(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="p-6">
              {renderTabContent()}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
