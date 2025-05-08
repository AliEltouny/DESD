"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Post } from "@/types/api";
import { formatDistanceToNow } from "date-fns";
import { getMediaUrl, postApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";

interface PostCardProps {
  post: Post;
  communitySlug: string;
  className?: string;
  onUpvote?: () => void;
  refreshPost?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  communitySlug,
  className = "",
  onUpvote,
  refreshPost,
}) => {
  const { isAuthenticated } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [localPost, setLocalPost] = useState<Post | null>(null);

  // Initialize localPost when post prop changes
  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  const getPostTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      discussion: "bg-blue-100 text-blue-800",
      question: "bg-purple-100 text-purple-800",
      event: "bg-green-100 text-green-800",
      announcement: "bg-red-100 text-red-800",
      resource: "bg-yellow-100 text-yellow-800",
    };

    return colorMap[type] || "bg-gray-100 text-gray-800";
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case "discussion":
        return (
          <svg
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "question":
        return (
          <svg
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "event":
        return (
          <svg
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "announcement":
        return (
          <svg
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "resource":
        return (
          <svg
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
        );
      default:
        return (
          <svg
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3v-3h6a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      console.warn(`Error formatting date string: ${dateString}`, error);
      return dateString;
    }
  };

  const handleUpvoteClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to post detail

    if (!isAuthenticated) {
      window.location.href = `/login?redirect=/communities/${communitySlug}/posts/${post.id}`;
      return;
    }

    try {
      // Get current post state (either from local state or props)
      const currentPost = localPost || post;

      // Optimistic update: Toggle the upvote state locally first
      const isCurrentlyUpvoted = currentPost.has_upvoted;
      const updatedPost = {
        ...currentPost,
        has_upvoted: !isCurrentlyUpvoted,
        upvote_count: isCurrentlyUpvoted
          ? currentPost.upvote_count - 1
          : currentPost.upvote_count + 1,
      };

      // Update local state immediately
      setLocalPost(updatedPost);

      // Make the API call
      await postApi.upvotePost(communitySlug, post.id);

      // Notify parent component (for list refresh)
      if (onUpvote) {
        onUpvote();
      }
    } catch (error) {
      console.error("Failed to upvote post:", error);
      toast.error("Failed to upvote. Please try again.");

      // Revert optimistic update on error
      setLocalPost(post);
    }
  };

  // Handle join event
  const handleJoinEvent = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to post detail

    if (!isAuthenticated) {
      window.location.href = `/login?redirect=/communities/${communitySlug}/posts/${post.id}`;
      return;
    }

    try {
      setIsJoining(true);
      await postApi.joinEventPost(communitySlug, post.id);
      toast.success("You have successfully joined this event!");

      // Fetch the updated post data after successful join
      try {
        const updatedPost = await postApi.getPost(communitySlug, post.id);
        // Update local post data with the new participant info
        if (updatedPost) {
          // Create a shallow copy of the post with updated properties
          const updatedPostData = {
            ...post,
            participant_count: updatedPost.participant_count,
            has_joined: true,
            is_full: updatedPost.is_full,
          };

          // If we have a parent refresh function, call it
          if (refreshPost) {
            refreshPost();
          }

          // Force a re-render by updating component state
          setLocalPost(updatedPostData);
        }
      } catch (error) {
        console.error("Failed to fetch updated post data:", error);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || "Failed to join event";
      toast.error(errorMessage);
      console.error("Failed to join event:", error);
    } finally {
      setIsJoining(false);
    }
  };

  // Handle leave event
  const handleLeaveEvent = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to post detail

    try {
      setIsLeaving(true);
      await postApi.leaveEventPost(communitySlug, post.id);
      toast.success("You have left this event");

      // Fetch the updated post data after successful leave
      try {
        const updatedPost = await postApi.getPost(communitySlug, post.id);
        // Update local post data with the new participant info
        if (updatedPost) {
          // Create a shallow copy of the post with updated properties
          const updatedPostData = {
            ...post,
            participant_count: updatedPost.participant_count,
            has_joined: false,
            is_full: updatedPost.is_full,
          };

          // If we have a parent refresh function, call it
          if (refreshPost) {
            refreshPost();
          }

          // Force a re-render by updating component state
          setLocalPost(updatedPostData);
        }
      } catch (error) {
        console.error("Failed to fetch updated post data:", error);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || "Failed to leave event";
      toast.error(errorMessage);
      console.error("Failed to leave event:", error);
    } finally {
      setIsLeaving(false);
    }
  };

  // Use local post state if available, otherwise use the prop
  const postData = localPost || post;

  return (
    <Link
      href={`/communities/${communitySlug}/posts/${post.id}`}
      className={`block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden ${className}`}
    >
      <div className="p-5">
        {/* Post header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            {/* Author avatar (initials) */}
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
              {post.author.full_name
                .split(" ")
                .map((name) => name[0])
                .join("")}
            </div>

            <div>
              <div className="font-medium text-gray-900">
                {post.author.full_name}
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{formatDate(post.created_at)}</span>
                {post.is_pinned && (
                  <span className="flex items-center text-blue-600">
                    <svg
                      className="h-3 w-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9.5 3a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 15h-6v1a3 3 0 11-6 0v-1H2a1 1 0 010-2h1v-3.5a1 1 0 01.4-.8l3.6-2.7V4a1 1 0 011-1h3a1 1 0 011 1v2l3.6 2.7a1 1 0 01.4.8V13h1a1 1 0 110 2z" />
                    </svg>
                    Pinned
                  </span>
                )}
              </div>
            </div>
          </div>

          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPostTypeColor(
              post.post_type
            )}`}
          >
            {getPostTypeIcon(post.post_type)}
            <span className="ml-1">
              {post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1)}
            </span>
          </span>
        </div>

        {/* Post title and content */}
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-900">{post.title}</h3>
          <div
            className="mt-2 text-gray-900 line-clamp-3 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html:
                post.content.length > 200
                  ? post.content.substring(0, 200) + "..."
                  : post.content,
            }}
          />
        </div>

        {/* Post image if available */}
        {post.image && (
          <div className="mt-4 relative h-48 w-full rounded-lg overflow-hidden">
            <Image
              src={getMediaUrl(post.image)}
              alt={post.title}
              fill
              style={{ objectFit: "cover" }}
              className="rounded-lg"
              onError={(
                e: React.SyntheticEvent<HTMLImageElement, Event>
              ) => {
                const imgElement = e.currentTarget;
                imgElement.onerror = null;
                imgElement.style.display = "none";
              }}
            />
          </div>
        )}

        {/* Event details if post is an event */}
        {postData.post_type === "event" && postData.event_date && (
          <div className="mt-4 bg-green-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-sm text-green-800">
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                {new Date(postData.event_date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {postData.event_location && (
              <div className="flex items-center space-x-2 text-sm text-green-800 mt-1">
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{postData.event_location}</span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-sm text-green-800 mt-1">
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              <span>
                {postData.participant_count || 0}
                {postData.event_participant_limit
                  ? ` / ${postData.event_participant_limit}`
                  : " participants"}
              </span>
            </div>

            {/* Join/Leave Event Button */}
            <div className="mt-3">
              {isAuthenticated && postData.has_joined ? (
                <button
                  onClick={handleLeaveEvent}
                  disabled={isLeaving}
                  className="w-full py-2 px-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium transition-colors"
                >
                  {isLeaving ? "Leaving..." : "Leave Event"}
                </button>
              ) : (
                <button
                  onClick={handleJoinEvent}
                  disabled={isJoining || (postData.is_full && !postData.has_joined)}
                  className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    postData.is_full && !postData.has_joined
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : "bg-green-100 hover:bg-green-200 text-green-700"
                  }`}
                >
                  {isJoining
                    ? "Joining..."
                    : postData.is_full && !postData.has_joined
                    ? "Event Full"
                    : "Join Event"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Post footer */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <button
            className={`flex items-center ${
              postData.has_upvoted ? "text-blue-600" : "hover:text-blue-500"
            }`}
            onClick={handleUpvoteClick}
          >
            <svg
              className="h-5 w-5 mr-1"
              fill={postData.has_upvoted ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={postData.has_upvoted ? 0 : 2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            <span>
              {postData.upvote_count}{" "}
              {postData.upvote_count === 1 ? "upvote" : "upvotes"}
            </span>
          </button>

          <div className="flex items-center">
            <svg
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>
              {post.comment_count}{" "}
              {post.comment_count === 1 ? "comment" : "comments"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;
