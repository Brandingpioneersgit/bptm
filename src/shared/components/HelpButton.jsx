import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import HelpModal from './HelpModal';
import { useTheme } from '../context/ThemeContext';

const HelpButton = () => {
  const { theme } = useTheme();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsHelpOpen(true)}
        className="p-2 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-dark-700 theme-transition shadow-sm"
        title="Help & Support"
        aria-label="Open help and support"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
      
      <HelpModal 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
      />
    </>
  );
};

export default HelpButton;