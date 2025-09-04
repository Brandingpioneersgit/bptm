import { useState, useEffect } from 'react';

/**
 * Custom hook for mobile responsiveness utilities
 * Provides breakpoint detection and responsive design helpers
 */
export function useMobileResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const [breakpoint, setBreakpoint] = useState('lg');

  useEffect(() => {
    function handleResize() {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      
      setWindowSize({
        width: newWidth,
        height: newHeight,
      });

      // Set breakpoint based on Tailwind CSS breakpoints
      if (newWidth < 640) {
        setBreakpoint('sm');
      } else if (newWidth < 768) {
        setBreakpoint('md');
      } else if (newWidth < 1024) {
        setBreakpoint('lg');
      } else if (newWidth < 1280) {
        setBreakpoint('xl');
      } else {
        setBreakpoint('2xl');
      }
    }

    // Set initial values
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = breakpoint === 'sm';
  const isTablet = breakpoint === 'md';
  const isDesktop = ['lg', 'xl', '2xl'].includes(breakpoint);
  const isMobileOrTablet = ['sm', 'md'].includes(breakpoint);

  // Responsive grid configurations
  const gridConfig = {
    // Dashboard card grids
    dashboardCards: isMobile 
      ? 'grid-cols-1' 
      : isTablet 
        ? 'grid-cols-2' 
        : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
    
    // Metrics grids  
    metrics: isMobile 
      ? 'grid-cols-1' 
      : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    
    // Stats grids
    stats: isMobile 
      ? 'grid-cols-1' 
      : 'grid-cols-2 md:grid-cols-4',
    
    // Quick actions
    quickActions: isMobile 
      ? 'grid-cols-2' 
      : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6',
  };

  // Responsive spacing
  const spacing = {
    container: isMobile ? 'space-y-4' : 'space-y-6',
    section: isMobile ? 'p-4' : 'p-6',
    gap: isMobile ? 'gap-4' : 'gap-6',
  };

  // Responsive text sizes
  const text = {
    title: isMobile ? 'text-2xl' : 'text-3xl',
    subtitle: isMobile ? 'text-lg' : 'text-xl',
    heading: isMobile ? 'text-lg' : 'text-xl',
  };

  // Mobile-specific utilities
  const mobileUtils = {
    // Hide/show elements based on screen size
    showOnMobile: isMobile ? 'block' : 'hidden',
    hideOnMobile: isMobile ? 'hidden' : 'block',
    showOnDesktop: isDesktop ? 'block' : 'hidden',
    hideOnDesktop: isDesktop ? 'hidden' : 'block',
    
    // Responsive flex direction
    flexDirection: isMobile ? 'flex-col' : 'flex-row',
    
    // Responsive button sizes
    buttonSize: isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2',
    
    // Modal/drawer behavior
    modalPlacement: isMobile ? 'bottom' : 'center',
  };

  return {
    windowSize,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet,
    gridConfig,
    spacing,
    text,
    mobileUtils,
  };
}

export default useMobileResponsive;