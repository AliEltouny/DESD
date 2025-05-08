"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Event } from "@/types/event";
import { fetchEvent } from "@/services/api/events/eventService";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CreateEventForm from "@/components/events/form/CreateEventForm";

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = parseInt(params.id as string);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const res = await fetchEvent(eventId);
        setEvent(res.data);
      } catch (err) {
        console.error("Failed to fetch event:", err);
        router.push("/events");
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId, router]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6">
        <CreateEventForm initialData={event} isEditing />
      </div>
    </div>
  );
}