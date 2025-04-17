"use client";

import React, { useState, useEffect } from 'react';
import { getMediaUrl } from '@/services/api';
import Image from 'next/image';

interface MediaPreviewProps {
  src: string | File;
  alt?: string;
  type?: 'image' | 'video' | 'audio' | 'document' | null;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'banner' | 'auto';
  rounded?: boolean;
  showControls?: boolean;
  onRemove?: () => void;
  onEdit?: () => void;
}

export default function MediaPreview({
  src,
  alt = 'Media preview',
  type,
  className = '',
  aspectRatio = 'auto',
  rounded = false,
  showControls = false,
  onRemove,
  onEdit,
}: MediaPreviewProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | 'document' | 'other'>(
    type || 'other'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If src is a File, create an object URL for preview
    if (src instanceof File) {
      const fileType = src.type.split('/')[0];
      if (fileType === 'image') {
        setMediaType('image');
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
          setIsLoading(false);
        };
        reader.onerror = () => {
          setError('Failed to load image');
          setIsLoading(false);
        };
        reader.readAsDataURL(src);
      } else if (fileType === 'video') {
        setMediaType('video');
        setPreview(URL.createObjectURL(src));
        setIsLoading(false);
      } else if (fileType === 'audio') {
        setMediaType('audio');
        setPreview(URL.createObjectURL(src));
        setIsLoading(false);
      } else if (fileType === 'application' || fileType === 'text') {
        setMediaType('document');
        setPreview(null);
        setIsLoading(false);
      } else {
        setMediaType('other');
        setPreview(null);
        setIsLoading(false);
      }
    } else if (typeof src === 'string') {
      // Determine type from URL if not explicitly provided
      if (!type) {
        const fileExtension = src.split('.').pop()?.toLowerCase();
        if (fileExtension) {
          if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension)) {
            setMediaType('image');
          } else if (['mp4', 'webm', 'ogg', 'mov'].includes(fileExtension)) {
            setMediaType('video');
          } else if (['mp3', 'wav', 'ogg', 'aac'].includes(fileExtension)) {
            setMediaType('audio');
          } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(fileExtension)) {
            setMediaType('document');
          } else {
            setMediaType('other');
          }
        }
      } else {
        setMediaType(type);
      }

      // Handle backend URLs
      if (src.startsWith('/media') || (src.includes('/media/') && !src.startsWith('http'))) {
        setPreview(getMediaUrl(src));
      } else {
        setPreview(src);
      }
      setIsLoading(false);
    }

    // Cleanup function to revoke object URLs
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [src, type, preview]);

  // Determine CSS classes for aspect ratio
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'video':
        return 'aspect-video';
      case 'banner':
        return 'aspect-[3/1]';
      case 'auto':
      default:
        return '';
    }
  };

  // Get rounded corner class
  const getRoundedClass = () => {
    return rounded ? 'rounded-full' : 'rounded-md';
  };

  // Render media based on type
  const renderMedia = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-gray-100">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-red-50 text-red-500">
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="ml-2">{error}</span>
        </div>
      );
    }

    switch (mediaType) {
      case 'image':
        return preview ? (
          <Image
            src={preview}
            alt={alt}
            fill
            style={{ objectFit: "cover" }}
            className="w-full h-full"
            onError={() => setError('Failed to load image')}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        );
      case 'video':
        return preview ? (
          <video
            src={preview}
            controls
            className="w-full h-full object-cover"
            onError={() => setError('Failed to load video')}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
        );
      case 'audio':
        return preview ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 p-4">
            <audio
              src={preview}
              controls
              className="w-full"
              onError={() => setError('Failed to load audio')}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
        );
      case 'document':
        return (
          <div className="flex flex-col items-center justify-center w-full h-full bg-gray-100 text-gray-500 p-4">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            {src instanceof File && (
              <span className="mt-2 text-xs truncate max-w-full">{src.name}</span>
            )}
            {preview && (
              <a
                href={preview}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-blue-500 hover:underline"
              >
                View Document
              </a>
            )}
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <div
      className={`relative overflow-hidden ${getAspectRatioClass()} ${getRoundedClass()} ${className}`}
    >
      {renderMedia()}
      
      {showControls && (onRemove || onEdit) && (
        <div className="absolute top-2 right-2 flex space-x-2">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="p-1 bg-white bg-opacity-75 rounded-full hover:bg-opacity-100 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1 bg-white bg-opacity-75 rounded-full hover:bg-opacity-100 text-gray-600 hover:text-red-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
} 