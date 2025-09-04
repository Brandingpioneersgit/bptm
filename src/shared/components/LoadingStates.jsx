/**
 * LoadingStates Component
 * 
 * Comprehensive loading state components with smooth animations
 * and consistent visual feedback patterns.
 */

import React from 'react';

// Main loading spinner with customizable size and color
export const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'blue', 
  className = '',
  showText = false,
  text = 'Loading...'
}) => {
  const sizes = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colors = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    red: 'border-red-600',
    gray: 'border-gray-600',
    purple: 'border-purple-600'
  };

  const sizeClass = sizes[size] || sizes.medium;
  const colorClass = colors[color] || colors.blue;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className={`${sizeClass} ${colorClass} border-2 border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {showText && (
        <span className="text-gray-600 text-sm animate-pulse">{text}</span>
      )}
    </div>
  );
};

// Skeleton loader for content placeholders
export const SkeletonLoader = ({ 
  lines = 3, 
  className = '',
  animated = true 
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`h-4 bg-gray-200 rounded ${
            animated ? 'animate-pulse' : ''
          } ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
};

// Card skeleton for dashboard items
export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
          <div className="h-3 bg-gray-200 rounded w-4/6" />
        </div>
      </div>
    </div>
  );
};

// Table skeleton for data tables
export const TableSkeleton = ({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-lg border overflow-hidden ${className}`}>
      <div className="animate-pulse">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-3 border-b">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, index) => (
              <div key={index} className="h-4 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4 border-b border-gray-100">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div 
                  key={colIndex} 
                  className={`h-4 bg-gray-200 rounded ${
                    colIndex === 0 ? 'w-3/4' : 'w-full'
                  }`} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Full page loading overlay
export const PageLoader = ({ 
  message = 'Loading...', 
  className = '' 
}) => {
  return (
    <div className={`fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="xl" showText text={message} />
      </div>
    </div>
  );
};

// Inline loading state for buttons and small components
export const InlineLoader = ({ 
  size = 'small', 
  className = '' 
}) => {
  return (
    <LoadingSpinner 
      size={size} 
      className={`inline-flex ${className}`}
    />
  );
};

// Progress bar component
export const ProgressBar = ({ 
  progress = 0, 
  className = '',
  color = 'blue',
  showPercentage = false,
  animated = true
}) => {
  const colors = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600'
  };

  const colorClass = colors[color] || colors.blue;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1">
        {showPercentage && (
          <span className="text-sm text-gray-600">{Math.round(clampedProgress)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${colorClass} ${
            animated ? 'transition-all duration-300 ease-out' : ''
          }`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

// Pulsing dot indicator
export const PulsingDot = ({ 
  color = 'blue', 
  size = 'medium',
  className = '' 
}) => {
  const sizes = {
    small: 'w-2 h-2',
    medium: 'w-3 h-3',
    large: 'w-4 h-4'
  };

  const colors = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  };

  const sizeClass = sizes[size] || sizes.medium;
  const colorClass = colors[color] || colors.blue;

  return (
    <div 
      className={`${sizeClass} ${colorClass} rounded-full animate-pulse ${className}`}
    />
  );
};

export default {
  LoadingSpinner,
  SkeletonLoader,
  CardSkeleton,
  TableSkeleton,
  PageLoader,
  InlineLoader,
  ProgressBar,
  PulsingDot
};