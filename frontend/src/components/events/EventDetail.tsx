"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchEvent } from "@/services/api/events/eventService";
import { notFound } from "next/navigation";

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const res = await fetchEvent(parseInt(id as string));
        setEvent(res.data);
      } catch (err) {
        console.error("Failed to fetch event:", err);
        setError(true);
      }
    };
    loadEvent();
  }, [id]);

  if (error) return notFound();
  if (!event) return <div className="text-center text-gray-500 py-10">Loading event...</div>;

  return (
    <div className="max-w-3xl mx-auto py-12 px-6 bg-white rounded shadow-md mt-10">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">{event.title}</h1>
      <p className="text-lg text-gray-700 mb-4">{event.description}</p>

      <div className="space-y-2 text-gray-600">
        <p><strong className="text-gray-800">📍 Location:</strong> {event.location}</p>
        <p><strong className="text-gray-800">📅 Date:</strong> {new Date(event.date_time).toLocaleString()}</p>
        <p><strong className="text-gray-800">👥 Participants:</strong> {event.participant_count} / {event.participant_limit ?? "∞"}</p>
      </div>
    </div>
  );
}
