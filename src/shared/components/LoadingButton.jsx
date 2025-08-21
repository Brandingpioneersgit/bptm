import React, { useState } from 'react';

export const LoadingButton = ({ 
  children, 
  onClick, 
  loading = false, 
  disabled = false, 
  className = '', 
  loadingText = 'Loading...', 
  variant = 'primary',
  size = 'medium',
  icon = null,
  loadingIcon = null,
  ...props 
}) => {
  const [isClicked, setIsClicked] = useState(false);

  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-400',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-400',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500 disabled:bg-yellow-400',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500 disabled:bg-gray-100 disabled:text-gray-400',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 disabled:text-gray-400',
    link: 'text-blue-600 hover:text-blue-800 hover:underline focus:ring-blue-500 disabled:text-blue-400'
  };

  const sizes = {
    small: 'px-3 py-1.5 text-sm rounded-md',
    medium: 'px-4 py-2 text-sm rounded-lg',
    large: 'px-6 py-3 text-base rounded-lg'
  };

  const variantClasses = variants[variant] || variants.primary;
  const sizeClasses = sizes[size] || sizes.medium;

  const isLoading = loading || isClicked;
  const isDisabled = disabled || isLoading;

  const handleClick = async (e) => {
    if (isDisabled || !onClick) return;

    setIsClicked(true);
    e.target.style.transform = 'scale(0.98)';
    try { await onClick(e); } catch (error) { console.error('Button click handler failed:', error); }
    finally { setTimeout(() => { e.target.style.transform = 'scale(1)'; setIsClicked(false); }, 150); }
  };

  const renderIcon = () => {
    if (isLoading) {
      return loadingIcon || (<div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />);
    }
    return icon;
  };

  const renderText = () => (isLoading && loadingText ? loadingText : children);

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className} ${isLoading ? 'animate-pulse' : ''}`}
      style={{ transform: isClicked ? 'scale(0.98)' : 'scale(1)', transition: 'transform 0.1s ease-in-out, background-color 0.2s ease-in-out' }}
    >
      {renderIcon()}
      {renderText()}
    </button>
  );
};

export const IconButton = ({ 
  icon, 
  loading = false, 
  disabled = false, 
  onClick, 
  className = '', 
  size = 'medium',
  variant = 'ghost',
  ...props 
}) => {
  const [isClicked, setIsClicked] = useState(false);
  const baseClasses = 'inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-400',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-400',
    ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500 disabled:text-gray-400',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500 disabled:bg-gray-100 disabled:text-gray-400'
  };
  const sizes = { small: 'w-8 h-8 rounded-md', medium: 'w-10 h-10 rounded-lg', large: 'w-12 h-12 rounded-lg' };
  const variantClasses = variants[variant] || variants.ghost;
  const sizeClasses = sizes[size] || sizes.medium;
  const isLoading = loading || isClicked;
  const isDisabled = disabled || isLoading;

  const handleClick = async (e) => {
    if (isDisabled || !onClick) return;
    setIsClicked(true);
    e.target.style.transform = 'scale(0.95)';
    try { await onClick(e); } catch (error) { console.error('Icon button click handler failed:', error); }
    finally { setTimeout(() => { e.target.style.transform = 'scale(1)'; setIsClicked(false); }, 150); }
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      style={{ transform: isClicked ? 'scale(0.95)' : 'scale(1)', transition: 'transform 0.1s ease-in-out, background-color 0.2s ease-in-out' }}
    >
      {isLoading ? (
        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
      ) : (
        icon
      )}
    </button>
  );
};

export default LoadingButton;

