"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCommunity } from "@/hooks/communities";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { communityApi } from "@/services/api";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import MediaUpload from "@/components/ui/MediaUpload";

// Community settings schema
const communitySettingsSchema = z.object({
  name: z.string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters"),
  description: z.string()
    .min(10, "Description must be at least 10 characters"),
  short_description: z.string()
    .max(255, "Short description must be less than 255 characters")
    .optional(),
  category: z.string().min(1, "Category is required"),
  tags: z.string()
    .max(255, "Tags must be less than 255 characters")
    .optional(),
  rules: z.string().optional(),
  is_private: z.boolean().optional(),
  requires_approval: z.boolean().optional(),
  image: z.any().optional(), // File handling will be done separately
  banner: z.any().optional(), // File handling will be done separately
});

type CommunitySettingsFormData = z.infer<typeof communitySettingsSchema>;

export default function ManageCommunitySettingsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  // Local states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Fetch community data
  const { 
    community, 
    loading: isLoadingCommunity, 
    error: communityError,
    refresh: refreshCommunity 
  } = useCommunity(slug);
  
  // Combined loading state
  const isLoading = isAuthLoading || isLoadingCommunity;
  
  // Form setup
  const { register, handleSubmit, reset, control, formState: { errors }, watch } = useForm<CommunitySettingsFormData>({
    resolver: zodResolver(communitySettingsSchema),
    defaultValues: {
      name: '',
      description: '',
      short_description: '',
      category: '',
      tags: '',
      rules: '',
      is_private: false,
      requires_approval: false,
    }
  });
  
  // Check if user is an admin
  const isAdmin = community?.membership_role === 'admin';
  
  // Redirect if not admin after loading completes
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      router.push(`/communities/${slug}`);
    }
  }, [isLoading, isAuthenticated, isAdmin, router, slug]);
  
  // Set form values once community data is loaded
  useEffect(() => {
    if (community) {
      reset({
        name: community.name || '',
        description: community.description || '',
        short_description: community.short_description || '',
        category: community.category || 'other',
        tags: community.tags || '',
        rules: community.rules || '',
        is_private: community.is_private || false,
        requires_approval: community.requires_approval || false,
      });
    }
  }, [community, reset]);
  
  // Categories list
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
  
  // Handle form submission
  const onSubmit = async (data: CommunitySettingsFormData) => {
    if (!community) return;
    
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      // Create basic FormData
      const formData = new FormData();
      
      // Add text fields
      formData.append('name', data.name || '');
      formData.append('description', data.description || '');
      formData.append('short_description', data.short_description || '');
      formData.append('category', data.category || 'other');
      formData.append('tags', data.tags || '');
      formData.append('rules', data.rules || '');
      formData.append('is_private', data.is_private ? 'true' : 'false');
      formData.append('requires_approval', data.requires_approval ? 'true' : 'false');
      
      // Add images if available
      if (data.image instanceof File) {
        formData.append('image', data.image);
      }
      
      if (data.banner instanceof File) {
        formData.append('banner', data.banner);
      }
      
      // Use our simple API endpoint to avoid CORS issues
      const response = await fetch(`/api/update-simple?slug=${slug}`, {
        method: 'POST',
        body: formData
      });
      
      // Handle response
      if (response.ok) {
        setSuccessMessage("Community settings updated successfully!");
        await refreshCommunity();
        
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        let errorMessage = "Failed to update community.";
        
        // Try to get more details
        try {
          const errorData = await response.json();
          if (errorData.error || errorData.detail) {
            errorMessage = errorData.error || errorData.detail;
          }
        } catch (e) {
          // If we can't parse the response, use a generic message
        }
        
        setErrorMessage(errorMessage);
      }
    } catch (error) {
      console.error('Error during update:', error);
      setErrorMessage("Network error during update. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }
  
  // Show error state
  if (communityError || !community) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            <h2 className="text-lg font-medium">Error</h2>
            <p>{communityError || "Failed to load community data"}</p>
            <Link 
              href={`/communities/${slug}`}
              className="text-sm underline mt-2 inline-block"
            >
              Return to community
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Display unauthorized message if needed
  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md mb-6">
            <h2 className="text-lg font-medium">Access Denied</h2>
            <p>You don't have permission to manage this community's settings.</p>
            <Link 
              href={`/communities/${slug}`}
              className="text-sm underline mt-2 inline-block"
            >
              Return to community
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb navigation */}
        <div className="flex flex-wrap items-center mb-6 text-sm">
          <Link 
            href={`/communities/${slug}`}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Community
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <Link 
            href={`/communities/${slug}/manage`}
            className="text-blue-600 hover:text-blue-800"
          >
            Manage Community
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-600">Settings</span>
        </div>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Community Settings</h1>
          <p className="text-gray-600">
            Update information, rules, and privacy settings for your community.
          </p>
        </div>
        
        {/* Status Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}
        
        {/* Settings Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Basic Information */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              {/* Community Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Community Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  {...register("name")}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.name ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="description"
                  rows={4}
                  {...register("description")}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.description ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
              
              {/* Short Description */}
              <div>
                <label htmlFor="short_description" className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                </label>
                <input
                  id="short_description"
                  type="text"
                  {...register("short_description")}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.short_description ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.short_description && (
                  <p className="mt-1 text-sm text-red-600">{errors.short_description.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  A brief summary for preview cards. If left empty, we'll use a truncated version of the main description.
                </p>
              </div>
              
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-600">*</span>
                </label>
                <select
                  id="category"
                  {...register("category")}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.category ? "border-red-500" : "border-gray-300"}`}
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>
              
              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  id="tags"
                  type="text"
                  {...register("tags")}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.tags ? "border-red-500" : "border-gray-300"}`}
                  placeholder="programming, study, engineering"
                />
                {errors.tags && (
                  <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Comma-separated tags to help others find your community.
                </p>
              </div>
            </div>
          </div>
          
          {/* Community Media */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Community Media</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Community Logo */}
              <div>
                <Controller
                  name="image"
                  control={control}
                  render={({ field: { onChange, onBlur, value, name, ref } }) => (
                    <MediaUpload
                      id="image"
                      name={name}
                      label="Community Logo"
                      value={value}
                      onChange={(file) => onChange(file)}
                      onBlur={onBlur}
                      previewType="circle"
                      aspectRatio={1}
                      description="Square image. Recommended 300x300+. Max 5MB."
                      maxSize={5}
                      inputRef={ref}
                    />
                  )}
                />
              </div>
              
              {/* Community Banner */}
              <div>
                <Controller
                  name="banner"
                  control={control}
                  render={({ field: { onChange, onBlur, value, name, ref } }) => (
                    <MediaUpload
                      id="banner"
                      name={name}
                      label="Community Banner"
                      value={value}
                      onChange={(file) => onChange(file)}
                      onBlur={onBlur}
                      previewType="banner"
                      aspectRatio={3}
                      description="Wide image (3:1 ratio). Recommended 1200x400+. Max 5MB."
                      maxSize={5}
                      inputRef={ref}
                    />
                  )}
                />
              </div>
            </div>
          </div>
          
          {/* Rules and Privacy */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Rules and Privacy</h2>
            
            <div className="space-y-4">
              {/* Rules */}
              <div>
                <label htmlFor="rules" className="block text-sm font-medium text-gray-700 mb-1">
                  Community Rules
                </label>
                <textarea
                  id="rules"
                  rows={4}
                  {...register("rules")}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.rules ? "border-red-500" : "border-gray-300"}`}
                  placeholder="1. Be respectful to other members&#10;2. No spamming or self-promotion&#10;3. Stay on topic"
                />
                {errors.rules && (
                  <p className="mt-1 text-sm text-red-600">{errors.rules.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Clear rules help set expectations and reduce moderation work.
                </p>
              </div>
              
              {/* Privacy Settings */}
              <div className="space-y-3">
                <p className="block text-sm font-medium text-gray-700">
                  Privacy Settings
                </p>
                
                {/* Is Private */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="is_private"
                      type="checkbox"
                      {...register("is_private")}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_private" className="font-medium text-gray-700">
                      Private Community
                    </label>
                    <p className="text-gray-500">
                      Only members can see community content
                    </p>
                  </div>
                </div>
                
                {/* Requires Approval */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="requires_approval"
                      type="checkbox"
                      {...register("requires_approval")}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="requires_approval" className="font-medium text-gray-700">
                      Requires Approval to Join
                    </label>
                    <p className="text-gray-500">
                      Admins must approve new member requests
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="px-6 py-4 bg-gray-50 text-right">
            <Link
              href={`/communities/${slug}/manage`}
              className="px-4 py-2 mr-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 