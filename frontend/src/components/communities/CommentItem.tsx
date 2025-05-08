import React from "react";
import { Comment } from "@/types/api";
import { formatDistanceToNow } from "date-fns";

interface CommentItemProps {
  comment: Comment;
  onUpvote: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onUpvote }) => {
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch /* (error) */ {
      return dateString;
    }
  };

  // Get initials for the avatar
  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="group">
      <div className="flex space-x-3">
        {/* Author avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
            {getInitials(comment.author.full_name)}
          </div>
        </div>

        {/* Comment content */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium text-gray-900">
                {comment.author.full_name}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(comment.created_at)}
                {comment.created_at !== comment.updated_at && " (edited)"}
              </p>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {comment.content}
            </p>
          </div>

          {/* Comment actions */}
          <div className="mt-1 flex items-center space-x-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                onUpvote();
              }}
              className={`text-xs flex items-center space-x-1 ${
                comment.has_upvoted
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-blue-500"
              }`}
            >
              <svg
                className="h-4 w-4"
                fill={comment.has_upvoted ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={comment.has_upvoted ? 0 : 2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
              </svg>
              <span>
                {comment.upvote_count}{" "}
                {comment.upvote_count === 1 ? "upvote" : "upvotes"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentItem; 