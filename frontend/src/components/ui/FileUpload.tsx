"use client";

import React, { InputHTMLAttributes, forwardRef, useState } from "react";

interface FileUploadProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  helpText?: string;
  acceptedFormats?: string;
  maxSize?: string;
  onFileChange?: (file: File | null) => void;
}

const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({ 
    label, 
    error, 
    className = "", 
    fullWidth = true, 
    helpText,
    acceptedFormats,
    maxSize,
    onChange,
    onFileChange,
    ...props 
  }, ref) => {
    const [fileName, setFileName] = useState<string>("");
    const [isDragging, setIsDragging] = useState(false);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setFileName(file?.name || "");
      if (onFileChange) {
        onFileChange(file);
      }
      if (onChange) {
        onChange(e);
      }
    };
    
    // Handle drag and drop events
    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };
    
    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };
    
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) {
        setIsDragging(true);
      }
    };
    
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      const file = e.dataTransfer.files?.[0] || null;
      if (file) {
        setFileName(file.name);
        if (onFileChange) {
          onFileChange(file);
        }
        
        // Create a synthetic event to pass to onChange
        if (onChange && ref && 'current' in ref && ref.current) {
          // Create a synthetic file list
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          
          // Update the file input value
          ref.current.files = dataTransfer.files;
          
          // Create and dispatch a change event
          const event = new Event('change', { bubbles: true });
          ref.current.dispatchEvent(event);
        }
      }
    };

    return (
      <div className={`file-upload ${fullWidth ? "w-full" : ""} ${className}`}>
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div 
          className={`
            file-upload-field 
            ${isDragging ? 'border-blue-400 bg-blue-50' : ''}
            ${error ? 'border-red-300' : ''}
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <label className="file-upload-button">
            <svg 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" 
              />
            </svg>
            Browse
            <input
              ref={ref}
              type="file"
              className="hidden"
              onChange={handleChange}
              {...props}
            />
          </label>
          <div className="file-upload-filename">
            {fileName || (isDragging ? "Drop file here..." : "No file selected")}
          </div>
          
          {error && (
            <div className="flex items-center px-3">
              <svg
                className="h-5 w-5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}
        </div>
        
        {error ? (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        ) : (
          (helpText || acceptedFormats || maxSize) && (
            <p className="file-upload-help-text">
              {helpText}
              {acceptedFormats && ` Supported formats: ${acceptedFormats}.`}
              {maxSize && ` Max size: ${maxSize}.`}
            </p>
          )
        )}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";

export default FileUpload; 