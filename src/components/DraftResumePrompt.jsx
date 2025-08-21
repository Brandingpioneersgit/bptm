import React, { useState, useEffect } from 'react';
import { monthLabel } from './constants';
import { dataPersistence } from './DataPersistence';

/**
 * Draft Resume Prompt Component
 * 
 * Detects and prompts users to resume partially completed forms
 * Handles crash recovery and provides draft management options
 */

export function DraftResumePrompt({ 
  currentUser, 
  onResumeDraft, 
  onStartFresh, 
  onDismiss,
  isVisible = false 
}) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isVisible && currentUser?.name && currentUser?.phone) {
      loadUserDrafts();
    }
  }, [isVisible, currentUser]);

  const loadUserDrafts = async () => {
    try {
      setLoading(true);
      
      // Get all drafts for this user
      const userDrafts = dataPersistence.getUserDrafts(currentUser.name, currentUser.phone);
      
      // Filter to only significant drafts
      const significantDrafts = userDrafts.filter(draft => {
        const age = Date.now() - draft.lastSaved;
        const isRecent = age < 7 * 24 * 60 * 60 * 1000; // Last 7 days
        const hasContent = draft.completionPercentage > 5 || draft.currentStep > 1;
        return isRecent && hasContent;
      });

      // Sort by last saved (most recent first)
      significantDrafts.sort((a, b) => b.lastSaved - a.lastSaved);
      
      setDrafts(significantDrafts);
      
      // Auto-select the most recent draft
      if (significantDrafts.length > 0) {
        setSelectedDraft(significantDrafts[0]);
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeDraft = () => {
    if (selectedDraft && onResumeDraft) {
      onResumeDraft(selectedDraft);
    }
  };

  const handleDeleteDraft = (draft) => {
    try {
      dataPersistence.deleteDraft(
        draft.name || draft.employee?.name,
        draft.phone || draft.employee?.phone,
        draft.monthKey
      );
      
      // Reload drafts
      loadUserDrafts();
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  const getDraftStatusColor = (draft) => {
    const completion = draft.completionPercentage || 0;
    if (completion >= 75) return 'text-green-600';
    if (completion >= 40) return 'text-blue-600';
    if (completion >= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDraftStatusText = (draft) => {
    const completion = draft.completionPercentage || 0;
    if (completion >= 75) return 'Nearly Complete';
    if (completion >= 40) return 'Good Progress';
    if (completion >= 15) return 'Started';
    return 'Just Begun';
  };

  if (!isVisible || loading) {
    return null;
  }

  if (drafts.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <h2 className="text-xl font-bold text-white">Welcome Back!</h2>
                <p className="text-blue-100 text-sm">We found your previous work</p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="text-white/80 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              You have <strong>{drafts.length}</strong> partially completed form{drafts.length !== 1 ? 's' : ''}.
              Would you like to continue where you left off?
            </p>
          </div>

          {/* Draft Selection */}
          <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
            {drafts.map((draft, index) => (
              <div
                key={`${draft.draftId}-${draft.version}`}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedDraft?.draftId === draft.draftId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedDraft(draft)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Draft header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        {monthLabel(draft.monthKey)} Report
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          selectedDraft?.draftId === draft.draftId
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {getDraftStatusText(draft)}
                        </span>
                        
                        <span className={`text-xs font-medium ${getDraftStatusColor(draft)}`}>
                          {draft.completionPercentage || 0}% complete
                        </span>
                      </div>
                    </div>

                    {/* Draft details */}
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-4">
                        <span>📅 Last saved: {formatTimeAgo(draft.lastSaved)}</span>
                        <span>📄 Step: {draft.currentStep || 1}</span>
                        <span>📝 Fields: {draft.fieldCount || 0}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(draft.completionPercentage || 0, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Radio button */}
                  <div className="ml-4 flex items-center">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedDraft?.draftId === draft.draftId
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedDraft?.draftId === draft.draftId && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDraft(draft);
                    }}
                    className="text-xs text-red-600 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded"
                  >
                    Delete Draft
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Selected draft details */}
          {selectedDraft && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Selected Draft Details</h4>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {showDetails ? 'Hide' : 'Show'} Details
                </button>
              </div>
              
              {showDetails && (
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Draft ID: {selectedDraft.draftId}</div>
                  <div>Version: {selectedDraft.version}</div>
                  <div>Session: {selectedDraft.sessionId}</div>
                  <div>Created: {new Date(selectedDraft.lastSaved).toLocaleString()}</div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleResumeDraft}
              disabled={!selectedDraft}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              📝 Continue Selected Draft
            </button>
            
            <button
              onClick={onStartFresh}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              🆕 Start Fresh
            </button>
            
            <button
              onClick={onDismiss}
              className="sm:w-auto px-6 py-3 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Maybe Later
            </button>
          </div>

          {/* Help text */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            💡 Your drafts are automatically saved as you type and will be available for 7 days
          </div>
        </div>
      </div>
    </div>
  );
}

// Crash recovery prompt component
export function CrashRecoveryPrompt({ onRecover, onDismiss }) {
  const [crashedDrafts, setCrashedDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCrashedDrafts();
  }, []);

  const loadCrashedDrafts = () => {
    try {
      const crashed = dataPersistence.checkCrashedSessions();
      setCrashedDrafts(crashed);
    } catch (error) {
      console.error('Error loading crashed drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || crashedDrafts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <div className="flex items-start gap-3">
        <span className="text-xl">🚨</span>
        <div className="flex-1">
          <h3 className="font-medium text-yellow-800 mb-1">Crash Detected</h3>
          <p className="text-sm text-yellow-700 mb-3">
            We found {crashedDrafts.length} unsaved form{crashedDrafts.length !== 1 ? 's' : ''} from your previous session.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onRecover(crashedDrafts[0])}
              className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
            >
              Recover
            </button>
            <button
              onClick={onDismiss}
              className="text-xs text-yellow-600 hover:text-yellow-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}