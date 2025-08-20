import React, { useMemo, useEffect, useState } from "react";
import { useSupabase } from "./SupabaseProvider";

export function ClientReportsView({ employee, employeeSubmissions }) {
  const supabase = useSupabase();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const employeeClientData = useMemo(() => {
    const workedClients = new Map();
    
    employeeSubmissions.forEach(submission => {
      if (submission.payload?.clients) {
        submission.payload.clients.forEach(client => {
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

    Array.from(workedClients.values()).forEach(clientData => {
      const masterClient = clients.find(c => c.name === clientData.name);
      clientData.masterClient = masterClient;
      
      clientData.totalKPIs = clientData.submissions.length;
      if (clientData.totalKPIs > 0) {
        const totalScore = clientData.submissions.reduce((sum, sub) => sum + (sub.scores?.kpiScore || 0), 0);
        clientData.avgScore = (totalScore / clientData.totalKPIs).toFixed(1);
      }
    });

    return Array.from(workedClients.values()).sort((a, b) => 
      new Date(b.latestWork?.created_at || 0) - new Date(a.latestWork?.created_at || 0)
    );
  }, [employeeSubmissions, clients]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
          📊 My Client Reports & Progress
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (employeeClientData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
          📊 My Client Reports & Progress
        </h3>
        <div className="text-center py-6 sm:py-8">
          <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🎯</div>
          <p className="text-sm sm:text-base text-gray-600 px-4">No client work reported yet. Add client KPIs in your submissions to track progress here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
        📊 My Client Reports & Progress
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {employeeClientData.map((clientData, index) => (
          <div key={clientData.name} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm sm:text-base">{clientData.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {clientData.masterClient && (
                    <>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        clientData.masterClient.client_type === 'Enterprise' 
                          ? 'bg-purple-100 text-purple-800'
                          : clientData.masterClient.client_type === 'Premium'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {clientData.masterClient.client_type}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        clientData.masterClient.team === 'Web' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {clientData.masterClient.team}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-blue-600">{clientData.avgScore}/10</div>
                <div className="text-xs text-gray-500">Avg Score</div>
              </div>
            </div>

            {clientData.masterClient?.scope_of_work && (
              <div className="mb-3">
                <p className="text-xs text-gray-600 line-clamp-2" title={clientData.masterClient.scope_of_work}>
                  {clientData.masterClient.scope_of_work}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div>
                <span className="text-gray-500">Total Reports:</span>
                <div className="font-medium">{clientData.totalKPIs}</div>
              </div>
              <div>
                <span className="text-gray-500">Latest Work:</span>
                <div className="font-medium text-xs">
                  {clientData.latestWork 
                    ? new Date(clientData.latestWork.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'N/A'
                  }
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs text-gray-500">Recent Activity:</span>
              <div className="mt-1 space-y-1">
                {clientData.submissions.slice(0, 3).map((submission, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span>{submission.month_key}</span>
                    <span>•</span>
                    <span>KPI: {submission.scores?.kpiScore || 'N/A'}/10</span>
                  </div>
                ))}
              </div>
            </div>

            {clientData.submissions.length >= 2 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {(() => {
                    const latest = clientData.submissions[0].scores?.kpiScore || 0;
                    const previous = clientData.submissions[1].scores?.kpiScore || 0;
                    const trend = latest - previous;
                    
                    return trend > 0 ? (
                      <>
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-green-600">+{trend.toFixed(1)} improvement</span>
                      </>
                    ) : trend < 0 ? (
                      <>
                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-red-600">{trend.toFixed(1)} decline</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-gray-600">No change</span>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}