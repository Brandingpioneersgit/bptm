import React, { useState, useEffect } from 'react';

export function DraftResumePrompt({ onResume, onDiscard, draftData, isVisible = true }) {
  if (!isVisible || !draftData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Resume Draft Found</h3>
            <p className="text-sm text-gray-600">You have unsaved changes from a previous session</p>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-2">Would you like to:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Resume editing your draft</li>
            <li>• Start fresh and discard the draft</li>
          </ul>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onResume}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Resume Draft
          </button>
          <button
            onClick={onDiscard}
            className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}

export function CrashRecoveryPrompt({ onRecover, onDiscard, recoveryData, isVisible = true }) {
  if (!isVisible || !recoveryData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recovery Data Found</h3>
            <p className="text-sm text-gray-600">We found data from an unexpected session end</p>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-2">We detected that your previous session ended unexpectedly.</p>
          <p className="text-sm text-gray-600">Would you like to recover your unsaved work?</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onRecover}
            className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            Recover Data
          </button>
          <button
            onClick={onDiscard}
            className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for managing draft state
export function useDraftManager(key = 'formDraft') {
  const [draftData, setDraftData] = useState(null);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);

  useEffect(() => {
    // Check for existing draft on mount
    const savedDraft = localStorage.getItem(key);
    const crashRecovery = sessionStorage.getItem(`${key}_recovery`);
    
    if (crashRecovery) {
      try {
        const recoveryData = JSON.parse(crashRecovery);
        setDraftData(recoveryData);
        setShowRecoveryPrompt(true);
      } catch (e) {
        sessionStorage.removeItem(`${key}_recovery`);
      }
    } else if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setDraftData(draft);
        setShowDraftPrompt(true);
      } catch (e) {
        localStorage.removeItem(key);
      }
    }
  }, [key]);

  const saveDraft = (data) => {
    localStorage.setItem(key, JSON.stringify(data));
    sessionStorage.setItem(`${key}_recovery`, JSON.stringify(data));
  };

  const clearDraft = () => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(`${key}_recovery`);
    setDraftData(null);
  };

  const resumeDraft = () => {
    setShowDraftPrompt(false);
    setShowRecoveryPrompt(false);
    return draftData;
  };

  const discardDraft = () => {
    clearDraft();
    setShowDraftPrompt(false);
    setShowRecoveryPrompt(false);
  };

  return {
    draftData,
    showDraftPrompt,
    showRecoveryPrompt,
    saveDraft,
    clearDraft,
    resumeDraft,
    discardDraft
  };
}