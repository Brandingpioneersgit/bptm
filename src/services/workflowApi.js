// Workflow API for managing row status transitions
// Draft → Submit → Approve with manager return and unlock capabilities

import { supabase } from '../database/supabaseClient';

class WorkflowApi {
  // Submit a monthly row for review
  async submitMonthlyRow(monthlyRowId, userId) {
    try {
      const { data: row, error: fetchError } = await supabase
        .from('monthly_rows')
        .select('*')
        .eq('id', monthlyRowId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;
      
      if (row.status !== 'draft' && row.status !== 'returned') {
        throw new Error('Only draft or returned rows can be submitted');
      }

      const { data, error } = await supabase
        .from('monthly_rows')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', monthlyRowId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Log the submission in change audit
      await this.logWorkflowChange({
        table_name: 'monthly_rows',
        record_id: monthlyRowId,
        field_name: 'status',
        old_value: row.status,
        new_value: 'submitted',
        changed_by: userId,
        change_reason: 'Row submitted for review'
      });

      return data;
    } catch (error) {
      console.error('Error submitting monthly row:', error);
      throw error;
    }
  }

  // Approve a monthly row (manager only)
  async approveMonthlyRow(monthlyRowId, managerId, reviewNotes = '') {
    try {
      const { data: row, error: fetchError } = await supabase
        .from('monthly_rows')
        .select('*, users!monthly_rows_user_id_fkey(manager_id)')
        .eq('id', monthlyRowId)
        .single();

      if (fetchError) throw fetchError;
      
      // Verify manager permission
      if (row.users.manager_id !== managerId) {
        throw new Error('Only the assigned manager can approve this row');
      }
      
      if (row.status !== 'submitted') {
        throw new Error('Only submitted rows can be approved');
      }

      const { data, error } = await supabase
        .from('monthly_rows')
        .update({
          status: 'approved',
          reviewer: managerId,
          review_notes: reviewNotes,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', monthlyRowId)
        .select()
        .single();

      if (error) throw error;

      // Log the approval in change audit
      await this.logWorkflowChange({
        table_name: 'monthly_rows',
        record_id: monthlyRowId,
        field_name: 'status',
        old_value: 'submitted',
        new_value: 'approved',
        changed_by: managerId,
        change_reason: `Row approved${reviewNotes ? ': ' + reviewNotes : ''}`
      });

      return data;
    } catch (error) {
      console.error('Error approving monthly row:', error);
      throw error;
    }
  }

  // Return a monthly row to employee (manager only)
  async returnMonthlyRow(monthlyRowId, managerId, returnReason) {
    try {
      if (!returnReason || returnReason.trim().length === 0) {
        throw new Error('Return reason is required');
      }

      const { data: row, error: fetchError } = await supabase
        .from('monthly_rows')
        .select('*, users!monthly_rows_user_id_fkey(manager_id)')
        .eq('id', monthlyRowId)
        .single();

      if (fetchError) throw fetchError;
      
      // Verify manager permission
      if (row.users.manager_id !== managerId) {
        throw new Error('Only the assigned manager can return this row');
      }
      
      if (row.status !== 'submitted') {
        throw new Error('Only submitted rows can be returned');
      }

      const { data, error } = await supabase
        .from('monthly_rows')
        .update({
          status: 'returned',
          reviewer: managerId,
          review_notes: returnReason,
          returned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', monthlyRowId)
        .select()
        .single();

      if (error) throw error;

      // Log the return in change audit
      await this.logWorkflowChange({
        table_name: 'monthly_rows',
        record_id: monthlyRowId,
        field_name: 'status',
        old_value: 'submitted',
        new_value: 'returned',
        changed_by: managerId,
        change_reason: `Row returned: ${returnReason}`
      });

      return data;
    } catch (error) {
      console.error('Error returning monthly row:', error);
      throw error;
    }
  }

  // Request unlock for approved row (requires manager approval)
  async requestUnlock(monthlyRowId, userId, unlockReason) {
    try {
      if (!unlockReason || unlockReason.trim().length === 0) {
        throw new Error('Unlock reason is required');
      }

      const { data: row, error: fetchError } = await supabase
        .from('monthly_rows')
        .select('*, users!monthly_rows_user_id_fkey(manager_id)')
        .eq('id', monthlyRowId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;
      
      if (row.status !== 'approved') {
        throw new Error('Only approved rows can be unlocked');
      }

      // Create unlock request
      const { data: unlockRequest, error: requestError } = await supabase
        .from('unlock_requests')
        .insert({
          monthly_row_id: monthlyRowId,
          requested_by: userId,
          manager_id: row.users.manager_id,
          unlock_reason: unlockReason,
          status: 'pending',
          requested_at: new Date().toISOString()
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Log the unlock request
      await this.logWorkflowChange({
        table_name: 'monthly_rows',
        record_id: monthlyRowId,
        field_name: 'unlock_request',
        old_value: null,
        new_value: 'requested',
        changed_by: userId,
        change_reason: `Unlock requested: ${unlockReason}`
      });

      return unlockRequest;
    } catch (error) {
      console.error('Error requesting unlock:', error);
      throw error;
    }
  }

  // Approve unlock request (manager only)
  async approveUnlock(unlockRequestId, managerId) {
    try {
      const { data: request, error: fetchError } = await supabase
        .from('unlock_requests')
        .select('*, monthly_rows(*)')
        .eq('id', unlockRequestId)
        .eq('manager_id', managerId)
        .single();

      if (fetchError) throw fetchError;
      
      if (request.status !== 'pending') {
        throw new Error('Only pending unlock requests can be approved');
      }

      // Start transaction-like operations
      const { error: requestUpdateError } = await supabase
        .from('unlock_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: managerId
        })
        .eq('id', unlockRequestId);

      if (requestUpdateError) throw requestUpdateError;

      // Unlock the monthly row
      const { data: unlockedRow, error: unlockError } = await supabase
        .from('monthly_rows')
        .update({
          status: 'draft',
          unlocked_at: new Date().toISOString(),
          unlocked_by: managerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.monthly_row_id)
        .select()
        .single();

      if (unlockError) throw unlockError;

      // Log the unlock approval
      await this.logWorkflowChange({
        table_name: 'monthly_rows',
        record_id: request.monthly_row_id,
        field_name: 'status',
        old_value: 'approved',
        new_value: 'draft',
        changed_by: managerId,
        change_reason: `Row unlocked by manager: ${request.unlock_reason}`
      });

      return { unlockRequest: request, monthlyRow: unlockedRow };
    } catch (error) {
      console.error('Error approving unlock:', error);
      throw error;
    }
  }

  // Reject unlock request (manager only)
  async rejectUnlock(unlockRequestId, managerId, rejectionReason = '') {
    try {
      const { data: request, error: fetchError } = await supabase
        .from('unlock_requests')
        .select('*')
        .eq('id', unlockRequestId)
        .eq('manager_id', managerId)
        .single();

      if (fetchError) throw fetchError;
      
      if (request.status !== 'pending') {
        throw new Error('Only pending unlock requests can be rejected');
      }

      const { data, error } = await supabase
        .from('unlock_requests')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: managerId,
          rejection_reason: rejectionReason
        })
        .eq('id', unlockRequestId)
        .select()
        .single();

      if (error) throw error;

      // Log the unlock rejection
      await this.logWorkflowChange({
        table_name: 'monthly_rows',
        record_id: request.monthly_row_id,
        field_name: 'unlock_request',
        old_value: 'requested',
        new_value: 'rejected',
        changed_by: managerId,
        change_reason: `Unlock rejected${rejectionReason ? ': ' + rejectionReason : ''}`
      });

      return data;
    } catch (error) {
      console.error('Error rejecting unlock:', error);
      throw error;
    }
  }

  // Get pending unlock requests for a manager
  async getPendingUnlockRequests(managerId) {
    try {
      const { data, error } = await supabase
        .from('unlock_requests')
        .select(`
          *,
          monthly_rows(
            id,
            year,
            month,
            work_summary,
            users!monthly_rows_user_id_fkey(
              id,
              full_name,
              email
            )
          )
        `)
        .eq('manager_id', managerId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching pending unlock requests:', error);
      throw error;
    }
  }

  // Get rows pending review for a manager
  async getRowsPendingReview(managerId) {
    try {
      const { data, error } = await supabase
        .from('monthly_rows')
        .select(`
          *,
          users!monthly_rows_user_id_fkey(
            id,
            full_name,
            email
          ),
          entities(
            id,
            name,
            type
          )
        `)
        .eq('users.manager_id', managerId)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching rows pending review:', error);
      throw error;
    }
  }

  // Get workflow history for a monthly row
  async getWorkflowHistory(monthlyRowId) {
    try {
      const { data, error } = await supabase
        .from('change_audit')
        .select(`
          *,
          users!change_audit_changed_by_fkey(
            full_name,
            email
          )
        `)
        .eq('table_name', 'monthly_rows')
        .eq('record_id', monthlyRowId)
        .in('field_name', ['status', 'unlock_request'])
        .order('changed_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching workflow history:', error);
      throw error;
    }
  }

  // Get workflow statistics for reporting
  async getWorkflowStats(year, month = null) {
    try {
      let query = supabase
        .from('monthly_rows')
        .select('status, submitted_at, approved_at')
        .eq('year', year);

      if (month) {
        query = query.eq('month', month);
      }

      const { data: rows, error } = await query;
      if (error) throw error;

      // Calculate statistics
      const stats = {
        total_rows: rows.length,
        draft: rows.filter(r => r.status === 'draft').length,
        submitted: rows.filter(r => r.status === 'submitted').length,
        approved: rows.filter(r => r.status === 'approved').length,
        returned: rows.filter(r => r.status === 'returned').length,
        submission_rate: 0,
        avg_approval_time_hours: 0
      };

      const submittedRows = rows.filter(r => r.submitted_at);
      stats.submission_rate = stats.total_rows > 0 ? (submittedRows.length / stats.total_rows) * 100 : 0;

      // Calculate average approval time
      const approvedRows = rows.filter(r => r.approved_at && r.submitted_at);
      if (approvedRows.length > 0) {
        const totalApprovalTime = approvedRows.reduce((sum, row) => {
          const submitted = new Date(row.submitted_at);
          const approved = new Date(row.approved_at);
          return sum + (approved - submitted);
        }, 0);
        stats.avg_approval_time_hours = (totalApprovalTime / approvedRows.length) / (1000 * 60 * 60);
      }

      return stats;
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
      throw error;
    }
  }

  // Helper method to log workflow changes
  async logWorkflowChange(changeData) {
    try {
      const { error } = await supabase
        .from('change_audit')
        .insert({
          ...changeData,
          changed_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging workflow change:', error);
      // Don't throw here to avoid breaking the main workflow
    }
  }

  // Bulk approve multiple rows (manager only)
  async bulkApproveRows(monthlyRowIds, managerId, reviewNotes = '') {
    try {
      const results = [];
      const errors = [];

      for (const rowId of monthlyRowIds) {
        try {
          const result = await this.approveMonthlyRow(rowId, managerId, reviewNotes);
          results.push(result);
        } catch (error) {
          errors.push({ rowId, error: error.message });
        }
      }

      return { results, errors };
    } catch (error) {
      console.error('Error in bulk approve:', error);
      throw error;
    }
  }
}

export const workflowApi = new WorkflowApi();
export default workflowApi;