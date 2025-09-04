/**
 * SEO API Service
 * Handles all SEO module API operations including CRUD, workflow, and reporting
 */

import { supabase } from '@/shared/lib/supabase';
import seoScoringService from '@/services/seoScoringService';

class SEOApiService {
  /**
   * Get SEO entries with filtering and pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Entries with metadata
   */
  async getEntries(params = {}) {
    const {
      employeeId,
      clientId,
      month,
      status,
      page = 1,
      limit = 50,
      sortBy = 'month',
      sortOrder = 'desc'
    } = params;

    let query = supabase
      .from('seo_monthly_entries')
      .select(`
        *,
        clients!inner(id, name, type, active),
        users!inner(id, name, email),
        reviewer:reviewed_by(id, name, email)
      `, { count: 'exact' });

    // Apply filters
    if (employeeId) query = query.eq('employee_id', employeeId);
    if (clientId) query = query.eq('client_id', clientId);
    if (month) query = query.eq('month', month);
    if (status) query = query.eq('status', status);

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch SEO entries: ${error.message}`);
    }

    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get single SEO entry by ID
   * @param {string} entryId - Entry ID
   * @returns {Promise<Object>} Entry data
   */
  async getEntry(entryId) {
    const { data, error } = await supabase
      .from('seo_monthly_entries')
      .select(`
        *,
        clients!inner(id, name, type, active),
        users!inner(id, name, email),
        reviewer:reviewed_by(id, name, email)
      `)
      .eq('id', entryId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch SEO entry: ${error.message}`);
    }

    return data;
  }

  /**
   * Create new SEO entry
   * @param {Object} entryData - Entry data
   * @returns {Promise<Object>} Created entry
   */
  async createEntry(entryData) {
    // Validate required fields
    const required = ['employee_id', 'client_id', 'month'];
    for (const field of required) {
      if (!entryData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Check for duplicate entry
    const { data: existing } = await supabase
      .from('seo_monthly_entries')
      .select('id')
      .eq('employee_id', entryData.employee_id)
      .eq('client_id', entryData.client_id)
      .eq('month', entryData.month)
      .single();

    if (existing) {
      throw new Error('Entry already exists for this employee, client, and month');
    }

    const { data, error } = await supabase
      .from('seo_monthly_entries')
      .insert(entryData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create SEO entry: ${error.message}`);
    }

    return data;
  }

  /**
   * Update SEO entry
   * @param {string} entryId - Entry ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated entry
   */
  async updateEntry(entryId, updateData) {
    // Remove system-calculated fields from update
    const systemFields = [
      'organic_growth_pct', 'traffic_growth_pct', 'technical_health_score',
      'ranking_score', 'delivery_score', 'relationship_score', 'month_score'
    ];
    
    const cleanData = { ...updateData };
    systemFields.forEach(field => delete cleanData[field]);

    const { data, error } = await supabase
      .from('seo_monthly_entries')
      .update(cleanData)
      .eq('id', entryId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update SEO entry: ${error.message}`);
    }

    return data;
  }

  /**
   * Submit SEO entry for review
   * @param {string} entryId - Entry ID
   * @returns {Promise<Object>} Updated entry with scores
   */
  async submitEntry(entryId) {
    // Get entry with client data
    const entry = await this.getEntry(entryId);
    
    if (entry.status !== 'draft') {
      throw new Error('Only draft entries can be submitted');
    }

    // Validate required data
    this.validateEntryData(entry);

    // Get previous entries for penalty calculation
    const { data: previousEntries } = await supabase
      .from('seo_monthly_entries')
      .select('*')
      .eq('employee_id', entry.employee_id)
      .eq('client_id', entry.client_id)
      .lt('month', entry.month)
      .order('month', { ascending: false })
      .limit(2);

    // Calculate scores
    const scoring = await seoScoringService.calculateMonthScore(
      entry,
      entry.clients,
      previousEntries || []
    );

    // Update entry with calculated scores
    const updateData = {
      organic_growth_pct: seoScoringService.calculateGrowthPercentage(
        entry.gsc_organic_prev_30d,
        entry.gsc_organic_curr_30d
      ),
      traffic_growth_pct: seoScoringService.calculateGrowthPercentage(
        entry.ga_total_prev_30d,
        entry.ga_total_curr_30d
      ),
      technical_health_score: scoring.breakdown.technicalHealth.points,
      ranking_score: scoring.breakdown.rankings.points,
      delivery_score: scoring.breakdown.deliveryScope.points,
      relationship_score: scoring.breakdown.relationshipQuality.points,
      month_score: scoring.totalScore,
      status: 'submitted',
      submitted_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('seo_monthly_entries')
      .update(updateData)
      .eq('id', entryId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit SEO entry: ${error.message}`);
    }

    return { ...data, scoring };
  }

  /**
   * Approve SEO entry (TL/Admin only)
   * @param {string} entryId - Entry ID
   * @param {string} reviewerId - Reviewer ID
   * @param {string} comment - Review comment
   * @returns {Promise<Object>} Updated entry
   */
  async approveEntry(entryId, reviewerId, comment = '') {
    const { data, error } = await supabase
      .from('seo_monthly_entries')
      .update({
        status: 'approved',
        review_comment: comment,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', entryId)
      .eq('status', 'submitted')
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to approve SEO entry: ${error.message}`);
    }

    return data;
  }

  /**
   * Return SEO entry for revision (TL/Admin only)
   * @param {string} entryId - Entry ID
   * @param {string} reviewerId - Reviewer ID
   * @param {string} comment - Review comment
   * @returns {Promise<Object>} Updated entry
   */
  async returnEntry(entryId, reviewerId, comment) {
    if (!comment || comment.trim() === '') {
      throw new Error('Comment is required when returning an entry');
    }

    const { data, error } = await supabase
      .from('seo_monthly_entries')
      .update({
        status: 'returned',
        review_comment: comment,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', entryId)
      .eq('status', 'submitted')
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to return SEO entry: ${error.message}`);
    }

    return data;
  }

  /**
   * Add mentor score to entry (TL/Mentor only)
   * @param {string} entryId - Entry ID
   * @param {number} mentorScore - Score (1-10)
   * @param {string} reviewerId - Reviewer ID
   * @returns {Promise<Object>} Updated entry
   */
  async addMentorScore(entryId, mentorScore, reviewerId) {
    if (mentorScore < 1 || mentorScore > 10) {
      throw new Error('Mentor score must be between 1 and 10');
    }

    const { data, error } = await supabase
      .from('seo_monthly_entries')
      .update({ mentor_score: mentorScore })
      .eq('id', entryId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add mentor score: ${error.message}`);
    }

    return data;
  }

  /**
   * Get employee dashboard data
   * @param {string} employeeId - Employee ID
   * @returns {Promise<Object>} Dashboard data
   */
  async getEmployeeDashboard(employeeId) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Get YTD entries
    const { data: ytdEntries } = await supabase
      .from('seo_monthly_entries')
      .select('month_score')
      .eq('employee_id', employeeId)
      .eq('status', 'approved')
      .gte('month', `${currentYear}-01`)
      .lte('month', `${currentYear}-12`);

    // Get last month entries
    const lastMonthStr = `${lastMonthYear}-${lastMonth.toString().padStart(2, '0')}`;
    const { data: lastMonthEntries } = await supabase
      .from('seo_monthly_entries')
      .select('month_score')
      .eq('employee_id', employeeId)
      .eq('status', 'approved')
      .eq('month', lastMonthStr);

    // Get active clients count
    const { data: activeClients } = await supabase
      .from('seo_accounts')
      .select('client_id')
      .eq('employee_id', employeeId)
      .eq('status', 'active');

    // Get NPS data (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { data: npsEntries } = await supabase
      .from('seo_monthly_entries')
      .select('nps_client')
      .eq('employee_id', employeeId)
      .not('nps_client', 'is', null)
      .gte('created_at', ninetyDaysAgo.toISOString());

    // Calculate metrics
    const ytdAvgScore = ytdEntries?.length > 0 
      ? ytdEntries.reduce((sum, entry) => sum + entry.month_score, 0) / ytdEntries.length 
      : 0;

    const lastMonthScore = lastMonthEntries?.length > 0
      ? lastMonthEntries.reduce((sum, entry) => sum + entry.month_score, 0) / lastMonthEntries.length
      : 0;

    const avgNPS = npsEntries?.length > 0
      ? npsEntries.reduce((sum, entry) => sum + entry.nps_client, 0) / npsEntries.length
      : 0;

    return {
      ytdAvgScore: Math.round(ytdAvgScore * 100) / 100,
      lastMonthScore: Math.round(lastMonthScore * 100) / 100,
      activeClientsCount: activeClients?.length || 0,
      avgNPS: Math.round(avgNPS * 100) / 100
    };
  }

  /**
   * Get team dashboard data (TL/Admin)
   * @param {string} teamLeadId - Team Lead ID (optional for admin)
   * @returns {Promise<Object>} Team dashboard data
   */
  async getTeamDashboard(teamLeadId = null) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    let query = supabase
      .from('seo_monthly_entries')
      .select(`
        *,
        users!inner(id, name, email, role),
        clients!inner(id, name, type)
      `);

    // If team lead, filter by their team members
    if (teamLeadId) {
      // This would need team structure in users table
      // For now, we'll show all entries
    }

    const { data: entries } = await query;

    // Calculate team metrics
    const teamMetrics = this.calculateTeamMetrics(entries || []);
    
    return teamMetrics;
  }

  /**
   * Get clients list
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Clients list
   */
  async getClients(params = {}) {
    const { active = true, type } = params;

    let query = supabase
      .from('clients')
      .select('*')
      .order('name');

    if (active !== null) query = query.eq('active', active);
    if (type) query = query.eq('type', type);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch clients: ${error.message}`);
    }

    return data;
  }

  /**
   * Get SEO accounts for employee
   * @param {string} employeeId - Employee ID
   * @returns {Promise<Array>} SEO accounts
   */
  async getEmployeeAccounts(employeeId) {
    const { data, error } = await supabase
      .from('seo_accounts')
      .select(`
        *,
        clients!inner(id, name, type, active)
      `)
      .eq('employee_id', employeeId)
      .eq('status', 'active');

    if (error) {
      throw new Error(`Failed to fetch SEO accounts: ${error.message}`);
    }

    return data;
  }

  /**
   * Validate entry data before submission
   * @param {Object} entry - Entry data
   */
  validateEntryData(entry) {
    const requiredFields = [
      'gsc_organic_prev_30d', 'gsc_organic_curr_30d',
      'ga_total_prev_30d', 'ga_total_curr_30d',
      'serp_top3_count', 'serp_top10_count',
      'pagespeed_home', 'pagespeed_service', 'pagespeed_location'
    ];

    const missingFields = requiredFields.filter(field => 
      entry[field] === null || entry[field] === undefined
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Calculate team metrics from entries
   * @param {Array} entries - Team entries
   * @returns {Object} Team metrics
   */
  calculateTeamMetrics(entries) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const approvedEntries = entries.filter(e => e.status === 'approved');
    const currentMonthEntries = entries.filter(e => e.month === currentMonth);
    
    const avgScore = approvedEntries.length > 0
      ? approvedEntries.reduce((sum, e) => sum + e.month_score, 0) / approvedEntries.length
      : 0;

    const lowPerformers = approvedEntries.filter(e => e.month_score < 65);
    
    return {
      totalEntries: entries.length,
      approvedEntries: approvedEntries.length,
      pendingReview: entries.filter(e => e.status === 'submitted').length,
      avgTeamScore: Math.round(avgScore * 100) / 100,
      lowPerformersCount: lowPerformers.length,
      currentMonthSubmissions: currentMonthEntries.length
    };
  }
}

export default new SEOApiService();