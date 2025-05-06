"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Event } from "@/types/event";
import { fetchEvent, fetchMyEvents, joinEvent, leaveEvent } from "@/services/api/events/eventService";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getMediaUrl } from "@/services/api/apiClient";
import toast from "react-hot-toast";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = typeof params.id === "string" ? parseInt(params.id) : null;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);

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
      router.push("/events"); // Redirect to the main events page
      setTimeout(() => toast.success("You joined the event!"), 200); // Show toast after redirect
    } catch (err) {
      console.error("Join failed:", err);
      alert("Failed to join event.");
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
      router.push("/events"); // Redirect to the main events page
      setTimeout(() => toast.success("You left the event."), 200); // Show toast after redirect
    } catch (err) {
      console.error("Leave failed:", err);
      alert("Failed to leave event.");
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (error || !event)
    return (
      <div className="flex items-center justify-center h-screen text-center">
        <div className="text-gray-600">
          <h2 className="text-2xl font-semibold">Event Not Found</h2>
          <p className="mt-2">The event you’re looking for does not exist.</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg overflow-hidden">
        {event.image && (
          <img
            src={getMediaUrl(event.image)}
            alt={event.title}
            className="w-full h-64 object-cover"
          />
        )}
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
          <p className="text-gray-700 mt-2">{event.description}</p>
          <div className="mt-4 space-y-1 text-sm text-gray-600">
            <p>
              <strong>Date:</strong>{" "}
              {new Date(event.date_time).toLocaleString()}
            </p>
            <p>
              <strong>Location:</strong> {event.location}
            </p>
            <p>
              <strong>Participants:</strong>{" "}
              {event.participant_count} / {event.participant_limit ?? "∞"}
            </p>
            {event.participant_limit !== null && (
              <p>
                <strong>Spots Left:</strong>{" "}
                {event.participant_limit - event.participant_count}
              </p>
            )}
            <p>
              <strong>Privacy:</strong> {event.is_private ? "Private" : "Public"}
            </p>
            {event.is_canceled && (
              <p className="text-red-600 font-semibold">⚠️ This event is canceled.</p>
            )}
          </div>

          {!event.is_canceled && (
            <div className="mt-6">
              {joined ? (
                <button
                  onClick={handleLeave}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                  disabled={joining}
                >
                  {joining ? "Leaving..." : "Leave Event"}
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                  disabled={joining || event.is_full}
                >
                  {event.is_full ? "Event Full" : joining ? "Joining..." : "Join Event"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}