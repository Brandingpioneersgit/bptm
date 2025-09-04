import React from 'react';

export const Separator = ({ orientation = 'horizontal', className = '' }) => {
  return (
    <div
      className={`bg-gray-200 ${
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'w-[1px] h-full'
      } ${className}`}
    />
  );
};