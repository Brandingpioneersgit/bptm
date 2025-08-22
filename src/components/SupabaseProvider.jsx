import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we're using placeholder credentials
const isPlaceholderConfig = 
  !SUPABASE_URL || 
  !SUPABASE_ANON_KEY || 
  SUPABASE_URL.includes('placeholder') || 
  SUPABASE_ANON_KEY.includes('placeholder');

export const SupabaseContext = React.createContext(null);

export const SupabaseProvider = ({ children }) => {
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localMode, setLocalMode] = useState(false);

  useEffect(() => {
    if (isPlaceholderConfig) {
      console.log("🔧 Running in LOCAL MODE - Supabase credentials not configured");
      setLocalMode(true);
      setSupabaseClient(null); // Will use local storage fallback
      setLoading(false);
    } else if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        setSupabaseClient(client);
        setLoading(false);
      } catch (err) {
        console.error("Supabase connection failed:", err);
        setLocalMode(true);
        setSupabaseClient(null);
        setLoading(false);
      }
    } else {
      setError("Supabase URL and Anon Key are required.");
      setLoading(false);
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 p-4">
        <div>Error: {error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <div>Loading Database Connection...</div>
      </div>
    );
  }

  return (
    <SupabaseContext.Provider value={supabaseClient}>
      {localMode && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-300 text-yellow-800 text-center py-2 text-sm z-50">
          🔧 Running in Local Mode - Data saved to browser storage
        </div>
      )}
      <div className={localMode ? "pt-10" : ""}>
        {children}
      </div>
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = React.useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
