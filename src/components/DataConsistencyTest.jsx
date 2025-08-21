/**
 * DataConsistencyTest Component
 * 
 * A developer utility component for testing data consistency
 * across different views and caches in the application.
 */

import React, { useState, useEffect } from 'react';
import { useDataSync } from './DataSyncContext';
import { useClientSync } from './ClientSyncContext';
import { useFetchSubmissions } from './useFetchSubmissions';
import { useSupabase } from './SupabaseProvider';

export const DataConsistencyTest = ({ isVisible = false }) => {
  const supabase = useSupabase();
  const dataSync = useDataSync();
  const clientSync = useClientSync();
  const fetchSubmissions = useFetchSubmissions();
  
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  const runConsistencyTest = async () => {
    if (!supabase || isRunning) return;
    
    setIsRunning(true);
    const results = {};

    try {
      console.log('🧪 Running data consistency test...');

      // Test 1: Compare submission counts
      const directSubmissions = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true });
      
      results.submissions = {
        database: directSubmissions.count,
        dataSync: dataSync.submissions.length,
        fetchHook: fetchSubmissions.allSubmissions.length,
        consistent: directSubmissions.count === dataSync.submissions.length &&
                   directSubmissions.count === fetchSubmissions.allSubmissions.length
      };

      // Test 2: Compare client counts
      const directClients = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      results.clients = {
        database: directClients.count,
        dataSync: dataSync.clients.length,
        clientSync: clientSync.allClients.length,
        consistent: directClients.count === dataSync.clients.length &&
                   directClients.count === clientSync.allClients.length
      };

      // Test 3: Check data freshness
      const now = Date.now();
      results.freshness = {
        dataSyncLastRefresh: dataSync.lastRefresh.submissions ? 
          Math.floor((now - dataSync.lastRefresh.submissions) / 1000) : 'Never',
        clientSyncLastRefresh: clientSync.lastRefresh ? 
          Math.floor((now - clientSync.lastRefresh) / 1000) : 'Never',
        acceptable: (now - dataSync.lastRefresh.submissions) < 60000 // Less than 1 minute
      };

      // Test 4: Check for data conflicts
      results.conflicts = {
        duplicateSubmissions: findDuplicateSubmissions(dataSync.submissions),
        duplicateClients: findDuplicateClients(dataSync.clients),
        hasConflicts: false
      };
      results.conflicts.hasConflicts = results.conflicts.duplicateSubmissions.length > 0 ||
                                      results.conflicts.duplicateClients.length > 0;

      console.log('✅ Data consistency test completed:', results);
      
    } catch (error) {
      console.error('❌ Data consistency test failed:', error);
      results.error = error.message;
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const findDuplicateSubmissions = (submissions) => {
    const seen = new Set();
    const duplicates = [];
    
    submissions.forEach(sub => {
      const key = `${sub.employee?.name}-${sub.employee?.phone}-${sub.monthKey}`;
      if (seen.has(key)) {
        duplicates.push(key);
      }
      seen.add(key);
    });
    
    return duplicates;
  };

  const findDuplicateClients = (clients) => {
    const seen = new Set();
    const duplicates = [];
    
    clients.forEach(client => {
      const key = client.name.toLowerCase().trim();
      if (seen.has(key)) {
        duplicates.push(client.name);
      }
      seen.add(key);
    });
    
    return duplicates;
  };

  const getStatusColor = (isGood) => {
    return isGood ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (isGood) => {
    return isGood ? '✅' : '❌';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Data Consistency Test</h3>
        <button
          onClick={runConsistencyTest}
          disabled={isRunning}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isRunning ? 'Testing...' : 'Run Test'}
        </button>
      </div>

      {Object.keys(testResults).length > 0 && (
        <div className="space-y-2 text-xs">
          {testResults.submissions && (
            <div>
              <div className="font-medium">Submissions:</div>
              <div className={getStatusColor(testResults.submissions.consistent)}>
                {getStatusIcon(testResults.submissions.consistent)} 
                DB: {testResults.submissions.database}, 
                Sync: {testResults.submissions.dataSync}, 
                Hook: {testResults.submissions.fetchHook}
              </div>
            </div>
          )}

          {testResults.clients && (
            <div>
              <div className="font-medium">Clients:</div>
              <div className={getStatusColor(testResults.clients.consistent)}>
                {getStatusIcon(testResults.clients.consistent)} 
                DB: {testResults.clients.database}, 
                DataSync: {testResults.clients.dataSync}, 
                ClientSync: {testResults.clients.clientSync}
              </div>
            </div>
          )}

          {testResults.freshness && (
            <div>
              <div className="font-medium">Data Freshness:</div>
              <div className={getStatusColor(testResults.freshness.acceptable)}>
                {getStatusIcon(testResults.freshness.acceptable)} 
                Last refresh: {testResults.freshness.dataSyncLastRefresh}s ago
              </div>
            </div>
          )}

          {testResults.conflicts && (
            <div>
              <div className="font-medium">Conflicts:</div>
              <div className={getStatusColor(!testResults.conflicts.hasConflicts)}>
                {getStatusIcon(!testResults.conflicts.hasConflicts)} 
                Dupe submissions: {testResults.conflicts.duplicateSubmissions.length}, 
                Dupe clients: {testResults.conflicts.duplicateClients.length}
              </div>
            </div>
          )}

          {testResults.error && (
            <div className="text-red-600">
              ❌ Error: {testResults.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataConsistencyTest;