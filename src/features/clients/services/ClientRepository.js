// Client Repository Service for automatic client management

import { EMPTY_CLIENT } from './clientServices';

export class ClientRepository {
  constructor(supabase, dataSyncNotifier = null) {
    this.supabase = supabase;
    this.cache = new Map();
    this.notifyUpdate = typeof dataSyncNotifier === 'function' ? dataSyncNotifier : null;
    this.isLocalMode = !supabase || this.checkLocalMode();
  }

  checkLocalMode() {
    // Check if we're in local mode (no database connection)
    try {
      return !this.supabase || process.env.REACT_APP_SUPABASE_URL === 'your-supabase-url';
    } catch {
      return true;
    }
  }

  getLocalClients() {
    try {
      const stored = localStorage.getItem('bptm_clients');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveLocalClients(clients) {
    try {
      localStorage.setItem('bptm_clients', JSON.stringify(clients));
      return true;
    } catch {
      return false;
    }
  }

  async getAllClients() {
    if (this.isLocalMode) {
      const clients = this.getLocalClients();
      clients.forEach(c => this.cache.set(c.id, c));
      return clients;
    }

    try {
      const { data, error } = await this.supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      data.forEach(c => this.cache.set(c.id, c));
      return data || [];
    } catch (error) {
      console.warn('Supabase failed, falling back to local mode:', error.message);
      this.isLocalMode = true;
      return this.getLocalClients();
    }
  }

  async findOrCreateClientByName(name, defaults = {}) {
    const normalized = (name || '').trim();
    if (!normalized) throw new Error('Client name is required');

    if (this.isLocalMode) {
      const clients = this.getLocalClients();
      const existing = clients.find(c => c.name === normalized);
      if (existing) return existing;

      const newClient = {
        ...EMPTY_CLIENT,
        ...defaults,
        id: 'client-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        name: normalized,
        created_at: new Date().toISOString()
      };
      
      clients.push(newClient);
      this.saveLocalClients(clients);
      if (this.notifyUpdate) this.notifyUpdate(newClient);
      return newClient;
    }

    try {
      const { data, error } = await this.supabase
        .from('clients')
        .select('*')
        .eq('name', normalized)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;

      if (data) return data;

      const newClient = { ...EMPTY_CLIENT, ...defaults, name: normalized };
      const { data: created, error: createErr } = await this.supabase
        .from('clients')
        .insert(newClient)
        .select('*')
        .single();
      if (createErr) throw createErr;
      if (this.notifyUpdate) this.notifyUpdate(created);
      return created;
    } catch (error) {
      console.warn('Supabase failed, falling back to local mode:', error.message);
      this.isLocalMode = true;
      return this.findOrCreateClientByName(name, defaults);
    }
  }

  async createClient(client) {
    const toCreate = { ...EMPTY_CLIENT, ...client };
    
    if (this.isLocalMode) {
      const clients = this.getLocalClients();
      const newClient = {
        ...toCreate,
        id: toCreate.id || 'client-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        created_at: toCreate.created_at || new Date().toISOString()
      };
      
      clients.push(newClient);
      this.saveLocalClients(clients);
      if (this.notifyUpdate) this.notifyUpdate(newClient);
      return newClient;
    }

    try {
      const { data, error } = await this.supabase
        .from('clients')
        .insert(toCreate)
        .select('*')
        .single();
      if (error) throw error;
      if (this.notifyUpdate) this.notifyUpdate(data);
      return data;
    } catch (error) {
      console.warn('Supabase failed, falling back to local mode:', error.message);
      this.isLocalMode = true;
      return this.createClient(client);
    }
  }

  async updateClient(client) {
    if (!client?.id) throw new Error('Client id is required');
    
    if (this.isLocalMode) {
      const clients = this.getLocalClients();
      const index = clients.findIndex(c => c.id === client.id);
      if (index === -1) throw new Error('Client not found');
      
      clients[index] = { ...clients[index], ...client };
      this.saveLocalClients(clients);
      if (this.notifyUpdate) this.notifyUpdate(clients[index]);
      return clients[index];
    }

    try {
      const { data, error } = await this.supabase
        .from('clients')
        .update(client)
        .eq('id', client.id)
        .select('*')
        .single();
      if (error) throw error;
      if (this.notifyUpdate) this.notifyUpdate(data);
      return data;
    } catch (error) {
      console.warn('Supabase failed, falling back to local mode:', error.message);
      this.isLocalMode = true;
      return this.updateClient(client);
    }
  }

  async addServicesToClient(clientId, servicesToAdd = []) {
    if (this.isLocalMode) {
      const clients = this.getLocalClients();
      const client = clients.find(c => c.id === clientId);
      if (!client) throw new Error('Client not found');
      
      const existingServices = client.services || [];
      const mergedServices = [...existingServices, ...servicesToAdd];
      
      const updatedClient = { ...client, services: mergedServices };
      return this.updateClient(updatedClient);
    }

    try {
      const { data: existing, error: fetchErr } = await this.supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      if (fetchErr) throw fetchErr;

      const existingServices = existing.services || [];
      const mergedServices = [...existingServices, ...servicesToAdd];

      const { data: updated, error: updateErr } = await this.supabase
        .from('clients')
        .update({ ...existing, services: mergedServices })
        .eq('id', clientId)
        .select('*')
        .single();
      if (updateErr) throw updateErr;
      if (this.notifyUpdate) this.notifyUpdate(updated);
      return updated;
    } catch (error) {
      console.warn('Supabase failed, falling back to local mode:', error.message);
      this.isLocalMode = true;
      return this.addServicesToClient(clientId, servicesToAdd);
    }
  }
}

export function getClientRepository(supabase, onUpdate) {
  return new ClientRepository(supabase, onUpdate);
}

