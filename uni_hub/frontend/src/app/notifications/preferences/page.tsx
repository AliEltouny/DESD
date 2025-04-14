// app/notifications/preferences/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/services/notificationService";
import { useRouter } from "next/navigation";

const NotificationPreferencesPage = () => {
  const [preferences, setPreferences] = useState({
    community_invites: true,
    community_join_requests: true,
    community_updates: true,
    community_new_posts: true,
    community_post_updates: true,
    post_upvotes: true,
    comment_upvotes: true,
    comment_replies: true,
    mention_notifications: true,
    email_community_invites: true,
    email_community_updates: false,
    email_engagement: false,
    push_notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        const data = await getNotificationPreferences();
        setPreferences(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load notification preferences");
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateNotificationPreferences(preferences);
      router.push("/notifications");
    } catch (err) {
      setError("Failed to save preferences");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <p className="text-red-500 text-lg">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Notification Preferences
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Customize how you receive notifications
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Community Notifications
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="community_invites"
                        name="community_invites"
                        type="checkbox"
                        checked={preferences.community_invites}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="community_invites"
                        className="font-medium text-gray-700"
                      >
                        Community Invitations
                      </label>
                      <p className="text-gray-500">
                        Receive notifications when you're invited to join a
                        community
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="community_join_requests"
                        name="community_join_requests"
                        type="checkbox"
                        checked={preferences.community_join_requests}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="community_join_requests"
                        className="font-medium text-gray-700"
                      >
                        Join Requests
                      </label>
                      <p className="text-gray-500">
                        Receive notifications when someone requests to join your
                        community
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="community_updates"
                        name="community_updates"
                        type="checkbox"
                        checked={preferences.community_updates}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="community_updates"
                        className="font-medium text-gray-700"
                      >
                        Community Updates
                      </label>
                      <p className="text-gray-500">
                        Receive notifications about important community updates
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="community_new_posts"
                        name="community_new_posts"
                        type="checkbox"
                        checked={preferences.community_new_posts}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="community_new_posts"
                        className="font-medium text-gray-700"
                      >
                        New Posts
                      </label>
                      <p className="text-gray-500">
                        Receive notifications when new posts are created in your
                        communities
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="community_post_updates"
                        name="community_post_updates"
                        type="checkbox"
                        checked={preferences.community_post_updates}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="community_post_updates"
                        className="font-medium text-gray-700"
                      >
                        Post Updates
                      </label>
                      <p className="text-gray-500">
                        Receive notifications when posts you're following are
                        updated
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Engagement Notifications
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="post_upvotes"
                        name="post_upvotes"
                        type="checkbox"
                        checked={preferences.post_upvotes}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="post_upvotes"
                        className="font-medium text-gray-700"
                      >
                        Post Upvotes
                      </label>
                      <p className="text-gray-500">
                        Receive notifications when someone upvotes your posts
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="comment_upvotes"
                        name="comment_upvotes"
                        type="checkbox"
                        checked={preferences.comment_upvotes}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="comment_upvotes"
                        className="font-medium text-gray-700"
                      >
                        Comment Upvotes
                      </label>
                      <p className="text-gray-500">
                        Receive notifications when someone upvotes your comments
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="comment_replies"
                        name="comment_replies"
                        type="checkbox"
                        checked={preferences.comment_replies}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="comment_replies"
                        className="font-medium text-gray-700"
                      >
                        Comment Replies
                      </label>
                      <p className="text-gray-500">
                        Receive notifications when someone replies to your
                        comments
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="mention_notifications"
                        name="mention_notifications"
                        type="checkbox"
                        checked={preferences.mention_notifications}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="mention_notifications"
                        className="font-medium text-gray-700"
                      >
                        Mentions
                      </label>
                      <p className="text-gray-500">
                        Receive notifications when you're mentioned in posts or
                        comments
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Email Notifications
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="email_community_invites"
                        name="email_community_invites"
                        type="checkbox"
                        checked={preferences.email_community_invites}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="email_community_invites"
                        className="font-medium text-gray-700"
                      >
                        Community Invitations
                      </label>
                      <p className="text-gray-500">
                        Receive email notifications when you're invited to join a
                        community
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="email_community_updates"
                        name="email_community_updates"
                        type="checkbox"
                        checked={preferences.email_community_updates}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="email_community_updates"
                        className="font-medium text-gray-700"
                      >
                        Community Updates
                      </label>
                      <p className="text-gray-500">
                        Receive email notifications about important community
                        updates
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="email_engagement"
                        name="email_engagement"
                        type="checkbox"
                        checked={preferences.email_engagement}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="email_engagement"
                        className="font-medium text-gray-700"
                      >
                        Engagement
                      </label>
                      <p className="text-gray-500">
                        Receive email notifications for upvotes, replies, and
                        mentions
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Push Notifications
                </h2>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="push_notifications"
                      name="push_notifications"
                      type="checkbox"
                      checked={preferences.push_notifications}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="push_notifications"
                      className="font-medium text-gray-700"
                    >
                      Enable Push Notifications
                    </label>
                    <p className="text-gray-500">
                      Receive push notifications on your device
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferencesPage;