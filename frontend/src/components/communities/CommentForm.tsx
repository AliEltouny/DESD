import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface CommentFormProps {
  onSubmit: (content: string) => void;
  isLoading: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({ onSubmit, isLoading }) => {
  const [content, setContent] = useState("");
  const { isAuthenticated } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    onSubmit(content);
    setContent(""); // Clear form after submission
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label
          htmlFor="comment"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Add a comment
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={3}
          className="shadow-sm block w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md"
          placeholder={
            isAuthenticated
              ? "Write your comment..."
              : "Log in to comment"
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!isAuthenticated || isLoading}
        ></textarea>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!isAuthenticated || !content.trim() || isLoading}
          className={`inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
            ${
              !isAuthenticated || !content.trim() || isLoading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            }`}
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Posting...
            </>
          ) : (
            "Post Comment"
          )}
        </button>
      </div>
    </form>
  );
};

export default CommentForm; 