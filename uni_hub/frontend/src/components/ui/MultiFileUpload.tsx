"use client";

import React, { useState, useRef, useCallback } from 'react';
import MediaPreview from './MediaPreview';

interface MultiFileUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  onBlur?: () => void;
  id: string;
  name: string;
  label: string;
  accept?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  description?: string;
  error?: string;
  allowDragDrop?: boolean;
}

export default function MultiFileUpload({
  files,
  onChange,
  onBlur,
  id,
  name,
  label,
  accept = "image/*,video/*,audio/*,application/pdf,text/plain",
  maxFiles = 5,
  maxSizeMB = 5,
  description,
  error,
  allowDragDrop = true,
}: MultiFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate max file size in bytes
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onChange(newFiles);
    if (onBlur) onBlur();
  };

  // Validate and add files (wrapped in useCallback)
  const addFiles = useCallback((newFiles: File[]) => {
    const errors: string[] = [];
    const validFiles: File[] = [];

    // Check if adding these files would exceed the max count
    if (files.length + newFiles.length > maxFiles) {
      errors.push(`You can upload a maximum of ${maxFiles} files.`);
      newFiles = newFiles.slice(0, maxFiles - files.length);
    }

    // Validate each file
    newFiles.forEach(file => {
      // Check file size
      if (file.size > maxSizeBytes) {
        errors.push(`${file.name} exceeds the maximum file size of ${maxSizeMB}MB.`);
        return;
      }

      // Check file type (if accept is specified)
      if (accept && accept !== '*') {
        const acceptTypes = accept.split(',').map(type => type.trim());
        const fileType = file.type;
        
        const isAccepted = acceptTypes.some(type => {
          if (type.endsWith('/*')) {
            // Handle wildcard types like 'image/*'
            const typePrefix = type.split('/*')[0];
            return fileType.startsWith(typePrefix);
          }
          return type === fileType;
        });

        if (!isAccepted) {
          errors.push(`${file.name} is not an accepted file type.`);
          return;
        }
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setFileErrors(errors);
    }

    if (validFiles.length > 0) {
      onChange([...files, ...validFiles]);
      if (onBlur) onBlur();
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [files, maxFiles, maxSizeBytes, accept, onChange, onBlur, maxSizeMB]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  }, [addFiles]);

  // Get the label for the file input button
  const getButtonLabel = () => {
    if (files.length === 0) {
      return "Upload Files";
    }
    if (files.length >= maxFiles) {
      return "Maximum files reached";
    }
    return "Add More Files";
  };

  // Get a summary of accepted file types for display
  const getAcceptSummary = () => {
    if (!accept || accept === '*') return "All files";
    
    const types = accept.split(',').map(type => type.trim());
    const typeGroups: Record<string, boolean> = {};
    
    types.forEach(type => {
      if (type === 'image/*') typeGroups['Images'] = true;
      else if (type === 'video/*') typeGroups['Videos'] = true;
      else if (type === 'audio/*') typeGroups['Audio'] = true;
      else if (type === 'application/pdf') typeGroups['PDFs'] = true;
      else if (type.includes('text/')) typeGroups['Text files'] = true;
      else if (type.includes('application/')) typeGroups['Documents'] = true;
      else typeGroups['Other files'] = true;
    });
    
    return Object.keys(typeGroups).join(', ');
  };

  // Determine content in the drop zone
  const renderDropZoneContent = () => {
    if (files.length === 0) {
      return (
        <div className="text-center p-6">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mt-1 text-sm text-gray-500">
            {allowDragDrop 
              ? `Drag and drop your files here, or click to select` 
              : `Click to select files`}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {getAcceptSummary()} (Max: {maxFiles} files, {maxSizeMB}MB each)
          </p>
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative">
              <MediaPreview
                src={file}
                aspectRatio="square"
                className="border border-gray-200"
                showControls={true}
                onRemove={() => handleRemoveFile(index)}
              />
            </div>
          ))}
          {files.length < maxFiles && (
            <div 
              className="aspect-square border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center p-4">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="mt-1 text-xs text-gray-500">Add More</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div
        className={`border-2 ${
          isDragging ? "border-blue-400 bg-blue-50" : "border-dashed border-gray-300"
        } rounded-lg transition-colors ${allowDragDrop ? 'cursor-pointer' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={allowDragDrop ? handleDragEnter : undefined}
        onDragOver={allowDragDrop ? handleDragOver : undefined}
        onDragLeave={allowDragDrop ? handleDragLeave : undefined}
        onDrop={allowDragDrop ? handleDrop : undefined}
      >
        <input
          type="file"
          id={id}
          name={name}
          ref={fileInputRef}
          accept={accept}
          onChange={handleFileChange}
          onBlur={onBlur}
          className="hidden"
          multiple
          disabled={files.length >= maxFiles}
        />
        
        {renderDropZoneContent()}
      </div>

      {fileErrors.length > 0 && (
        <div className="mt-2">
          {fileErrors.map((error, index) => (
            <div key={index} className="flex items-start text-red-600 text-sm mt-1">
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
              <p>{error}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-start">
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
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}

      {files.length > 0 && files.length < maxFiles && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={files.length >= maxFiles}
          >
            {getButtonLabel()}
          </button>
          <span className="ml-2 text-sm text-gray-500">
            {files.length} of {maxFiles} files
          </span>
        </div>
      )}
    </div>
  );
} 