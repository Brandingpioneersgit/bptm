import React, { useState, useEffect, useMemo } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { Section } from '@/shared/components/ui';
import { thisMonthKey, monthLabel } from '@/shared/lib/constants';

// Attendance Calendar Component
const AttendanceCalendar = ({ month, attendanceData, onAttendanceChange }) => {
  const getDaysInMonth = (monthKey) => {
    const [year, monthNum] = monthKey.split('-').map(Number);
    return new Date(year, monthNum, 0).getDate();
  };
  
  const getFirstDayOfMonth = (monthKey) => {
    const [year, monthNum] = monthKey.split('-').map(Number);
    return new Date(year, monthNum - 1, 1).getDay();
  };
  
  const daysInMonth = getDaysInMonth(month);
  const firstDay = getFirstDayOfMonth(month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => null);
  
  const getAttendanceStatus = (day) => {
    const dateKey = `${month}-${day.toString().padStart(2, '0')}`;
    return attendanceData[dateKey] || 'not-set';
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-500 text-white';
      case 'wfh': return 'bg-blue-500 text-white';
      case 'leave': return 'bg-yellow-500 text-white';
      case 'absent': return 'bg-red-500 text-white';
      case 'holiday': return 'bg-gray-400 text-white';
      default: return 'bg-gray-100 text-gray-600 border border-gray-300';
    }
  };
  
  const handleDayClick = (day) => {
    const dateKey = `${month}-${day.toString().padStart(2, '0')}`;
    const currentStatus = getAttendanceStatus(day);
    
    // Cycle through statuses
    const statuses = ['present', 'wfh', 'leave', 'absent', 'holiday'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    
    onAttendanceChange(dateKey, nextStatus);
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-4">📅 Attendance Calendar - {monthLabel(month)}</h4>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Present</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>WFH</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Leave</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Absent</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-gray-400 rounded"></div>
          <span>Holiday</span>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}
        
        {/* Empty days */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="h-8"></div>
        ))}
        
        {/* Calendar days */}
        {days.map(day => {
          const status = getAttendanceStatus(day);
          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={`h-8 w-8 text-xs font-medium rounded hover:scale-110 transition-all duration-200 ${
                getStatusColor(status)
              }`}
              title={`Day ${day} - ${status.replace('-', ' ').toUpperCase()} (Click to change)`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Communication Log Component
const CommunicationLog = ({ logs, onAddLog, onUpdateLog, onDeleteLog }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newLog, setNewLog] = useState({
    type: 'whatsapp',
    count: 1,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const handleAddLog = () => {
    if (newLog.description.trim()) {
      onAddLog(newLog);
      setNewLog({
        type: 'whatsapp',
        count: 1,
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setIsAdding(false);
    }
  };
  
  const getTypeIcon = (type) => {
    switch (type) {
      case 'whatsapp': return '💬';
      case 'call': return '📞';
      case 'email': return '📧';
      case 'meeting': return '🤝';
      default: return '📝';
    }
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-gray-900">📞 Communication Log</h4>
        <button
          onClick={() => setIsAdding(true)}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          + Add Log
        </button>
      </div>
      
      {/* Add New Log Form */}
      {isAdding && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                value={newLog.type}
                onChange={(e) => setNewLog(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Count</label>
              <input
                type="number"
                value={newLog.count}
                onChange={(e) => setNewLog(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={newLog.date}
                onChange={(e) => setNewLog(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={newLog.description}
                onChange={(e) => setNewLog(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Brief description..."
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-3">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddLog}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Log
            </button>
          </div>
        </div>
      )}
      
      {/* Communication Logs List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getTypeIcon(log.type)}</span>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {log.count}x {log.type.charAt(0).toUpperCase() + log.type.slice(1)}
                  </div>
                  <div className="text-xs text-gray-600">{log.description}</div>
                  <div className="text-xs text-gray-500">{log.date}</div>
                </div>
              </div>
              
              <button
                onClick={() => onDeleteLog(index)}
                className="text-red-500 hover:text-red-700 text-sm"
                title="Delete log"
              >
                🗑️
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">No communication logs added yet</p>
            <p className="text-xs">Click "Add Log" to start tracking your communications</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Meeting URLs Component
const MeetingURLs = ({ meetings, onAddMeeting, onDeleteMeeting }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    url: '',
    date: new Date().toISOString().split('T')[0],
    duration: 60
  });
  
  const handleAddMeeting = () => {
    if (newMeeting.title.trim() && newMeeting.url.trim()) {
      onAddMeeting(newMeeting);
      setNewMeeting({
        title: '',
        url: '',
        date: new Date().toISOString().split('T')[0],
        duration: 60
      });
      setIsAdding(false);
    }
  };
  
  const isValidURL = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-gray-900">🔗 Meeting URLs</h4>
        <button
          onClick={() => setIsAdding(true)}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          + Add Meeting
        </button>
      </div>
      
      {/* Add New Meeting Form */}
      {isAdding && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Meeting Title</label>
              <input
                type="text"
                value={newMeeting.title}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Client Review, Team Standup"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={newMeeting.date}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Meeting URL</label>
              <input
                type="url"
                value={newMeeting.url}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, url: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="https://meet.google.com/..."
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={newMeeting.duration}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                min="15"
                step="15"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-3">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddMeeting}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Meeting
            </button>
          </div>
        </div>
      )}
      
      {/* Meetings List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {meetings.length > 0 ? (
          meetings.map((meeting, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{meeting.title}</span>
                  <span className="text-xs text-gray-500">({meeting.duration} min)</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">{meeting.date}</div>
                <div className="text-xs text-blue-600 mt-1">
                  <a 
                    href={meeting.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {isValidURL(meeting.url) ? '🔗 Open Meeting' : '❌ Invalid URL'}
                  </a>
                </div>
              </div>
              
              <button
                onClick={() => onDeleteMeeting(index)}
                className="text-red-500 hover:text-red-700 text-sm ml-2"
                title="Delete meeting"
              >
                🗑️
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">No meeting URLs added yet</p>
            <p className="text-xs">Click "Add Meeting" to start tracking your meetings</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Discipline Score Calculator
const DisciplineScore = ({ attendanceData, communicationLogs, meetings, submissions, month }) => {
  const score = useMemo(() => {
    const daysInMonth = new Date(new Date(month + '-01').getFullYear(), new Date(month + '-01').getMonth() + 1, 0).getDate();
    const workingDays = 25; // Assuming 25 working days per month
    
    // Attendance Score (40% weight)
    const attendanceDays = Object.values(attendanceData).filter(status => 
      ['present', 'wfh'].includes(status)
    ).length;
    const attendanceScore = Math.min((attendanceDays / workingDays) * 100, 100);
    
    // Communication Score (30% weight)
    const totalCommunications = communicationLogs.reduce((sum, log) => sum + log.count, 0);
    const communicationScore = Math.min((totalCommunications / 50) * 100, 100); // Assuming 50 communications target
    
    // Meeting Score (20% weight)
    const meetingScore = Math.min((meetings.length / 10) * 100, 100); // Assuming 10 meetings target
    
    // Submission Score (10% weight)
    const submissionScore = submissions.length > 0 ? 100 : 0;
    
    // Weighted total
    const totalScore = (
      (attendanceScore * 0.4) +
      (communicationScore * 0.3) +
      (meetingScore * 0.2) +
      (submissionScore * 0.1)
    );
    
    return {
      total: Math.round(totalScore),
      breakdown: {
        attendance: Math.round(attendanceScore),
        communication: Math.round(communicationScore),
        meetings: Math.round(meetingScore),
        submissions: Math.round(submissionScore)
      },
      stats: {
        attendanceDays,
        workingDays,
        totalCommunications,
        totalMeetings: meetings.length,
        submissionsCount: submissions.length
      }
    };
  }, [attendanceData, communicationLogs, meetings, submissions, month]);
  
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };
  
  return (
    <div className={`border-2 rounded-lg p-6 ${getScoreColor(score.total)}`}>
      <h4 className="text-lg font-semibold mb-4 text-center">📊 Discipline Score</h4>
      
      <div className="text-center mb-6">
        <div className="text-4xl font-bold mb-2">{score.total}/100</div>
        <div className="text-sm opacity-75">Overall Discipline Score</div>
      </div>
      
      {/* Score Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold">{score.breakdown.attendance}</div>
          <div className="text-xs opacity-75">Attendance</div>
          <div className="text-xs">{score.stats.attendanceDays}/{score.stats.workingDays} days</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold">{score.breakdown.communication}</div>
          <div className="text-xs opacity-75">Communication</div>
          <div className="text-xs">{score.stats.totalCommunications} logs</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold">{score.breakdown.meetings}</div>
          <div className="text-xs opacity-75">Meetings</div>
          <div className="text-xs">{score.stats.totalMeetings} meetings</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold">{score.breakdown.submissions}</div>
          <div className="text-xs opacity-75">Submissions</div>
          <div className="text-xs">{score.stats.submissionsCount} forms</div>
        </div>
      </div>
      
      {/* Score Formula */}
      <div className="text-xs opacity-75 text-center">
        Formula: Attendance (40%) + Communication (30%) + Meetings (20%) + Submissions (10%)
      </div>
    </div>
  );
};

export const DisciplineTracking = ({ employee }) => {
  const supabase = useSupabase();
  const { notify } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(thisMonthKey());
  const [attendanceData, setAttendanceData] = useState({});
  const [communicationLogs, setCommunicationLogs] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  
  // Load discipline data for selected month
  useEffect(() => {
    const loadDisciplineData = async () => {
      if (!employee?.id) return;
      
      setLoading(true);
      try {
        // Load attendance data
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('employee_attendance')
          .select('*')
          .eq('employee_id', employee.id)
          .like('date', `${selectedMonth}%`);
        
        if (attendanceError) throw attendanceError;
        
        const attendance = {};
        attendanceData?.forEach(record => {
          attendance[record.date] = record.status;
        });
        setAttendanceData(attendance);
        
        // Load communication logs
        const { data: commData, error: commError } = await supabase
          .from('employee_communications')
          .select('*')
          .eq('employee_id', employee.id)
          .like('date', `${selectedMonth}%`)
          .order('date', { ascending: false });
        
        if (commError) throw commError;
        setCommunicationLogs(commData || []);
        
        // Load meetings
        const { data: meetingData, error: meetingError } = await supabase
          .from('employee_meetings')
          .select('*')
          .eq('employee_id', employee.id)
          .like('date', `${selectedMonth}%`)
          .order('date', { ascending: false });
        
        if (meetingError) throw meetingError;
        setMeetings(meetingData || []);
        
        // Load submissions
        const { data: submissionData, error: submissionError } = await supabase
          .from('submissions')
          .select('*')
          .eq('employee_name', employee.name)
          .eq('month_key', selectedMonth);
        
        if (submissionError) throw submissionError;
        setSubmissions(submissionData || []);
        
      } catch (error) {
        console.error('Error loading discipline data:', error);
        notify('Failed to load discipline data', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    loadDisciplineData();
  }, [employee, selectedMonth, supabase, notify]);
  
  const handleAttendanceChange = async (dateKey, status) => {
    try {
      const { error } = await supabase
        .from('employee_attendance')
        .upsert({
          employee_id: employee.id,
          date: dateKey,
          status: status,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      setAttendanceData(prev => ({ ...prev, [dateKey]: status }));
      notify('Attendance updated', 'success');
    } catch (error) {
      console.error('Error updating attendance:', error);
      notify('Failed to update attendance', 'error');
    }
  };
  
  const handleAddCommunicationLog = async (logData) => {
    try {
      const { data, error } = await supabase
        .from('employee_communications')
        .insert({
          employee_id: employee.id,
          type: logData.type,
          count: logData.count,
          description: logData.description,
          date: logData.date,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setCommunicationLogs(prev => [data, ...prev]);
      notify('Communication log added', 'success');
    } catch (error) {
      console.error('Error adding communication log:', error);
      notify('Failed to add communication log', 'error');
    }
  };
  
  const handleDeleteCommunicationLog = async (index) => {
    const log = communicationLogs[index];
    if (!log.id) return;
    
    try {
      const { error } = await supabase
        .from('employee_communications')
        .delete()
        .eq('id', log.id);
      
      if (error) throw error;
      
      setCommunicationLogs(prev => prev.filter((_, i) => i !== index));
      notify('Communication log deleted', 'success');
    } catch (error) {
      console.error('Error deleting communication log:', error);
      notify('Failed to delete communication log', 'error');
    }
  };
  
  const handleAddMeeting = async (meetingData) => {
    try {
      const { data, error } = await supabase
        .from('employee_meetings')
        .insert({
          employee_id: employee.id,
          title: meetingData.title,
          url: meetingData.url,
          date: meetingData.date,
          duration: meetingData.duration,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setMeetings(prev => [data, ...prev]);
      notify('Meeting added', 'success');
    } catch (error) {
      console.error('Error adding meeting:', error);
      notify('Failed to add meeting', 'error');
    }
  };
  
  const handleDeleteMeeting = async (index) => {
    const meeting = meetings[index];
    if (!meeting.id) return;
    
    try {
      const { error } = await supabase
        .from('employee_meetings')
        .delete()
        .eq('id', meeting.id);
      
      if (error) throw error;
      
      setMeetings(prev => prev.filter((_, i) => i !== index));
      notify('Meeting deleted', 'success');
    } catch (error) {
      console.error('Error deleting meeting:', error);
      notify('Failed to delete meeting', 'error');
    }
  };
  
  if (loading) {
    return (
      <Section title="📋 Discipline Tracking" className="bg-white">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Section>
    );
  }
  
  return (
    <Section title="📋 Discipline Tracking" className="bg-white">
      <div className="space-y-6">
        {/* Month Selector */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Select Month:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
              return (
                <option key={monthKey} value={monthKey}>
                  {monthLabel(monthKey)}
                </option>
              );
            })}
          </select>
        </div>
        
        {/* Discipline Score */}
        <DisciplineScore
          attendanceData={attendanceData}
          communicationLogs={communicationLogs}
          meetings={meetings}
          submissions={submissions}
          month={selectedMonth}
        />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Calendar */}
          <AttendanceCalendar
            month={selectedMonth}
            attendanceData={attendanceData}
            onAttendanceChange={handleAttendanceChange}
          />
          
          {/* Communication Log */}
          <CommunicationLog
            logs={communicationLogs}
            onAddLog={handleAddCommunicationLog}
            onDeleteLog={handleDeleteCommunicationLog}
          />
        </div>
        
        {/* Meeting URLs */}
        <MeetingURLs
          meetings={meetings}
          onAddMeeting={handleAddMeeting}
          onDeleteMeeting={handleDeleteMeeting}
        />
        
        {/* Info Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-800 mb-2">ℹ️ How Discipline Scoring Works</h5>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• <strong>Attendance (40%):</strong> Based on present/WFH days vs total working days (25/month)</p>
            <p>• <strong>Communication (30%):</strong> WhatsApp messages, calls, emails logged (target: 50/month)</p>
            <p>• <strong>Meetings (20%):</strong> Meeting URLs and attendance tracking (target: 10/month)</p>
            <p>• <strong>Submissions (10%):</strong> Monthly form submissions and reports completed</p>
            <p>• <strong>Self-Reporting:</strong> All data is self-reported and should be accurate for fair evaluation</p>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default DisciplineTracking;