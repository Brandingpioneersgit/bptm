import { useState, useCallback, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';

export function useFetchSubmissions() {
  const supabase = useSupabase();
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubmissions = useCallback(async () => {
    if (!supabase) {
      // Running in local mode - load from localStorage
      setLoading(true);
      try {
        const localData = localStorage.getItem('codex_submissions') || '[]';
        const submissions = JSON.parse(localData);
        setAllSubmissions(submissions);
        setError(null);
      } catch (err) {
        console.error('Error loading local submissions:', err);
        setAllSubmissions([]);
        setError(null); // Don't show error for empty local storage
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
        
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);
        
        if (error) throw error;

        setAllSubmissions(data || []);
        setError(null);
        break; // Success, exit retry loop
        
      } catch (e) {
        retryCount++;
        console.error(`Failed to load submissions (attempt ${retryCount}/${maxRetries}):`, e);
        
        if (e.name === 'AbortError') {
          console.error('Database query timeout');
        }
        
        if (retryCount >= maxRetries) {
          setError(`Failed to load data after ${maxRetries} attempts. Please check your connection and try refreshing the page.`);
          setAllSubmissions([]);
        } else {
          // Wait before retrying with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }
    
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return { allSubmissions, loading, error, refreshSubmissions: fetchSubmissions };
}