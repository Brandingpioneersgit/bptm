// Client Repository Service for automatic client management

import { EMPTY_CLIENT, findClientInRepository, mergeClientData, createServiceObject } from './clientServices';

export class ClientRepository {
  constructor(supabase) {
    this.supabase = supabase;
    this.cache = new Map(); // Cache for client data
  }

  // Get all clients from repository
  async getAllClients() {
    if (!this.supabase) return [];
    
    try {
      const { data, error } = await this.supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Update cache
      data?.forEach(client => {
        this.cache.set(client.name.toLowerCase().trim(), client);
      });
      
      return data || [];
    } catch (error) {
      console.error('Error fetching clients from repository:', error);
      return [];
    }
  }

  // Add or update client in repository
  async upsertClient(clientData) {
    if (!this.supabase || !clientData.name) return null;
    
    try {
      console.log('📝 Upserting client to repository:', clientData.name);
      
      // Check if client already exists
      const existingClients = await this.getAllClients();
      const existingClient = findClientInRepository(existingClients, clientData.name);
      
      let clientToSave;
      
      if (existingClient) {
        // Merge with existing client data
        clientToSave = mergeClientData(existingClient, clientData);
        console.log('🔄 Updating existing client:', existingClient.id);
        
        const { data, error } = await this.supabase
          .from('clients')
          .update(clientToSave)
          .eq('id', existingClient.id)
          .select()
          .single();
        
        if (error) throw error;
        
        // Update cache
        this.cache.set(clientData.name.toLowerCase().trim(), data);
        return data;
      } else {
        // Create new client
        clientToSave = {
          ...EMPTY_CLIENT,
          ...clientData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('➕ Creating new client in repository');
        
        const { data, error } = await this.supabase
          .from('clients')
          .insert([clientToSave])
          .select()
          .single();
        
        if (error) throw error;
        
        // Update cache
        this.cache.set(clientData.name.toLowerCase().trim(), data);
        return data;
      }
    } catch (error) {
      console.error('Error upserting client to repository:', error);
      return null;
    }
  }

  // Automatically store clients from form submission
  async storeClientsFromSubmission(submission) {
    if (!submission.clients || !Array.isArray(submission.clients)) return;
    
    console.log('🏢 Auto-storing clients from submission:', submission.clients.length);
    
    const results = [];
    
    for (const client of submission.clients) {
      if (!client.name) continue;
      
      // Extract relevant client data from form
      const clientData = {
        name: client.name.trim(),
        team: submission.employee?.department || "Web",
        status: "Active",
        client_type: "Standard",
        contact_email: client.contact_email || "",
        contact_phone: client.contact_phone || "",
        logo_url: client.logo_url || "",
        scope_notes: client.scope_notes || "",
        // Extract services from client data
        services: this.extractServicesFromClient(client, submission.employee?.department)
      };
      
      const result = await this.upsertClient(clientData);
      if (result) {
        results.push(result);
      }
    }
    
    console.log('✅ Successfully stored clients:', results.length);
    return results;
  }

  // Extract services from client form data based on department
  extractServicesFromClient(client, department) {
    const services = [];
    
    // Department-specific service extraction
    switch (department) {
      case "Web":
      case "Web Head":
        if (client.web_pagesThis > 0) {
          services.push(createServiceObject("Website Development", "Project-based"));
        }
        if (client.web_saasUpsells > 0) {
          services.push(createServiceObject("Website Maintenance", "Monthly"));
        }
        break;
        
      case "SEO":
        if (client.seo_trafficThis > 0 || client.seo_kwImprovedThis > 0) {
          services.push(createServiceObject("SEO", "Monthly"));
        }
        break;
        
      case "Ads":
        if (client.ads_ctrThis > 0 || client.ads_leadsThis > 0) {
          services.push(createServiceObject("Google Ads", "Weekly"));
          services.push(createServiceObject("Meta Ads", "Weekly"));
        }
        break;
        
      case "Social Media":
        if (client.sm_followersThis > 0 || client.sm_reachThis > 0) {
          services.push(createServiceObject("Social Media Management", "Daily"));
          services.push(createServiceObject("Content Creation", "Weekly"));
        }
        break;
        
      default:
        // For other departments, add generic consulting
        services.push(createServiceObject("Consulting", "As needed"));
    }
    
    // Add analytics for all clients with data
    if (client.reports && client.reports.length > 0) {
      services.push(createServiceObject("Analytics & Reporting", "Monthly"));
    }
    
    return services;
  }

  // Get client from cache or fetch
  async getClient(clientName) {
    const cacheKey = clientName.toLowerCase().trim();
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Fetch from database
    try {
      const { data, error } = await this.supabase
        .from('clients')
        .select('*')
        .ilike('name', clientName.trim())
        .single();
      
      if (error) return null;
      
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching client:', error);
      return null;
    }
  }

  // Update client services
  async updateClientServices(clientId, services) {
    if (!this.supabase) return null;
    
    try {
      const { data, error } = await this.supabase
        .from('clients')
        .update({
          services,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update cache
      this.cache.set(data.name.toLowerCase().trim(), data);
      return data;
    } catch (error) {
      console.error('Error updating client services:', error);
      return null;
    }
  }
}

// Global instance
let globalClientRepository = null;

export const getClientRepository = (supabase) => {
  if (!globalClientRepository) {
    globalClientRepository = new ClientRepository(supabase);
  }
  return globalClientRepository;
};