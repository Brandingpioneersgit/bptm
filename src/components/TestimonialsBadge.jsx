import React, { useState } from 'react';

export function TestimonialsBadge({ testimonials = [] }) {
  const [show, setShow] = useState(false);
  if (!testimonials || testimonials.length === 0) return null;
  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        className="text-yellow-500 text-sm"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        aria-label="Employee testimonials"
      >
        🎬
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
          {testimonials.map((t, idx) => (
            <div key={idx}>
              <a
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-200 hover:text-white"
              >
                {t.client || `Video ${idx + 1}`}
              </a>
            </div>
          ))}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}
