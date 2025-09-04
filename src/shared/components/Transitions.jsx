/**
 * Transitions Component
 * 
 * Reusable transition and animation components for enhanced UX
 * with smooth enter/exit animations and interactive feedback.
 */

import React, { useState, useEffect } from 'react';
import { Transition } from '@headlessui/react';

// Fade transition wrapper
export const FadeTransition = ({ 
  show, 
  children, 
  duration = 'duration-200',
  className = '' 
}) => {
  return (
    <Transition
      show={show}
      enter={`ease-out ${duration}`}
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave={`ease-in ${duration}`}
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      className={className}
    >
      {children}
    </Transition>
  );
};

// Slide transition wrapper
export const SlideTransition = ({ 
  show, 
  children, 
  direction = 'down',
  duration = 'duration-300',
  className = '' 
}) => {
  const directions = {
    up: {
      enterFrom: 'translate-y-4 opacity-0',
      enterTo: 'translate-y-0 opacity-100',
      leaveFrom: 'translate-y-0 opacity-100',
      leaveTo: 'translate-y-4 opacity-0'
    },
    down: {
      enterFrom: '-translate-y-4 opacity-0',
      enterTo: 'translate-y-0 opacity-100',
      leaveFrom: 'translate-y-0 opacity-100',
      leaveTo: '-translate-y-4 opacity-0'
    },
    left: {
      enterFrom: 'translate-x-4 opacity-0',
      enterTo: 'translate-x-0 opacity-100',
      leaveFrom: 'translate-x-0 opacity-100',
      leaveTo: 'translate-x-4 opacity-0'
    },
    right: {
      enterFrom: '-translate-x-4 opacity-0',
      enterTo: 'translate-x-0 opacity-100',
      leaveFrom: 'translate-x-0 opacity-100',
      leaveTo: '-translate-x-4 opacity-0'
    }
  };

  const directionClasses = directions[direction] || directions.down;

  return (
    <Transition
      show={show}
      enter={`ease-out ${duration}`}
      enterFrom={directionClasses.enterFrom}
      enterTo={directionClasses.enterTo}
      leave={`ease-in ${duration}`}
      leaveFrom={directionClasses.leaveFrom}
      leaveTo={directionClasses.leaveTo}
      className={className}
    >
      {children}
    </Transition>
  );
};

// Scale transition wrapper
export const ScaleTransition = ({ 
  show, 
  children, 
  duration = 'duration-200',
  className = '' 
}) => {
  return (
    <Transition
      show={show}
      enter={`ease-out ${duration}`}
      enterFrom="scale-95 opacity-0"
      enterTo="scale-100 opacity-100"
      leave={`ease-in ${duration}`}
      leaveFrom="scale-100 opacity-100"
      leaveTo="scale-95 opacity-0"
      className={className}
    >
      {children}
    </Transition>
  );
};

// Staggered list animation
export const StaggeredList = ({ 
  items, 
  renderItem, 
  delay = 50,
  className = '' 
}) => {
  const [visibleItems, setVisibleItems] = useState([]);

  useEffect(() => {
    items.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(prev => [...prev, index]);
      }, index * delay);
    });

    return () => setVisibleItems([]);
  }, [items, delay]);

  return (
    <div className={className}>
      {items.map((item, index) => (
        <SlideTransition
          key={index}
          show={visibleItems.includes(index)}
          direction="up"
          className="mb-2"
        >
          {renderItem(item, index)}
        </SlideTransition>
      ))}
    </div>
  );
};

// Interactive button with hover and click animations
export const AnimatedButton = ({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  className = '',
  ...props 
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500'
  };

  const sizes = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };

  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  const variantClasses = variants[variant] || variants.primary;
  const sizeClasses = sizes[size] || sizes.medium;

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
  };

  return (
    <button
      {...props}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        ${baseClasses} 
        ${variantClasses} 
        ${sizeClasses} 
        ${className}
        transform transition-transform duration-150 ease-in-out
        ${isPressed ? 'scale-95' : isHovered ? 'scale-105' : 'scale-100'}
        ${loading ? 'animate-pulse' : ''}
      `}
    >
      {loading && (
        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
      )}
      {children}
    </button>
  );
};

// Notification toast with slide-in animation
export const AnimatedToast = ({ 
  show, 
  message, 
  type = 'info',
  onClose,
  duration = 5000,
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const types = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white'
  };

  const typeClasses = types[type] || types.info;

  return (
    <Transition
      show={isVisible}
      enter="ease-out duration-300"
      enterFrom="translate-x-full opacity-0"
      enterTo="translate-x-0 opacity-100"
      leave="ease-in duration-300"
      leaveFrom="translate-x-0 opacity-100"
      leaveTo="translate-x-full opacity-0"
      className={`fixed top-4 right-4 z-50 ${className}`}
    >
      <div className={`px-4 py-3 rounded-lg shadow-lg ${typeClasses} flex items-center gap-3 max-w-sm`}>
        <span className="flex-1">{message}</span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-gray-200 transition-colors"
        >
          ×
        </button>
      </div>
    </Transition>
  );
};

// Accordion with smooth expand/collapse
export const AnimatedAccordion = ({ 
  title, 
  children, 
  defaultOpen = false,
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border border-gray-200 rounded-lg ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
      >
        <span>{title}</span>
        <svg
          className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <Transition
        show={isOpen}
        enter="ease-out duration-300"
        enterFrom="opacity-0 max-h-0"
        enterTo="opacity-100 max-h-96"
        leave="ease-in duration-300"
        leaveFrom="opacity-100 max-h-96"
        leaveTo="opacity-0 max-h-0"
        className="overflow-hidden"
      >
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          {children}
        </div>
      </Transition>
    </div>
  );
};

// Floating action button with ripple effect
export const FloatingActionButton = ({ 
  onClick, 
  icon, 
  className = '',
  position = 'bottom-right' 
}) => {
  const [ripples, setRipples] = useState([]);

  const positions = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  };

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const newRipple = {
      x,
      y,
      size,
      id: Date.now()
    };

    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);

    onClick?.(e);
  };

  const positionClasses = positions[position] || positions['bottom-right'];

  return (
    <button
      onClick={handleClick}
      className={`
        ${positionClasses}
        w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        transform transition-all duration-200 hover:scale-110 active:scale-95
        flex items-center justify-center relative overflow-hidden
        ${className}
      `}
    >
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white bg-opacity-30 rounded-full animate-ping"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size
          }}
        />
      ))}
      {icon}
    </button>
  );
};

export default {
  FadeTransition,
  SlideTransition,
  ScaleTransition,
  StaggeredList,
  AnimatedButton,
  AnimatedToast,
  AnimatedAccordion,
  FloatingActionButton
};