import { useContext } from 'react';
import AuthContext from './AuthContext';

/**
 * Custom hook to use the AuthContext
 * Separated into its own file for Fast Refresh compatibility
 * Updated to use new simplified AuthContext
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};