"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { communityApi } from "@/services/api";
import { Community } from "@/types/community";
import Card from "@/components/ui/Card";
import { getMediaUrl } from "@/services/api";

const CommunityRecommendations: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get newly created communities (latest ones, exclude ones the user is already a member of)
        const data = await communityApi.getCommunities({
          order_by: "created_at",
          limit: 3,
        });

        // Ensure data is valid before filtering
        if (Array.isArray(data)) {
          setCommunities(
            data.filter(
              (community) =>
                community &&
                typeof community === "object" &&
                !(community.is_member ?? false)
            )
          );
        } else {
          console.error("Received invalid data format for communities", data);
          setCommunities([]);
        }
      } catch (err) {
        console.error("Failed to fetch community recommendations:", err);
        setError("Failed to load recommendations");
        setCommunities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, []);

  // If no recommendations (either loading or error or all already joined)
  if (loading || error || communities.length === 0) {
    return null;
  }

  // Get category badge color
  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      academic: "bg-blue-100 text-blue-800",
      social: "bg-purple-100 text-purple-800",
      sports: "bg-green-100 text-green-800",
      arts: "bg-orange-100 text-orange-800",
      career: "bg-teal-100 text-teal-800",
      technology: "bg-indigo-100 text-indigo-800",
      health: "bg-red-100 text-red-800",
      service: "bg-yellow-100 text-yellow-800",
      other: "bg-gray-100 text-gray-800",
    };

    return colorMap[category] || "bg-gray-100 text-gray-800";
  };

  // Generate initials for communities without images
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card
      title="Recommended Communities"
      className={className}
      headerAction={
        <Link
          href="/communities"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View All
        </Link>
      }
    >
      <div className="space-y-4">
        {Array.isArray(communities)
          ? communities.map((community) =>
              community && community.id && community.slug && community.name ? (
                <Link
                  key={community.id}
                  href={`/communities/${community.slug}`}
                  className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Community Avatar */}
                  <div className="flex-shrink-0">
                    {community.image ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                        <Image
                          src={getMediaUrl(community.image)}
                          alt={community.name}
                          fill
                          style={{ objectFit: "cover" }}
                          className="rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 text-blue-600 font-semibold text-lg">
                        {getInitials(community.name)}
                      </div>
                    )}
                  </div>

                  {/* Community Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {community.name}
                      </h4>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                          community.category || "other"
                        )}`}
                      >
                        {(community.category || "other")
                          .charAt(0)
                          .toUpperCase() +
                          (community.category || "other").slice(1)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      {community.short_description ||
                        community.description ||
                        "No description available"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {community.member_count || 0}{" "}
                      {(community.member_count || 0) === 1
                        ? "member"
                        : "members"}
                    </p>
                  </div>
                </Link>
              ) : null
            )
          : null}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
        <Link
          href="/communities"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Discover More Communities
          <svg
            className="ml-1 w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>
    </Card>
  );
};

export default CommunityRecommendations;
