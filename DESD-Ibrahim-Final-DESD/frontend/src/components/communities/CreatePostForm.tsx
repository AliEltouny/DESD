"use client";

import React, { useState } from 'react';
import { Post } from '@/types/community'; // Assuming Post type is needed
import Button from '@/components/ui/Button'; // Example UI import
import RichTextEditor from '@/components/ui/RichTextEditor'; // Example UI import
import { postApi } from '@/services/api'; // Assuming postApi is needed

interface CreatePostFormProps {
  communityId: number;
  onPostCreated: (newPost: Post) => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ communityId, onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('discussion'); // Default type
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!title.trim() || !content.trim()) {
        setError("Title and content cannot be empty.");
        setIsLoading(false);
        return;
    }

    try {
        console.log(`Placeholder: Creating post in community ${communityId}...`);
        // TODO: Implement actual API call using postApi.createPost or similar
        // const newPost = await postApi.createPost(communityId, { title, content, type: postType });
        
        // Placeholder data for demonstration
        const placeholderPost: Post = {
            id: Math.random() * 1000, // Temporary ID
            title: title,
            content: content,
            post_type: postType,
            author: { id: 0, username: 'You', first_name: 'You', last_name: '' }, // Placeholder author
            community: communityId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            upvote_count: 0,
            comment_count: 0,
            has_upvoted: false,
        };

        onPostCreated(placeholderPost);
        setTitle('');
        setContent(''); 
        setPostType('discussion');

    } catch (err) {
        console.error("Placeholder: Failed to create post", err);
        setError("Failed to create post. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  // TODO: Add actual form fields (Input for title, RichTextEditor for content, etc.)
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      {/* <h3 className="text-lg font-medium mb-4">Create New Post</h3> */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label htmlFor="postTitle" className="block text-sm font-medium text-gray-700">Title</label>
            <input 
                id="postTitle"
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                placeholder="Enter post title"
                required
            />
        </div>
         <div>
            <label htmlFor="postContent" className="block text-sm font-medium text-gray-700">Content</label>
            {/* Replace with RichTextEditor or Textarea */}
             <textarea 
                id="postContent"
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                rows={4} 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                placeholder="What's on your mind?"
                required
            />
        </div>
         {/* Add Post Type Selector if needed */}
        
        {error && <p className="text-red-600 text-sm">{error}</p>}
        
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          Create Post
        </Button>
      </form>
    </div>
  );
};

export default CreatePostForm; 