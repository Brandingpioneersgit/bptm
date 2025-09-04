import { supabase } from '@/database/supabaseClient';

/**
 * Data Locking Utility for Monthly Operating System
 * 
 * Rules:
 * - Past months: locked (read-only)
 * - Current month: editable until approved
 * - All transitions audited
 * - Unlock requires manager + reason
 */

class DataLockingManager {
  constructor() {
    this.currentUser = null;
  }

  setCurrentUser(user) {
    this.currentUser = user;
  }

  /**
   * Check if a monthly row can be edited
   * @param {Object} monthlyRow - The monthly row object
   * @param {string} userId - Current user ID
   * @returns {Object} { canEdit: boolean, reason: string }
   */
  canEditMonthlyRow(monthlyRow, userId = null) {
    const currentUserId = userId || this.currentUser?.id;
    
    if (!currentUserId) {
      return { canEdit: false, reason: 'User not authenticated' };
    }

    // Only the owner can edit their own rows
    if (monthlyRow.user_id !== currentUserId) {
      return { canEdit: false, reason: 'Can only edit your own monthly rows' };
    }

    // Cannot edit approved rows
    if (monthlyRow.status === 'approved') {
      return { canEdit: false, reason: 'Approved rows are locked and cannot be edited' };
    }

    // Check if month is in the past
    const rowMonth = new Date(monthlyRow.month);
    const currentMonth = new Date();
    currentMonth.setDate(1); // First day of current month
    currentMonth.setHours(0, 0, 0, 0);

    if (rowMonth < currentMonth) {
      return { canEdit: false, reason: 'Past months are locked and cannot be edited' };
    }

    return { canEdit: true, reason: 'Row is editable' };
  }

  /**
   * Check if a user can approve a monthly row
   * @param {Object} monthlyRow - The monthly row object
   * @param {string} reviewerId - Reviewer user ID
   * @returns {Object} { canApprove: boolean, reason: string }
   */
  async canApproveMonthlyRow(monthlyRow, reviewerId = null) {
    const currentReviewerId = reviewerId || this.currentUser?.id;
    
    if (!currentReviewerId) {
      return { canApprove: false, reason: 'Reviewer not authenticated' };
    }

    // Cannot approve your own rows
    if (monthlyRow.user_id === currentReviewerId) {
      return { canApprove: false, reason: 'Cannot approve your own monthly rows' };
    }

    // Row must be submitted
    if (monthlyRow.status !== 'submitted') {
      return { canApprove: false, reason: 'Row must be submitted before approval' };
    }

    // Check if reviewer has permission (manager/supervisor)
    try {
      const { data: reviewer, error } = await supabase
        .from('users')
        .select('role_label, id')
        .eq('id', currentReviewerId)
        .single();

      if (error) throw error;

      const managerRoles = ['Manager', 'Supervisor', 'Team Lead', 'Admin'];
      if (!managerRoles.some(role => reviewer.role_label?.includes(role))) {
        return { canApprove: false, reason: 'Only managers can approve monthly rows' };
      }

      // Check if reviewer is the user's manager or has authority
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('manager_id')
        .eq('id', monthlyRow.user_id)
        .single();

      if (userError) throw userError;

      if (user.manager_id !== currentReviewerId && !reviewer.role_label?.includes('Admin')) {
        return { canApprove: false, reason: 'Can only approve rows for your direct reports' };
      }

      return { canApprove: true, reason: 'Reviewer has approval authority' };

    } catch (error) {
      console.error('Error checking approval permissions:', error);
      return { canApprove: false, reason: 'Error checking approval permissions' };
    }
  }

  /**
   * Log an audit entry for data changes
   * @param {string} tableName - Name of the table being modified
   * @param {string} rowId - ID of the row being modified
   * @param {string} action - Type of action (insert/update/status_change/approve/unlock)
   * @param {Object} diff - Before/after data
   * @param {string} userId - User performing the action
   */
  async logAuditEntry(tableName, rowId, action, diff = {}, userId = null) {
    try {
      const currentUserId = userId || this.currentUser?.id;
      
      if (!currentUserId) {
        console.warn('Cannot log audit entry: User not authenticated');
        return;
      }

      const auditEntry = {
        table_name: tableName,
        row_id: rowId,
        user_id: currentUserId,
        action: action,
        diff: diff,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('change_audit')
        .insert(auditEntry);

      if (error) {
        console.error('Failed to log audit entry:', error);
      }

    } catch (error) {
      console.error('Error logging audit entry:', error);
    }
  }

  /**
   * Update monthly row status with audit logging
   * @param {string} rowId - Monthly row ID
   * @param {string} newStatus - New status (draft/submitted/approved)
   * @param {string} reviewNotes - Optional review notes
   * @param {string} userId - User performing the action
   */
  async updateMonthlyRowStatus(rowId, newStatus, reviewNotes = '', userId = null) {
    try {
      const currentUserId = userId || this.currentUser?.id;
      
      // Get current row data
      const { data: currentRow, error: fetchError } = await supabase
        .from('monthly_rows')
        .select('*')
        .eq('id', rowId)
        .single();

      if (fetchError) throw fetchError;

      // Check permissions based on action
      if (newStatus === 'approved') {
        const approvalCheck = await this.canApproveMonthlyRow(currentRow, currentUserId);
        if (!approvalCheck.canApprove) {
          throw new Error(approvalCheck.reason);
        }
      } else {
        const editCheck = this.canEditMonthlyRow(currentRow, currentUserId);
        if (!editCheck.canEdit) {
          throw new Error(editCheck.reason);
        }
      }

      // Prepare update data
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'approved') {
        updateData.reviewer_id = currentUserId;
        updateData.review_notes = reviewNotes;
      }

      // Update the row
      const { data: updatedRow, error: updateError } = await supabase
        .from('monthly_rows')
        .update(updateData)
        .eq('id', rowId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Log audit entry
      await this.logAuditEntry(
        'monthly_rows',
        rowId,
        newStatus === 'approved' ? 'approve' : 'status_change',
        {
          before: { status: currentRow.status, reviewer_id: currentRow.reviewer_id },
          after: { status: newStatus, reviewer_id: updateData.reviewer_id }
        },
        currentUserId
      );

      return updatedRow;

    } catch (error) {
      console.error('Error updating monthly row status:', error);
      throw error;
    }
  }

  /**
   * Unlock a monthly row (manager override)
   * @param {string} rowId - Monthly row ID
   * @param {string} reason - Reason for unlocking
   * @param {string} managerId - Manager performing the unlock
   */
  async unlockMonthlyRow(rowId, reason, managerId = null) {
    try {
      const currentManagerId = managerId || this.currentUser?.id;
      
      if (!currentManagerId) {
        throw new Error('Manager not authenticated');
      }

      // Verify manager permissions
      const { data: manager, error: managerError } = await supabase
        .from('users')
        .select('role_label')
        .eq('id', currentManagerId)
        .single();

      if (managerError) throw managerError;

      const managerRoles = ['Manager', 'Supervisor', 'Team Lead', 'Admin'];
      if (!managerRoles.some(role => manager.role_label?.includes(role))) {
        throw new Error('Only managers can unlock monthly rows');
      }

      // Get current row
      const { data: currentRow, error: fetchError } = await supabase
        .from('monthly_rows')
        .select('*')
        .eq('id', rowId)
        .single();

      if (fetchError) throw fetchError;

      // Reset status to draft
      const { data: updatedRow, error: updateError } = await supabase
        .from('monthly_rows')
        .update({
          status: 'draft',
          reviewer_id: null,
          review_notes: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', rowId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Log audit entry
      await this.logAuditEntry(
        'monthly_rows',
        rowId,
        'unlock',
        {
          reason: reason,
          before: { status: currentRow.status, reviewer_id: currentRow.reviewer_id },
          after: { status: 'draft', reviewer_id: null }
        },
        currentManagerId
      );

      return updatedRow;

    } catch (error) {
      console.error('Error unlocking monthly row:', error);
      throw error;
    }
  }

  /**
   * Get audit history for a specific row
   * @param {string} tableName - Table name
   * @param {string} rowId - Row ID
   * @returns {Array} Audit entries
   */
  async getAuditHistory(tableName, rowId) {
    try {
      const { data, error } = await supabase
        .from('change_audit')
        .select(`
          *,
          user:user_id (name, role_label)
        `)
        .eq('table_name', tableName)
        .eq('row_id', rowId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Error fetching audit history:', error);
      return [];
    }
  }

  /**
   * Check if current month data exists and create if needed
   * @param {string} userId - User ID
   * @returns {Object} Status of current month setup
   */
  async ensureCurrentMonthSetup(userId = null) {
    try {
      const currentUserId = userId || this.currentUser?.id;
      
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }

      const currentMonth = new Date();
      const monthString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-01`;

      // Check if user has any monthly rows for current month
      const { data: existingRows, error: fetchError } = await supabase
        .from('monthly_rows')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('month', monthString);

      if (fetchError) throw fetchError;

      return {
        hasCurrentMonthData: existingRows && existingRows.length > 0,
        currentMonth: monthString,
        rowCount: existingRows ? existingRows.length : 0
      };

    } catch (error) {
      console.error('Error checking current month setup:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const dataLockingManager = new DataLockingManager();

// Export utility functions
export const DataLockingUtils = {
  canEditMonthlyRow: (monthlyRow, userId) => dataLockingManager.canEditMonthlyRow(monthlyRow, userId),
  canApproveMonthlyRow: (monthlyRow, reviewerId) => dataLockingManager.canApproveMonthlyRow(monthlyRow, reviewerId),
  logAuditEntry: (tableName, rowId, action, diff, userId) => dataLockingManager.logAuditEntry(tableName, rowId, action, diff, userId),
  updateMonthlyRowStatus: (rowId, newStatus, reviewNotes, userId) => dataLockingManager.updateMonthlyRowStatus(rowId, newStatus, reviewNotes, userId),
  unlockMonthlyRow: (rowId, reason, managerId) => dataLockingManager.unlockMonthlyRow(rowId, reason, managerId),
  getAuditHistory: (tableName, rowId) => dataLockingManager.getAuditHistory(tableName, rowId),
  ensureCurrentMonthSetup: (userId) => dataLockingManager.ensureCurrentMonthSetup(userId)
};

export default dataLockingManager;