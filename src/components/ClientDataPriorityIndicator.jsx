/**
 * Client Data Priority Indicator Component
 * 
 * Displays information about client data sources and priority system
 * to help users understand which data is being used and why.
 */

import React, { useState, useEffect } from 'react';
import { clientDataPriorityService } from '../services/clientDataPriorityService';

const ClientDataPriorityIndicator = ({ clientName, className = '' }) => {
  const [dataSummary, setDataSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!clientName) {
      setDataSummary(null);
      return;
    }

    const fetchDataSummary = async () => {
      setIsLoading(true);
      try {
        const summary = await clientDataPriorityService.getClientDataSummary(clientName);
        setDataSummary(summary);
      } catch (error) {
        console.error('Failed to fetch client data summary:', error);
        setDataSummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataSummary();
  }, [clientName]);

  if (!clientName || isLoading) {
    return null;
  }

  if (!dataSummary) {
    return (
      <div className={`text-xs text-gray-500 ${className}`}>
        <span className="inline-flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          Employee data
        </span>
      </div>
    );
  }

  const getPriorityColor = (source) => {
    switch (source) {
      case 'client_onboarding':
        return 'bg-green-500';
      case 'master_client':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getPriorityLabel = (source) => {
    switch (source) {
      case 'client_onboarding':
        return 'Client-filled data';
      case 'master_client':
        return 'Master client data';
      default:
        return 'Employee data';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`text-xs ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <div className={`w-2 h-2 ${getPriorityColor(dataSummary.prioritySource)} rounded-full`}></div>
        <span>{getPriorityLabel(dataSummary.prioritySource)}</span>
        {dataSummary.hasClientOnboardingData && (
          <span className="text-green-600 font-medium">✓</span>
        )}
        <svg 
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border text-xs space-y-2">
          <div className="font-medium text-gray-700">Data Source Priority</div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className={dataSummary.hasClientOnboardingData ? 'font-medium text-green-700' : 'text-gray-500'}>
                Client-filled forms {dataSummary.hasClientOnboardingData ? '(Active)' : '(Not available)'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Master client database</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600">Employee submissions</span>
            </div>
          </div>

          {dataSummary.hasClientOnboardingData && (
            <div className="pt-2 border-t border-gray-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Onboarding Date:</span>
                <span className="font-medium">{formatDate(dataSummary.clientOnboardingDate)}</span>
              </div>
              
              {dataSummary.assignedTeam && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Assigned Team:</span>
                  <span className="font-medium">{dataSummary.assignedTeam}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Data Completeness:</span>
                <span className="font-medium">{dataSummary.dataCompleteness}%</span>
              </div>
              
              {dataSummary.submissionStatus && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium capitalize ${
                    dataSummary.submissionStatus === 'submitted' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {dataSummary.submissionStatus}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-gray-200 text-gray-500">
            <div className="text-xs">
              💡 Client-filled data always takes priority over employee-filled data when available.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDataPriorityIndicator;