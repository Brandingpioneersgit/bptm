/**
 * Comprehensive Data Persistence System
 */

const STORAGE_KEYS = {
  DRAFT_PREFIX: 'codex_draft_',
  DRAFT_INDEX: 'codex_draft_index',
  SESSION_ID: 'codex_session_id',
  LAST_ACTIVITY: 'codex_last_activity',
  CRASH_RECOVERY: 'codex_crash_recovery'
};

const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateDraftId = (name, phone, monthKey) => `${name?.toLowerCase()?.replace(/\s+/g, '_')}_${phone}_${monthKey}`;

class StorageManager {
  constructor() { this.primaryStorage = null; this.fallbackStorage = null; this.memoryStorage = new Map(); this.initializeStorage(); }
  initializeStorage() {
    try { const k='__storage_test__'; localStorage.setItem(k,'test'); localStorage.removeItem(k); this.primaryStorage = localStorage; } catch {}
    try { const k='__storage_test__'; sessionStorage.setItem(k,'test'); sessionStorage.removeItem(k); this.fallbackStorage = sessionStorage; } catch {}
  }
  setItem(key, value) {
    const v = JSON.stringify(value);
    if (this.primaryStorage) { try { this.primaryStorage.setItem(key, v); return true; } catch {} }
    if (this.fallbackStorage) { try { this.fallbackStorage.setItem(key, v); return true; } catch {} }
    this.memoryStorage.set(key, v); return false;
  }
  getItem(key) {
    if (this.primaryStorage) { try { const v=this.primaryStorage.getItem(key); if (v!==null) return JSON.parse(v); } catch {} }
    if (this.fallbackStorage) { try { const v=this.fallbackStorage.getItem(key); if (v!==null) return JSON.parse(v); } catch {} }
    const m=this.memoryStorage.get(key); if (m!==undefined) return JSON.parse(m); return null;
  }
  removeItem(key) { try { this.primaryStorage?.removeItem(key);} catch {} try { this.fallbackStorage?.removeItem(key);} catch {} this.memoryStorage.delete(key); }
  clear() { try{this.primaryStorage?.clear();}catch{} try{this.fallbackStorage?.clear();}catch{} this.memoryStorage.clear(); }
}

class DataPersistenceService {
  constructor() {
    this.storage = new StorageManager();
    this.sessionId = this.initializeSession();
    this.autoSaveTimer = null; this.pendingSaves = new Map(); this.listeners = new Set();
    this.setupCrashRecovery(); this.setupActivityTracking();
  }
  initializeSession() { const existing = this.storage.getItem(STORAGE_KEYS.SESSION_ID); const id = existing || generateSessionId(); this.storage.setItem(STORAGE_KEYS.SESSION_ID, id); return id; }
  setupCrashRecovery() {
    this.markActivity(); setInterval(()=>this.markActivity(), 30000);
    window.addEventListener('beforeunload', ()=>{ this.storage.setItem(STORAGE_KEYS.CRASH_RECOVERY,{sessionId:this.sessionId,timestamp:Date.now(),graceful:true});});
    this.checkCrashedSessions();
  }
  setupActivityTracking() { const ev=['click','keypress','scroll','mousemove']; const t=this.throttle(()=>this.markActivity(),10000); ev.forEach(e=>document.addEventListener(e,t,{passive:true})); }
  markActivity() { this.storage.setItem(STORAGE_KEYS.LAST_ACTIVITY,{sessionId:this.sessionId,timestamp:Date.now()}); }
  checkCrashedSessions() { const c=this.storage.getItem(STORAGE_KEYS.CRASH_RECOVERY); if (c && !c.graceful) { return this.getCrashedDrafts(); } return []; }
  getCrashedDrafts() { const idx=this.getDraftIndex(); const now=Date.now(); const crashed=[]; Object.values(idx).forEach(d=>{ if (now-d.lastSaved<2*60*60*1000) { const data=this.storage.getItem(d.storageKey); if (data && this.isSignificantDraft(data)) crashed.push({...d,data}); } }); return crashed; }
  saveDraft(draftData, options = {}) {
    const { name, phone, monthKey, currentStep = 1, forceImmediate = false } = draftData;
    if (!name || !phone || !monthKey) return;
    const draftId = generateDraftId(name, phone, monthKey);
    const storageKey = STORAGE_KEYS.DRAFT_PREFIX + draftId;
    const existing = this.storage.getItem(storageKey) || {};
    const merged = { ...existing, ...draftData, currentStep, savedAt: Date.now(), sessionId: this.sessionId, version: (existing.version || 0) + 1 };
    if (forceImmediate) { this.storage.setItem(storageKey, merged); this.updateDraftIndex(draftId, storageKey); this.notify('save', merged); return; }
    this.pendingSaves.set(storageKey, merged); this.scheduleAutoSave();
  }
  scheduleAutoSave() { if (this.autoSaveTimer) return; this.autoSaveTimer = setTimeout(()=> this.flushPendingSaves(), 500); }
  flushPendingSaves() { this.pendingSaves.forEach((data, key)=>{ this.storage.setItem(key, data); this.notify('save', data);}); this.pendingSaves.clear(); this.autoSaveTimer = null; }
  getDraft(name, phone, monthKey) { const id=generateDraftId(name, phone, monthKey); return this.storage.getItem(STORAGE_KEYS.DRAFT_PREFIX+id); }
  getAllDrafts() { const index=this.getDraftIndex(); return Object.values(index).map(i=>({ ...i, data: this.storage.getItem(i.storageKey) })).filter(Boolean); }
  deleteDraft(name, phone, monthKey) { const id=generateDraftId(name, phone, monthKey); const key=STORAGE_KEYS.DRAFT_PREFIX+id; this.storage.removeItem(key); this.removeFromDraftIndex(id); this.notify('delete', { id, storageKey: key }); }
  clearAllDrafts() { const idx=this.getDraftIndex(); Object.values(idx).forEach(d=> this.storage.removeItem(d.storageKey)); this.storage.removeItem(STORAGE_KEYS.DRAFT_INDEX); this.notify('clear', null); }
  getDraftIndex() { return this.storage.getItem(STORAGE_KEYS.DRAFT_INDEX) || {}; }
  updateDraftIndex(draftId, storageKey) { const idx=this.getDraftIndex(); idx[draftId] = { draftId, storageKey, lastSaved: Date.now() }; this.storage.setItem(STORAGE_KEYS.DRAFT_INDEX, idx); }
  removeFromDraftIndex(draftId) { const idx=this.getDraftIndex(); delete idx[draftId]; this.storage.setItem(STORAGE_KEYS.DRAFT_INDEX, idx); }
  isSignificantDraft(d) { if (!d) return false; const fields = ['employee','clients','learning','meta','feedback']; return fields.some(f => d[f] && (Array.isArray(d[f]) ? d[f].length>0 : Object.keys(d[f]||{}).length>0)); }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  notify(type, payload) { this.listeners.forEach(l => { try { l({ type, payload }); } catch {} }); }
  throttle(fn, wait) { let last=0; return (...args)=>{ const now=Date.now(); if (now-last>=wait) { last=now; fn(...args); } }; }
}

export const dataPersistence = new DataPersistenceService();

import { useEffect, useRef, useState } from 'react';
export function useDraftPersistence({ name, phone, monthKey, model, onRestore }) {
  const [status, setStatus] = useState({ lastSaved: null, restored: false });
  const lastModelRef = useRef(model);

  useEffect(() => {
    const crashed = dataPersistence.checkCrashedSessions();
    if (crashed && crashed.length && onRestore) {
      onRestore(crashed[0].data);
      setStatus(s => ({ ...s, restored: true }));
    }
    const unsub = dataPersistence.subscribe(({ type, payload }) => {
      if (type === 'save') setStatus(s => ({ ...s, lastSaved: Date.now() }));
    });
    return () => unsub();
  }, [onRestore]);

  useEffect(() => {
    const snapshot = JSON.stringify(model);
    const lastSnapshot = JSON.stringify(lastModelRef.current);
    if (snapshot !== lastSnapshot) {
      dataPersistence.saveDraft({ ...model, name, phone, monthKey });
      lastModelRef.current = model;
    }
  }, [model, name, phone, monthKey]);

  const restore = () => {
    const d = dataPersistence.getDraft(name, phone, monthKey);
    if (d && onRestore) onRestore(d);
  };
  const clear = () => dataPersistence.deleteDraft(name, phone, monthKey);

  return { status, restore, clear };
}

