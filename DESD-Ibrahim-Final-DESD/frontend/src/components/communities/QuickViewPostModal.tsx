import React, { memo, useEffect, useState } from 'react';
import { Post } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';
import { getMediaUrl, postApi } from '@/services/api';
import Image from 'next/image';
import Link from 'next/link';

interface QuickViewPostModalProps {
  postId: number;
  communitySlug: string;
  isOpen: boolean;
  onClose: () => void;
}

const QuickViewPostModal: React.FC<QuickViewPostModalProps> = ({
  postId,
  communitySlug,
  isOpen,
  onClose
}) => {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch post data
  useEffect(() => {
    if (isOpen && postId) {
      setLoading(true);
      setError(null);
      
      const fetchPost = async () => {
        try {
          const postData = await postApi.getPost(communitySlug, postId);
          setPost(postData);
        } catch (err) {
          console.error('Error fetching post:', err);
          setError('Failed to load post data. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchPost();
    }
  }, [isOpen, postId, communitySlug]);

  // Close modal when escape key is pressed
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  // Stop scrolling on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Format date to human-readable format
  const formattedDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      
      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div 
          className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {loading ? (
              <div className="py-20">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
                <p className="mt-4 text-center text-gray-500">Loading post...</p>
              </div>
            ) : error ? (
              <div className="py-20 text-center">
                <p className="text-red-500">{error}</p>
                <button
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  onClick={() => onClose()}
                >
                  Close
                </button>
              </div>
            ) : post ? (
              <div className="space-y-6">
                {/* Post header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    {/* Author avatar */}
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                      {post.author.full_name
                        .split(" ")
                        .map((name) => name[0])
                        .join("")}
                    </div>
                    
                    <div>
                      <div className="font-medium text-gray-900">
                        {post.author.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formattedDate(post.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Post type badge */}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    ${post.post_type === 'discussion' ? 'bg-blue-100 text-blue-800' :
                      post.post_type === 'question' ? 'bg-purple-100 text-purple-800' :
                      post.post_type === 'event' ? 'bg-green-100 text-green-800' :
                      post.post_type === 'announcement' ? 'bg-red-100 text-red-800' :
                      post.post_type === 'resource' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1)}
                  </span>
                </div>
                
                {/* Post title and content */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{post.title}</h3>
                  <div 
                    className="mt-4 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </div>
                
                {/* Post image if available */}
                {post.image && (
                  <div className="mt-4 relative h-64 w-full rounded-lg overflow-hidden">
                    <Image
                      src={getMediaUrl(post.image)}
                      alt={post.title}
                      fill
                      style={{ objectFit: "cover" }}
                      className="rounded-lg"
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, 600px"
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        const imgElement = e.currentTarget; 
                        imgElement.onerror = null;
                        imgElement.style.display = "none";
                      }}
                    />
                  </div>
                )}
                
                {/* Event details if post is an event */}
                {post.post_type === "event" && post.event_date && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-800 flex items-center">
                      <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span>
                        {new Date(post.event_date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric", 
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    
                    {post.event_location && (
                      <div className="mt-2 text-sm text-green-800 flex items-center">
                        <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span>{post.event_location}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Post stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-200">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-1" fill={post.has_upvoted ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={post.has_upvoted ? 0 : 2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    <span>{post.upvote_count} {post.upvote_count === 1 ? 'upvote' : 'upvotes'}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-gray-500">No post data available.</p>
              </div>
            )}
          </div>
          
          {post && (
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <Link
                href={`/communities/${communitySlug}/posts/${post.id}`}
                className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
              >
                View Full Post
              </Link>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(QuickViewPostModal); 