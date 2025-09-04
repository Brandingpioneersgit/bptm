import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const DatabaseErrorHandler = ({ onBack }) => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [missingTables, setMissingTables] = useState([]);
  const [testResults, setTestResults] = useState({});

  const requiredTables = [
    'employees',
    'clients', 
    'unified_users',
    'submissions',
    'monthly_kpi_reports',
    'employee_performance',
    'client_onboarding'
  ];

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    setConnectionStatus('checking');
    const results = {};
    const missing = [];

    try {
      // Test basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);

      if (connectionError) {
        setConnectionStatus('error');
        results.connection = { status: 'error', error: connectionError.message };
        setTestResults(results);
        return;
      }

      results.connection = { status: 'success' };

      // Check each required table
      for (const table of requiredTables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

          if (error) {
            missing.push(table);
            results[table] = { status: 'missing', error: error.message };
          } else {
            results[table] = { status: 'exists', count: data?.length || 0 };
          }
        } catch (err) {
          missing.push(table);
          results[table] = { status: 'error', error: err.message };
        }
      }

      setMissingTables(missing);
      setConnectionStatus(missing.length > 0 ? 'incomplete' : 'success');
      setTestResults(results);

    } catch (error) {
      setConnectionStatus('error');
      results.general = { status: 'error', error: error.message };
      setTestResults(results);
    }
  };

  const copySetupScript = () => {
    const setupScript = `-- Run this in your Supabase SQL Editor
-- Complete Database Setup for BPTM Application

BEGIN;

-- Create update function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create employees table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  department VARCHAR(100) NOT NULL,
  role TEXT[] DEFAULT '{}',
  employee_type VARCHAR(50) DEFAULT 'Full-time',
  work_location VARCHAR(50) DEFAULT 'Office',
  status VARCHAR(20) DEFAULT 'Active',
  hire_date DATE,
  date_of_birth DATE,
  direct_manager VARCHAR(255),
  performance_rating DECIMAL(3,1),
  appraisal_date DATE,
  profile_image_url TEXT,
  address JSONB DEFAULT '{}',
  emergency_contact JSONB DEFAULT '{}',
  onboarding_data JSONB DEFAULT '{}',
  personal_info JSONB DEFAULT '{}',
  contact_info JSONB DEFAULT '{}',
  professional_info JSONB DEFAULT '{}',
  financial_info JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, phone)
);

-- Create other required tables...
-- (Copy the full script from setup_complete_database.sql)

COMMIT;`;

    navigator.clipboard.writeText(setupScript).then(() => {
      toast.success('Setup script copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy script');
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
      case 'exists':
        return <span className="text-green-500">✓</span>;
      case 'missing':
      case 'error':
        return <span className="text-red-500">✗</span>;
      case 'checking':
        return <span className="text-yellow-500">⟳</span>;
      default:
        return <span className="text-gray-500">?</span>;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'incomplete':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Database Status & Setup</h1>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </button>
        )}
      </div>

      {/* Overall Status */}
      <div className={`rounded-lg border p-6 mb-6 ${getStatusColor(connectionStatus)}`}>
        <div className="flex items-center gap-3 mb-4">
          {getStatusIcon(connectionStatus)}
          <h2 className="text-xl font-semibold">
            Database Status: {connectionStatus === 'checking' ? 'Checking...' : 
                             connectionStatus === 'success' ? 'All Good!' :
                             connectionStatus === 'incomplete' ? 'Setup Required' : 'Connection Error'}
          </h2>
        </div>
        
        {connectionStatus === 'success' && (
          <p className="text-green-700">All required tables are present and accessible.</p>
        )}
        
        {connectionStatus === 'incomplete' && (
          <div className="text-yellow-700">
            <p className="mb-2">Missing {missingTables.length} required table(s): {missingTables.join(', ')}</p>
            <p>Please run the database setup script to create missing tables.</p>
          </div>
        )}
        
        {connectionStatus === 'error' && (
          <p className="text-red-700">Unable to connect to the database. Please check your Supabase configuration.</p>
        )}
      </div>

      {/* Detailed Table Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Table Status Details</h3>
        <div className="space-y-2">
          {requiredTables.map(table => {
            const result = testResults[table];
            return (
              <div key={table} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result?.status || 'checking')}
                  <span className="font-medium">{table}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {result?.status === 'exists' && `✓ Available`}
                  {result?.status === 'missing' && `✗ Missing`}
                  {result?.status === 'error' && `✗ Error`}
                  {!result && 'Checking...'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Setup Instructions</h3>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Quick Setup</h4>
            <ol className="list-decimal list-inside space-y-2 text-blue-700">
              <li>Open your Supabase project dashboard</li>
              <li>Go to the SQL Editor</li>
              <li>Copy and paste the complete setup script</li>
              <li>Click "Run" to execute the script</li>
              <li>Refresh this page to verify setup</li>
            </ol>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={copySetupScript}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Copy Setup Script
            </button>
            
            <button
              onClick={checkDatabaseStatus}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Recheck Status
            </button>
            
            <a
              href="/setup_complete_database.sql"
              download
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Download Full Script
            </a>
          </div>
        </div>
      </div>

      {/* Error Details */}
      {Object.keys(testResults).length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Technical Details</h3>
          <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-700">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseErrorHandler;