"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { communityApi } from "@/services/api";
import { UserMiniCard, UserSearchComponent } from "@/components/users";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { User } from "@/types/user";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CommunityMembersPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [community, setCommunity] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCommunityAndMembers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch community details
        const communityData = await communityApi.getCommunity(slug);
        setCommunity(communityData);

        // Fetch members
        const memberData = await communityApi.getCommunityMembers(slug);
        setMembers(memberData);
      } catch (err) {
        console.error("Error fetching community details:", err);
        setError("Failed to load community information. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchCommunityAndMembers();
    }
  }, [slug]);

  const handleMessageUser = (user: User) => {
    router.push(`/messages?user=${user.id}`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/communities/${slug}`}
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Back to Community
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {isLoading ? "Loading..." : `${community?.name} - Members`}
          </h1>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading members...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {error}
          </div>
        ) : (
          <>
            <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Find Members</h2>
              <UserSearchComponent
                onUserSelect={(user) => handleMessageUser(user)}
              />
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  All Members ({members.length})
                </h2>
              </div>

              {members.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  This community has no members yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <UserMiniCard
                      key={member.user.id}
                      user={member.user}
                      onClick={() => handleMessageUser(member.user)}
                      className="hover:bg-gray-50 transition duration-150"
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}