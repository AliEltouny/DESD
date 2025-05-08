"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import {
  communityApi,
  postApi,
  Comment as CommentType,
  PostDetail,
} from "@/services/api";
import { formatDistanceToNow } from "date-fns";
import { getMediaUrl, baseApi } from "@/services/api";
import CommentItem from "@/components/communities/CommentItem";
import CommentForm from "@/components/communities/CommentForm";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { toast } from "react-hot-toast";
import { mutate } from "swr";

export default function PostDetailPage() {
  const { slug, id } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [upvoting, setUpvoting] = useState(false);
  const [upvotingCommentId, setUpvotingCommentId] = useState<number | null>(null);
  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        setLoading(true);

        // Fetch post details
        const postData = await postApi.getPost(slug as string, parseInt(id as string));
        setPost(postData);

        // Fetch comments
        const commentsData = await postApi.getComments(slug as string, parseInt(id as string));
        setComments(commentsData);
      } catch (err: unknown) {
        console.error("Failed to fetch post data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (slug && id) {
      fetchPostData();
    }
  }, [slug, id]);

  const handleUpvotePost = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/communities/${slug}/posts/${id}`);
      return;
    }

    try {
      setUpvoting(true);
      await postApi.upvotePost(slug as string, parseInt(id as string));
      
      // Refetch post to update upvote status
      const updatedPost = await postApi.getPost(slug as string, parseInt(id as string));
      setPost(updatedPost);
    } catch (err: unknown) {
      console.error("Failed to upvote post:", err);
    } finally {
      setUpvoting(false);
    }
  };

  const handleUpvoteComment = async (commentId: number) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/communities/${slug}/posts/${id}`);
      return;
    }

    try {
      setUpvotingCommentId(commentId);
      await postApi.upvoteComment(slug as string, parseInt(id as string), commentId);
      
      // Refetch comments to update upvote status
      const updatedComments = await postApi.getComments(slug as string, parseInt(id as string));
      setComments(updatedComments);
      toast.success("Vote recorded successfully");
    } catch (err: unknown) {
      console.error("Failed to upvote comment:", err);
      toast.error("Failed to record vote. Please try again.");
    } finally {
      setUpvotingCommentId(null);
    }
  };

  const handleCommentSubmit = async (content: string) => {
    if (!content.trim()) return;
    
    if (!isAuthenticated) {
      router.push(`/login?redirect=/communities/${slug}/posts/${id}`);
      return;
    }
    
    try {
      setSubmitting(true);
      // Use the correct postApi.createComment method instead of baseApi.post
      await postApi.createComment(
        slug as string,
        parseInt(id as string),
        { content }
      );
      
      // Fetch the updated comments
      const updatedComments = await postApi.getComments(slug as string, parseInt(id as string));
      setComments(updatedComments);
      
      toast.success("Comment added successfully!");
    } catch (err: unknown) {
      console.error("Error adding comment:", err);
      toast.error(
        "Failed to add comment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinEvent = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/communities/${slug}/posts/${id}`);
      return;
    }

    try {
      setIsJoining(true);
      await postApi.joinEventPost(slug as string, parseInt(id as string));
      
      // Refetch post to update participant status
      const updatedPost = await postApi.getPost(slug as string, parseInt(id as string));
      setPost(updatedPost);
      toast.success("Successfully joined the event!");
    } catch (err: unknown) {
      console.error("Failed to join event:", err);
      toast.error("Failed to join event. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveEvent = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/communities/${slug}/posts/${id}`);
      return;
    }

    try {
      setIsLeaving(true);
      await postApi.leaveEventPost(slug as string, parseInt(id as string));
      
      // Refetch post to update participant status
      const updatedPost = await postApi.getPost(slug as string, parseInt(id as string));
      setPost(updatedPost);
      toast.success("Successfully left the event.");
    } catch (err: unknown) {
      console.error("Failed to leave event:", err);
      toast.error("Failed to leave event. Please try again.");
    } finally {
      setIsLeaving(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  // Get post type label
  const getPostTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get post type color
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="bg-gray-50 min-h-screen py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-48 bg-gray-200 rounded mb-6"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!post) {
    return (
      <DashboardLayout>
        <div className="bg-gray-50 min-h-screen py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">Post not found</p>
                </div>
              </div>
            </div>
            <Link
              href={`/communities/${slug}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Community
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Breadcrumb - Enhanced for better visibility */}
          <nav className="flex mb-6 bg-white rounded-lg p-3 shadow-sm" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3 w-full">
              <li className="inline-flex items-center">
                <Link
                  href="/communities"
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  <svg 
                    className="w-4 h-4 mr-2" 
                    fill="currentColor" 
                    viewBox="0 0 20 20" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                  </svg>
                  Communities
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <Link
                    href={`/communities/${slug}`}
                    className="ml-1 text-sm font-medium text-blue-600 hover:text-blue-800 md:ml-2"
                  >
                    {post.community.name}
                  </Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 truncate max-w-xs">
                    {post.title}
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Also add a visible back button for easier navigation */}
          <div className="mb-4">
            <Link
              href={`/communities/${slug}`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg 
                className="-ml-0.5 mr-2 h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              Back to {post.community.name}
            </Link>
          </div>

          {/* Post card */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
            <div className="p-6">
              {/* Post header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  {/* Author avatar (initials) */}
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {post.author.full_name
                      .split(" ")
                      .map((name) => name[0])
                      .join("")}
                  </div>

                  <div>
                    <div className="font-medium text-gray-900">
                      {post.author.full_name}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{formatDate(post.created_at)}</span>
                      {post.created_at !== post.updated_at && (
                        <span>(edited)</span>
                      )}
                      {post.is_pinned && (
                        <span className="flex items-center text-blue-600">
                          <svg
                            className="h-4 w-4 mr-1"
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
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPostTypeColor(
                    post.post_type
                  )}`}
                >
                  {getPostTypeLabel(post.post_type)}
                </span>
              </div>

              {/* Post title and content */}
              <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                {post.title}
              </h1>
              <div 
                className="prose prose-sm max-w-none mb-6 text-gray-900" 
                dangerouslySetInnerHTML={{ __html: post.content }}
                style={{
                  color: '#111827',
                }}
              />

              {/* Post image if available */}
              {post.image && (
                <div className="mb-6 relative w-full h-96">
                  <Image
                    src={getMediaUrl(post.image)}
                    alt={post.title}
                    fill
                    style={{ objectFit: "contain" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Post attachment if available */}
              {post.file && (
                <div className="mb-6">
                  <a
                    href={getMediaUrl(post.file)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5 text-gray-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download Attachment
                  </a>
                </div>
              )}

              {/* Event details if post is an event */}
              {post.post_type === "event" && post.event_date && (
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium text-green-800 mb-2">
                    Event Details
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-green-800 mb-2">
                    <svg
                      className="h-5 w-5"
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
                      {new Date(post.event_date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {post.event_location && (
                    <div className="flex items-center space-x-2 text-sm text-green-800 mb-2">
                      <svg
                        className="h-5 w-5"
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
                      <span>{post.event_location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 text-sm text-green-800 mb-4">
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <span>
                      {post.participant_count || 0}
                      {post.event_participant_limit 
                        ? ` / ${post.event_participant_limit} participants`
                        : " participants"}
                    </span>
                  </div>
                  
                  {/* Join/Leave Event Button */}
                  {isAuthenticated && post.has_joined ? (
                    <button
                      onClick={handleLeaveEvent}
                      disabled={isLeaving}
                      className="w-full py-2 px-4 mt-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      {isLeaving ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Leaving...
                        </span>
                      ) : (
                        "Leave Event"
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleJoinEvent}
                      disabled={!isAuthenticated || isJoining || (post.is_full && !post.has_joined)}
                      className={`w-full py-2 px-4 mt-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        !isAuthenticated
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed focus:ring-gray-500"
                          : post.is_full && !post.has_joined
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed focus:ring-gray-500"
                          : "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500"
                      }`}
                    >
                      {isJoining ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Joining...
                        </span>
                      ) : !isAuthenticated ? (
                        "Login to Join Event"
                      ) : post.is_full && !post.has_joined ? (
                        "Event Full"
                      ) : (
                        "Join Event"
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Post actions */}
              <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
                <button
                  className={`flex items-center ${
                    post.has_upvoted
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-blue-500"
                  }`}
                  onClick={handleUpvotePost}
                  disabled={upvoting}
                >
                  {upvoting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Upvoting...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-5 w-5 mr-1"
                        fill={post.has_upvoted ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={post.has_upvoted ? 0 : 2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                        />
                      </svg>
                      <span>
                        {post.upvote_count}{" "}
                        {post.upvote_count === 1 ? "upvote" : "upvotes"}
                      </span>
                    </>
                  )}
                </button>

                <div className="text-gray-500">
                  <span>
                    {comments.length} {comments.length === 1 ? "comment" : "comments"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Comments section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Comments
              </h2>

              {/* Comment form */}
              <div className="mt-6">
                <CommentForm 
                  onSubmit={handleCommentSubmit} 
                  isLoading={submitting}
                />
              </div>

              {/* Comments list */}
              {comments.length > 0 ? (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onUpvote={() => handleUpvoteComment(comment.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}