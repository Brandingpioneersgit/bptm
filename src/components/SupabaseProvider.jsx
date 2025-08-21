import React, { useEffect, useState } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://igwgryykglsetfvomhdj.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_SDqrksN-DTMdHP01p3z6wQ_OlX5bJ3o";

export const SupabaseContext = React.createContext(null);

export const SupabaseProvider = ({ children }) => {
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!window.supabase) {
        console.warn("Supabase CDN failed to load");
        clearInterval(intervalId);
        setError("Supabase failed to load");
        setLoading(false);
      }
    }, 2000);

    const intervalId = setInterval(() => {
      if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        setSupabaseClient(client);
        setLoading(false);
      }
    }, 100);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
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
      {children}
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