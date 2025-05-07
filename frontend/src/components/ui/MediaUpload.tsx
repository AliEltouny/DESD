"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import ImageCropper from './ImageCropper';

interface MediaUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  onBlur?: () => void;
  id: string;
  name: string;
  label: string;
  accept?: string;
  previewType?: 'square' | 'circle' | 'banner' | 'avatar';
  description?: string;
  error?: string;
  aspectRatio?: number;
  required?: boolean;
  maxSize?: number; // in MB
}

export default function MediaUpload({
  value,
  onChange,
  onBlur,
  id,
  name,
  label,
  accept = "image/*",
  previewType = 'square',
  description,
  error,
  aspectRatio,
  required = false,
  maxSize = 5, // Default 5MB
}: MediaUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [fileType, setFileType] = useState<'image' | 'document' | 'video' | 'audio' | 'other'>('other');
  const [sizeError, setSizeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate preview when file changes
  useEffect(() => {
    if (!value) {
      setPreview(null);
      setSizeError(null);
      return;
    }

    // Determine file type
    const type = value.type.split('/')[0];
    if (type === 'image') {
      setFileType('image');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(value);
    } else if (type === 'application' || type === 'text') {
      setFileType('document');
      setPreview(null);
    } else if (type === 'video') {
      setFileType('video');
      setPreview(null);
    } else if (type === 'audio') {
      setFileType('audio');
      setPreview(null);
    } else {
      setFileType('other');
      setPreview(null);
    }
  }, [value]);

  const checkFileSize = (file: File): boolean => {
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setSizeError(`File size exceeds the maximum allowed (${maxSize}MB)`);
      return false;
    }
    setSizeError(null);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size
      if (!checkFileSize(file)) {
        return;
      }

      // For all file types, just update the value and generate preview if it's an image
      onChange(file);
      setSelectedFile(file);
      
      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemove = () => {
    onChange(null);
    setSelectedFile(null);
    setPreview(null);
    setSizeError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onBlur) onBlur();
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    // Convert blob to file with original name
    const file = new File(
      [croppedBlob], 
      selectedFile?.name || 'cropped-image.jpg',
      { type: croppedBlob.type }
    );
    onChange(file);
    setShowCropper(false);
    if (onBlur) onBlur();
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    // If we were uploading a new file (not editing an existing one)
    if (!value) {
      handleRemove();
    }
  };

  // Get preview container classes based on previewType
  const getPreviewContainerClasses = () => {
    switch (previewType) {
      case 'circle':
        return 'w-24 h-24 rounded-full overflow-hidden';
      case 'avatar':
        return 'w-32 h-32 rounded-full overflow-hidden';
      case 'banner':
        return 'w-full h-32 md:h-40 rounded-lg overflow-hidden';
      case 'square':
      default:
        return 'w-24 h-24 rounded-lg overflow-hidden';
    }
  };

  // Get preview styles
  const getPreviewStyles = () => {
    if (previewType === 'banner') {
      return 'w-full h-full object-cover';
    }
    return 'w-full h-full object-cover';
  };

  // Render file preview based on file type
  const renderPreview = () => {
    if (!value) {
      return (
        <div className="flex flex-col items-center justify-center text-gray-400">
          {fileType === 'image' && (
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
          {fileType === 'document' && (
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )}
          {fileType === 'video' && (
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
          {fileType === 'audio' && (
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          )}
          {fileType === 'other' && (
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          )}
        </div>
      );
    }

    if (fileType === 'image' && preview) {
      // Special handling for circle/avatar previews
      if (previewType === 'circle' || previewType === 'avatar') {
        const size = previewType === 'circle' ? 96 : 128; // Corresponds to w-24/h-24 or w-32/h-32
        return (
          <Image
            src={preview}
            alt="Preview"
            width={size}
            height={size}
            className={`object-cover ${previewType === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
          />
        );
      } else {
        // Original handling for banner/square/default using fill
        return (
          <Image
            src={preview}
            alt="Preview"
            fill
            style={{ objectFit: "cover" }}
            className={getPreviewStyles()} // Ensure this doesn't conflict
          />
        );
      }
    }

    if (fileType === 'document') {
      return (
        <div className="flex flex-col items-center justify-center">
          <svg className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="mt-2 text-xs text-gray-500 truncate max-w-full">{value.name}</span>
        </div>
      );
    }

    if (fileType === 'video') {
      return (
        <div className="flex flex-col items-center justify-center">
          <svg className="h-12 w-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="mt-2 text-xs text-gray-500 truncate max-w-full">{value.name}</span>
        </div>
      );
    }

    if (fileType === 'audio') {
      return (
        <div className="flex flex-col items-center justify-center">
          <svg className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <span className="mt-2 text-xs text-gray-500 truncate max-w-full">{value.name}</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center">
        <svg className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        <span className="mt-2 text-xs text-gray-500 truncate max-w-full">{value.name}</span>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="flex flex-col md:flex-row md:items-start gap-4">
        <div 
          className={`relative ${getPreviewContainerClasses()} border-2 ${
            value ? "border-transparent" : "border-dashed border-gray-300"
          } flex items-center justify-center bg-gray-50`}
        >
          {renderPreview()}
        </div>

        <div className="flex-1">
          <div className="flex flex-col space-y-3">
            <div className="flex flex-wrap gap-2">
              <input
                type="file"
                id={id}
                name={name}
                ref={fileInputRef}
                accept={accept}
                onChange={handleFileChange}
                onBlur={onBlur}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-normal text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                style={{ fontWeight: "normal" }}
              >
                Choose File
              </button>
              {value && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-normal text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  style={{ fontWeight: "normal" }}
                >
                  Remove
                </button>
              )}
              {value && fileType === 'image' && !showCropper && (
                <button
                  type="button"
                  onClick={() => {
                    setShowCropper(true);
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-normal text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  style={{ fontWeight: "normal" }}
                >
                  Edit/Crop
                </button>
              )}
            </div>
            
            {description && (
              <p className="text-sm text-gray-500 font-normal" style={{ fontWeight: "normal" }}>{description}</p>
            )}
            
            {(error || sizeError) && (
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-red-500 mr-1 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-sm text-red-600 font-normal" style={{ fontWeight: "normal" }}>{sizeError || error}</p>
              </div>
            )}
            
            {value && (
              <div className="text-sm text-gray-500 font-normal" style={{ fontWeight: "normal" }}>
                <p>File: {value.name}</p>
                <p>Size: {(value.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showCropper && preview && (
        <ImageCropper
          imageSrc={preview}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspect={aspectRatio}
          circularCrop={previewType === 'circle' || previewType === 'avatar'}
        />
      )}
    </div>
  );
} 