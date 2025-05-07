"use client";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import CreateEventForm from "@/components/events/form/CreateEventForm";

export default function CreateEventPage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Create Event</h1>
        <CreateEventForm />
      </div>
    </DashboardLayout>
  );
}
