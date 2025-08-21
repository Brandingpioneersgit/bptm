// Client Repository Service for automatic client management

import { EMPTY_CLIENT, findClientInRepository, mergeClientData, createServiceObject } from '@/shared/services/clientServices';

export class ClientRepository {
  constructor(supabase, dataSyncNotifier = null) {
    this.supabase = supabase;
    this.cache = new Map();
    this.notifyUpdate = typeof dataSyncNotifier === 'function' ? dataSyncNotifier : null;
  }

  async getAllClients() {
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    data.forEach(c => this.cache.set(c.id, c));
    return data || [];
  }

  async findOrCreateClientByName(name, defaults = {}) {
    const normalized = (name || '').trim();
    if (!normalized) throw new Error('Client name is required');

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
  }

  async createClient(client) {
    const toCreate = { ...EMPTY_CLIENT, ...client };
    const { data, error } = await this.supabase
      .from('clients')
      .insert(toCreate)
      .select('*')
      .single();
    if (error) throw error;
    if (this.notifyUpdate) this.notifyUpdate(data);
    return data;
  }

  async updateClient(client) {
    if (!client?.id) throw new Error('Client id is required');
    const { data, error } = await this.supabase
      .from('clients')
      .update(client)
      .eq('id', client.id)
      .select('*')
      .single();
    if (error) throw error;
    if (this.notifyUpdate) this.notifyUpdate(data);
    return data;
  }

  async addServicesToClient(clientId, servicesToAdd = []) {
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
  }
}

export function getClientRepository(supabase, onUpdate) {
  return new ClientRepository(supabase, onUpdate);
}

