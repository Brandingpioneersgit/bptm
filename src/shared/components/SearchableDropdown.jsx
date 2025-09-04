import React, { useState, useEffect, useRef, useCallback } from 'react';

const SearchableDropdown = ({
  options = [],
  value = '',
  onChange,
  onInputChange,
  placeholder = 'Type to search...',
  disabled = false,
  searchable = true,
  creatable = false,
  isLoading = false,
  className = '',
  error = null,
  warning = null,
  label = null,
  required = false,
  onCreateNew = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const hasError = !!error;
  const hasWarning = !!warning && !hasError;

  // Filter options based on search term
  const filteredOptions = searchable && searchTerm
    ? options.filter(option => {
        const optionText = typeof option === 'string' ? option : option.label || option.value || '';
        return optionText.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : options;

  // Add "Create new" option if creatable and no exact match
  const showCreateOption = creatable && searchTerm && !filteredOptions.some(option => {
    const optionText = typeof option === 'string' ? option : option.label || option.value || '';
    return optionText.toLowerCase() === searchTerm.toLowerCase();
  });

  const allOptions = showCreateOption
    ? [...filteredOptions, { isCreateOption: true, label: `Create "${searchTerm}"`, value: searchTerm }]
    : filteredOptions;

  // Handle input change
  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setHighlightedIndex(-1);
    
    if (onInputChange) {
      onInputChange(newValue);
    }
    
    if (!isOpen) {
      setIsOpen(true);
    }
  }, [onInputChange, isOpen]);

  // Handle option selection
  const handleOptionSelect = useCallback((option) => {
    if (disabled) return;

    if (option.isCreateOption) {
      // Handle creation of new item
      if (onCreateNew) {
        onCreateNew(option.value);
      }
      setSearchTerm(option.value);
      if (onChange) {
        onChange(option.value);
      }
    } else {
      const optionValue = typeof option === 'string' ? option : option.value;
      const optionLabel = typeof option === 'string' ? option : option.label || option.value;
      
      setSearchTerm(optionLabel);
      if (onChange) {
        onChange(optionValue);
      }
    }
    
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, [disabled, onChange, onCreateNew]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < allOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : allOptions.length - 1
          );
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && allOptions[highlightedIndex]) {
          handleOptionSelect(allOptions[highlightedIndex]);
        } else if (isOpen && allOptions.length === 1) {
          handleOptionSelect(allOptions[0]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  }, [disabled, isOpen, highlightedIndex, allOptions, handleOptionSelect]);

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    if (!disabled && searchable) {
      setIsOpen(true);
    }
  }, [disabled, searchable]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update search term when value changes externally
  useEffect(() => {
    if (value !== searchTerm) {
      setSearchTerm(value || '');
    }
  }, [value]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {hasError && (
            <span className="ml-2 flex items-center gap-1 text-red-600 text-xs font-medium">
              <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">!</div>
              Required
            </span>
          )}
          {hasWarning && (
            <span className="ml-2 flex items-center gap-1 text-amber-600 text-xs font-medium">
              <div className="w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">⚠</div>
              Warning
            </span>
          )}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={`w-full border rounded-xl p-3 focus:ring-2 transition-all duration-200 ${
            hasError
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
              : hasWarning
              ? 'border-amber-300 focus:ring-amber-500 focus:border-amber-500 bg-amber-50'
              : disabled || isLoading
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300'
              : 'border-gray-300 hover:border-gray-400 bg-white focus:ring-blue-500 focus:border-blue-500'
          }`}
          autoComplete="off"
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {isOpen && !disabled && !isLoading && allOptions.length > 0 && (
          <ul
            ref={listRef}
            className="absolute z-50 w-full bg-white border border-gray-300 rounded-xl mt-1 max-h-60 overflow-y-auto shadow-lg"
            role="listbox"
          >
            {allOptions.map((option, index) => {
              const isHighlighted = index === highlightedIndex;
              const isCreateOption = option.isCreateOption;
              const optionLabel = typeof option === 'string' ? option : option.label || option.value;
              
              return (
                <li
                  key={isCreateOption ? `create-${option.value}` : (typeof option === 'string' ? option : option.value || index)}
                  onClick={() => handleOptionSelect(option)}
                  className={`p-3 cursor-pointer transition-all duration-150 ${
                    isHighlighted
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-900 hover:bg-blue-50'
                  } ${
                    isCreateOption
                      ? 'border-t border-gray-200 bg-green-50 hover:bg-green-100 text-green-800 font-medium'
                      : ''
                  }`}
                  role="option"
                  aria-selected={isHighlighted}
                >
                  {isCreateOption && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">+</span>
                      <span>{optionLabel}</span>
                    </div>
                  )}
                  {!isCreateOption && optionLabel}
                </li>
              );
            })}
          </ul>
        )}
        
        {isOpen && !disabled && !isLoading && allOptions.length === 0 && searchTerm && (
          <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-xl mt-1 p-3 text-gray-500 text-center shadow-lg">
            No options found
          </div>
        )}
      </div>
      
      {hasError && (
        <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
            {error}
          </p>
        </div>
      )}
      
      {hasWarning && (
        <div className="mt-2 p-2 bg-amber-100 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700 flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
            {warning}
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;