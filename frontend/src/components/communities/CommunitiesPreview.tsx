import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { communityApi } from "@/services/api";
import { Community } from "@/types/community";
import Card from "@/components/ui/Card";
import { getMediaUrl } from "@/services/api";

interface CommunitiesPreviewProps {
  className?: string;
  userId?: number;
}

const CommunitiesPreview: React.FC<CommunitiesPreviewProps> = ({
  className = "",
  userId,
}) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCommunities = async () => {
      try {
        setLoading(true);
        // If userId is provided, get only communities the user is a member of
        // Otherwise get all communities
        const params = userId ? { member_of: true } : { limit: 3 };
        const data = await communityApi.getCommunities(params);

        // Ensure we got an array back
        if (!Array.isArray(data)) {
          setCommunities([]);
          return;
        }

        setCommunities(data.slice(0, 3)); // Show max 3 communities
      } catch (err: unknown) {
        console.error("Failed to load communities:", err);
        setError("Could not load communities");
      } finally {
        setLoading(false);
      }
    };

    loadCommunities();
  }, [userId]);

  if (loading) {
    return (
      <Card title="Communities" className={className}>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center space-x-4">
              <div className="rounded-lg bg-gray-200 h-12 w-12"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error || communities.length === 0) {
    return (
      <Card title="Communities" className={className}>
        <div className="text-center py-6">
          <p className="text-gray-500">{error || "No communities found"}</p>
          <Link
            href="/communities"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            Browse Communities
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Communities"
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
        {communities.map((community) => (
          <Link
            key={community.id}
            href={`/communities/${community.slug}`}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* Community Image */}
            <div className="flex-shrink-0 relative h-12 w-12 rounded-lg overflow-hidden">
              {community.image ? (
                <Image
                  src={getMediaUrl(community.image)}
                  alt={community.name}
                  fill
                  style={{ objectFit: "cover" }}
                  className="rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-blue-100 text-blue-600 font-semibold">
                  {community.name
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .toUpperCase()
                    .substring(0, 2)}
                </div>
              )}
            </div>

            {/* Community Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {community.name}
              </h4>
              <p className="text-xs text-gray-500">
                {community.member_count || 0} members
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
};

export default CommunitiesPreview;
