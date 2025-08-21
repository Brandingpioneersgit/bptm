import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SupabaseContext = React.createContext(null);

export const SupabaseProvider = ({ children }) => {
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      setSupabaseClient(client);
      setLoading(false);
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
