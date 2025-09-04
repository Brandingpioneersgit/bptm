import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '', showLabel = true, size = 'md' }) => {
  const { theme, toggleTheme, setLightTheme, setDarkTheme, setSystemTheme } = useTheme();
  const [showDropdown, setShowDropdown] = React.useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return (
          <svg className={iconSizeClasses[size]} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" clipRule="evenodd" />
          </svg>
        );
      case 'light':
        return (
          <svg className={iconSizeClasses[size]} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className={iconSizeClasses[size]} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'dark': return 'Dark';
      case 'light': return 'Light';
      default: return 'System';
    }
  };

  // Simple toggle version (just light/dark)
  if (!showDropdown) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={toggleTheme}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowDropdown(true);
          }}
          className={`
            ${sizeClasses[size]} 
            flex items-center justify-center rounded-lg 
            bg-gray-100 hover:bg-gray-200 
            dark:bg-dark-800 dark:hover:bg-dark-700 
            text-gray-700 dark:text-gray-300 
            transition-all duration-200 
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 
            dark:focus:ring-offset-dark-800
            group
          `}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode (right-click for more options)`}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <div className="transform group-hover:scale-110 transition-transform duration-200">
            {getThemeIcon()}
          </div>
        </button>
        
        {showLabel && (
          <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
            {getThemeLabel()}
          </span>
        )}
      </div>
    );
  }

  // Dropdown version with all options
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`
          ${sizeClasses[size]} 
          flex items-center justify-center rounded-lg 
          bg-gray-100 hover:bg-gray-200 
          dark:bg-dark-800 dark:hover:bg-dark-700 
          text-gray-700 dark:text-gray-300 
          transition-all duration-200 
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 
          dark:focus:ring-offset-dark-800
        `}
        aria-label="Theme options"
        aria-expanded={showDropdown}
        aria-haspopup="true"
      >
        {getThemeIcon()}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 z-20">
            <div className="py-1" role="menu" aria-orientation="vertical">
              <button
                onClick={() => {
                  setLightTheme();
                  setShowDropdown(false);
                }}
                className={`
                  w-full px-3 py-2 text-left text-sm 
                  hover:bg-gray-100 dark:hover:bg-dark-700 
                  flex items-center gap-2
                  ${theme === 'light' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}
                `}
                role="menuitem"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
                Light
              </button>
              
              <button
                onClick={() => {
                  setDarkTheme();
                  setShowDropdown(false);
                }}
                className={`
                  w-full px-3 py-2 text-left text-sm 
                  hover:bg-gray-100 dark:hover:bg-dark-700 
                  flex items-center gap-2
                  ${theme === 'dark' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}
                `}
                role="menuitem"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" clipRule="evenodd" />
                </svg>
                Dark
              </button>
              
              <button
                onClick={() => {
                  setSystemTheme();
                  setShowDropdown(false);
                }}
                className={`
                  w-full px-3 py-2 text-left text-sm 
                  hover:bg-gray-100 dark:hover:bg-dark-700 
                  flex items-center gap-2
                  ${!localStorage.getItem('theme') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}
                `}
                role="menuitem"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                </svg>
                System
              </button>
            </div>
          </div>
        </>
      )}
      
      {showLabel && (
        <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {getThemeLabel()}
        </span>
      )}
    </div>
  );
};

export default ThemeToggle;