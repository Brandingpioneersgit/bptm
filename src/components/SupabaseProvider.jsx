import React, { createContext, useContext } from 'react';
// Import the centralized Supabase client to avoid multiple instances
import { supabase } from '../shared/lib/supabase';

console.log('📦 SupabaseProvider using centralized client');

const SupabaseContext = createContext(supabase);

export const SupabaseProvider = ({ children }) => {
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return { supabase: context };
};

export default supabase;