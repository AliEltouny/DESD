"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Event } from "@/types/event";
import { fetchEvent, fetchMyEvents, joinEvent, leaveEvent, deleteEvent } from "@/services/api/events/eventService";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getMediaUrl } from "@/services/api/apiClient";
import { showToast } from "@/utils/toastHelper";
import { useUser } from "@/contexts/UserContext"; // Import useUser
import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = typeof params.id === "string" ? parseInt(params.id) : null;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, isLoadingProfile } = useUser(); // Use user and profile loading state

  // Debug logs to verify data
  console.log("User from context:", user);
  console.log("Event creator:", event?.created_by);
  console.log("isLoadingProfile:", isLoadingProfile);

  // Check if event.created_by is a number or an object
  const isCreator =
    !isLoadingProfile &&
    user?.id === (typeof event?.created_by === "number" ? event.created_by : event?.created_by?.id);

  console.log("Computed isCreator:", isCreator);

  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId || isNaN(eventId)) {
        router.push("/not-found");
        return;
      }

      try {
        const res = await fetchEvent(eventId);
        setEvent(res.data);

        // Check if user has joined
        try {
          const myEventsRes = await fetchMyEvents();
          const joinedEvents = Array.isArray(myEventsRes.data) ? myEventsRes.data : myEventsRes.data.results || [];
          const joinedEventIds = joinedEvents.map((e: any) => e.event.id);
          setJoined(joinedEventIds.includes(eventId));
        } catch (err) {
          console.error("Failed to fetch joined events:", err);
        }
      } catch (err: any) {
        console.error("Failed to fetch event:", err);
        setError("Event not found");
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId, router]);

  const handleJoin = async () => {
    if (!event) return;
    setJoining(true);
    try {
      await joinEvent(event.id);
      setJoined(true);
      setEvent({ ...event, participant_count: event.participant_count + 1 });
      router.push("/events");
      setTimeout(() => showToast.success("You joined the event!"), 200);
    } catch (err: any) {
      console.error("Join failed:", err);
      const msg = err?.response?.data?.detail || "Failed to join event.";
      showToast.error(`❌ ${msg}`);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!event) return;
    setJoining(true);
    try {
      await leaveEvent(event.id);
      setJoined(false);
      setEvent({ ...event, participant_count: event.participant_count - 1 });
      router.push("/events");
      setTimeout(() => showToast.success("You left the event."), 200);
    } catch (err) {
      console.error("Leave failed:", err);
      alert("Failed to leave event.");
    } finally {
      setJoining(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !confirm("Are you sure you want to delete this event?")) return;

    setIsDeleting(true);
    try {
      await deleteEvent(event.id);
      showToast.success("Event deleted successfully");
      router.push("/events");
    } catch (err) {
      console.error("Delete failed:", err);
      showToast.error("Failed to delete event");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    if (!event) return;
    router.push(`/events/${event.id}/edit`);
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (error || !event)
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen text-center">
          <div className="text-gray-600">
            <h2 className="text-2xl font-semibold">Event Not Found</h2>
            <p className="mt-2">The event you’re looking for does not exist.</p>
          </div>
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-100 py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white shadow rounded-lg overflow-hidden">
          {event.image && (
            <img
              src={getMediaUrl(event.image)}
              alt={event.title}
              className="w-full h-64 object-cover"
            />
          )}
          <div className="p-6 space-y-6">
            <h1 className="text-3xl font-extrabold text-gray-900">{event.title}</h1>

            <p className="text-gray-700 text-base">{event.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-700">
              <p><strong>Date:</strong> {new Date(event.date_time).toLocaleString()}</p>
              <p><strong>Location:</strong> {event.location}</p>
              <p><strong>Participants:</strong> {event.participant_count} / {event.participant_limit ?? "∞"}</p>
              {event.participant_limit !== null && (
                <p><strong>Spots Left:</strong> {event.participant_limit - event.participant_count}</p>
              )}
              <p><strong>Created By:</strong> {event.created_by?.username}</p>
              <p>
                <strong>Privacy:</strong>{" "}
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                  event.is_private ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                }`}>
                  {event.is_private ? "Private" : "Public"}
                </span>
              </p>
              {event.is_canceled && (
                <p className="col-span-2 text-red-600 font-semibold">⚠️ This event is canceled.</p>
              )}
            </div>

            {!event.is_canceled && !isCreator && (
            <div className="pt-4 flex gap-3">
              {joined ? (
                <button
                  onClick={handleLeave}
                  disabled={joining}
                  className="w-full sm:w-auto px-5 py-2 rounded-md font-medium text-white bg-yellow-600 hover:bg-yellow-700"
                >
                  {joining ? "Leaving..." : "Leave Event"}
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining || event.is_full}
                  className={`w-full sm:w-auto px-5 py-2 rounded-md font-medium text-white ${
                    event.is_full
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {event.is_full ? "Event Full" : joining ? "Joining..." : "Join Event"}
                </button>
              )}
            </div>
          )}

            
            {isCreator && (
              <div className="flex flex-wrap gap-3 pt-6">
                <button
                  onClick={handleEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md font-medium"
                >
                  Edit Event
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-md font-medium"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Event"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}