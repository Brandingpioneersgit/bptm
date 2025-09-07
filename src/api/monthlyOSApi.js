import { supabase } from '@/database/supabaseClient';
import { InputSanitizer } from '@/shared/utils/securityUtils';
import { dataLockingManager } from '@/utils/dataLocking';

/**
 * Monthly Operating System API
 * 
 * Provides REST-like API functions for:
 * - Authentication
 * - Onboarding
 * - Monthly data CRUD
 * - Submission/approval workflow
 * - Reporting
 */

class MonthlyOSApi {
  constructor() {
    this.currentUser = null;
  }

  setCurrentUser(user) {
    this.currentUser = user;
    dataLockingManager.setCurrentUser(user);
  }

  // ==================== AUTHENTICATION ====================

  /**
   * POST /auth/login → token
   * Authenticate user and return session info
   */
  async login(credentials) {
    try {
      const { email, password, userType } = credentials;
      
      // Sanitize inputs
      const sanitizedEmail = InputSanitizer.sanitizeEmail(email);
      
      if (!sanitizedEmail || !password || !userType) {
        throw new Error('Email, password, and user type are required');
      }

      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: password
      });

      if (authError) throw authError;

      // Get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', sanitizedEmail)
        .eq('user_type', userType)
        .single();

      if (profileError) throw profileError;

      this.setCurrentUser(userProfile);

      return {
        success: true,
        user: userProfile,
        session: authData.session,
        token: authData.session.access_token
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  }

  /**
   * GET /me → user profile & role_label
   * Get current user profile
   */
  async getCurrentUser() {
    try {
      if (!this.currentUser) {
        // Try to get from Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          throw new Error('Not authenticated');
        }

        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (profileError) throw profileError;

        this.setCurrentUser(userProfile);
      }

      return {
        success: true,
        user: this.currentUser
      };

    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get user profile'
      };
    }
  }

  // ==================== ONBOARDING ====================

  /**
   * GET /onboarding
   * Get user's onboarding data (profile + mappings)
   */
  async getOnboardingData(userId = null) {
    try {
      const targetUserId = userId || this.currentUser?.id;
      
      if (!targetUserId) {
        throw new Error('User ID required');
      }

      // Get user profile
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (userError) throw userError;

      // Get entity mappings
      const { data: mappings, error: mappingsError } = await supabase
        .from('user_entity_mappings')
        .select(`
          *,
          entities (*)
        `)
        .eq('user_id', targetUserId)
        .eq('active', true);

      if (mappingsError) throw mappingsError;

      // Check if onboarding is locked
      const { data: approvedRows, error: lockError } = await supabase
        .from('monthly_rows')
        .select('id')
        .eq('user_id', targetUserId)
        .eq('status', 'approved')
        .limit(1);

      if (lockError) throw lockError;

      return {
        success: true,
        data: {
          profile: userProfile,
          entityMappings: mappings || [],
          isLocked: approvedRows && approvedRows.length > 0
        }
      };

    } catch (error) {
      console.error('Get onboarding data error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get onboarding data'
      };
    }
  }

  /**
   * POST /onboarding
   * Save onboarding data (profile + mappings)
   */
  async saveOnboardingData(onboardingData) {
    try {
      const { profile, entityMappings } = onboardingData;
      const userId = this.currentUser?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Check if onboarding is locked
      const currentData = await this.getOnboardingData(userId);
      if (currentData.success && currentData.data.isLocked) {
        throw new Error('Onboarding is locked and cannot be modified');
      }

      // Update user profile
      if (profile) {
        const sanitizedProfile = {
          name: InputSanitizer.sanitizeInput(profile.name?.trim()),
          phone: profile.phone ? InputSanitizer.sanitizePhone(profile.phone.trim()) : null,
          role_label: InputSanitizer.sanitizeInput(profile.roleLabel?.trim()),
          manager_id: profile.managerId || null,
          timezone: profile.timezone || 'Asia/Kolkata'
        };

        const { error: profileError } = await supabase
          .from('users')
          .update(sanitizedProfile)
          .eq('id', userId);

        if (profileError) throw profileError;
      }

      // Process entity mappings
      if (entityMappings && Array.isArray(entityMappings)) {
        for (const mapping of entityMappings) {
          let entityId = mapping.entity_id;
          
          // Create new entity if needed
          if (!entityId && mapping.entity_name) {
            const { data: newEntity, error: entityError } = await supabase
              .from('entities')
              .insert({
                entity_type: mapping.entity_type || 'Client',
                name: InputSanitizer.sanitizeInput(mapping.entity_name.trim()),
                scope_summary: mapping.scope_summary ? InputSanitizer.sanitizeInput(mapping.scope_summary.trim()) : null,
                start_date: mapping.start_date || new Date().toISOString().split('T')[0]
              })
              .select()
              .single();

            if (entityError) throw entityError;
            entityId = newEntity.id;
          }

          if (entityId) {
            const mappingData = {
              user_id: userId,
              entity_id: entityId,
              expected_projects: mapping.expected_projects || 0,
              expected_units: mapping.expected_units || 0,
              active: mapping.active !== false
            };

            if (mapping.isNew) {
              const { error: insertError } = await supabase
                .from('user_entity_mappings')
                .insert(mappingData);
              
              if (insertError) throw insertError;
            } else {
              const { error: updateError } = await supabase
                .from('user_entity_mappings')
                .update(mappingData)
                .eq('id', mapping.id);
              
              if (updateError) throw updateError;
            }
          }
        }
      }

      return {
        success: true,
        message: 'Onboarding data saved successfully'
      };

    } catch (error) {
      console.error('Save onboarding data error:', error);
      return {
        success: false,
        error: error.message || 'Failed to save onboarding data'
      };
    }
  }

  // ==================== MONTHLY DATA ====================

  /**
   * GET /monthly?month=&userId=
   * Get monthly rows (entity-grouped)
   */
  async getMonthlyData(month, userId = null) {
    try {
      const targetUserId = userId || this.currentUser?.id;
      
      if (!targetUserId) {
        throw new Error('User ID required');
      }

      if (!month) {
        throw new Error('Month parameter required (YYYY-MM format)');
      }

      const monthDate = `${month}-01`; // Convert YYYY-MM to YYYY-MM-01

      // Get monthly rows
      const { data: rows, error: rowsError } = await supabase
        .from('monthly_rows')
        .select(`
          *,
          entities (*),
          reviewer:reviewer_id (name, role_label)
        `)
        .eq('user_id', targetUserId)
        .eq('month', monthDate)
        .order('entity_id', { nullsFirst: true });

      if (rowsError) throw rowsError;

      // Get user's entity mappings for context
      const { data: mappings, error: mappingsError } = await supabase
        .from('user_entity_mappings')
        .select(`
          *,
          entities (*)
        `)
        .eq('user_id', targetUserId)
        .eq('active', true);

      if (mappingsError) throw mappingsError;

      return {
        success: true,
        data: {
          monthlyRows: rows || [],
          entityMappings: mappings || [],
          month: monthDate
        }
      };

    } catch (error) {
      console.error('Get monthly data error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get monthly data'
      };
    }
  }

  /**
   * POST /monthly
   * Create current month row
   */
  async createMonthlyRow(rowData) {
    try {
      const userId = this.currentUser?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { month, entity_id } = rowData;
      
      if (!month) {
        throw new Error('Month is required');
      }

      // Check if row already exists
      const { data: existingRow, error: checkError } = await supabase
        .from('monthly_rows')
        .select('id')
        .eq('user_id', userId)
        .eq('month', month)
        .eq('entity_id', entity_id || null)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw checkError;
      }

      if (existingRow) {
        throw new Error('Monthly row already exists for this entity and month');
      }

      // Create new row
      const newRowData = {
        user_id: userId,
        month: month,
        entity_id: entity_id || null,
        work_summary: rowData.work_summary || '',
        kpi_json: rowData.kpi_json || {},
        meetings_count: rowData.meetings_count || 0,
        meeting_links: rowData.meeting_links || [],
        client_satisfaction: rowData.client_satisfaction || null,
        learning_entries: rowData.learning_entries || [],
        learning_minutes: rowData.learning_minutes || 0,
        team_feedback: rowData.team_feedback || '',
        evidence_links: rowData.evidence_links || [],
        status: 'draft'
      };

      const { data: createdRow, error: createError } = await supabase
        .from('monthly_rows')
        .insert(newRowData)
        .select(`
          *,
          entities (*),
          reviewer:reviewer_id (name, role_label)
        `)
        .single();

      if (createError) throw createError;

      // Log audit entry
      await dataLockingManager.logAuditEntry(
        'monthly_rows',
        createdRow.id,
        'insert',
        { after: newRowData },
        userId
      );

      return {
        success: true,
        data: createdRow
      };

    } catch (error) {
      console.error('Create monthly row error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create monthly row'
      };
    }
  }

  /**
   * PUT /monthly/{id}
   * Edit current month row
   */
  async updateMonthlyRow(rowId, updates) {
    try {
      const userId = this.currentUser?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get current row
      const { data: currentRow, error: fetchError } = await supabase
        .from('monthly_rows')
        .select('*')
        .eq('id', rowId)
        .single();

      if (fetchError) throw fetchError;

      // Check edit permissions
      const editCheck = dataLockingManager.canEditMonthlyRow(currentRow, userId);
      if (!editCheck.canEdit) {
        throw new Error(editCheck.reason);
      }

      // Validate payment proof URLs if payment status is being updated
      if (updates.paymentStatus && updates.paymentProofUrl) {
        const paymentValidationErrors = [];
        Object.keys(updates.paymentStatus).forEach(clientId => {
          const status = updates.paymentStatus[clientId];
          const proofUrl = updates.paymentProofUrl[clientId] || '';
          
          if ((status === 'completed' || status === 'partial')) {
            if (!proofUrl.trim()) {
              paymentValidationErrors.push(`Client ${clientId}: Payment proof URL is required for ${status} status`);
            } else if (!/https?:\/\/(drive|docs)\.google\.com\//i.test(proofUrl)) {
              paymentValidationErrors.push(`Client ${clientId}: Payment proof must be a valid Google Drive URL`);
            }
          }
        });
        
        if (paymentValidationErrors.length > 0) {
          throw new Error(`Payment validation failed: ${paymentValidationErrors.join('; ')}`);
        }
      }

      // Sanitize updates
      const sanitizedUpdates = {
        ...updates,
        work_summary: updates.work_summary ? InputSanitizer.sanitizeInput(updates.work_summary) : updates.work_summary,
        team_feedback: updates.team_feedback ? InputSanitizer.sanitizeInput(updates.team_feedback) : updates.team_feedback,
        updated_at: new Date().toISOString()
      };

      // Remove fields that shouldn't be updated directly
      delete sanitizedUpdates.id;
      delete sanitizedUpdates.user_id;
      delete sanitizedUpdates.month;
      delete sanitizedUpdates.status;
      delete sanitizedUpdates.reviewer_id;
      delete sanitizedUpdates.review_notes;
      delete sanitizedUpdates.created_at;

      const { data: updatedRow, error: updateError } = await supabase
        .from('monthly_rows')
        .update(sanitizedUpdates)
        .eq('id', rowId)
        .select(`
          *,
          entities (*),
          reviewer:reviewer_id (name, role_label)
        `)
        .single();

      if (updateError) throw updateError;

      // Log audit entry
      await dataLockingManager.logAuditEntry(
        'monthly_rows',
        rowId,
        'update',
        {
          before: currentRow,
          after: updatedRow,
          changes: sanitizedUpdates
        },
        userId
      );

      return {
        success: true,
        data: updatedRow
      };

    } catch (error) {
      console.error('Update monthly row error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update monthly row'
      };
    }
  }

  /**
   * POST /monthly/{id}/submit
   * Submit monthly row for review
   */
  async submitMonthlyRow(rowId) {
    try {
      const userId = this.currentUser?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const updatedRow = await dataLockingManager.updateMonthlyRowStatus(
        rowId,
        'submitted',
        '',
        userId
      );

      return {
        success: true,
        data: updatedRow,
        message: 'Monthly row submitted for review'
      };

    } catch (error) {
      console.error('Submit monthly row error:', error);
      return {
        success: false,
        error: error.message || 'Failed to submit monthly row'
      };
    }
  }

  /**
   * POST /monthly/{id}/approve
   * Approve monthly row (manager only)
   */
  async approveMonthlyRow(rowId, reviewNotes = '') {
    try {
      const reviewerId = this.currentUser?.id;
      
      if (!reviewerId) {
        throw new Error('Reviewer not authenticated');
      }

      const updatedRow = await dataLockingManager.updateMonthlyRowStatus(
        rowId,
        'approved',
        reviewNotes,
        reviewerId
      );

      return {
        success: true,
        data: updatedRow,
        message: 'Monthly row approved successfully'
      };

    } catch (error) {
      console.error('Approve monthly row error:', error);
      return {
        success: false,
        error: error.message || 'Failed to approve monthly row'
      };
    }
  }

  // ==================== ATTENDANCE ====================

  /**
   * POST /attendance/daily:bulk
   * Bulk update daily attendance
   */
  async updateDailyAttendance(attendanceData) {
    try {
      const userId = this.currentUser?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (!Array.isArray(attendanceData)) {
        throw new Error('Attendance data must be an array');
      }

      const processedData = attendanceData.map(entry => ({
        user_id: userId,
        day: entry.day,
        presence: entry.presence,
        morning_meeting_attended: entry.morning_meeting_attended || false
      }));

      const { data, error } = await supabase
        .from('attendance_daily')
        .upsert(processedData, {
          onConflict: 'user_id,day'
        });

      if (error) throw error;

      return {
        success: true,
        data: data,
        message: 'Daily attendance updated successfully'
      };

    } catch (error) {
      console.error('Update daily attendance error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update daily attendance'
      };
    }
  }

  // ==================== REPORTING ====================

  /**
   * GET /reports/user-month?userId=&month=
   * Get comprehensive user-month report
   */
  async getUserMonthReport(month, userId = null) {
    try {
      const targetUserId = userId || this.currentUser?.id;
      
      if (!targetUserId) {
        throw new Error('User ID required');
      }

      if (!month) {
        throw new Error('Month parameter required (YYYY-MM format)');
      }

      const monthDate = `${month}-01`;

      // Get monthly data
      const monthlyResult = await this.getMonthlyData(month, targetUserId);
      if (!monthlyResult.success) {
        throw new Error(monthlyResult.error);
      }

      // Get attendance data
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_monthly_cache')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('month', monthDate)
        .single();

      // Get audit history
      const auditHistory = await dataLockingManager.getAuditHistory('monthly_rows', null);

      return {
        success: true,
        data: {
          ...monthlyResult.data,
          attendance: attendanceData || null,
          auditHistory: auditHistory.filter(entry => 
            monthlyResult.data.monthlyRows.some(row => row.id === entry.row_id)
          )
        }
      };

    } catch (error) {
      console.error('Get user month report error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get user month report'
      };
    }
  }
}

// Export singleton instance
export const monthlyOSApi = new MonthlyOSApi();

export default monthlyOSApi;