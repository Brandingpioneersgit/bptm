import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useToast } from '@/shared/components/Toast';

export const useFetchSubmissions = () => {
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { supabase } = useSupabase();
  const { notify } = useToast();

  const fetchSubmissions = useCallback(async () => {
    if (!supabase) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch submissions and employees separately to avoid foreign key issues
      const [submissionsResult, employeesResult] = await Promise.all([
        supabase
          .from('submissions')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('employees')
          .select('id, name, email, role, department, phone')
      ]);

      if (submissionsResult.error) {
        throw submissionsResult.error;
      }

      if (employeesResult.error) {
        console.warn('Could not fetch employees:', employeesResult.error.message);
      }

      // Manually join submissions with employees based on name and phone
      const submissions = submissionsResult.data || [];
      const employees = employeesResult.data || [];
      
      const enrichedSubmissions = submissions.map(submission => {
        // Try to find matching employee by name and phone
        const matchingEmployee = employees.find(emp => 
          emp.name === submission.employee_name && 
          emp.phone === submission.employee_phone
        );
        
        return {
          ...submission,
          employees: matchingEmployee || {
            id: null,
            name: submission.employee_name,
            email: null,
            role: submission.role,
            department: submission.department,
            phone: submission.employee_phone
          }
        };
      });

      const data = enrichedSubmissions;

      setAllSubmissions(data || []);
      setSubmissions(data || []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError(err.message);
      notify({
        title: 'Error fetching submissions',
        message: err.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, notify]);

  const refreshSubmissions = useCallback(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const addSubmission = useCallback(async (submissionData) => {
    if (!supabase) return null;
    
    try {
      // Validate payment proof URLs before submission
      if (submissionData.paymentStatus && submissionData.paymentProofUrl) {
        const paymentValidationErrors = [];
        Object.keys(submissionData.paymentStatus).forEach(clientId => {
          const status = submissionData.paymentStatus[clientId];
          const proofUrl = submissionData.paymentProofUrl[clientId] || '';
          
          if ((status === 'completed' || status === 'partial')) {
            if (!proofUrl.trim()) {
              paymentValidationErrors.push(`Client ${clientId}: Payment proof URL is required for ${status} status`);
            } else if (!/https?:\/\/(drive|docs)\.google\.com\//i.test(proofUrl)) {
              paymentValidationErrors.push(`Client ${clientId}: Payment proof must be a valid Google Drive URL`);
            }
          }
        });
        
        if (paymentValidationErrors.length > 0) {
          throw new Error(`Payment validation failed: ${paymentValidationErrors.join(', ')}`);
        }
      }
      
      const { data, error: insertError } = await supabase
        .from('submissions')
        .insert([submissionData])
        .select(`
          *,
          employees (
            id,
            name,
            email,
            role,
            department
          )
        `)
        .single();

      if (insertError) {
        throw insertError;
      }

      setAllSubmissions(prev => [data, ...prev]);
      setSubmissions(prev => [data, ...prev]);
      
      notify({
        title: 'Submission added successfully',
        variant: 'default'
      });
      
      return data;
    } catch (err) {
      console.error('Error adding submission:', err);
      notify({
        title: 'Error adding submission',
        description: err.message,
        variant: 'destructive'
      });
      throw err;
    }
  }, [supabase, notify]);

  const updateSubmission = useCallback(async (id, updates) => {
    if (!supabase) return null;
    
    try {
      // Validate payment proof URLs before update
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
          throw new Error(`Payment validation failed: ${paymentValidationErrors.join(', ')}`);
        }
      }
      
      const { data, error: updateError } = await supabase
        .from('submissions')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          employees (
            id,
            name,
            email,
            role,
            department
          )
        `)
        .single();

      if (updateError) {
        throw updateError;
      }

      setAllSubmissions(prev => 
        prev.map(submission => 
          submission.id === id ? data : submission
        )
      );
      setSubmissions(prev => 
        prev.map(submission => 
          submission.id === id ? data : submission
        )
      );
      
      notify({
        title: 'Submission updated successfully',
        variant: 'default'
      });
      
      return data;
    } catch (err) {
      console.error('Error updating submission:', err);
      notify({
        title: 'Error updating submission',
        description: err.message,
        variant: 'destructive'
      });
      throw err;
    }
  }, [supabase, notify]);

  const deleteSubmission = useCallback(async (id) => {
    if (!supabase) return;
    
    try {
      const { error: deleteError } = await supabase
        .from('submissions')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setAllSubmissions(prev => prev.filter(submission => submission.id !== id));
      setSubmissions(prev => prev.filter(submission => submission.id !== id));
      
      notify({
        title: 'Submission deleted successfully',
        variant: 'default'
      });
    } catch (err) {
      console.error('Error deleting submission:', err);
      notify({
        title: 'Error deleting submission',
        description: err.message,
        variant: 'destructive'
      });
      throw err;
    }
  }, [supabase, notify]);

  const filterSubmissions = useCallback((filters) => {
    let filtered = allSubmissions;
    
    if (filters.employeeId) {
      filtered = filtered.filter(sub => sub.employee_id === filters.employeeId);
    }
    
    if (filters.status) {
      filtered = filtered.filter(sub => sub.status === filters.status);
    }
    
    if (filters.dateFrom) {
      filtered = filtered.filter(sub => 
        new Date(sub.created_at) >= new Date(filters.dateFrom)
      );
    }
    
    if (filters.dateTo) {
      filtered = filtered.filter(sub => 
        new Date(sub.created_at) <= new Date(filters.dateTo)
      );
    }
    
    setSubmissions(filtered);
  }, [allSubmissions]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return {
    allSubmissions,
    submissions,
    loading,
    error,
    refreshSubmissions,
    addSubmission,
    updateSubmission,
    deleteSubmission,
    filterSubmissions
  };
};

export default useFetchSubmissions;