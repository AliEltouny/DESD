"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  getCommunity,
  createPost,
  Community,
} from "@/services/communityService";

export default function CreatePostPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // Validation state
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    content?: string;
    postType?: string;
  }>({});

  // Post types
  const postTypes = [
    { value: "discussion", label: "Discussion" },
    { value: "question", label: "Question" },
    { value: "event", label: "Event" },
    { value: "announcement", label: "Announcement" },
    { value: "resource", label: "Resource" },
  ];

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        setLoading(true);
        setError(null);

        // Add a small delay to allow auth state to restore on hard refresh
        if (!isAuthenticated) {
          console.log("Not authenticated yet, delaying authentication check...");
          // Wait a short time to see if auth state loads from storage
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Check if user is authenticated after potential delay
        if (!isAuthenticated) {
          console.log("Still not authenticated after delay, redirecting to login");
          const currentPath = `/communities/${slug}/posts/create`;
          router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
          return;
        }

        // Try to get cached community data first
        let isCreatorFromCache = false;
        try {
          const storedUserData = localStorage.getItem('user');
          const storedCommunityKey = `community_${slug}`;
          const storedCommunityData = localStorage.getItem(storedCommunityKey);
          
          if (storedUserData && storedCommunityData) {
            const userData = JSON.parse(storedUserData);
            const communityData = JSON.parse(storedCommunityData);
            
            if (communityData.creator?.id === userData.id) {
              isCreatorFromCache = true;
            }
          }
        } catch (err) {
          console.error("Error checking cached creator status:", err);
        }

        // Fetch community details
        const communityData = await getCommunity(slug as string);
        
        // Store community data in localStorage for quicker access on hard refresh
        try {
          localStorage.setItem(`community_${slug}`, JSON.stringify(communityData));
        } catch (err) {
          console.error("Error storing community data:", err);
        }
        
        setCommunity(communityData);

        // Check if user is the creator of the community
        const isCreator = isCreatorFromCache || communityData.creator?.id === user?.id;
        
        // Check if user is a member of the community or the creator
        const isMember = communityData.is_member || isCreator;
        
        // Always treat creator as a member
        if (isCreator) {
          communityData.is_member = true;
          communityData.membership_status = "approved";
          communityData.membership_role = "admin";
          // Update the community state with these changes
          setCommunity({...communityData});
        }
        
        if (!isMember) {
          setError(
            "You must be a member of this community to create posts. Please join the community first."
          );
        }
      } catch (err) {
        console.error("Failed to fetch community:", err);
        setError("Failed to load community. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCommunity();
    }
  }, [slug, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      router.push(`/login?redirect=/communities/${slug}/posts/create`);
      return;
    }
    
    // Validate required fields
    const errors: {
      title?: string;
      content?: string;
      postType?: string;
    } = {};
    
    if (!title.trim()) {
      errors.title = "Title is required";
    }
    
    if (!content.trim()) {
      errors.content = "Content is required";
    }
    
    if (!postType) {
      errors.postType = "Please select a post type";
    }
    
    // If there are validation errors, don't submit
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setError("Please fill in all required fields");
      return;
    }
    
    // Reset any previous errors
    setFormErrors({});
    
    // Double-check if user is creator
    const isCreator = community?.creator?.id === user?.id;
    
    try {
      setSubmitting(true);
      setError(null);
      
      if (!community) {
        throw new Error("Community data is missing");
      }
      
      console.log("Creating post with data:", {
        title,
        content, 
        postType,
        isCreator: community?.creator?.id === user?.id,
        communityId: community.id,
        communitySlug: slug,
        user: user?.id
      });
      
      // Create form data for the post
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("post_type", postType);
      formData.append("community", community.id.toString());
      
      // Add optional fields if they exist
      if (postType === "event") {
        if (eventDate) formData.append("event_date", eventDate);
        if (eventLocation) formData.append("event_location", eventLocation);
      }
      
      if (image) formData.append("image", image);
      if (file) formData.append("file", file);
      
      // Submit the post
      try {
        const response = await createPost(slug as string, formData);
        console.log("Post creation successful:", response);
        // Redirect to community page on success
        router.push(`/communities/${slug}`);
      } catch (postError: any) {
        console.error("Post creation error details:", postError?.response?.data || postError);
        
        // If we get a 403 permission error and user is creator, try joining the community first
        if (isCreator && postError?.response?.status === 403) {
          console.log("Creator received permission error, attempting community join first");
          
          // Import the join function
          const { joinCommunity } = await import("@/services/communityService");
          
          try {
            // Try joining the community first
            await joinCommunity(slug as string);
            console.log("Joined community, trying post creation again");
            
            // Try creating the post again
            const retryResponse = await createPost(slug as string, formData);
            console.log("Retry post creation successful:", retryResponse);
            
            // Redirect to community page on success
            router.push(`/communities/${slug}`);
            return;
          } catch (joinError) {
            console.error("Join attempt failed:", joinError);
            throw new Error("Failed to join community as creator");
          }
        }
        
        // If we reached here, re-throw the original error
        throw postError;
      }
    } catch (err) {
      console.error("Failed to create post:", err);
      setError("Failed to create post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-48 bg-gray-200 rounded mb-6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
          <Link
            href={`/communities/${slug}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Community
          </Link>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">Community not found</p>
              </div>
            </div>
          </div>
          <Link
            href="/communities"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Communities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li>
                <Link
                  href="/communities"
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Communities
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="w-3 h-3 text-gray-400 mx-1"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 6 10"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 9 4-4-4-4"
                    />
                  </svg>
                  <Link
                    href={`/communities/${slug}`}
                    className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
                  >
                    {community?.name}
                  </Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg
                    className="w-3 h-3 text-gray-400 mx-1"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 6 10"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 9 4-4-4-4"
                    />
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                    Create Post
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Create a new post in {community?.name}
          </h1>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="postType"
                  className="block text-sm font-medium text-gray-700"
                >
                  Post Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="postType"
                  name="postType"
                  className={`mt-1 block w-full rounded-md border ${
                    formErrors.postType ? "border-red-300" : "border-gray-300"
                  } py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm`}
                  value={postType}
                  onChange={(e) => setPostType(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select a post type
                  </option>
                  {postTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {formErrors.postType && (
                  <p className="mt-2 text-sm text-red-600">
                    {formErrors.postType}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  className={`mt-1 block w-full rounded-md ${
                    formErrors.title ? "border-red-300" : "border-gray-300"
                  } shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                {formErrors.title && (
                  <p className="mt-2 text-sm text-red-600">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="content"
                  className="block text-sm font-medium text-gray-700"
                >
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={6}
                  className={`mt-1 block w-full rounded-md ${
                    formErrors.content ? "border-red-300" : "border-gray-300"
                  } shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                ></textarea>
                {formErrors.content && (
                  <p className="mt-2 text-sm text-red-600">{formErrors.content}</p>
                )}
              </div>

              {/* Event details (only shown if post type is 'event') */}
              {postType === "event" && (
                <div className="space-y-6 bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-900">
                    Event Details
                  </h3>

                  {/* Event Date */}
                  <div>
                    <label
                      htmlFor="event-date"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Event Date and Time
                    </label>
                    <input
                      type="datetime-local"
                      name="event-date"
                      id="event-date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  {/* Event Location */}
                  <div>
                    <label
                      htmlFor="event-location"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Location
                    </label>
                    <input
                      type="text"
                      name="event-location"
                      id="event-location"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Where will the event take place?"
                    />
                  </div>
                </div>
              )}

              {/* Image Upload */}
              <div>
                <label
                  htmlFor="image"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Image (optional)
                </label>
                <input
                  type="file"
                  name="image"
                  id="image"
                  accept="image/*"
                  onChange={(e) =>
                    setImage(e.target.files ? e.target.files[0] : null)
                  }
                  className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  "
                />
                <p className="mt-1 text-xs text-gray-500">
                  Supported formats: JPEG, PNG, GIF. Max size: 5MB.
                </p>
              </div>

              {/* File Attachment */}
              <div>
                <label
                  htmlFor="file"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Attachment (optional)
                </label>
                <input
                  type="file"
                  name="file"
                  id="file"
                  onChange={(e) =>
                    setFile(e.target.files ? e.target.files[0] : null)
                  }
                  className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  "
                />
                <p className="mt-1 text-xs text-gray-500">
                  Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX. Max size: 10MB.
                </p>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Link
                  href={`/communities/${slug}`}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={!title || !content || submitting}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
                    ${
                      !title || !content || submitting
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    }`}
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating Post...
                    </>
                  ) : (
                    "Create Post"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 