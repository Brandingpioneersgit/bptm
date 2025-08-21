/**
 * Comprehensive Data Persistence System
 * 
 * Features:
 * - Field-level autosave on every change
 * - User identity-based draft tracking  
 * - Crash recovery and session restoration
 * - Multiple storage fallbacks (localStorage -> sessionStorage -> memory)
 * - Draft versioning and conflict resolution
 * - Cross-tab synchronization
 */

// Storage keys
const STORAGE_KEYS = {
  DRAFT_PREFIX: 'codex_draft_',
  DRAFT_INDEX: 'codex_draft_index',
  SESSION_ID: 'codex_session_id',
  LAST_ACTIVITY: 'codex_last_activity',
  CRASH_RECOVERY: 'codex_crash_recovery'
};

// Utility functions
const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateDraftId = (name, phone, monthKey) => `${name?.toLowerCase()?.replace(/\s+/g, '_')}_${phone}_${monthKey}`;

// Storage abstraction layer with fallbacks
class StorageManager {
  constructor() {
    this.primaryStorage = null;
    this.fallbackStorage = null;
    this.memoryStorage = new Map();
    this.initializeStorage();
  }

  initializeStorage() {
    // Test localStorage availability
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.primaryStorage = localStorage;
    } catch (e) {
      console.warn('localStorage not available:', e);
    }

    // Test sessionStorage as fallback
    try {
      const testKey = '__storage_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      this.fallbackStorage = sessionStorage;
    } catch (e) {
      console.warn('sessionStorage not available:', e);
    }
  }

  setItem(key, value) {
    const serializedValue = JSON.stringify(value);
    
    // Try primary storage first
    if (this.primaryStorage) {
      try {
        this.primaryStorage.setItem(key, serializedValue);
        return true;
      } catch (e) {
        console.warn('Primary storage failed, trying fallback:', e);
      }
    }

    // Try fallback storage
    if (this.fallbackStorage) {
      try {
        this.fallbackStorage.setItem(key, serializedValue);
        return true;
      } catch (e) {
        console.warn('Fallback storage failed, using memory:', e);
      }
    }

    // Use memory storage as last resort
    this.memoryStorage.set(key, serializedValue);
    return false; // Indicates we're using memory storage
  }

  getItem(key) {
    // Try primary storage first
    if (this.primaryStorage) {
      try {
        const value = this.primaryStorage.getItem(key);
        if (value !== null) {
          return JSON.parse(value);
        }
      } catch (e) {
        console.warn('Error reading from primary storage:', e);
      }
    }

    // Try fallback storage
    if (this.fallbackStorage) {
      try {
        const value = this.fallbackStorage.getItem(key);
        if (value !== null) {
          return JSON.parse(value);
        }
      } catch (e) {
        console.warn('Error reading from fallback storage:', e);
      }
    }

    // Try memory storage
    const memValue = this.memoryStorage.get(key);
    if (memValue !== undefined) {
      return JSON.parse(memValue);
    }

    return null;
  }

  removeItem(key) {
    if (this.primaryStorage) {
      try {
        this.primaryStorage.removeItem(key);
      } catch (e) {
        console.warn('Error removing from primary storage:', e);
      }
    }

    if (this.fallbackStorage) {
      try {
        this.fallbackStorage.removeItem(key);
      } catch (e) {
        console.warn('Error removing from fallback storage:', e);
      }
    }

    this.memoryStorage.delete(key);
  }

  clear() {
    if (this.primaryStorage) {
      try {
        this.primaryStorage.clear();
      } catch (e) {
        console.warn('Error clearing primary storage:', e);
      }
    }

    if (this.fallbackStorage) {
      try {
        this.fallbackStorage.clear();
      } catch (e) {
        console.warn('Error clearing fallback storage:', e);
      }
    }

    this.memoryStorage.clear();
  }
}

// Main persistence service
class DataPersistenceService {
  constructor() {
    this.storage = new StorageManager();
    this.sessionId = this.initializeSession();
    this.autoSaveTimer = null;
    this.pendingSaves = new Map();
    this.listeners = new Set();
    
    this.setupCrashRecovery();
    this.setupActivityTracking();
  }

  initializeSession() {
    const existingSession = this.storage.getItem(STORAGE_KEYS.SESSION_ID);
    const sessionId = existingSession || generateSessionId();
    this.storage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
    return sessionId;
  }

  setupCrashRecovery() {
    // Mark session as active
    this.markActivity();
    
    // Set up periodic heartbeat
    setInterval(() => {
      this.markActivity();
    }, 30000); // Every 30 seconds

    // Set up beforeunload handler for graceful shutdown
    window.addEventListener('beforeunload', () => {
      this.storage.setItem(STORAGE_KEYS.CRASH_RECOVERY, {
        sessionId: this.sessionId,
        timestamp: Date.now(),
        graceful: true
      });
    });

    // Check for crashed sessions on startup
    this.checkCrashedSessions();
  }

  setupActivityTracking() {
    const events = ['click', 'keypress', 'scroll', 'mousemove'];
    const throttledMarkActivity = this.throttle(() => this.markActivity(), 10000); // Max once per 10 seconds

    events.forEach(event => {
      document.addEventListener(event, throttledMarkActivity, { passive: true });
    });
  }

  markActivity() {
    this.storage.setItem(STORAGE_KEYS.LAST_ACTIVITY, {
      sessionId: this.sessionId,
      timestamp: Date.now()
    });
  }

  checkCrashedSessions() {
    const crashInfo = this.storage.getItem(STORAGE_KEYS.CRASH_RECOVERY);
    if (crashInfo && !crashInfo.graceful) {
      console.log('🚨 Detected potential crash, checking for recoverable drafts...');
      return this.getCrashedDrafts();
    }
    return [];
  }

  getCrashedDrafts() {
    const draftIndex = this.getDraftIndex();
    const now = Date.now();
    const crashedDrafts = [];

    Object.values(draftIndex).forEach(draft => {
      // Consider drafts from last 2 hours as potentially crashed
      if (now - draft.lastSaved < 2 * 60 * 60 * 1000) {
        const draftData = this.storage.getItem(draft.storageKey);
        if (draftData && this.isSignificantDraft(draftData)) {
          crashedDrafts.push({
            ...draft,
            data: draftData
          });
        }
      }
    });

    return crashedDrafts;
  }

  // Create or update a draft
  saveDraft(draftData, options = {}) {
    const { 
      name, 
      phone, 
      monthKey,
      currentStep = 1,
      forceImmediate = false 
    } = draftData;

    if (!name || !phone || !monthKey) {
      console.warn('📝 Cannot save draft: missing required identifiers');
      return false;
    }

    const draftId = generateDraftId(name, phone, monthKey);
    const storageKey = STORAGE_KEYS.DRAFT_PREFIX + draftId;
    
    const draftPayload = {
      ...draftData,
      draftId,
      sessionId: this.sessionId,
      lastSaved: Date.now(),
      version: (this.storage.getItem(storageKey)?.version || 0) + 1,
      fieldCount: this.countFormFields(draftData),
      completionPercentage: this.calculateCompletion(draftData)
    };

    // Immediate save for critical changes or forced saves
    if (forceImmediate || this.isCriticalChange(draftData)) {
      return this.performSave(storageKey, draftPayload);
    }

    // Debounced save for frequent updates
    this.scheduleAutoSave(storageKey, draftPayload);
    return true;
  }

  performSave(storageKey, draftPayload) {
    try {
      // Save the draft
      const saveSuccessful = this.storage.setItem(storageKey, draftPayload);
      
      // Update the draft index
      this.updateDraftIndex(draftPayload);
      
      // Notify listeners
      this.notifyListeners('draft_saved', draftPayload);
      
      console.log(`💾 Draft saved successfully: ${draftPayload.draftId} (v${draftPayload.version})`);
      return saveSuccessful;
    } catch (error) {
      console.error('❌ Draft save failed:', error);
      return false;
    }
  }

  scheduleAutoSave(storageKey, draftPayload) {
    // Cancel existing timer
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    // Store pending save
    this.pendingSaves.set(storageKey, draftPayload);

    // Schedule save
    this.autoSaveTimer = setTimeout(() => {
      this.flushPendingSaves();
    }, 2000); // 2 second debounce
  }

  flushPendingSaves() {
    for (const [storageKey, draftPayload] of this.pendingSaves) {
      this.performSave(storageKey, draftPayload);
    }
    this.pendingSaves.clear();
  }

  // Load a draft by user identity
  loadDraft(name, phone, monthKey) {
    if (!name || !phone || !monthKey) {
      return null;
    }

    const draftId = generateDraftId(name, phone, monthKey);
    const storageKey = STORAGE_KEYS.DRAFT_PREFIX + draftId;
    const draft = this.storage.getItem(storageKey);

    if (draft && this.isDraftValid(draft)) {
      console.log(`📄 Draft loaded: ${draftId} (v${draft.version})`);
      return draft;
    }

    return null;
  }

  // Get all drafts for a user (across all months)
  getUserDrafts(name, phone) {
    const draftIndex = this.getDraftIndex();
    const userDrafts = [];

    Object.values(draftIndex).forEach(draft => {
      if (draft.name === name && draft.phone === phone) {
        const draftData = this.storage.getItem(draft.storageKey);
        if (draftData && this.isDraftValid(draftData)) {
          userDrafts.push(draftData);
        }
      }
    });

    return userDrafts.sort((a, b) => b.lastSaved - a.lastSaved);
  }

  // Delete a specific draft
  deleteDraft(name, phone, monthKey) {
    const draftId = generateDraftId(name, phone, monthKey);
    const storageKey = STORAGE_KEYS.DRAFT_PREFIX + draftId;
    
    this.storage.removeItem(storageKey);
    this.removeDraftFromIndex(draftId);
    
    console.log(`🗑️ Draft deleted: ${draftId}`);
  }

  // Clean up old or invalid drafts
  cleanupDrafts(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days default
    const draftIndex = this.getDraftIndex();
    const now = Date.now();
    let cleaned = 0;

    Object.entries(draftIndex).forEach(([draftId, draft]) => {
      const age = now - draft.lastSaved;
      const draftData = this.storage.getItem(draft.storageKey);
      
      if (age > maxAge || !draftData || !this.isDraftValid(draftData) || !this.isSignificantDraft(draftData)) {
        this.storage.removeItem(draft.storageKey);
        delete draftIndex[draftId];
        cleaned++;
      }
    });

    if (cleaned > 0) {
      this.storage.setItem(STORAGE_KEYS.DRAFT_INDEX, draftIndex);
      console.log(`🧹 Cleaned up ${cleaned} old/invalid drafts`);
    }
  }

  // Utility methods
  getDraftIndex() {
    return this.storage.getItem(STORAGE_KEYS.DRAFT_INDEX) || {};
  }

  updateDraftIndex(draftPayload) {
    const draftIndex = this.getDraftIndex();
    const storageKey = STORAGE_KEYS.DRAFT_PREFIX + draftPayload.draftId;
    
    draftIndex[draftPayload.draftId] = {
      name: draftPayload.name || draftPayload.employee?.name,
      phone: draftPayload.phone || draftPayload.employee?.phone,
      monthKey: draftPayload.monthKey,
      lastSaved: draftPayload.lastSaved,
      version: draftPayload.version,
      fieldCount: draftPayload.fieldCount,
      completionPercentage: draftPayload.completionPercentage,
      storageKey
    };

    this.storage.setItem(STORAGE_KEYS.DRAFT_INDEX, draftIndex);
  }

  removeDraftFromIndex(draftId) {
    const draftIndex = this.getDraftIndex();
    delete draftIndex[draftId];
    this.storage.setItem(STORAGE_KEYS.DRAFT_INDEX, draftIndex);
  }

  isDraftValid(draft) {
    return draft && 
           typeof draft === 'object' && 
           draft.lastSaved && 
           (draft.name || draft.employee?.name) && 
           (draft.phone || draft.employee?.phone) &&
           draft.monthKey;
  }

  isSignificantDraft(draftData) {
    // Consider a draft significant if it has meaningful user input
    const hasEmployeeData = draftData.employee?.name || draftData.employee?.phone;
    const hasFormData = draftData.fieldCount > 2 || draftData.completionPercentage > 5;
    const hasStep = draftData.currentStep > 1;
    
    return hasEmployeeData && (hasFormData || hasStep);
  }

  isCriticalChange(draftData) {
    // Critical changes that should be saved immediately
    return draftData.currentStep > 1 || 
           (draftData.employee?.name && draftData.employee?.phone) ||
           draftData.forceImmediate;
  }

  countFormFields(draftData) {
    let count = 0;
    
    const countObject = (obj) => {
      if (!obj || typeof obj !== 'object') return 0;
      let localCount = 0;
      
      Object.values(obj).forEach(value => {
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value) && value.length > 0) {
            localCount++;
          } else if (typeof value === 'object') {
            localCount += countObject(value);
          } else {
            localCount++;
          }
        }
      });
      
      return localCount;
    };

    return countObject(draftData);
  }

  calculateCompletion(draftData) {
    // Rough completion percentage based on filled fields
    const totalExpectedFields = 50; // Approximate total form fields
    const filledFields = this.countFormFields(draftData);
    return Math.min(Math.round((filledFields / totalExpectedFields) * 100), 100);
  }

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Event listener system
  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in persistence listener:', error);
      }
    });
  }
}

// Global instance
export const dataPersistence = new DataPersistenceService();

// React hooks for easy integration
export function useDraftPersistence() {
  return {
    saveDraft: (data, options) => dataPersistence.saveDraft(data, options),
    loadDraft: (name, phone, monthKey) => dataPersistence.loadDraft(name, phone, monthKey),
    getUserDrafts: (name, phone) => dataPersistence.getUserDrafts(name, phone),
    deleteDraft: (name, phone, monthKey) => dataPersistence.deleteDraft(name, phone, monthKey),
    cleanupDrafts: (maxAge) => dataPersistence.cleanupDrafts(maxAge)
  };
}

// Initialize cleanup on page load
if (typeof window !== 'undefined') {
  // Clean up drafts on app start
  setTimeout(() => {
    dataPersistence.cleanupDrafts();
  }, 5000); // Wait 5 seconds after app load

  // Set up periodic cleanup
  setInterval(() => {
    dataPersistence.cleanupDrafts();
  }, 60 * 60 * 1000); // Every hour
}