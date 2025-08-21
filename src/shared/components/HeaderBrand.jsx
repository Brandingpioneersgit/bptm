import React from 'react';

export const HeaderBrand = () => (
  <div className="flex items-center gap-3">
    <img
      src="https://brandingpioneers.com/assets/logo.png"
      alt="Branding Pioneers"
      className="w-10 h-10 object-contain"
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
      }}
    />
    <div className="w-10 h-10 rounded-full bg-blue-600 text-white items-center justify-center font-bold text-sm hidden">BP</div>
    <div className="font-bold text-gray-800">
      <div className="text-lg">Branding Pioneers</div>
      <div className="text-sm text-gray-600 font-normal hidden sm:block">Monthly Tactical System</div>
    </div>
  </div>
);

