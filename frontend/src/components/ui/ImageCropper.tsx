"use client";

import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspect?: number; // Aspect ratio (width/height), undefined means free-form
  circularCrop?: boolean;
  initialCrop?: Crop;
}

// Maximum dimensions for preview image
const MAX_PREVIEW_WIDTH = 800;
const MAX_PREVIEW_HEIGHT = 600;

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export default function ImageCropper({ 
  imageSrc, 
  onCropComplete, 
  onCancel, 
  aspect,
  circularCrop = false,
  initialCrop 
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>(initialCrop || {
    unit: '%',
    width: 90,
    height: aspect ? 90 / aspect : 90,
    x: 5,
    y: 5
  });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const [optimizedSrc, setOptimizedSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  // Optimize the source image before displaying
  useEffect(() => {
    if (!imageSrc) return;
    
    setIsLoading(true);
    
    // Create an image to get dimensions
    const img = new Image();
    img.onload = () => {
      // Check if resizing is needed
      let needsResize = img.width > MAX_PREVIEW_WIDTH || img.height > MAX_PREVIEW_HEIGHT;
      
      if (needsResize) {
        // Calculate new dimensions while maintaining aspect ratio
        let newWidth, newHeight;
        if (img.width / img.height > MAX_PREVIEW_WIDTH / MAX_PREVIEW_HEIGHT) {
          // Width is the limiting factor
          newWidth = MAX_PREVIEW_WIDTH;
          newHeight = (img.height / img.width) * newWidth;
        } else {
          // Height is the limiting factor
          newHeight = MAX_PREVIEW_HEIGHT;
          newWidth = (img.width / img.height) * newHeight;
        }
        
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          // Convert to lower quality JPEG for even more optimization
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setOptimizedSrc(optimizedDataUrl);
          console.log(`Image resized from ${img.width}x${img.height} to ${newWidth}x${newHeight}`);
        } else {
          // Fallback if canvas context not available
          setOptimizedSrc(imageSrc);
        }
      } else {
        // No need to resize
        setOptimizedSrc(imageSrc);
      }
      
      setIsLoading(false);
    };
    
    img.onerror = () => {
      console.error('Error loading image for optimization');
      setOptimizedSrc(imageSrc);
      setIsLoading(false);
    };
    
    img.src = imageSrc;
  }, [imageSrc]);

  // When the image is loaded, set up initial crop area
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    if (aspect) {
      const crop = centerAspectCrop(width, height, aspect);
      setCrop(crop);
    }
  };

  // Generate cropped image when user confirms
  const handleCropConfirm = async () => {
    if (!completedCrop || !imgRef.current) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Calculate pixel crop values
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const pixelCrop = {
      x: completedCrop.x * scaleX,
      y: completedCrop.y * scaleY,
      width: completedCrop.width * scaleX,
      height: completedCrop.height * scaleY,
    };

    // Set canvas size to match the cropped area
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Apply circular mask if circularCrop is true
    if (circularCrop) {
      ctx.beginPath();
      ctx.arc(
        pixelCrop.width / 2,
        pixelCrop.height / 2,
        Math.min(pixelCrop.width, pixelCrop.height) / 2,
        0,
        2 * Math.PI
      );
      ctx.clip();
    }

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Canvas is empty');
      }
      onCropComplete(blob);
    }, 'image/jpeg', 0.95); // Use 95% quality JPEG for good balance
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Crop Your Image</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-auto flex justify-center items-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8">
              <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-gray-600">Preparing image...</p>
            </div>
          ) : optimizedSrc ? (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              circularCrop={circularCrop}
              className="max-h-[calc(90vh-8rem)] object-contain"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={optimizedSrc}
                alt="Crop preview"
                onLoad={onImageLoad}
                style={{ maxHeight: 'calc(90vh - 8rem)' }}
                loading="eager" // Prioritize this image
              />
            </ReactCrop>
          ) : null}
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCropConfirm}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
            disabled={isLoading || !completedCrop}
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
} 