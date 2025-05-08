"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const sampleCommunities = [
  {
    name: "UWE Sports Society",
    slug: "uwe-sports",
    description: "Join us for weekly sports events and training!",
  },
  {
    name: "UWE PakSoc",
    slug: "uwe-paksoc",
    description: "Cultural events, food festivals, and more.",
  },
  {
    name: "UWE Coding Club",
    slug: "uwe-coding",
    description: "Level up your coding skills with workshops and hackathons.",
  },
];

export default function CommunityPreviewSection() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleAction = (slug: string) => {
    if (isAuthenticated) {
      router.push(`/communities/${slug}/posts/create`);
    } else {
      router.push(`/login?redirect=/communities/${slug}/posts/create`);
    }
  };

  return (
    <section className="py-12 bg-gray-100" id="communities">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Explore Vibrant Communities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sampleCommunities.map((community) => (
            <div
              key={community.slug}
              className="bg-white shadow rounded-lg p-6 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {community.name}
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  {community.description}
                </p>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <Link
                  href={`/communities/${community.slug}`}
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  View
                </Link>
                <button
                  onClick={() => handleAction(community.slug)}
                  className="bg-blue-600 text-white px-4 py-2 text-sm rounded hover:bg-blue-700"
                >
                  Create Post
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
