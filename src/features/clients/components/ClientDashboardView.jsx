import React, { useMemo, useEffect, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { useFetchSubmissions } from "@/components/useFetchSubmissions.js";
import { MultiSelect } from "@/shared/components/ui";
import { calculateScopeCompletion, getServiceWeight } from "@/shared/lib/scoring";

export function ClientDashboardView() {
  const supabase = useSupabase();
  const { allSubmissions } = useFetchSubmissions();
  const [clients, setClients] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('All');
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const serviceOptions = ['SEO', 'GBP SEO', 'Website Maintenance', 'Social Media', 'Google Ads', 'Meta Ads', 'AI'];
  const exportCsv = () => {
    try {
      const targetClients = selectedClient ? clients.filter(c => c.id === selectedClient) : filteredClients;
      const rows = [['Client','Month','KPI Score','Services']];
      targetClients.forEach(c => {
        (allSubmissions||[])
          .filter(s => (s.clients||[]).some(x => x.name === c.name))
          .forEach(s => {
            const sc = s.scores?.kpiScore ?? '';
            const svc = (c.services||[]).map(x => typeof x==='string'? x : x.service).join(';');
            rows.push([c.name, s.monthKey, sc, svc]);
          });
      });
      const csv = rows.map(r => r.map(x => (`${x}`).replace(/"/g,'""')).map(x => /[",\n]/.test(x)?`"${x}"`:x).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `kpi-by-client-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) { console.error('Export failed', e); }
  };

  useEffect(() => {
    const fetchClients = async () => {
      if (!supabase) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setClients(data || []);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClients();
  }, [supabase]);

  const teams = useMemo(() => {
    const uniqueTeams = new Set(['All']);
    clients.forEach(client => uniqueTeams.add(client.team || 'Web'));
    return Array.from(uniqueTeams);
  }, [clients]);

  const filteredClients = useMemo(() => {
    if (selectedTeam === 'All') return clients;
    return clients.filter(client => client.team === selectedTeam);
  }, [clients, selectedTeam]);

  const clientOptions = useMemo(() => 
    filteredClients.map(c => ({ label: c.name, value: c.id })),
    [filteredClients]
  );

  const selectedClientData = useMemo(() => {
    if (!selectedClient) return null;
    const client = clients.find(c => c.id === selectedClient);
    if (!client) return null;

    // Aggregate submission data for this client
    const submissionsForClient = (allSubmissions || []).filter(s => 
      (s.clients || []).some(c => c.name === client.name)
    );
    const latestSubmission = submissionsForClient.length > 0 
      ? submissionsForClient.reduce((latest, current) => 
          current.monthKey > latest.monthKey ? current : latest
        )
      : null;
    return {
      client,
      submissions: submissionsForClient,
      latestMonthKey: latestSubmission?.monthKey || null
    };
  }, [selectedClient, clients, allSubmissions]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select className="border rounded-xl p-2" value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}>
          {teams.map(t => <option key={t}>{t}</option>)}
        </select>
        <div className="min-w-[240px]">
          <MultiSelect 
            options={clientOptions}
            value={selectedClient ? [selectedClient] : []}
            onChange={vals => setSelectedClient(vals[0] || null)}
            placeholder="Select a client"
            single
          />
        </div>
        <button className="border rounded-xl px-3 py-2" onClick={exportCsv}>Export KPI by Client</button>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading clients...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredClients.map(client => (
            <div key={client.id} className="border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">{client.name}</div>
                <button className="rounded-xl px-3 py-2 border" onClick={() => setEditingClient(client)}>Edit</button>
              </div>
              <div className="mt-2 text-sm text-gray-600">Team: {client.team}</div>
              {client.services?.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">Services: {client.services.map(s => s.service).join(', ')}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedClientData && (
        <div className="border rounded-xl p-4 space-y-3">
          <div className="text-lg font-semibold">{selectedClientData.client.name}</div>
          <div className="text-sm text-gray-600">Submissions: {selectedClientData.submissions.length}</div>

          {Array.isArray(selectedClientData.client.services) && selectedClientData.client.services.length > 0 && (
            <div className="mt-2">
              <div className="text-sm font-medium mb-2">Service Scope Progress</div>
              <div className="space-y-2">
                {(() => {
                  const services = selectedClientData.client.services;
                  const total = services.reduce((acc, s) => {
                    const nm = typeof s === 'string' ? s : s.service;
                    const p = calculateScopeCompletion(selectedClientData.client, nm, { monthKey: selectedClientData.latestMonthKey }) || 0;
                    const ww = getServiceWeight(nm);
                    return acc + (ww * p);
                  }, 0) || 1;
                  return services.map((s, idx) => {
                    const name = typeof s === 'string' ? s : s.service;
                    const comp = calculateScopeCompletion(selectedClientData.client, name, { monthKey: selectedClientData.latestMonthKey });
                    const pct = comp == null ? 0 : Math.max(0, Math.min(100, comp));
                    const w = getServiceWeight(name);
                    const share = Math.round(((w * pct) / total) * 100);
                    return (
                      <div key={idx} className="text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{name} <span className="text-gray-500">(w {w}, {share}% of scope)</span></span>
                          <span className="text-gray-600">{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`${pct>=100?'bg-green-500':pct>=60?'bg-yellow-500':'bg-red-500'} h-2 rounded-full`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {editingClient && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 w-full max-w-2xl">
            <div className="flex items-center justify-between">
              <div className="text-lg font-medium">Edit Client</div>
              <button className="text-gray-500" onClick={() => setEditingClient(null)}>✕</button>
            </div>
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-sm">Client Name</label>
                <input className="w-full border rounded-xl p-2" value={editingClient.name} onChange={e => setEditingClient(c => ({ ...c, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm">Team</label>
                <select className="w-full border rounded-xl p-2" value={editingClient.team} onChange={e => setEditingClient(c => ({ ...c, team: e.target.value }))}>
                  <option>Web</option>
                  <option>Marketing</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="rounded-xl px-4 py-2 border" onClick={() => setEditingClient(null)}>Cancel</button>
              <button className="rounded-xl px-4 py-2 bg-blue-600 text-white" onClick={() => setEditingClient(null)}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
