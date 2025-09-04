/**
 * Client Data Priority Service
 * 
 * This service implements a priority system where client-filled forms take precedence
 * over employee-filled forms when there are conflicts in client data.
 * 
 * Priority Order:
 * 1. Client-filled data (from client_onboarding table) - HIGHEST PRIORITY
 * 2. Employee-filled data (from submissions table) - LOWER PRIORITY
 * 3. Master client data (from clients table) - FALLBACK
 */

import { supabase } from '@/shared/lib/supabase';

class ClientDataPriorityService {
  constructor() {
    this.clientOnboardingCache = new Map();
    this.lastCacheUpdate = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get client onboarding data with caching
   */
  async getClientOnboardingData() {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.lastCacheUpdate && (now - this.lastCacheUpdate) < this.cacheTimeout) {
      return Array.from(this.clientOnboardingCache.values());
    }

    try {
      const { data, error } = await supabase
        .from('client_onboarding')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching client onboarding data:', error);
        return [];
      }

      // Update cache
      this.clientOnboardingCache.clear();
      data.forEach(client => {
        this.clientOnboardingCache.set(client.client_name.toLowerCase(), client);
      });
      this.lastCacheUpdate = now;

      return data;
    } catch (error) {
      console.error('Failed to fetch client onboarding data:', error);
      return [];
    }
  }

  /**
   * Merge client data with priority system
   * @param {Object} employeeClientData - Client data from employee submission
   * @param {Array} masterClients - Master client list
   * @returns {Object} Merged client data with priority applied
   */
  async mergeClientDataWithPriority(employeeClientData, masterClients = []) {
    if (!employeeClientData || !employeeClientData.name) {
      return employeeClientData;
    }

    const clientName = employeeClientData.name.toLowerCase();
    
    // Get client onboarding data
    await this.getClientOnboardingData();
    const clientOnboardingData = this.clientOnboardingCache.get(clientName);
    
    // Find master client data
    const masterClient = masterClients.find(client => 
      client.name.toLowerCase() === clientName
    );

    // Apply priority system
    const mergedData = {
      ...employeeClientData, // Start with employee data as base
    };

    // Override with master client data if available
    if (masterClient) {
      mergedData.clientType = masterClient.client_type || mergedData.clientType;
      mergedData.team = masterClient.team || mergedData.team;
      mergedData.status = masterClient.status || mergedData.status;
      mergedData.industry = masterClient.industry || mergedData.industry;
      mergedData.contactEmail = masterClient.contact_email || mergedData.contactEmail;
      mergedData.contactPhone = masterClient.contact_phone || mergedData.contactPhone;
      mergedData.website = masterClient.website_url || mergedData.website;
      mergedData.priorityLevel = masterClient.priority_level || mergedData.priorityLevel;
    }

    // Override with client onboarding data (HIGHEST PRIORITY)
    if (clientOnboardingData) {
      mergedData.name = clientOnboardingData.client_name || mergedData.name;
      mergedData.contactPerson = clientOnboardingData.contact_person || mergedData.contactPerson;
      mergedData.email = clientOnboardingData.email || mergedData.email;
      mergedData.phone = clientOnboardingData.phone || mergedData.phone;
      mergedData.companySize = clientOnboardingData.company_size || mergedData.companySize;
      mergedData.industry = clientOnboardingData.industry || mergedData.industry;
      mergedData.website = clientOnboardingData.website_url || mergedData.website;
      mergedData.serviceScope = clientOnboardingData.service_scope || mergedData.serviceScope;
      mergedData.budgetRange = clientOnboardingData.budget_range || mergedData.budgetRange;
      mergedData.timeline = clientOnboardingData.timeline || mergedData.timeline;
      mergedData.targetAudience = clientOnboardingData.target_audience || mergedData.targetAudience;
      mergedData.assignedTeam = clientOnboardingData.assigned_team || mergedData.assignedTeam;
      
      // Client-specific insights (only from client onboarding)
      mergedData.targetOccupation = clientOnboardingData.target_occupation;
      mergedData.topServices = clientOnboardingData.top_services;
      mergedData.customerLearningPoints = clientOnboardingData.customer_learning_points;
      mergedData.customerQuestions = clientOnboardingData.customer_questions;
      mergedData.educationTopics = clientOnboardingData.education_topics;
      mergedData.keywords = clientOnboardingData.keywords;
      mergedData.customerFears = clientOnboardingData.customer_fears;
      mergedData.customerPainPoints = clientOnboardingData.customer_pain_points;
      mergedData.customerProblems = clientOnboardingData.customer_problems;
      mergedData.customerDesires = clientOnboardingData.customer_desires;
      
      // Add metadata about data source
      mergedData.dataSource = 'client_priority';
      mergedData.hasClientOnboardingData = true;
      mergedData.clientOnboardingDate = clientOnboardingData.created_at;
    } else {
      mergedData.dataSource = masterClient ? 'master_client' : 'employee_submission';
      mergedData.hasClientOnboardingData = false;
    }

    return mergedData;
  }

  /**
   * Process multiple client entries with priority system
   * @param {Array} employeeClients - Array of client data from employee submissions
   * @param {Array} masterClients - Master client list
   * @returns {Array} Array of merged client data with priority applied
   */
  async processClientListWithPriority(employeeClients = [], masterClients = []) {
    if (!Array.isArray(employeeClients) || employeeClients.length === 0) {
      return employeeClients;
    }

    // Process each client with priority system
    const processedClients = await Promise.all(
      employeeClients.map(client => 
        this.mergeClientDataWithPriority(client, masterClients)
      )
    );

    return processedClients;
  }

  /**
   * Get client data summary with priority indicators
   * @param {string} clientName - Name of the client
   * @returns {Object} Client data summary with priority information
   */
  async getClientDataSummary(clientName) {
    if (!clientName) return null;

    const normalizedName = clientName.toLowerCase();
    
    // Get all data sources
    await this.getClientOnboardingData();
    const clientOnboardingData = this.clientOnboardingCache.get(normalizedName);
    
    return {
      clientName,
      hasClientOnboardingData: !!clientOnboardingData,
      clientOnboardingDate: clientOnboardingData?.created_at,
      submissionStatus: clientOnboardingData?.submission_status,
      assignedTeam: clientOnboardingData?.assigned_team,
      dataCompleteness: this.calculateDataCompleteness(clientOnboardingData),
      prioritySource: clientOnboardingData ? 'client_onboarding' : 'employee_submission'
    };
  }

  /**
   * Calculate data completeness percentage
   * @param {Object} clientData - Client onboarding data
   * @returns {number} Completeness percentage (0-100)
   */
  calculateDataCompleteness(clientData) {
    if (!clientData) return 0;

    const requiredFields = [
      'client_name', 'contact_person', 'email', 'phone', 'company_size',
      'industry', 'service_scope', 'budget_range', 'timeline', 'target_audience'
    ];

    const optionalFields = [
      'website_url', 'target_occupation', 'top_services', 'customer_learning_points',
      'customer_questions', 'education_topics', 'keywords', 'customer_fears',
      'customer_pain_points', 'customer_problems', 'customer_desires'
    ];

    const totalFields = requiredFields.length + optionalFields.length;
    let filledFields = 0;

    [...requiredFields, ...optionalFields].forEach(field => {
      const value = clientData[field];
      if (value && value !== '' && (!Array.isArray(value) || value.length > 0)) {
        filledFields++;
      }
    });

    return Math.round((filledFields / totalFields) * 100);
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache() {
    this.clientOnboardingCache.clear();
    this.lastCacheUpdate = null;
  }

  /**
   * Get data source priority explanation
   * @returns {Object} Priority explanation
   */
  getDataSourcePriority() {
    return {
      1: {
        source: 'client_onboarding',
        description: 'Client-filled onboarding forms (highest priority)',
        color: 'green'
      },
      2: {
        source: 'master_client',
        description: 'Master client database records',
        color: 'blue'
      },
      3: {
        source: 'employee_submission',
        description: 'Employee-filled submission data (lowest priority)',
        color: 'gray'
      }
    };
  }
}

// Export singleton instance
export const clientDataPriorityService = new ClientDataPriorityService();
export default clientDataPriorityService;