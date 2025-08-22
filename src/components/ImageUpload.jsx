/**
 * ImageUpload Component
 * 
 * A comprehensive image upload component with drag-and-drop,
 * progress tracking, image preview, and error handling.
 */

import React, { useState, useRef, useCallback } from 'react';
import { useSupabase } from './SupabaseProvider';
import { getImageUploadService } from '@/shared/services/ImageUploadService';
import { useToast } from '@/shared/components/Toast';

export const ImageUpload = ({ 
  currentImageUrl = null,
  onImageChange = null,
  userId = 'anonymous',
  type = 'profile',
  className = '',
  disabled = false,
  required = false,
  placeholder = 'Click to upload or drag and drop',
  maxWidth = 400,
  maxHeight = 400,
  compress = true
}) => {
  const supabase = useSupabase();
  const fileInputRef = useRef(null);
  
  const [uploadState, setUploadState] = useState({
    uploading: false,
    progress: 0,
    error: null,
    success: false,
    previewUrl: currentImageUrl
  });
  const { notify } = useToast();

  const imageUploadService = getImageUploadService(supabase);

  // Handle file selection via input
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      handleUpload(file);
    }
  }, []);

  // Main upload handler
  const handleUpload = useCallback(async (file) => {
    if (!file || !imageUploadService || disabled) return;

    setUploadState(prev => ({
      ...prev,
      uploading: true,
      progress: 0,
      error: null,
      success: false
    }));

    try {
      // Create preview URL immediately
      const previewUrl = URL.createObjectURL(file);
      setUploadState(prev => ({ ...prev, previewUrl }));

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      // Upload the image
      const result = await imageUploadService.uploadImage(file, {
        userId,
        type,
        compress,
        maxWidth,
        maxHeight,
        onProgress: (progress) => {
          setUploadState(prev => ({ ...prev, progress }));
        }
      });

      clearInterval(progressInterval);

      if (result.success) {
        setUploadState(prev => ({
          ...prev,
          uploading: false,
          progress: 100,
          success: true,
          previewUrl: result.url,
          error: null
        }));

        // Notify parent component
        if (onImageChange) {
          onImageChange({
            url: result.url,
            path: result.path,
            originalSize: result.originalSize,
            compressedSize: result.compressedSize
          });
        }

        console.log('🎉 Image upload successful:', result.url);
        notify({ type: 'success', title: 'Upload complete', message: 'Image uploaded successfully.' });

      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Image upload failed:', error);
      
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        progress: 0,
        error: error.message,
        success: false,
        previewUrl: currentImageUrl // Revert to original
      }));
      notify({ type: 'error', title: 'Upload failed', message: error.message });
    }
  }, [imageUploadService, userId, type, compress, maxWidth, maxHeight, onImageChange, disabled, currentImageUrl]);

  // Click handler for upload area
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // Remove image handler
  const handleRemove = useCallback((event) => {
    event.stopPropagation();
    
    setUploadState(prev => ({
      ...prev,
      previewUrl: null,
      error: null,
      success: false
    }));

    if (onImageChange) {
      onImageChange(null);
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onImageChange]);

  const renderUploadArea = () => {
    if (uploadState.uploading) {
      return (
        <div className="flex flex-col items-center justify-center p-6">
          <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mb-3"></div>
          <div className="text-sm text-gray-600 mb-2">Uploading image...</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadState.progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">{uploadState.progress}%</div>
        </div>
      );
    }

    if (uploadState.previewUrl) {
      return (
        <div className="relative group">
          <img
            src={uploadState.previewUrl}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
            onError={() => {
              setUploadState(prev => ({ ...prev, previewUrl: null, error: 'Failed to load image' }));
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
              <button
                type="button"
                onClick={handleClick}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Change
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
          {uploadState.success && (
            <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <div className="text-sm text-gray-600 mb-2">
          {placeholder}
        </div>
        <div className="text-xs text-gray-500">
          PNG, JPG, GIF up to 5MB
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      <div
        className={`
          border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500 hover:bg-blue-50'}
          ${uploadState.error ? 'border-red-300 bg-red-50' : ''}
          ${uploadState.success ? 'border-green-300 bg-green-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {renderUploadArea()}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Error message */}
      {uploadState.error && (
        <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {uploadState.error}
        </div>
      )}

      {/* Success message */}
      {uploadState.success && !uploadState.error && (
        <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Image uploaded successfully!
        </div>
      )}
    </div>
  );
};

// Simple profile image upload variant
export const ProfileImageUpload = ({ 
  currentImageUrl, 
  onImageChange, 
  userId,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative">
        {currentImageUrl ? (
          <img
            src={currentImageUrl}
            alt="Profile"
            className="w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 rounded-full object-cover border-2 sm:border-4 border-white shadow-lg"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userId)}&background=6366f1&color=fff&size=96`;
            }}
          />
        ) : (
          <div className="w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 rounded-full bg-gray-200 border-2 sm:border-4 border-white shadow-lg flex items-center justify-center">
            <svg className="w-6 sm:w-8 h-6 sm:h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        )}
      </div>
      
      <ImageUpload
        currentImageUrl={currentImageUrl}
        onImageChange={onImageChange}
        userId={userId}
        type="profile"
        disabled={disabled}
        placeholder="Upload profile photo"
        maxWidth={200}
        maxHeight={200}
        className="w-full max-w-xs"
      />
    </div>
  );
};

export default ImageUpload;
