"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createCommunity } from "@/services/communityService";

export default function CreateCommunityPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [category, setCategory] = useState("academic");
  const [tags, setTags] = useState("");
  const [rules, setRules] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);

  // Image state
  const [image, setImage] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Form state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Refs for file inputs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Categories for selection
  const categories = [
    { value: "academic", label: "Academic" },
    { value: "social", label: "Social" },
    { value: "sports", label: "Sports" },
    { value: "arts", label: "Arts & Culture" },
    { value: "career", label: "Career & Professional" },
    { value: "technology", label: "Technology" },
    { value: "health", label: "Health & Wellness" },
    { value: "service", label: "Community Service" },
    { value: "other", label: "Other" },
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBanner(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setImage(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleBannerRemove = () => {
    setBanner(null);
    setBannerPreview(null);
    if (bannerInputRef.current) {
      bannerInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation on client side
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Community name is required";
    } else if (name.length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    } else if (name.length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    if (shortDescription && shortDescription.length > 255) {
      newErrors.shortDescription =
        "Short description must be less than 255 characters";
    }

    if (!category) {
      newErrors.category = "Category is required";
    }

    if (tags && tags.length > 255) {
      newErrors.tags = "Tags must be less than 255 characters";
    }

    // If there are validation errors, don't submit
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Manually submit the form using FormData and fetch
      const form = formRef.current;
      if (!form) return;

      setErrors({});
      setIsSubmitting(true);
      setSubmitError(null);

      // Use the native FormData object
      const formData = new FormData(form);

      // Ensure we get the right checkbox values and use the correct field names for Django
      formData.set("is_private", isPrivate ? "true" : "false");
      formData.set("requires_approval", requiresApproval ? "true" : "false");

      // Make sure short_description is set correctly (Django expects snake_case field names)
      if (shortDescription) {
        formData.set("short_description", shortDescription);
      } else {
        formData.delete("short_description");
      }

      // Clean up any empty values
      if (!tags) formData.delete("tags");
      if (!rules) formData.delete("rules");

      console.log(
        "Form submission started with data:",
        Object.fromEntries(formData.entries())
      );

      // Get token for authorization
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1];

      // Make the API request with proper error handling
      console.log(
        "Submitting to /api/communities with token:",
        token ? `Bearer ${token.substring(0, 10)}...` : "No token found"
      );

      try {
        // Use a simple, direct fetch with minimal headers
        const response = await fetch("/api/communities", {
          method: "POST",
          body: formData,
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        // Handle unsuccessful responses
        if (!response.ok) {
          let errorMessage = `Error ${response.status}: ${response.statusText}`;
          console.error("Response status:", response.status);

          try {
            // Try to parse the error response as JSON
            const errorData = await response.json();
            console.error("Response error data:", errorData);

            // Check if we have field-specific validation errors
            if (errorData.name) {
              // Set field-specific error
              setErrors((prev) => ({
                ...prev,
                name: Array.isArray(errorData.name)
                  ? errorData.name[0]
                  : errorData.name,
              }));
              errorMessage = "Please fix the highlighted fields.";
            } else if (errorData.detail) {
              errorMessage = errorData.detail;
            } else if (errorData.non_field_errors) {
              errorMessage = Array.isArray(errorData.non_field_errors)
                ? errorData.non_field_errors[0]
                : errorData.non_field_errors;
            } else if (typeof errorData === "object") {
              // Check for any field errors
              const fieldErrors: Record<string, string> = {};
              let hasErrors = false;

              Object.entries(errorData).forEach(([key, value]) => {
                if (key !== "detail" && key !== "non_field_errors") {
                  fieldErrors[key] = Array.isArray(value)
                    ? value[0]
                    : String(value);
                  hasErrors = true;
                }
              });

              if (hasErrors) {
                setErrors(fieldErrors);
                errorMessage = "Please fix the highlighted fields.";
              }
            }
          } catch (e) {
            // If it's not JSON, try to get the text
            const errorText = await response.text();
            console.error("Server error text:", errorText);

            // If it's HTML (likely a Django error page), give a simplified message
            if (errorText.includes("<!DOCTYPE html>")) {
              errorMessage =
                "The server encountered an internal error. Please try again later.";
            }
          }

          throw new Error(errorMessage);
        }

        // Handle successful response
        const newCommunity = await response.json();
        console.log("Community created successfully:", newCommunity);

        // Redirect to the new community
        router.push(`/communities/${newCommunity.slug}`);
      } catch (error: any) {
        console.error("Error in form submission:", error);
        setSubmitError(
          error.message || "Failed to create community. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error("Error in form submission:", error);
      setSubmitError(
        error.message || "Failed to create community. Please try again."
      );
    }
  };

  if (!isAuthenticated) {
    // Redirect to login or show a message
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h1>
            <p className="text-gray-600 mb-6">
              You need to be logged in to create a community.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Create a New Community
            </h1>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6">
            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
                <svg
                  className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    There was an error creating the community
                  </h3>
                  <p className="mt-1 text-sm text-red-700">{submitError}</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Basic Information Section */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Basic Information
                </h2>

                {/* Community Name */}
                <div className="mb-4">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Community Name <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.name
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="Enter a unique name for your community"
                    />
                    {errors.name && (
                      <div className="mt-2 flex items-start">
                        <svg
                          className="h-5 w-5 text-red-500 mr-1 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <p className="text-sm text-red-600">{errors.name}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      errors.description
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder="Describe what your community is about"
                  />
                  {errors.description && (
                    <div className="mt-2 flex items-start">
                      <svg
                        className="h-5 w-5 text-red-500 mr-1 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <p className="text-sm text-red-600">
                        {errors.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Short Description */}
                <div className="mb-4">
                  <label
                    htmlFor="short_description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Short Description
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="short_description"
                      name="short_description"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.shortDescription
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="A brief summary for preview cards (optional)"
                    />
                    {errors.shortDescription && (
                      <div className="mt-2 flex items-start">
                        <svg
                          className="h-5 w-5 text-red-500 mr-1 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <p className="text-sm text-red-600">
                          {errors.shortDescription}
                        </p>
                      </div>
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                      If left empty, we'll use a truncated version of the main
                      description.
                    </p>
                  </div>
                </div>

                {/* Category */}
                <div className="mb-4">
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Category <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="category"
                      name="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none ${
                        errors.category
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                    {errors.category && (
                      <div className="mt-2 flex items-start">
                        <svg
                          className="h-5 w-5 text-red-500 mr-1 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <p className="text-sm text-red-600">
                          {errors.category}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="mb-4">
                  <label
                    htmlFor="tags"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Tags
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <input
                        type="text"
                        id="tags"
                        name="tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                        placeholder="Enter comma-separated tags (e.g. engineering, robotics, computer science)"
                      />
                      {tags && (
                        <button
                          type="button"
                          onClick={() => setTags("")}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {tags
                        .split(",")
                        .filter((tag) => tag.trim())
                        .map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                    </div>
                    <p className="mt-2 text-sm text-gray-500 flex items-center">
                      <svg
                        className="h-4 w-4 text-gray-400 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Help others find your community with relevant tags
                    </p>
                  </div>
                </div>
              </div>

              {/* Media Section */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Community Media
                </h2>

                {/* Community Logo/Image */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Community Logo
                  </label>
                  <div className="flex items-start">
                    <div
                      className={`w-24 h-24 rounded-lg border-2 ${
                        imagePreview
                          ? "border-transparent"
                          : "border-dashed border-gray-300"
                      } overflow-hidden mr-4 flex items-center justify-center bg-gray-50`}
                    >
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Community logo preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          className="h-12 w-12 text-gray-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row">
                        <input
                          type="file"
                          id="image"
                          name="image"
                          ref={imageInputRef}
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Choose File
                        </button>
                        {imagePreview && (
                          <button
                            type="button"
                            onClick={handleImageRemove}
                            className="mt-2 sm:mt-0 sm:ml-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Recommended: Square image, at least 300x300 pixels. Max
                        5MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Community Banner */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Community Banner
                  </label>
                  <div className="flex flex-col items-start">
                    <div
                      className={`w-full h-32 rounded-lg border-2 ${
                        bannerPreview
                          ? "border-transparent"
                          : "border-dashed border-gray-300"
                      } overflow-hidden mb-4 flex items-center justify-center bg-gray-50`}
                    >
                      {bannerPreview ? (
                        <img
                          src={bannerPreview}
                          alt="Community banner preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center px-6 py-10">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="mt-1 text-sm text-gray-500">
                            Add a banner image to make your community stand out
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row">
                      <input
                        type="file"
                        id="banner"
                        name="banner"
                        ref={bannerInputRef}
                        accept="image/*"
                        onChange={handleBannerChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Choose File
                      </button>
                      {bannerPreview && (
                        <button
                          type="button"
                          onClick={handleBannerRemove}
                          className="mt-2 sm:mt-0 sm:ml-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Recommended: Wide image (3:1 ratio), at least 1200x400
                      pixels. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Rules and Settings */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Rules and Settings
                </h2>

                {/* Community Rules */}
                <div className="mb-4">
                  <label
                    htmlFor="rules"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Community Rules
                  </label>
                  <textarea
                    id="rules"
                    name="rules"
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter community rules or guidelines (optional)"
                  />
                </div>

                {/* Privacy Settings */}
                <div className="mb-4">
                  <fieldset>
                    <legend className="text-sm font-medium text-gray-700 mb-2">
                      Privacy Settings
                    </legend>

                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="is_private"
                          name="is_private"
                          type="checkbox"
                          checked={isPrivate}
                          onChange={(e) => setIsPrivate(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="is_private"
                          className="font-medium text-gray-700"
                        >
                          Private Community
                        </label>
                        <p className="text-gray-500">
                          Only members can see the content of this community.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="requires_approval"
                          name="requires_approval"
                          type="checkbox"
                          checked={requiresApproval}
                          onChange={(e) =>
                            setRequiresApproval(e.target.checked)
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="requires_approval"
                          className="font-medium text-gray-700"
                        >
                          Require Admin Approval
                        </label>
                        <p className="text-gray-500">
                          New members must be approved by an admin before they
                          can participate.
                        </p>
                      </div>
                    </div>
                  </fieldset>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                    Creating Community...
                  </>
                ) : (
                  "Create Community"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
