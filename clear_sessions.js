// Clear existing authentication sessions
// Run this in browser console or add to app initialization

if (typeof window !== 'undefined' && window.localStorage) {
  // Clear all auth-related localStorage items
  localStorage.removeItem('unified_auth_session');
  localStorage.removeItem('unified_auth_user');
  localStorage.removeItem('unified_auth_local_user');
  
  console.log('✅ Cleared all authentication sessions');
  console.log('🔄 Please refresh the page to see the login screen');
} else {
  console.log('localStorage not available (running in Node.js environment)');
}

// Export for use in other files
export const clearAuthSessions = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('unified_auth_session');
    localStorage.removeItem('unified_auth_user');
    localStorage.removeItem('unified_auth_local_user');
    return true;
  }
  return false;
};