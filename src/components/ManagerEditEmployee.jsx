import React, { useMemo, useState, useEffect } from "react";
import { useSupabase } from "./SupabaseProvider";
import { useFetchSubmissions } from "./useFetchSubmissions.js";
import { useModal } from "./AppShell";
import { monthLabel } from "./constants";

export function ManagerEditEmployee({ employee, onBack }) {
  const supabase = useSupabase();
  const { allSubmissions, refreshSubmissions } = useFetchSubmissions();
  const { openModal, closeModal } = useModal();
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [managerRemarks, setManagerRemarks] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [newClient, setNewClient] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const employeeSubmissions = useMemo(() => {
    return allSubmissions.filter(s =>
      s.employee?.name === employee.name &&
      s.employee?.phone === employee.phone &&
      !s.isDraft
    ).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [allSubmissions, employee]);

  useEffect(() => {
    if (employeeSubmissions.length > 0) {
      setTestimonials(employeeSubmissions[0].employee?.testimonials || []);
    }
  }, [employeeSubmissions]);

  const updateTestimonials = async (updated) => {
    if (!supabase) return;
    try {
      const baseEmployee = employeeSubmissions[0]?.employee || {};
      const updatedEmployee = { ...baseEmployee, testimonials: updated };
      const { error } = await supabase
        .from('submissions')
        .update({ employee: updatedEmployee })
        .eq('employee->>phone', employee.phone)
        .eq('employee->>name', employee.name);
      if (error) throw error;
      setTestimonials(updated);
      refreshSubmissions();
      openModal('Success', 'Testimonials updated', closeModal);
    } catch (e) {
      openModal('Error', `Failed to update testimonials: ${e.message}`, closeModal);
    }
  };

  const addTestimonial = async () => {
    if (!newUrl || !newClient) return;
    await updateTestimonials([...testimonials, { url: newUrl, client: newClient }]);
    setNewClient('');
    setNewUrl('');
  };

  const removeTestimonial = async (idx) => {
    const updated = testimonials.filter((_, i) => i !== idx);
    await updateTestimonials(updated);
  };

  const handleEditSubmission = (submission) => {
    setSelectedSubmission(submission);
    setManagerRemarks(submission.manager_remarks || '');
    setIsEditing(true);
  };

  const saveManagerRemarks = async () => {
    if (!selectedSubmission || !supabase) return;

    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          manager_remarks: managerRemarks,
          manager_edited_at: new Date().toISOString(),
          manager_edited_by: 'Manager'
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      openModal('Success', 'Manager remarks saved successfully!', () => {
        closeModal();
        setIsEditing(false);
        setSelectedSubmission(null);
        refreshSubmissions();
      });
    } catch (error) {
      openModal('Error', `Failed to save remarks: ${error.message}`, closeModal);
    }
  };

  const deleteSubmission = async (submission) => {
    if (!supabase) return;

    openModal(
      'Confirm Delete',
      `Are you sure you want to delete ${employee.name}'s submission for ${monthLabel(submission.monthKey)}? This action cannot be undone.`,
      async () => {
        try {
          const { error } = await supabase
            .from('submissions')
            .delete()
            .eq('id', submission.id);

          if (error) throw error;

          openModal('Success', 'Submission deleted successfully!', () => {
            closeModal();
            refreshSubmissions();
          });
        } catch (error) {
          openModal('Error', `Failed to delete submission: ${error.message}`, closeModal);
        }
      },
      closeModal
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Employee Data</h1>
            <p className="text-gray-600">{employee.name} - {employee.phone}</p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4">Testimonials</h3>
        {testimonials.length === 0 ? (
          <p className="text-sm text-gray-600">No testimonials added.</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {testimonials.map((t, idx) => (
              <li key={idx} className="flex items-center justify-between">
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                  title={t.client}
                >
                  {t.client}
                </a>
                <button
                  onClick={() => removeTestimonial(idx)}
                  className="text-red-600 text-sm"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <input
            type="text"
            value={newClient}
            onChange={e => setNewClient(e.target.value)}
            placeholder="Client name"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            placeholder="YouTube URL"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={addTestimonial}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4">Employee Submissions</h3>
        
        {employeeSubmissions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-600">No completed submissions found for this employee.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {employeeSubmissions.map((submission, index) => (
              <div key={submission.id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{monthLabel(submission.monthKey)}</h4>
                    <p className="text-sm text-gray-600">
                      Score: {submission.scores?.overall?.toFixed(1) || 'N/A'}/10 • 
                      Submitted: {new Date(submission.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSubmission(submission)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      ✏️ Edit Remarks
                    </button>
                    <button
                      onClick={() => deleteSubmission(submission)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                
                {submission.manager_remarks && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
                    <p className="text-sm font-medium text-blue-800 mb-1">Manager Remarks:</p>
                    <p className="text-sm text-blue-700 whitespace-pre-wrap">{submission.manager_remarks}</p>
                    {submission.manager_edited_at && (
                      <p className="text-xs text-blue-600 mt-2">
                        Last edited: {new Date(submission.manager_edited_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isEditing && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              Edit Remarks - {monthLabel(selectedSubmission.monthKey)}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager Remarks
              </label>
              <textarea
                value={managerRemarks}
                onChange={(e) => setManagerRemarks(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-base resize-y"
                rows={6}
                placeholder="Add your feedback, suggestions, or remarks for this employee's performance..."
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedSubmission(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveManagerRemarks}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Remarks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}