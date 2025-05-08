"use client";

import React, { memo, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Post } from "@/types/api";
import { formatDistanceToNow } from "date-fns";
import { getMediaUrl } from "@/services/api";
import { useRouter } from "next/navigation";
import QuickViewPostModal from "./QuickViewPostModal";

interface PostCardProps {
  post: Post;
  communitySlug: string;
  className?: string;
  onUpvote?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  communitySlug,
  className = "",
  onUpvote,
}) => {
  const router = useRouter();
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  
  if (!post || !post.id) {
    console.error('Invalid post object:', post);
    return null;
  }

  // Handle prefetching on hover
  const handleMouseEnter = () => {
    if (!isPrefetching) {
      setIsPrefetching(true);
      // Prefetch the post detail page
      router.prefetch(`/communities/${communitySlug}/posts/${post.id}`);
    }
  };

  // Handle quick view toggle
  const openQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
  };

  const closeQuickView = () => {
    setIsQuickViewOpen(false);
  };
  
  // Toggle content expansion
  const toggleContent = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowFullContent(!showFullContent);
  };

  // Memoized values for better performance
  const postTypeColor = useMemo(() => {
    const colorMap: Record<string, string> = {
      discussion: "bg-blue-100 text-blue-800",
      question: "bg-purple-100 text-purple-800",
      event: "bg-green-100 text-green-800",
      announcement: "bg-red-100 text-red-800",
      resource: "bg-yellow-100 text-yellow-800",
    };

    return colorMap[post.post_type] || "bg-gray-100 text-gray-800";
  }, [post.post_type]);

  const postTypeIcon = useMemo(() => {
    switch (post.post_type) {
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
  }, [post.post_type]);

  const formattedDate = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
    } catch (error) {
      console.warn(`Error formatting date string: ${post.created_at}`, error);
      return post.created_at;
    }
  }, [post.created_at]);

  const truncatedContent = useMemo(() => {
    if (!post.content) return '';
    return post.content.length > 200 
      ? post.content.substring(0, 200) + '...' 
      : post.content;
  }, [post.content]);

  const authorInitials = useMemo(() => {
    if (!post.author || !post.author.full_name) return "??";
    return post.author.full_name
      .split(" ")
      .map((name) => name[0])
      .join("");
  }, [post.author]);

  // Optimize the upvote handler
  const handleUpvoteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to post detail
    e.stopPropagation(); // Prevent event bubbling
    if (onUpvote) {
      onUpvote();
    }
  };

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <>
      <div className="group relative">
        <Link
          href={`/communities/${communitySlug}/posts/${post.id}`}
          className={`block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden ${className}`}
          prefetch={false}
          onMouseEnter={handleMouseEnter}
        >
          <div className="p-5">
            {/* Post header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                {/* Author avatar (initials) */}
                <div className="w-10 h-10 min-w-[2.5rem] rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                  {authorInitials}
                </div>

                <div>
                  <div className="font-medium text-gray-900">
                    {post.author?.full_name || "Anonymous"}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{formattedDate}</span>
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
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${postTypeColor}`}
              >
                {postTypeIcon}
                <span className="ml-1">
                  {post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1)}
                </span>
              </span>
            </div>

            {/* Post title and content */}
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900">{post.title}</h3>
              <div 
                className={`mt-2 text-gray-900 prose prose-sm max-w-none ${!showFullContent ? 'line-clamp-3' : ''}`}
                dangerouslySetInnerHTML={{ __html: showFullContent ? post.content : truncatedContent }}
              />
              {post.content && post.content.length > 200 && (
                <button 
                  onClick={toggleContent} 
                  className="mt-1 text-blue-500 text-sm hover:text-blue-700 focus:outline-none"
                >
                  {showFullContent ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>

            {/* Post image if available */}
            {post.image && !imageError && (
              <div className="mt-4 relative h-48 w-full rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-gray-100"></div>
                <Image
                  src={getMediaUrl(post.image)}
                  alt={post.title}
                  fill
                  style={{ objectFit: "cover", objectPosition: "center" }}
                  className="rounded-lg"
                  priority={false}
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onError={handleImageError}
                />
              </div>
            )}

            {/* Event details if post is an event */}
            {post.post_type === "event" && post.event_date && (
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
                    <span>{post.event_location}</span>
                  </div>
                )}
              </div>
            )}

            {/* Post footer */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <button
                className={`flex items-center ${
                  post.has_upvoted ? "text-blue-600" : "hover:text-blue-500"
                }`}
                onClick={handleUpvoteClick}
                aria-label="Upvote post"
              >
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
                  {post.upvote_count || 0}{" "}
                  {post.upvote_count === 1 ? "upvote" : "upvotes"}
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
                  {post.comment_count || 0}{" "}
                  {post.comment_count === 1 ? "comment" : "comments"}
                </span>
              </div>
            </div>
          </div>
        </Link>
        
        {/* Quick view button */}
        <button 
          onClick={openQuickView}
          className="absolute opacity-0 group-hover:opacity-100 top-4 right-4 bg-white rounded-full p-2 shadow-md transition-opacity z-10"
          aria-label="Quick view"
          title="Quick preview"
        >
          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>

      {/* Quick view modal - only render when open */}
      {isQuickViewOpen && (
        <QuickViewPostModal
          postId={post.id}
          communitySlug={communitySlug}
          isOpen={isQuickViewOpen}
          onClose={closeQuickView}
        />
      )}
    </>
  );
};

export default memo(PostCard);
