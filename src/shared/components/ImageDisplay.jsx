/**
 * ImageDisplay Components
 */
import React from 'react';

export const ImageDisplay = ({ url, alt = '', className = '', fallback = '🖼️', rounded = true }) => {
  if (!url) {
    return (
      <div className={`flex items-center justify-center ${rounded ? 'rounded-full' : 'rounded-lg'} bg-gray-100 text-gray-400 ${className}`}>
        {fallback}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      className={`${rounded ? 'rounded-full' : 'rounded-lg'} object-cover ${className}`}
      onError={(e) => { e.currentTarget.src = ''; e.currentTarget.alt = alt || 'image'; }}
    />
  );
};

export const ClientLogo = ({ url, name, size = 10 }) => {
  const px = `${size * 0.25}rem`;
  const rounded = true;
  return (
    <div style={{ width: px, height: px }} className="relative">
      <ImageDisplay url={url} alt={`${name} logo`} className="w-full h-full" rounded={rounded} />
      {!url && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-600 text-white font-bold rounded-full">
          {name?.[0]?.toUpperCase() || 'C'}
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;

