// Manager Workflow Dashboard for handling reviews and unlock requests
// Manages Draft → Submit → Approve workflow with return and unlock capabilities

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar, 
  MessageSquare, 
  Unlock, 
  ArrowLeft,
  AlertTriangle,
  FileText,
  Target,
  BookOpen
} from 'lucide-react';
import { supabase } from '../database/supabaseClient';
import { workflowApi } from '../services/workflowApi';

const ManagerWorkflowDashboard = ({ managerId }) => {
  const [activeTab, setActiveTab] = useState('pending_reviews');
  const [pendingReviews, setPendingReviews] = useState([]);
  const [unlockRequests, setUnlockRequests] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [workflowStats, setWorkflowStats] = useState(null);
  
  // Form states
  const [reviewNotes, setReviewNotes] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    loadWorkflowData();
  }, [managerId]);

  const loadWorkflowData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Load pending reviews
      const reviews = await workflowApi.getRowsPendingReview(managerId);
      setPendingReviews(reviews);
      
      // Load unlock requests
      const unlocks = await workflowApi.getPendingUnlockRequests(managerId);
      setUnlockRequests(unlocks);
      
      // Load workflow statistics for current month
      const now = new Date();
      const stats = await workflowApi.getWorkflowStats(now.getFullYear(), now.getMonth() + 1);
      setWorkflowStats(stats);
      
    } catch (err) {
      setError('Failed to load workflow data: ' + err.message);
      console.error('Error loading workflow data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (monthlyRowId) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await workflowApi.approveMonthlyRow(monthlyRowId, managerId, reviewNotes);
      setSuccess('Monthly row approved successfully!');
      setReviewNotes('');
      setSelectedItem(null);
      await loadWorkflowData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to approve: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async (monthlyRowId) => {
    if (!returnReason.trim()) {
      setError('Return reason is required');
      return;
    }
    
    setActionLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await workflowApi.returnMonthlyRow(monthlyRowId, managerId, returnReason);
      setSuccess('Monthly row returned to employee!');
      setReturnReason('');
      setShowReturnForm(false);
      setSelectedItem(null);
      await loadWorkflowData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to return: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveUnlock = async (unlockRequestId) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await workflowApi.approveUnlock(unlockRequestId, managerId);
      setSuccess('Unlock request approved!');
      setSelectedItem(null);
      await loadWorkflowData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to approve unlock: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectUnlock = async (unlockRequestId) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await workflowApi.rejectUnlock(unlockRequestId, managerId, rejectionReason);
      setSuccess('Unlock request rejected!');
      setRejectionReason('');
      setShowRejectForm(false);
      setSelectedItem(null);
      await loadWorkflowData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to reject unlock: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const renderDetailView = () => {
    if (!selectedItem) return null;
    
    const isReview = selectedItem.type === 'review';
    const item = selectedItem.data;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {isReview ? 'Review Monthly Submission' : 'Unlock Request Details'}
          </h2>
          <button
            onClick={() => setSelectedItem(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
        
        {/* Employee Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Employee</label>
              <p className="text-gray-900">{item.users?.full_name || item.monthly_rows?.users?.full_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Period</label>
              <p className="text-gray-900">
                {new Date(item.year || item.monthly_rows?.year, (item.month || item.monthly_rows?.month) - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                {isReview ? 'Submitted' : 'Requested'}
              </label>
              <p className="text-gray-900">
                {formatDate(item.submitted_at || item.requested_at)}
              </p>
            </div>
          </div>
        </div>
        
        {isReview ? (
          // Monthly Row Review Details
          <div className="space-y-6">
            {/* Work Summary */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Work Summary
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {item.work_summary || 'No work summary provided'}
                </p>
              </div>
            </div>
            
            {/* KPIs */}
            {item.kpi_json && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-green-600" />
                  Key Performance Indicators
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Expected Projects:</span>
                      <span className="ml-2 font-medium">{item.kpi_json.expected_projects || 0}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Delivered Projects:</span>
                      <span className="ml-2 font-medium">{item.kpi_json.delivered_projects || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Learning */}
            {item.learning_json && item.learning_json.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
                  Learning Activities
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    {item.learning_json.map((learning, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-gray-700">{learning.topic}</span>
                        <span className="text-sm text-gray-500">{learning.minutes} min</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-600">Total Learning: </span>
                    <span className="font-bold text-green-600">
                      {item.learning_json.reduce((sum, l) => sum + (l.minutes || 0), 0)} minutes
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Review Actions */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Review Actions</h3>
              
              {/* Review Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes (Optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any feedback or comments..."
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => handleApprove(item.id)}
                  disabled={actionLoading}
                  className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{actionLoading ? 'Approving...' : 'Approve'}</span>
                </button>
                
                <button
                  onClick={() => setShowReturnForm(!showReturnForm)}
                  className="flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Return for Changes</span>
                </button>
              </div>
              
              {/* Return Form */}
              {showReturnForm && (
                <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Reason (Required)
                  </label>
                  <textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Explain what needs to be changed or improved..."
                  />
                  <div className="mt-3 flex space-x-3">
                    <button
                      onClick={() => handleReturn(item.id)}
                      disabled={actionLoading || !returnReason.trim()}
                      className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
                    >
                      {actionLoading ? 'Returning...' : 'Confirm Return'}
                    </button>
                    <button
                      onClick={() => setShowReturnForm(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Unlock Request Details
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Unlock Request</span>
              </div>
              <p className="text-yellow-700">{item.unlock_reason}</p>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => handleApproveUnlock(item.id)}
                disabled={actionLoading}
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <Unlock className="h-4 w-4" />
                <span>{actionLoading ? 'Approving...' : 'Approve Unlock'}</span>
              </button>
              
              <button
                onClick={() => setShowRejectForm(!showRejectForm)}
                className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject Request</span>
              </button>
            </div>
            
            {/* Reject Form */}
            {showRejectForm && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Explain why the unlock request is being rejected..."
                />
                <div className="mt-3 flex space-x-3">
                  <button
                    onClick={() => handleRejectUnlock(item.id)}
                    disabled={actionLoading}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedItem) {
    return renderDetailView();
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Manager Workflow Dashboard
        </h1>
        <p className="text-gray-600">
          Review team submissions and manage unlock requests
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <span className="text-red-700">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Statistics */}
      {workflowStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-blue-600">{workflowStats.total_rows}</div>
            <div className="text-sm text-gray-600">Total Rows</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-green-600">{workflowStats.submission_rate}%</div>
            <div className="text-sm text-gray-600">Submission Rate</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-orange-600">{workflowStats.avg_approval_time_hours}h</div>
            <div className="text-sm text-gray-600">Avg Approval Time</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-purple-600">{pendingReviews.length + unlockRequests.length}</div>
            <div className="text-sm text-gray-600">Pending Items</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('pending_reviews')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending_reviews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Reviews ({pendingReviews.length})
            </button>
            <button
              onClick={() => setActiveTab('unlock_requests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'unlock_requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Unlock Requests ({unlockRequests.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'pending_reviews' && (
            <div className="space-y-4">
              {pendingReviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No pending reviews</p>
                </div>
              ) : (
                pendingReviews.map((review) => (
                  <div
                    key={review.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedItem({ type: 'review', data: review })}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <User className="h-8 w-8 text-gray-400" />
                        <div>
                          <h3 className="font-medium text-gray-900">{review.users.full_name}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(review.year, review.month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                            {review.entities && ` • ${review.entities.name}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          Submitted {getTimeAgo(review.submitted_at)}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          Click to review
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'unlock_requests' && (
            <div className="space-y-4">
              {unlockRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Unlock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No pending unlock requests</p>
                </div>
              ) : (
                unlockRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 hover:bg-yellow-100 cursor-pointer"
                    onClick={() => setSelectedItem({ type: 'unlock', data: request })}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <AlertTriangle className="h-8 w-8 text-yellow-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">{request.monthly_rows.users.full_name}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(request.monthly_rows.year, request.monthly_rows.month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-sm text-yellow-700 mt-1">{request.unlock_reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          Requested {getTimeAgo(request.requested_at)}
                        </div>
                        <div className="text-xs text-yellow-600 font-medium">
                          Click to review
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerWorkflowDashboard;