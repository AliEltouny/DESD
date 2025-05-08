"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";

import { useCreateCommunity } from '@/hooks/communities/create/useCreateCommunity';
import MediaUpload from "@/components/ui/MediaUpload";
import CategorySelect from "@/components/ui/CategorySelect";
import { CommunityFormData } from "@/types/community";

// --- Zod Schema Definition ---
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

const communitySchema = z.object({
  name: z.string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  description: z.string()
    .min(1, "Description is required")
    .trim(),
  short_description: z.string()
    .max(255, "Short description must be less than 255 characters")
    .optional()
    .or(z.literal('')), // Allow empty string
  category: z.string().min(1, "Category is required"),
  tags: z.string()
    .max(255, "Tags must be less than 255 characters")
    .optional()
    .refine((val) => !val || /^[a-zA-Z0-9\s,-]*$/.test(val), { // Basic tag validation (allow letters, numbers, spaces, commas, hyphens)
        message: "Tags can only contain letters, numbers, spaces, commas, and hyphens.",
    }),
  rules: z.string().optional(),
  is_private: z.boolean().optional(),
  requires_approval: z.boolean().optional(),
  image: z
    .instanceof(File, { message: "Image is required." })
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      "Only .jpg, .jpeg, .png, .webp and .gif formats are supported."
    ).nullable().optional(), // Allow null/optional for initial state
  banner: z
    .instanceof(File, { message: "Banner is required." })
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max banner size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      "Only .jpg, .jpeg, .png, .webp and .gif formats are supported."
    ).nullable().optional(), // Allow null/optional
});

// Infer the type from the schema
type CommunitySchemaType = z.infer<typeof communitySchema>;

interface CreateCommunityFormProps {
    // Example: onSubmitSuccess?: (slug: string) => void;
}

const CreateCommunityForm: React.FC<CreateCommunityFormProps> = (/* props */) => {
  const router = useRouter();
  const { createCommunity, isCreating, error: createApiError } = useCreateCommunity();
  const [creationSuccess, setCreationSuccess] = useState(false);
  const [newCommunitySlug, setNewCommunitySlug] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Add state to track retry attempts for availability check
  const [availabilityCheckCount, setAvailabilityCheckCount] = useState(0);
  const MAX_AVAILABILITY_CHECKS = 3;

  // --- React Hook Form Initialization ---
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CommunitySchemaType>({
    resolver: zodResolver(communitySchema),
    defaultValues: {
        name: "",
        description: "",
        short_description: "",
        category: "academic",
        tags: "",
        rules: "",
        is_private: false,
        requires_approval: false,
        image: null,
        banner: null,
    }
  });

  const watchedTags = watch("tags");

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

  const onSubmit: SubmitHandler<CommunitySchemaType> = async (data) => {
    console.log("Form data validated by Zod:", data);

    // Create a properly structured CommunityFormData object that matches what communityApi expects
    const communityData: CommunityFormData = {
      name: data.name,
      description: data.description,
      short_description: data.short_description || '',
      category: data.category,
      tags: data.tags || '',
      rules: data.rules || '',
      is_private: data.is_private || false,
      requires_approval: data.requires_approval || false,
      image: data.image, // Will be null if no file selected
      banner: data.banner, // Will be null if no file selected
    };

    console.log("Submitting community data:", communityData);

    try {
      // Let communityApi.createCommunity handle the FormData creation internally
      const response = await createCommunity(communityData);
      
      if (response) {
        console.log("Community created successfully:", response);
        
        // Update success state and store the new community slug
        setCreationSuccess(true);
        setNewCommunitySlug(response.slug);
        setRedirectCountdown(5); // Reset countdown to 5 seconds
        reset(); // Reset form fields
        
        // We won't redirect immediately - the useEffect countdown will handle redirection
      } else {
        console.error("Error creating community:", createApiError);
      }
    } catch (error) {
      console.error("Error caught in component:", error);
    }
  };

  // Add useEffect to handle the countdown and successful community creation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (creationSuccess && newCommunitySlug) {
      // Set up countdown timer
      timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            
            // If we've already tried MAX_AVAILABILITY_CHECKS times, force redirect
            if (availabilityCheckCount >= MAX_AVAILABILITY_CHECKS) {
              console.log("Max retries reached, forcing redirect to community...");
              router.push(`/communities/${newCommunitySlug}`);
              return 0;
            }
            
            // Before redirecting, pre-check if the community is available
            const checkCommunity = async () => {
              try {
                setAvailabilityCheckCount(prev => prev + 1);
                // Make a HEAD request to check if community exists yet before redirecting
                const communityApiUrl = `/api/communities/${newCommunitySlug}/`;
                
                await fetch(communityApiUrl, { method: 'HEAD' });
                console.log("Community exists, redirecting now...");
                
                // Community is ready, now redirect
                router.push(`/communities/${newCommunitySlug}`);
              } catch (error) {
                console.log(`Community not ready yet (attempt ${availabilityCheckCount + 1}/${MAX_AVAILABILITY_CHECKS})...`);
                
                // If we've hit the max retries, force redirect anyway
                if (availabilityCheckCount >= MAX_AVAILABILITY_CHECKS) {
                  console.log("Max retries reached, forcing redirect to community...");
                  router.push(`/communities/${newCommunitySlug}`);
                  return;
                }
                
                // Otherwise, add additional seconds to wait
                setRedirectCountdown(3);
              }
            };
            
            checkCommunity();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      clearInterval(timer);
    };
  }, [creationSuccess, newCommunitySlug, router, availabilityCheckCount]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
      {createApiError && (
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
            <p className="mt-1 text-sm text-red-700">{createApiError}</p>
          </div>
        </div>
      )}

      {creationSuccess && newCommunitySlug && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m2-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Community created successfully!
              </p>
              <p className="mt-1 text-sm text-green-700">
                Redirecting to your community page in{" "}
                <span className="font-semibold">{redirectCountdown}</span> seconds...
              </p>
              <div className="mt-3 flex space-x-2">
                <button
                  type="button"
                  onClick={() => router.push(`/communities/${newCommunitySlug}`)}
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Go now
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/communities')}
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Go to communities
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Basic Information
          </h2>

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
                {...register("name")}
                className={`w-full px-4 py-3 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 font-normal ${
                  errors.name ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                }`}
                placeholder="Enter a unique name for your community"
                style={{ color: "#111827", fontWeight: "normal" }}
              />
              {errors.name && (
                <div className="mt-2 flex items-start">
                   <svg className="h-5 w-5 text-red-500 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                   </svg>
                   <p className="text-sm text-red-600">{errors.name.message}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              id="description"
              {...register("description")}
              rows={4}
              className={`w-full px-4 py-3 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 font-normal ${
                errors.description ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
              }`}
              placeholder="Describe what your community is about"
              style={{ color: "#111827", fontWeight: "normal" }}
            />
             {errors.description && (
                <div className="mt-2 flex items-start">
                   <svg className="h-5 w-5 text-red-500 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                   </svg>
                    <p className="text-sm text-red-600">{errors.description.message}</p>
                </div>
             )}
          </div>

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
                {...register("short_description")}
                className={`w-full px-4 py-3 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 font-normal ${
                  errors.short_description ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                }`}
                placeholder="A brief summary for preview cards (optional)"
                style={{ color: "#111827", fontWeight: "normal" }}
              />
              {errors.short_description && (
                 <div className="mt-2 flex items-start">
                    <svg className="h-5 w-5 text-red-500 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <p className="text-sm text-red-600">{errors.short_description.message}</p>
                 </div>
              )}
              <p className="mt-2 text-sm text-gray-500">
                If left empty, we&apos;ll use a truncated version of the main
                description.
              </p>
            </div>
          </div>

          <div className="mb-4">
             <Controller
                name="category"
                control={control}
                render={({ field }) => (
                    <CategorySelect
                        id="category"
                        label="Category"
                        options={categories}
                        required
                        error={errors.category?.message}
                        className="font-normal"
                        {...field}
                    />
                )}
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tags
            </label>
            <div className="relative">
               <input
                  type="text"
                  id="tags"
                  {...register("tags")}
                  className={`w-full px-4 py-3 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400 text-gray-900 font-normal ${errors.tags ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                  placeholder="Enter comma-separated tags (e.g. engineering, robotics)"
                  style={{ color: "#111827", fontWeight: "normal" }}
               />
               {watchedTags && (
                <button type="button" onClick={() => setValue('tags', '', { shouldValidate: true })} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {watchedTags
                  ?.split(",")
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
              {errors.tags && (
                 <div className="mt-2 flex items-start">
                   <svg className="h-5 w-5 text-red-500 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                   </svg>
                   <p className="text-sm text-red-600">{errors.tags.message}</p>
                 </div>
               )}
              <p className="mt-2 text-sm text-gray-500 flex items-center">
                <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Help others find your community with relevant tags
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Community Media
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="mb-4">
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
                            error={errors.image?.message}
                            maxSize={5}
                            inputRef={ref}
                        />
                    )}
                />
              </div>

              <div className="mb-4">
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
                            error={errors.banner?.message}
                            maxSize={5}
                            inputRef={ref}
                        />
                    )}
                />
              </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Rules and Settings
          </h2>

          <div className="mb-6">
            <label
              htmlFor="rules"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Community Rules (Optional)
            </label>
            <textarea
              id="rules"
              {...register("rules")}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400 text-gray-900 font-normal"
              placeholder="Enter any specific rules or guidelines for your community"
              style={{ color: "#111827", fontWeight: "normal" }}
            />
            <p className="mt-2 text-sm text-gray-500">
              Clear community rules help establish expectations.
            </p>
          </div>

          <div className="mb-4">
            <fieldset>
              <legend className="text-sm font-medium text-gray-700 mb-2">
                Privacy Settings
              </legend>
              <div className="space-y-3">
                  <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="is_private"
                        type="checkbox"
                        {...register("is_private")}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="is_private" className="font-normal text-gray-700" style={{fontWeight: "normal"}}>
                        Private Community
                      </label>
                      <p className="text-gray-500 font-normal" style={{fontWeight: "normal"}}>Only members can see the content.</p>
                    </div>
                  </div>
                  <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="requires_approval"
                        type="checkbox"
                        {...register("requires_approval")}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="requires_approval" className="font-normal text-gray-700" style={{fontWeight: "normal"}}>
                        Require Approval to Join
                      </label>
                      <p className="text-gray-500 font-normal" style={{fontWeight: "normal"}}>Admins must approve new members.</p>
                    </div>
                  </div>
              </div>
            </fieldset>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200 flex justify-end">
        <button
          type="button"
          onClick={() => { router.back(); /* reset(); */ } }
          className="px-5 py-2.5 border border-gray-300 shadow-sm text-sm font-normal rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mr-3"
          style={{ fontWeight: "normal" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isCreating}
          className={`px-6 py-2.5 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${isCreating ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isCreating ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </div>
          ) : (
            "Create Community"
          )}
        </button>
      </div>
    </form>
  );
};

export default CreateCommunityForm;