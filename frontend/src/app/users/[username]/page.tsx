"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { userApi, baseApi, communityApi, getMediaUrl } from "@/services/api";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { User } from "@/types/user";
import Link from "next/link";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [userCommunities, setUserCommunities] = useState<any[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);

  // Get user data using the improved userApi.getUserProfile method
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use the improved getUserProfile method that handles fallbacks
        const userData = await userApi.getUserProfile(username);
        setProfile(userData);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError(`Failed to load profile for ${username}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  // Fetch user communities
  useEffect(() => {
    const fetchUserCommunities = async () => {
      setLoadingCommunities(true);

      try {
        const communitiesData = await communityApi.getUserCommunities(username);
        setUserCommunities(communitiesData);
      } catch (err) {
        console.error("Error fetching user communities:", err);
        setError("Failed to load communities");
      } finally {
        setLoadingCommunities(false);
      }
    };

    if (username) {
      fetchUserCommunities();
    }
  }, [username]);

  // Function to start a direct message with this user
  const startDirectMessage = async () => {
    if (!profile) return;
    
    setIsStartingChat(true);
    try {
      // Call the API to start a direct message
      const response = await baseApi.post("/api/dm/start/", { user_id: profile.id });
      
      // Get the group ID from the response
      const groupId = response.data.group_id || response.data.id;
      
      // Navigate to the message group
      router.push(`/messages/${groupId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
      alert("Failed to start conversation. Please try again.");
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/users/search" className="text-blue-600 hover:text-blue-800">
            &larr; Back to User Search
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading profile...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {error}
          </div>
        ) : profile ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Profile Header */}
            <div className="bg-blue-50 p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start">
                <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
                  {profile.profile_picture ? (
                    <img
                      src={getMediaUrl(profile.profile_picture)}
                      alt={profile.username}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white"
                      onError={(e) => {
                        // Fallback if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallbackDiv = document.createElement('div');
                          fallbackDiv.className = "w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-semibold border-4 border-white";
                          fallbackDiv.textContent = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || profile.username?.[0] || "U"}`;
                          parent.appendChild(fallbackDiv);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-semibold border-4 border-white">
                      {profile.first_name?.[0] || ""}{profile.last_name?.[0] || profile.username?.[0] || "U"}
                    </div>
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.first_name} {profile.last_name}
                  </h1>
                  <p className="text-gray-500">@{profile.username}</p>
                  
                  <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                    <button
                      onClick={startDirectMessage}
                      disabled={isStartingChat}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-2"
                    >
                      {isStartingChat ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Starting chat...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          Message
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6">
              {/* Always show bio section with fallback message if empty */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2 text-gray-900">About</h2>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-gray-700 whitespace-pre-line">
                    {profile.bio || "No bio information available"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2 text-gray-900">Academic Information</h2>
                  <div className="bg-gray-50 rounded-md p-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Program</p>
                        <p className="font-medium text-gray-900">{profile.study_program || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Academic Year</p>
                        <p className="font-medium text-gray-900">{profile.academic_year || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-2 text-gray-900">Contact Information</h2>
                  <div className="bg-gray-50 rounded-md p-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{profile.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h2 className="text-lg font-semibold mb-2 text-gray-900">Interests</h2>
                  <div className="bg-gray-50 rounded-md p-4">
                    {profile.interests ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.split(',').map((interest, index) => (
                          <span 
                            key={index} 
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            {interest.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-700">No interests specified</p>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h2 className="text-lg font-semibold mb-2 text-gray-900">Achievements</h2>
                  <div className="bg-gray-50 rounded-md p-4">
                    {profile.achievements && Object.keys(profile.achievements).length > 0 ? (
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(profile.achievements).map(([achievement, achieved]) => (
                          <li key={achievement} className="flex items-center">
                            <span className={`mr-2 ${achieved ? 'text-green-500' : 'text-gray-400'}`}>
                              {achieved ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                </svg>
                              )}
                            </span>
                            <span className={achieved ? 'font-medium' : 'text-gray-500'}>
                              {achievement.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-700">No achievements unlocked yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* User Communities Section */}
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-2 text-gray-900">Communities</h2>
                {loadingCommunities ? (
                  <div className="flex justify-center items-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Loading communities...</span>
                  </div>
                ) : userCommunities.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <p className="text-gray-600 mb-4">This user hasn't joined any communities yet.</p>
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
          </div>
        ) : (
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md">
            User profile not found.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}