// Attendance Tracker Component for Monthly Operating System
// Handles daily attendance capture and monthly reporting

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import attendanceApi from '../api/attendanceApi';

const AttendanceTracker = ({ userId = null, isManagerView = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [monthlyCache, setMonthlyCache] = useState(null);
  const [calendarConfig, setCalendarConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state for daily attendance
  const [dailyForm, setDailyForm] = useState({
    presence: 'office',
    morning_meeting_attended: false,
    notes: ''
  });

  const presenceTypes = [
    { value: 'office', label: 'Office', color: 'bg-green-100 text-green-800' },
    { value: 'wfh', label: 'Work From Home', color: 'bg-blue-100 text-blue-800' },
    { value: 'leave', label: 'Leave', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'off', label: 'Off Day', color: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    loadData();
  }, [currentDate, userId]);

  useEffect(() => {
    // Load today's attendance if selecting today
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate === today) {
      loadTodayAttendance();
    }
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      // Load calendar config
      const config = await attendanceApi.getCalendarConfig(year);
      setCalendarConfig(config);
      
      // Load monthly attendance data
      const attendance = await attendanceApi.getCurrentMonthAttendance(userId);
      setAttendanceData(attendance);
      
      // Load monthly cache
      const cache = await attendanceApi.getCurrentMonthAttendanceCache(userId);
      setMonthlyCache(cache?.[0] || null);
      
    } catch (err) {
      setError('Failed to load attendance data');
      console.error('Error loading attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendanceData.find(a => a.date === today);
      
      if (todayAttendance) {
        setDailyForm({
          presence: todayAttendance.presence,
          morning_meeting_attended: todayAttendance.morning_meeting_attended,
          notes: todayAttendance.notes || ''
        });
      }
    } catch (err) {
      console.error('Error loading today attendance:', err);
    }
  };

  const handleSubmitDaily = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await attendanceApi.submitDailyAttendance({
        date: selectedDate,
        ...dailyForm
      });
      
      setSuccess('Attendance submitted successfully!');
      await loadData(); // Refresh data
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to submit attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (bulkData) => {
    setLoading(true);
    setError('');
    
    try {
      await attendanceApi.submitBulkDailyAttendance(bulkData);
      setSuccess('Bulk attendance submitted successfully!');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to submit bulk attendance');
    } finally {
      setLoading(false);
    }
  };

  const getPresenceColor = (presence) => {
    const type = presenceTypes.find(t => t.value === presence);
    return type?.color || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const getDisciplineStatus = (score) => {
    if (score >= 9) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 7) return { label: 'Good', color: 'text-blue-600' };
    if (score >= 5) return { label: 'Average', color: 'text-yellow-600' };
    return { label: 'Needs Improvement', color: 'text-red-600' };
  };

  // Show loading state while data is loading
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading attendance data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isManagerView ? 'Team Attendance' : 'My Attendance'}
              </h1>
              <p className="text-gray-600">
                {currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            >
              ←
            </button>
            <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded font-medium">
              {currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Attendance Form */}
        {!isManagerView && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Daily Attendance
            </h2>
            
            <form onSubmit={handleSubmitDaily} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Presence Type
                </label>
                <select
                  value={dailyForm.presence}
                  onChange={(e) => setDailyForm({ ...dailyForm, presence: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {presenceTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {dailyForm.presence === 'office' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="morning_meeting"
                    checked={dailyForm.morning_meeting_attended}
                    onChange={(e) => setDailyForm({ ...dailyForm, morning_meeting_attended: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="morning_meeting" className="text-sm text-gray-700">
                    Attended morning meeting
                  </label>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={dailyForm.notes}
                  onChange={(e) => setDailyForm({ ...dailyForm, notes: e.target.value })}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any additional notes..."
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Attendance'}
              </button>
            </form>
          </div>
        )}

        {/* Monthly Summary */}
        <div className={`bg-white rounded-lg shadow-sm border p-6 ${isManagerView ? 'lg:col-span-2' : ''}`}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Monthly Summary
          </h2>
          
          {monthlyCache ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {monthlyCache.office_days_present}
                </div>
                <div className="text-sm text-blue-700">Office Days</div>
                <div className="text-xs text-blue-600">
                  {(monthlyCache.office_attendance_rate * 100).toFixed(1)}% attendance
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {monthlyCache.office_days_with_meeting}
                </div>
                <div className="text-sm text-green-700">Meetings Attended</div>
                <div className="text-xs text-green-600">
                  {(monthlyCache.meeting_attendance_rate * 100).toFixed(1)}% rate
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {monthlyCache.wfh_days}
                </div>
                <div className="text-sm text-purple-700">WFH Days</div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {monthlyCache.leaves}
                </div>
                <div className="text-sm text-yellow-700">Leave Days</div>
              </div>
              
              <div className="col-span-2 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {monthlyCache.discipline_component.toFixed(1)}/10
                    </div>
                    <div className="text-sm text-gray-700">Discipline Score</div>
                  </div>
                  <div className={`text-sm font-medium ${getDisciplineStatus(monthlyCache.discipline_component).color}`}>
                    {getDisciplineStatus(monthlyCache.discipline_component).label}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No attendance data for this month</p>
            </div>
          )}
        </div>

        {/* Recent Attendance */}
        <div className={`bg-white rounded-lg shadow-sm border p-6 ${isManagerView ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-indigo-600" />
            Recent Attendance
          </h2>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {attendanceData.slice(-10).reverse().map((attendance, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-gray-900">
                    {formatDate(attendance.date)}
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPresenceColor(attendance.presence)}`}>
                    {presenceTypes.find(t => t.value === attendance.presence)?.label}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {attendance.presence === 'office' && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      attendance.morning_meeting_attended 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {attendance.morning_meeting_attended ? '✓ Meeting' : '✗ No Meeting'}
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {attendanceData.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No attendance records found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracker;