import React, { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from '@/shared/hooks/useToast';

// Audit Logging Context
const AuditLoggingContext = createContext();

// Provider Component
export const AuditProvider = ({ children }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const { toast } = useToast();

  const logUserAction = useCallback((action, details = {}) => {
    const logEntry = {
      id: Date.now(),
      action,
      details,
      timestamp: new Date().toISOString(),
      user: details.user || 'Unknown User'
    };
    
    setAuditLogs(prev => [logEntry, ...prev].slice(0, 1000)); // Keep last 1000 logs
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Audit Log:', logEntry);
    }
  }, []);

  const getAuditLogs = useCallback((filter = {}) => {
    let filteredLogs = auditLogs;
    
    if (filter.action) {
      filteredLogs = filteredLogs.filter(log => 
        log.action.toLowerCase().includes(filter.action.toLowerCase())
      );
    }
    
    if (filter.user) {
      filteredLogs = filteredLogs.filter(log => 
        log.user.toLowerCase().includes(filter.user.toLowerCase())
      );
    }
    
    if (filter.dateFrom) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= new Date(filter.dateFrom)
      );
    }
    
    if (filter.dateTo) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= new Date(filter.dateTo)
      );
    }
    
    return filteredLogs;
  }, [auditLogs]);

  const clearAuditLogs = useCallback(() => {
    setAuditLogs([]);
    toast({
      title: 'Audit logs cleared',
      variant: 'default'
    });
  }, [toast]);

  const value = {
    auditLogs,
    logUserAction,
    getAuditLogs,
    clearAuditLogs
  };

  return (
    <AuditLoggingContext.Provider value={value}>
      {children}
    </AuditLoggingContext.Provider>
  );
};

// Hook to use the context
export const useAuditLogging = () => {
  const context = useContext(AuditLoggingContext);
  if (!context) {
    throw new Error('useAuditLogging must be used within an AuditProvider');
  }
  return context;
};

// Audit Logging Dashboard Component
export const AuditLoggingDashboard = () => {
  const { auditLogs, getAuditLogs, clearAuditLogs } = useAuditLogging();
  const [filter, setFilter] = useState('');
  
  const filteredLogs = getAuditLogs({ action: filter });

  return (
    <div className="card-brand p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-brand-text">Audit Logs</h3>
        <button 
          onClick={clearAuditLogs}
          className="btn-brand-secondary text-sm"
        >
          Clear Logs
        </button>
      </div>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter by action..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <p className="text-brand-text-secondary text-center py-8">
            No audit logs found
          </p>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div key={log.id} className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-brand-text">{log.action}</p>
                    <p className="text-sm text-brand-text-secondary">
                      User: {log.user}
                    </p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="text-xs text-brand-text-secondary mt-1">
                        Details: {JSON.stringify(log.details, null, 2)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-brand-text-secondary">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditProvider;