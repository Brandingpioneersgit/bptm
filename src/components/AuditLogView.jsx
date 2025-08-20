import React, { useEffect, useState } from 'react';
import { useSupabase } from './SupabaseProvider';

export function AuditLogView() {
  const supabase = useSupabase();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data) setLogs(data);
    };
    fetchLogs();
  }, [supabase]);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-xl font-semibold mb-4">Audit Log</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="px-2 py-1">Time</th>
              <th className="px-2 py-1">User</th>
              <th className="px-2 py-1">Action</th>
              <th className="px-2 py-1">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-b">
                <td className="px-2 py-1">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-2 py-1">{log.user_id || 'unknown'}</td>
                <td className="px-2 py-1">{log.action}</td>
                <td className="px-2 py-1">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(log.details)}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
