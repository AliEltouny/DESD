"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/utils/toastHelper"; // Import showToast
import { createEvent, updateEvent } from "@/services/api/events/eventService";
import { communityApi } from "@/services/api/community/communityApi";
import { Community } from "@/types/community";
import { Event } from "@/types/event";

interface CreateEventFormProps {
  initialData?: Event | null;
  isEditing?: boolean;
}

const CreateEventForm = ({ initialData, isEditing = false }: CreateEventFormProps) => {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [dateTime, setDateTime] = useState(
    initialData?.date_time
      ? new Date(initialData.date_time).toISOString().slice(0, 16)
      : ""
  );
  const [location, setLocation] = useState(initialData?.location || "");
  const [participantLimit, setParticipantLimit] = useState<number | null>(initialData?.participant_limit || null);
  const [isPrivate, setIsPrivate] = useState(initialData?.is_private || false);
  const [image, setImage] = useState<File | null | undefined>(undefined); // Allow undefined for no changes
  const [communityId, setCommunityId] = useState<number | null>(
    initialData?.community?.id || null
  );

  const [allAdminCommunities, setAllAdminCommunities] = useState<Community[]>([]); // Original list
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]); // Filtered list
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const communities = await communityApi.getCommunities({ role: "admin" });
        setAllAdminCommunities(communities || []);
        setFilteredCommunities(communities || []);

        if (isEditing && initialData?.community) {
          setCommunityId(initialData.community.id);
        }
      } catch (err) {
        console.error("Failed to fetch communities:", err);
      }
    };

    if (isPrivate || (isEditing && initialData?.is_private)) {
      fetchCommunities();
    }
  }, [isPrivate, isEditing, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (isPrivate && communityId) {
        const selected = allAdminCommunities.find((c) => c.id === communityId);
        if (!selected) {
          showToast.error("❌ You must be a leader/admin of the selected community.");
          setSubmitting(false);
          return;
        }
      }

      const formDataToSend = new FormData();
      formDataToSend.append("title", title);
      formDataToSend.append("description", description);
      formDataToSend.append("date_time", new Date(dateTime).toISOString());
      formDataToSend.append("location", location);

      if (participantLimit) {
        formDataToSend.append("participant_limit", participantLimit.toString());
      }

      formDataToSend.append("is_private", isPrivate.toString());

      if (isPrivate && communityId) {
        formDataToSend.append("community", communityId.toString());
      }

      if (image instanceof File) {
        formDataToSend.append("image", image);
      } else if (image === null) {
        // Send "image": "" only if the user chooses to remove the image
        formDataToSend.append("image", "");
      }

      let response;
      if (isEditing && initialData) {
        response = await updateEvent(initialData.id, formDataToSend);
        showToast.success("🎉 Event updated successfully!");
        router.push(`/events/${response.data.id}`);
      } else {
        response = await createEvent(formDataToSend);
        showToast.success("🎉 Event created successfully!");
        router.push("/events");
      }
    } 
    catch (err: any) {
      const errorData = err?.response?.data;
      let serverMsg = "An error occurred.";
    
      // Helper: extract first field-specific error if available
      const extractFirstError = (data: any): string => {
        if (typeof data === "string") return data;
    
        if (Array.isArray(data)) {
          return data.map(extractFirstError).join(", ");
        }
    
        if (typeof data === "object") {
          // Prioritize 'errors' or Django-style field errors
          if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
            const first = data.errors[0];
            return first?.message || first?.detail || JSON.stringify(first);
          }
    
          const firstKey = Object.keys(data)[0];
          const firstVal = data[firstKey];
          if (Array.isArray(firstVal)) return firstVal[0];
          return typeof firstVal === "string" ? firstVal : JSON.stringify(firstVal);
        }
    
        return String(data);
      };
    
      if (errorData) {
        serverMsg = extractFirstError(errorData);
      }
    
      showToast.error(`❌ ${serverMsg}`);
      setError(serverMsg);
    }
    
    finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-6 bg-white p-8 rounded-lg shadow-lg max-w-xl mx-auto" onSubmit={handleSubmit}>
  
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">Title</label>
        <input
          type="text"
          placeholder="e.g. Study Skills Workshop"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

      </div>
  
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Description <span className="text-gray-500 font-normal">(include any required materials)</span>
        </label>
        <textarea
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
            placeholder="e.g. Describe your event here. Include any required materials like notebooks, laptops, or handouts.
"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
         />

      </div>
  
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">Date & Time</label>
        <input
          type="datetime-local"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          required
        />
      </div>
  
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">Location</label>
        <input
          type="text"
          placeholder="e.g. Room 2Q42, Frenchay Campus or link if online"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />

      </div>
  
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">Participant Limit (optional)</label>
        <input
          type="number"
          min={1}
          placeholder="e.g. 50"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
          value={participantLimit ?? ""}
          onChange={(e) =>
            setParticipantLimit(e.target.value ? parseInt(e.target.value) : null)
          }
        />
      </div>
  
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPrivate"
          checked={isPrivate}
          onChange={() => setIsPrivate(!isPrivate)}
          className="mr-2"
        />
        <label htmlFor="isPrivate" className="text-sm font-semibold text-gray-800">Private Event (linked to a community)</label>
      </div>
  
      {isPrivate && (
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Select Community</label>
          <input
            type="text"
            placeholder="Search your communities..."
            className="mb-2 block w-full rounded-md border px-3 py-2 text-sm text-gray-900 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) => {
              const keyword = e.target.value.toLowerCase();
              const filtered = allAdminCommunities.filter((c) =>
                c.name.toLowerCase().includes(keyword)
              );
              setFilteredCommunities(filtered);
            }}
          />
          <select
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
            value={communityId || ""}
            onChange={(e) => setCommunityId(Number(e.target.value))}
            required
          >
            <option value="" disabled>Select your community</option>
            {filteredCommunities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
  
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">Image (optional)</label>
        {!image && initialData?.image && (
          <div className="mb-2">
            <p className="text-sm text-gray-600 mb-1">Current Image:</p>
            <img
              src={initialData.image}
              alt="Current event"
              className="w-full h-48 object-cover rounded-md"
            />
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || undefined)}
          className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {initialData?.image && !image && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="removeImage"
              onChange={(e) => setImage(e.target.checked ? null : undefined)}
            />
            <label htmlFor="removeImage" className="text-sm text-gray-700">
              Remove current image
            </label>
          </div>
        )}
      </div>
  
      {error && <p className="text-red-500 text-sm">{error}</p>}
  
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        disabled={submitting}
      >
        {submitting
          ? isEditing
            ? "Updating..."
            : "Creating..."
          : isEditing
          ? "Update Event"
          : "Create Event"}
      </button>
    </form>
  );
};

export default CreateEventForm;
