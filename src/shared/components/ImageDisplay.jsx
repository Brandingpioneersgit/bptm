/**
 * ImageDisplay Components
 * 
 * Reusable components for displaying images with fallbacks,
 * loading states, and proper error handling.
 */

import React, { useState, useCallback } from 'react';

// Generic image display with fallback and loading states
export const ImageDisplay = ({ 
  src, 
  alt = 'Image', 
  className = '', 
  fallbackSrc = null,
  showFallback = true,
  loading = 'lazy',
  onLoad = null,
  onError = null,
  ...props 
}) => {
  const [imageState, setImageState] = useState({
    loading: true,
    error: false,
    loaded: false
  });

  const handleLoad = useCallback((e) => {
    setImageState({
      loading: false,
      error: false,
      loaded: true
    });
    if (onLoad) onLoad(e);
  }, [onLoad]);

  const handleError = useCallback((e) => {
    setImageState(prev => ({
      ...prev,
      loading: false,
      error: true
    }));
    if (onError) onError(e);
  }, [onError]);

  const handleFallbackError = useCallback((e) => {
    setImageState(prev => ({
      ...prev,
      loading: false,
      error: true
    }));
  }, []);

  // Show fallback if no src or error occurred
  if (!src || (imageState.error && !fallbackSrc)) {
    if (!showFallback) return null;
    
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`} {...props}>
        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="m21 19v-14c0-1.1-.9-2-2-2h-14c0-1.1-.9-2-2-2s-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-12.5-9.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm4.5 9h-10v-4l2-2 3 3 2-2 3 3v2z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loading spinner */}
      {imageState.loading && (
        <div className={`absolute inset-0 bg-gray-100 flex items-center justify-center ${className}`}>
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Main image */}
      {!imageState.error && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${imageState.loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
          loading={loading}
          onLoad={handleLoad}
          onError={fallbackSrc ? handleError : handleFallbackError}
          {...props}
        />
      )}

      {/* Fallback image */}
      {imageState.error && fallbackSrc && (
        <img
          src={fallbackSrc}
          alt={alt}
          className={className}
          loading={loading}
          onLoad={handleLoad}
          onError={handleFallbackError}
          {...props}
        />
      )}
    </div>
  );
};

// Profile image with circular styling and name fallback
export const ProfileImage = ({ 
  src, 
  name = 'User',
  size = 'md',
  className = '',
  showFallback = true
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-xl',
    '2xl': 'w-32 h-32 text-2xl'
  };

  const sizeClasses = sizes[size] || sizes.md;
  
  // Generate fallback avatar with initials
  const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=128&font-size=0.33`;

  return (
    <div className={`${sizeClasses} rounded-full overflow-hidden border-2 border-white shadow-sm ${className}`}>
      <ImageDisplay
        src={src}
        alt={`${name}'s profile picture`}
        className="w-full h-full object-cover"
        fallbackSrc={fallbackSrc}
        showFallback={showFallback}
        loading="eager"
      />
    </div>
  );
};

// Client logo display with company name fallback
export const ClientLogo = ({ 
  src, 
  clientName = 'Client',
  size = 'md',
  className = '',
  showFallback = true
}) => {
  const sizes = {
    xs: 'w-8 h-6',
    sm: 'w-12 h-9',
    md: 'w-16 h-12',
    lg: 'w-24 h-18',
    xl: 'w-32 h-24'
  };

  const sizeClasses = sizes[size] || sizes.md;

  // Generate text-based fallback logo
  const generateFallback = (name) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, 128, 96);
    
    // Text
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Truncate long names
    const displayName = name.length > 12 ? name.substring(0, 12) + '...' : name;
    ctx.fillText(displayName, 64, 48);
    
    return canvas.toDataURL();
  };

  const [fallbackSrc, setFallbackSrc] = React.useState('');

  React.useEffect(() => {
    setFallbackSrc(generateFallback(clientName));
  }, [clientName]);

  return (
    <div className={`${sizeClasses} rounded-md overflow-hidden border border-gray-200 bg-white ${className}`}>
      <ImageDisplay
        src={src}
        alt={`${clientName} logo`}
        className="w-full h-full object-contain p-1"
        fallbackSrc={fallbackSrc}
        showFallback={showFallback}
      />
    </div>
  );
};

// Brand/banner image display
export const BrandImage = ({ 
  src, 
  alt = 'Brand image',
  aspectRatio = '16/9',
  className = '',
  showFallback = true
}) => {
  const aspectRatios = {
    '1/1': 'aspect-square',
    '4/3': 'aspect-4/3',
    '16/9': 'aspect-video',
    '21/9': 'aspect-[21/9]'
  };

  const aspectClass = aspectRatios[aspectRatio] || 'aspect-video';

  return (
    <div className={`${aspectClass} bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      <ImageDisplay
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        showFallback={showFallback}
      />
    </div>
  );
};

// Image gallery component
export const ImageGallery = ({ images = [], className = '' }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  if (images.length === 0) return null;

  return (
    <div className={className}>
      {/* Thumbnail grid */}
      <div className="grid grid-cols-3 gap-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(image)}
            className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors"
          >
            <ImageDisplay
              src={image.src || image.url}
              alt={image.alt || `Image ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Modal for selected image */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
          <div className="max-w-4xl max-h-full p-4">
            <img
              src={selectedImage.src || selectedImage.url}
              alt={selectedImage.alt || 'Selected image'}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;