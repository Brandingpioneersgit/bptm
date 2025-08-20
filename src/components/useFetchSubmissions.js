import { useState, useCallback, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';

export function useFetchSubmissions() {
  const supabase = useSupabase();
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubmissions = useCallback(async () => {
    if (!supabase) return;

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*');

      if (error) throw error;

      setAllSubmissions(data || []);
    } catch (e) {
      console.error("Failed to load submissions from Supabase:", e);
      setError("Failed to load data from the database. Please check your connection and the table setup.");
      setAllSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return { allSubmissions, loading, error, refreshSubmissions: fetchSubmissions };
}