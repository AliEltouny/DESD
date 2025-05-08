"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const sampleEvents = [
  {
    id: 1,
    title: "UWE Sports Fest 2024",
    date: "2024-05-20",
    location: "UWE Frenchay Campus",
    description: "Celebrate sports, games, and community spirit at the annual UWE Sports Fest!",
  },
  {
    id: 2,
    title: "PakSoc Eid Dinner",
    date: "2024-06-15",
    location: "Bristol City Hall",
    description: "Join us for an evening of food, celebration, and cultural appreciation with PakSoc.",
  },
];

export default function EventPreviewSection() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleCreateEventClick = () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/create-event");
    } else {
      router.push("/create-event");
    }
  };

  return (
    <section className="bg-gray-100 py-12 px-4" id="events">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
          Featured Events
        </h2>
        <p className="text-center text-gray-600 mb-10">
          Explore exciting upcoming university events – join or host your own!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {sampleEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow p-6 border border-gray-200"
            >
              <h3 className="text-xl font-semibold text-blue-600">
                {event.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {event.date} &bull; {event.location}
              </p>
              <p className="mt-2 text-gray-700">{event.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleCreateEventClick}
            className="bg-blue-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-blue-700 transition"
          >
            Create or Join an Event
          </button>
        </div>
      </div>
    </section>
  );
}