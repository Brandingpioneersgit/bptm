import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { TextField, TextArea } from '@/shared/components/ui';
import { LoadingButton } from '@/shared/components/LoadingButton';
import { useToast } from '@/shared/components/Toast';

export function RazorpayReimbursementForm({ applicationId, onSuccess, onCancel }) {
  const { supabase } = useSupabase();
  const { showToast } = useToast();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bankAccountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    upiId: '',
    preferredMethod: 'bank_transfer', // 'bank_transfer' or 'upi'
    panNumber: '',
    additionalNotes: ''
  });

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      
      if (!supabase) {
        // Fallback for local development
        const mockApplication = {
          id: applicationId,
          employee_name: 'John Doe',
          incentive_type_name: 'Hiring Recommendation',
          incentive_amount: 3000,
          status: 'approved'
        };
        setApplication(mockApplication);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('hr_incentive_approvals')
        .select('*')
        .eq('id', applicationId)
        .eq('status', 'approved')
        .single();

      if (error) {
        console.error('Error loading application:', error);
        showToast('Failed to load application details', 'error');
        return;
      }

      if (!data) {
        showToast('Application not found or not approved', 'error');
        return;
      }

      setApplication(data);
    } catch (error) {
      console.error('Error loading application:', error);
      showToast('Failed to load application', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!application) {
      showToast('Application data not available', 'error');
      return;
    }

    // Validate required fields
    if (formData.preferredMethod === 'bank_transfer') {
      if (!formData.bankAccountNumber || !formData.ifscCode || !formData.accountHolderName) {
        showToast('Please fill all required bank details', 'error');
        return;
      }
    } else if (formData.preferredMethod === 'upi') {
      if (!formData.upiId) {
        showToast('Please provide UPI ID', 'error');
        return;
      }
    }

    if (!formData.panNumber) {
      showToast('PAN number is required for tax purposes', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const reimbursementData = {
        application_id: applicationId,
        employee_name: application.employee_name,
        incentive_type: application.incentive_type_name,
        amount: application.incentive_amount,
        payment_method: formData.preferredMethod,
        bank_account_number: formData.preferredMethod === 'bank_transfer' ? formData.bankAccountNumber : null,
        ifsc_code: formData.preferredMethod === 'bank_transfer' ? formData.ifscCode : null,
        account_holder_name: formData.preferredMethod === 'bank_transfer' ? formData.accountHolderName : null,
        upi_id: formData.preferredMethod === 'upi' ? formData.upiId : null,
        pan_number: formData.panNumber,
        additional_notes: formData.additionalNotes,
        submission_date: new Date().toISOString(),
        status: 'submitted'
      };

      if (supabase) {
        // Update the incentive application with Razorpay form submission
        const { error: updateError } = await supabase
          .from('incentive_applications')
          .update({
            razorpay_form_submitted: true,
            razorpay_submission_date: new Date().toISOString(),
            status: 'processing_payment'
          })
          .eq('id', applicationId);

        if (updateError) {
          console.error('Error updating application:', updateError);
          showToast('Failed to update application status', 'error');
          return;
        }

        // Store reimbursement details (you might want to create a separate table for this)
        const { error: insertError } = await supabase
          .from('razorpay_reimbursements')
          .insert([reimbursementData]);

        if (insertError) {
          console.error('Error storing reimbursement data:', insertError);
          // Continue anyway as the main update succeeded
        }
      } else {
        // Fallback for local development
        console.log('Razorpay reimbursement form submitted:', reimbursementData);
        
        // Store in localStorage for demo purposes
        const existingData = JSON.parse(localStorage.getItem('razorpay_submissions') || '[]');
        existingData.push({
          ...reimbursementData,
          id: Date.now().toString()
        });
        localStorage.setItem('razorpay_submissions', JSON.stringify(existingData));
      }

      showToast('Reimbursement form submitted successfully! Payment will be processed within 3-5 business days.', 'success');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting reimbursement form:', error);
      showToast('Failed to submit reimbursement form', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading application details...</span>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">❌</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Application Not Found</h3>
        <p className="text-gray-600">The incentive application could not be found or is not approved.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-4">💰</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Razorpay Reimbursement Form</h1>
        <p className="text-gray-600">Submit your payment details for incentive reimbursement</p>
      </div>

      {/* Application Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-green-900 mb-2">✅ Approved Incentive</h3>
        <div className="text-sm text-green-800 space-y-1">
          <p><strong>Employee:</strong> {application.employee_name}</p>
          <p><strong>Incentive Type:</strong> {application.incentive_type_name}</p>
          <p><strong>Amount:</strong> ₹{application.incentive_amount}</p>
        </div>
      </div>

      {/* Reimbursement Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Payment Method *
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="bank_transfer"
                checked={formData.preferredMethod === 'bank_transfer'}
                onChange={(e) => setFormData({ ...formData, preferredMethod: e.target.value })}
                className="mr-2"
              />
              <span>Bank Transfer (NEFT/RTGS)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="upi"
                checked={formData.preferredMethod === 'upi'}
                onChange={(e) => setFormData({ ...formData, preferredMethod: e.target.value })}
                className="mr-2"
              />
              <span>UPI Transfer</span>
            </label>
          </div>
        </div>

        {/* Bank Transfer Details */}
        {formData.preferredMethod === 'bank_transfer' && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900">Bank Account Details</h4>
            
            <TextField
              label="Account Holder Name *"
              value={formData.accountHolderName}
              onChange={(value) => setFormData({ ...formData, accountHolderName: value })}
              placeholder="Enter account holder name as per bank records"
              required
            />
            
            <TextField
              label="Bank Account Number *"
              value={formData.bankAccountNumber}
              onChange={(value) => setFormData({ ...formData, bankAccountNumber: value })}
              placeholder="Enter bank account number"
              required
            />
            
            <TextField
              label="IFSC Code *"
              value={formData.ifscCode}
              onChange={(value) => setFormData({ ...formData, ifscCode: value.toUpperCase() })}
              placeholder="Enter IFSC code (e.g., SBIN0001234)"
              required
            />
          </div>
        )}

        {/* UPI Details */}
        {formData.preferredMethod === 'upi' && (
          <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900">UPI Details</h4>
            
            <TextField
              label="UPI ID *"
              value={formData.upiId}
              onChange={(value) => setFormData({ ...formData, upiId: value })}
              placeholder="Enter UPI ID (e.g., yourname@paytm, yourname@gpay)"
              required
            />
          </div>
        )}

        {/* PAN Number */}
        <TextField
          label="PAN Number *"
          value={formData.panNumber}
          onChange={(value) => setFormData({ ...formData, panNumber: value.toUpperCase() })}
          placeholder="Enter PAN number (required for tax purposes)"
          required
        />

        {/* Additional Notes */}
        <TextArea
          label="Additional Notes"
          value={formData.additionalNotes}
          onChange={(value) => setFormData({ ...formData, additionalNotes: value })}
          placeholder="Any additional information or special instructions..."
          rows={3}
        />

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">⚠️ Important Notice</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Payment will be processed within 3-5 business days</li>
            <li>• Ensure all details are accurate to avoid delays</li>
            <li>• TDS will be deducted as per applicable tax rates</li>
            <li>• You will receive a confirmation email once payment is processed</li>
          </ul>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <LoadingButton
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </LoadingButton>
          <LoadingButton
            type="submit"
            loading={submitting}
            variant="success"
            loadingText="Submitting..."
          >
            Submit Reimbursement Form
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}

export default RazorpayReimbursementForm;