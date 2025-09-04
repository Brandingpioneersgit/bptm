import { supabase } from '@/shared/lib/supabase';

/**
 * Service for handling client onboarding data operations
 */
export class ClientOnboardingService {
  /**
   * Save client onboarding form data
   * @param {Object} formData - The complete form data
   * @returns {Promise<Object>} - The saved record with ID
   */
  static async saveOnboardingData(formData) {
    try {
      // Prepare the data for database insertion
      const dbData = {
        // Basic Information
        client_name: formData.clientName,
        industry: formData.industry,
        healthcare_type: formData.healthcareType,
        
        // Service Selection
        service_scope: formData.serviceScope,
        selected_web_services: formData.selectedWebServices || [],
        selected_marketing_services: formData.selectedMarketingServices || [],
        
        // Contact Information
        primary_email: formData.primaryEmail,
        leads_email: formData.leadsEmail,
        phone_number: formData.phoneNumber,
        locations: formData.locations || [],
        
        // Website & Technical Access
        website_url: formData.websiteAccess?.url,
        cpanel_username: formData.websiteAccess?.cpanelUsername,
        cpanel_password: formData.websiteAccess?.cpanelPassword,
        admin_panel_url: formData.websiteAccess?.adminPanelUrl,
        admin_username: formData.websiteAccess?.adminUsername,
        admin_password: formData.websiteAccess?.adminPassword,
        
        // Google Services Access
        gmb_access_granted: formData.googleServices?.gmbAccess || false,
        analytics_access_granted: formData.googleServices?.analyticsAccess || false,
        search_console_access_granted: formData.googleServices?.searchConsoleAccess || false,
        
        // SEO & Marketing Services
        extra_services: formData.seoServices?.extraServices || [],
        seo_involvement: formData.seoServices?.involvement,
        seo_remarks: formData.seoServices?.remarks,
        
        // Advertising Details
        ad_platforms: formData.advertising?.platforms || [],
        ad_budget_per_day: formData.advertising?.budgetPerDay ? parseFloat(formData.advertising.budgetPerDay) : null,
        ad_involvement: formData.advertising?.involvement,
        ad_target_locations: formData.advertising?.targetLocations || [],
        ad_remarks: formData.advertising?.remarks,
        
        // Social Media & Content Management
        facebook_access_granted: formData.socialMedia?.facebookAccess || false,
        linkedin_access_granted: formData.socialMedia?.linkedinAccess || false,
        youtube_access_granted: formData.socialMedia?.youtubeAccess || false,
        youtube_involvement: formData.socialMedia?.youtubeInvolvement,
        social_media_involvement: formData.socialMedia?.involvement,
        
        // Business Understanding & Target Audience
        biggest_strength: formData.biggestStrength,
        business_identity: formData.identity,
        value_proposition: formData.valueProposition,
        target_age: formData.targetAge,
        target_gender: formData.targetGender,
        target_occupation: formData.targetOccupation,
        top_services: formData.topServices || [],
        customer_learning_points: formData.customerLearningPoints || [],
        customer_questions: formData.customerQuestions || [],
        education_topics: formData.educationTopics || [],
        keywords: formData.keywords || [],
        
        // Customer Psychology & Follow-up
        customer_fears: formData.customerFears || [],
        customer_pain_points: formData.customerPainPoints || [],
        customer_problems: formData.customerProblems || [],
        customer_desires: formData.customerDesires || [],
        review_meeting_date: formData.reviewMeetingDate,
        
        // Indian Business Details
        gstin: formData.indianBusinessDetails?.gstin,
        pan_number: formData.indianBusinessDetails?.panNumber,
        state: formData.indianBusinessDetails?.state,
        city: formData.indianBusinessDetails?.city,
        pincode: formData.indianBusinessDetails?.pincode,
        business_registration_type: formData.indianBusinessDetails?.businessRegistrationType,
        udyam_registration: formData.indianBusinessDetails?.udyamRegistration,
        medical_council_registration: formData.indianBusinessDetails?.medicalCouncilRegistration,
        clinical_establishment_license: formData.indianBusinessDetails?.clinicalEstablishmentLicense,
        drug_license: formData.indianBusinessDetails?.drugLicense,
        nabh_jci_accreditation: formData.indianBusinessDetails?.nabh_jci_accreditation,
        fssai_license: formData.indianBusinessDetails?.fssaiLicense,
        biomedical_waste_authorization: formData.indianBusinessDetails?.biomedicalWasteAuthorization,
        
        // Status
        submission_status: 'submitted',
        assigned_team: this.determineAssignedTeam(formData.serviceScope)
      };

      const { data, error } = await supabase
        .from('client_onboarding')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error('Error saving onboarding data:', error);
        throw new Error(`Failed to save onboarding data: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in saveOnboardingData:', error);
      throw error;
    }
  }

  /**
   * Save uploaded files for a client onboarding record
   * @param {string} onboardingId - The onboarding record ID
   * @param {Array} files - Array of file objects
   * @param {string} fileType - Type of files (logo, seo_report, document)
   * @returns {Promise<Array>} - Array of saved file records
   */
  static async saveOnboardingFiles(onboardingId, files, fileType) {
    try {
      const fileRecords = files.map(file => ({
        client_onboarding_id: onboardingId,
        file_type: fileType,
        file_name: file.name,
        file_url: file.url,
        file_size: file.size,
        mime_type: file.type
      }));

      const { data, error } = await supabase
        .from('client_onboarding_files')
        .insert(fileRecords)
        .select();

      if (error) {
        console.error('Error saving onboarding files:', error);
        throw new Error(`Failed to save files: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in saveOnboardingFiles:', error);
      throw error;
    }
  }

  /**
   * Get all client onboarding records
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of onboarding records
   */
  static async getAllOnboardingRecords(filters = {}) {
    try {
      let query = supabase
        .from('client_onboarding')
        .select(`
          *,
          client_onboarding_files(*),
          client_onboarding_comments(*)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('submission_status', filters.status);
      }
      if (filters.industry) {
        query = query.eq('industry', filters.industry);
      }
      if (filters.serviceScope) {
        query = query.eq('service_scope', filters.serviceScope);
      }
      if (filters.assignedTeam) {
        query = query.eq('assigned_team', filters.assignedTeam);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching onboarding records:', error);
        throw new Error(`Failed to fetch records: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllOnboardingRecords:', error);
      throw error;
    }
  }

  /**
   * Get a specific client onboarding record by ID
   * @param {string} id - The onboarding record ID
   * @returns {Promise<Object>} - The onboarding record
   */
  static async getOnboardingRecord(id) {
    try {
      const { data, error } = await supabase
        .from('client_onboarding')
        .select(`
          *,
          client_onboarding_files(*),
          client_onboarding_comments(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching onboarding record:', error);
        throw new Error(`Failed to fetch record: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getOnboardingRecord:', error);
      throw error;
    }
  }

  /**
   * Update client onboarding record status
   * @param {string} id - The onboarding record ID
   * @param {string} status - New status (draft, submitted, reviewed, approved)
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} - Updated record
   */
  static async updateOnboardingStatus(id, status, notes = null) {
    try {
      const updateData = { submission_status: status };
      if (notes) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from('client_onboarding')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating onboarding status:', error);
        throw new Error(`Failed to update status: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateOnboardingStatus:', error);
      throw error;
    }
  }

  /**
   * Add a comment to a client onboarding record
   * @param {string} onboardingId - The onboarding record ID
   * @param {string} userName - Name of the user adding the comment
   * @param {string} userRole - Role of the user
   * @param {string} comment - The comment text
   * @returns {Promise<Object>} - The saved comment
   */
  static async addComment(onboardingId, userName, userRole, comment) {
    try {
      const { data, error } = await supabase
        .from('client_onboarding_comments')
        .insert([{
          client_onboarding_id: onboardingId,
          user_name: userName,
          user_role: userRole,
          comment: comment
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        throw new Error(`Failed to add comment: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in addComment:', error);
      throw error;
    }
  }

  /**
   * Delete a client onboarding record
   * @param {string} id - The onboarding record ID
   * @returns {Promise<boolean>} - Success status
   */
  static async deleteOnboardingRecord(id) {
    try {
      const { error } = await supabase
        .from('client_onboarding')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting onboarding record:', error);
        throw new Error(`Failed to delete record: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error in deleteOnboardingRecord:', error);
      throw error;
    }
  }

  /**
   * Determine assigned team based on service scope
   * @param {string} serviceScope - The selected service scope
   * @returns {string} - The assigned team
   */
  static determineAssignedTeam(serviceScope) {
    switch (serviceScope) {
      case 'web':
        return 'web';
      case 'marketing':
        return 'marketing';
      case 'both':
        return 'both';
      default:
        return 'both';
    }
  }

  /**
   * Get onboarding statistics
   * @returns {Promise<Object>} - Statistics object
   */
  static async getOnboardingStats() {
    try {
      const { data, error } = await supabase
        .from('client_onboarding')
        .select('submission_status, service_scope, industry, created_at');

      if (error) {
        console.error('Error fetching onboarding stats:', error);
        throw new Error(`Failed to fetch stats: ${error.message}`);
      }

      // Calculate statistics
      const stats = {
        total: data.length,
        byStatus: {},
        byServiceScope: {},
        byIndustry: {},
        recentSubmissions: 0
      };

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      data.forEach(record => {
        // Count by status
        stats.byStatus[record.submission_status] = (stats.byStatus[record.submission_status] || 0) + 1;
        
        // Count by service scope
        stats.byServiceScope[record.service_scope] = (stats.byServiceScope[record.service_scope] || 0) + 1;
        
        // Count by industry
        if (record.industry) {
          stats.byIndustry[record.industry] = (stats.byIndustry[record.industry] || 0) + 1;
        }
        
        // Count recent submissions
        if (new Date(record.created_at) > oneWeekAgo) {
          stats.recentSubmissions++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error in getOnboardingStats:', error);
      throw error;
    }
  }
}

export default ClientOnboardingService;