import React, { useMemo, useEffect, useState } from "react";
import { calculateScopeCompletion, getServiceWeight } from "@/shared/lib/scoring";
import { useSupabase } from "@/components/SupabaseProvider";

export function ClientReportsView({ employee, employeeSubmissions }) {
  const supabase = useSupabase();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedService, setSelectedService] = useState('All');
  const [showScope, setShowScope] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      if (!supabase) return;
      
      try {
        setLoading(true);
        const employeeTeam = employee.department === "Social Media" ? "Marketing" : "Web";
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('team', employeeTeam)
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
  }, [supabase, employee.department]);

  const monthOptions = useMemo(() => {
    const ms = new Set();
    employeeSubmissions.forEach(s => { if (s.monthKey) ms.add(s.monthKey); });
    return Array.from(ms).sort((a,b)=>b.localeCompare(a));
  }, [employeeSubmissions]);

  const serviceOptions = useMemo(() => {
    const sv = new Set();
    employeeSubmissions.forEach(s => (s.clients||[]).forEach(c => (c.services||[]).forEach(x => sv.add(typeof x==='string'? x : x.service))));
    return ['All', ...Array.from(sv).sort()];
  }, [employeeSubmissions]);

  const employeeClientData = useMemo(() => {
    const workedClients = new Map();
    const filteredSubs = selectedMonth==='all' ? employeeSubmissions : employeeSubmissions.filter(s => s.monthKey === selectedMonth);
    filteredSubs.forEach(submission => {
      if (submission.clients) {
        submission.clients.forEach(client => {
          if (!workedClients.has(client.name)) {
            workedClients.set(client.name, {
              name: client.name,
              submissions: [],
              totalKPIs: 0,
              avgScore: 0,
              latestWork: null,
              masterClient: null
            });
          }
          
          const clientData = workedClients.get(client.name);
          clientData.submissions.push({
            ...submission,
            clientData: client
          });
          
          if (!clientData.latestWork || submission.created_at > clientData.latestWork.created_at) {
            clientData.latestWork = submission;
          }
        });
      }
    });

    // Match worked clients with master client list
    clients.forEach(masterClient => {
      const data = workedClients.get(masterClient.name);
      if (data) {
        data.masterClient = masterClient;
      }
    });

    // Calculate aggregated metrics
    workedClients.forEach(data => {
      const kpis = data.submissions.map(s => s?.scores?.kpiScore || 0);
      data.totalKPIs = kpis.reduce((a, b) => a + b, 0);
      data.avgScore = kpis.length ? (kpis.reduce((a, b) => a + b, 0) / kpis.length) : 0;
    });

    let arr = Array.from(workedClients.values());
    if (selectedService !== 'All') {
      arr = arr.filter(c => (c.latestWork?.clients||[]).some(x => x.name===c.name && (x.services||[]).some(s => (typeof s==='string'? s : s.service)===selectedService)));
    }
    return arr.sort((a, b) => b.avgScore - a.avgScore);
  }, [employeeSubmissions, clients, selectedMonth, selectedService]);

  if (loading) {
    return <div className="text-gray-500">Loading client data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Clients You've Worked On</div>
        <div className="flex gap-2 text-sm">
          <select className="border rounded p-2" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}>
            <option value="all">All Months</option>
            {monthOptions.map(m => (<option key={m} value={m}>{m}</option>))}
          </select>
          <select className="border rounded p-2" value={selectedService} onChange={e=>setSelectedService(e.target.value)}>
            {serviceOptions.map(s => (<option key={s}>{s}</option>))}
          </select>
          <button className="border rounded px-2 py-1" onClick={()=>setShowScope(s=>!s)}>
            {showScope ? 'Hide Scope' : 'Show Scope'}
          </button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {employeeClientData.map(client => (
          <div key={client.name} className="border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">{client.name}</div>
              <div className="text-sm text-gray-500">Avg KPI: {client.avgScore.toFixed(1)}</div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Latest work: {client.latestWork ? new Date(client.latestWork.created_at).toLocaleDateString() : '—'}
            </div>
            {/* Scope progress from latest submission's client snapshot if available */}
            {showScope && (() => {
              const latest = client.latestWork;
              const latestClient = latest?.clients?.find(c => c.name === client.name);
              const services = latestClient?.services || [];
              if (!latestClient || services.length === 0) return null;
              return (
                <div className="mt-3">
                  <div className="text-sm font-medium">Service Scope Progress</div>
                  <div className="space-y-2 mt-1">
                    {services.map((s, idx) => {
                      const name = typeof s === 'string' ? s : s.service;
                      const pct = calculateScopeCompletion(latestClient, name, { monthKey: latest?.monthKey }) || 0;
                      const w = getServiceWeight(name);
                      // compute contribution share across services
                      const total = services.reduce((acc, sv) => {
                        const nm = typeof sv === 'string' ? sv : sv.service;
                        const p = calculateScopeCompletion(latestClient, nm, { monthKey: latest?.monthKey }) || 0;
                        const ww = getServiceWeight(nm);
                        return acc + (ww * p);
                      }, 0) || 1;
                      const share = Math.round(((w * pct) / total) * 100);
                      return (
                        <div key={idx} className="text-xs">
                          <div className="flex justify-between mb-0.5"><span className="font-medium">{name} <span className="text-gray-500">(w {w}, {share}% of scope)</span></span><span>{pct}%</span></div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full">
                            <div className={`h-1.5 rounded-full ${pct>=100?'bg-green-500':pct>=60?'bg-yellow-500':'bg-red-500'}`} style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            <div className="mt-3">
              <div className="text-sm font-medium">Submissions</div>
              <ul className="text-sm list-disc pl-5 mt-1">
                {client.submissions.map((s, i) => (
                  <li key={i}>{new Date(s.created_at).toLocaleDateString()} — KPI: {s?.scores?.kpiScore || 0}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
