import React, { useState } from 'react';

export const Select = ({ children, onValueChange, defaultValue, value, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || defaultValue || "");

  const handleValueChange = (newValue) => {
    setSelectedValue(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            isOpen,
            setIsOpen,
            selectedValue,
            onValueChange: handleValueChange
          });
        }
        return child;
      })}
    </div>
  );
};

export const SelectTrigger = ({ children, className = "", isOpen, setIsOpen, selectedValue }) => {
  return (
    <button
      type="button"
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={() => setIsOpen(!isOpen)}
    >
      {children}
      <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
};

export const SelectValue = ({ placeholder, selectedValue }) => {
  return (
    <span className={selectedValue ? "" : "text-gray-500"}>
      {selectedValue || placeholder}
    </span>
  );
};

export const SelectContent = ({ children, className = "", isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className={`absolute top-full z-50 w-full rounded-md border bg-white shadow-md ${className}`}>
      {children}
    </div>
  );
};

export const SelectItem = ({ children, value, onValueChange }) => {
  return (
    <div
      className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
      onClick={() => onValueChange(value)}
    >
      {children}
    </div>
  );
};