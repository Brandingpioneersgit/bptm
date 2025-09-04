import React, { useState, useEffect } from 'react';

export const HeaderBrand = () => {
  const [clickTime, setClickTime] = useState(null);
  const [showTimer, setShowTimer] = useState(false);

  const handleLogoClick = () => {
    const now = new Date();
    setClickTime(now);
    setShowTimer(true);
    
    // Navigate to agency dashboard
    window.location.assign('/');
    
    // Hide timer after 3 seconds
    setTimeout(() => {
      setShowTimer(false);
    }, 3000);
  };

  return (
    <div className="flex items-center gap-3 relative">
      <div 
        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity duration-200"
        onClick={handleLogoClick}
        title="Click to return to Agency Dashboard"
      >
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
      
      {/* Timer Display */}
      {showTimer && clickTime && (
        <div className="absolute top-full left-0 mt-2 bg-blue-600 text-white px-3 py-1 rounded-lg shadow-lg text-sm font-medium z-50">
          Clicked at {clickTime.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

