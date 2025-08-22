import React, { useState, useEffect } from 'react';
import { dataPersistence, useDraftPersistence } from '@/shared/services/DataPersistence';

/**
 * Simple test component to verify the data persistence system works
 */
export function DataPersistenceTest() {
  const [testData, setTestData] = useState({
    name: '',
    phone: '',
    monthKey: '2024-11',
    content: '',
    step: 1
  });
  
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [status, setStatus] = useState('Ready');
  const draftPersistence = useDraftPersistence({
    name: testData.name,
    phone: testData.phone,
    monthKey: testData.monthKey,
    model: testData
  });

  // Load existing drafts on mount
  useEffect(() => {
    if (testData.name && testData.phone) {
      const drafts = draftPersistence.getUserDrafts(testData.name, testData.phone);
      setSavedDrafts(drafts);
    }
  }, [testData.name, testData.phone, draftPersistence]);

  const handleSave = () => {
    if (!testData.name || !testData.phone) {
      setStatus('Error: Name and phone required');
      return;
    }

    setStatus('Saving...');
    
    const success = draftPersistence.saveDraft({
      ...testData,
      currentStep: testData.step,
      testField: 'This is a test field',
      timestamp: Date.now()
    }, { forceImmediate: true });

    if (success) {
      setStatus('Saved successfully!');
      // Refresh drafts list
      setTimeout(() => {
        const drafts = draftPersistence.getUserDrafts(testData.name, testData.phone);
        setSavedDrafts(drafts);
      }, 100);
    } else {
      setStatus('Save failed');
    }
  };

  const handleLoad = (draft) => {
    setTestData({
      name: draft.name || draft.employee?.name || '',
      phone: draft.phone || draft.employee?.phone || '',
      monthKey: draft.monthKey || '',
      content: draft.content || '',
      step: draft.currentStep || 1
    });
    setStatus(`Loaded draft from ${new Date(draft.lastSaved).toLocaleString()}`);
  };

  const handleDelete = (draft) => {
    draftPersistence.deleteDraft(
      draft.name || draft.employee?.name,
      draft.phone || draft.employee?.phone,
      draft.monthKey
    );
    
    // Refresh drafts list
    setTimeout(() => {
      const drafts = draftPersistence.getUserDrafts(testData.name, testData.phone);
      setSavedDrafts(drafts);
    }, 100);
    
    setStatus('Draft deleted');
  };

  const handleCleanup = () => {
    dataPersistence.cleanupDrafts();
    setStatus('Cleanup completed');
    
    // Refresh drafts list
    setTimeout(() => {
      const drafts = draftPersistence.getUserDrafts(testData.name, testData.phone);
      setSavedDrafts(drafts);
    }, 100);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Data Persistence Test</h2>
      
      {/* Status */}
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <strong>Status:</strong> {status}
      </div>
      
      {/* Test Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={testData.name}
            onChange={(e) => setTestData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter test name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="text"
            value={testData.phone}
            onChange={(e) => setTestData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter test phone"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Month Key</label>
          <input
            type="text"
            value={testData.monthKey}
            onChange={(e) => setTestData(prev => ({ ...prev, monthKey: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g., 2024-11"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Content</label>
          <textarea
            value={testData.content}
            onChange={(e) => setTestData(prev => ({ ...prev, content: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            rows="3"
            placeholder="Enter test content"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Step</label>
          <select
            value={testData.step}
            onChange={(e) => setTestData(prev => ({ ...prev, step: parseInt(e.target.value) }))}
            className="w-full border rounded px-3 py-2"
          >
            <option value={1}>Step 1</option>
            <option value={2}>Step 2</option>
            <option value={3}>Step 3</option>
            <option value={4}>Step 4</option>
            <option value={5}>Step 5</option>
          </select>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleSave}
          disabled={!testData.name || !testData.phone}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Save Draft
        </button>
        
        <button
          onClick={handleCleanup}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Cleanup Old Drafts
        </button>
      </div>
      
      {/* Saved Drafts List */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Saved Drafts ({savedDrafts.length})</h3>
        
        {savedDrafts.length === 0 ? (
          <p className="text-gray-500 italic">No drafts found</p>
        ) : (
          <div className="space-y-2">
            {savedDrafts.map((draft, index) => (
              <div key={`${draft.draftId}-${draft.version}`} className="border rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <strong>{draft.name || draft.employee?.name}</strong> • {draft.phone || draft.employee?.phone}
                    <div className="text-sm text-gray-600">
                      Month: {draft.monthKey} • Step: {draft.currentStep || 1}
                    </div>
                    <div className="text-xs text-gray-500">
                      Saved: {new Date(draft.lastSaved).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Completion: {draft.completionPercentage || 0}% • Fields: {draft.fieldCount || 0}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoad(draft)}
                      className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDelete(draft)}
                      className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {draft.content && (
                  <div className="text-sm bg-gray-50 p-2 rounded">
                    Content: {draft.content.substring(0, 100)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
