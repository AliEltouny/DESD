"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Event } from "@/types/events";
import { getMediaUrl } from "@/services/api";

interface EventCardProps {
  event: Event;
  className?: string;
}

const EventCard: React.FC<EventCardProps> = ({ event, className = "" }) => {
  if (!event || typeof event !== "object" || !event.id) {
    console.error("Invalid event object", event);
    return null;
  }

  const formattedDate = new Date(event.date_time).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Link
      href={`/events/${event.id}`}
      className={`block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden ${className}`}
    >
      {/* Event image or fallback */}
      <div className="relative h-36 w-full bg-gray-100">
        {event.image ? (
          <img
          src={getMediaUrl(event.image)}
          alt={`${event.title} banner`}
          className="w-full h-full object-cover rounded-t-xl"
        />        
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-r from-blue-100 to-blue-50 text-gray-500 text-sm">
            No Image
          </div>
        )}
      </div>

      {/* Event details */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
          {event.title}
        </h3>

        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
          {event.description || "No description available."}
        </p>

        <div className="mt-4 text-sm text-gray-500 space-y-1">
          <div className="flex items-center">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formattedDate}
          </div>
          <div className="flex items-center">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414M15 10a5 5 0 10-10 0 5 5 0 0010 0z" />
            </svg>
            {event.location}
          </div>
          <div className="flex items-center">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M12 12a9 9 0 110-18 9 9 0 010 18z" />
            </svg>
            {event.participant_count}/{event.participant_limit ?? "∞"} participants
          </div>
          {event.participant_limit !== null && event.participant_count !== null && (
            <div className="flex items-center">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m2 0a8 8 0 11-16 0 8 8 0 0116 0z" />
              </svg>
              {event.participant_limit - event.participant_count} spots left
            </div>
          )}
        </div>

        {event.is_private && (
          <div className="mt-3 text-xs text-gray-500 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Private event
          </div>
        )}

        {event.is_canceled && (
          <div className="mt-2 text-xs font-medium text-red-600">Canceled</div>
        )}
      </div>
    </Link>
  );
};

export default EventCard;
