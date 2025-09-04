// Calendar Manager for India-specific working days
// Sundays off, alternate Saturdays off, admin-managed holidays

import React, { useState, useEffect } from 'react';
import { Calendar, Settings, Plus, Trash2, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../database/supabaseClient';
import { attendanceApi } from '../services/attendanceApi';

const CalendarManager = ({ isAdmin = false }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [calendarConfig, setCalendarConfig] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '', type: 'national' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [workingDaysPreview, setWorkingDaysPreview] = useState({});

  const holidayTypes = {
    national: { label: 'National Holiday', color: 'red' },
    regional: { label: 'Regional Holiday', color: 'orange' },
    company: { label: 'Company Holiday', color: 'blue' }
  };

  const alternateSaturdayOptions = {
    '1,3': '1st & 3rd Saturdays Off',
    '2,4': '2nd & 4th Saturdays Off',
    '1,2,3,4': 'All Saturdays Off',
    'none': 'No Saturdays Off'
  };

  useEffect(() => {
    loadCalendarData();
  }, [selectedYear]);

  const loadCalendarData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Load calendar config
      const config = await attendanceApi.getCalendarConfig(selectedYear);
      setCalendarConfig(config);
      
      // Extract holidays from config
      const holidayList = config.holidays || [];
      setHolidays(holidayList);
      
      // Generate working days preview for each month
      const preview = {};
      for (let month = 1; month <= 12; month++) {
        const workingDays = await attendanceApi.getWorkingDaysInMonth(selectedYear, month);
        preview[month] = workingDays;
      }
      setWorkingDaysPreview(preview);
      
    } catch (err) {
      setError('Failed to load calendar data: ' + err.message);
      console.error('Error loading calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field, value) => {
    setCalendarConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addHoliday = () => {
    if (!newHoliday.date || !newHoliday.name) {
      setError('Please provide both date and name for the holiday');
      return;
    }
    
    const holidayDate = new Date(newHoliday.date);
    if (holidayDate.getFullYear() !== selectedYear) {
      setError('Holiday date must be in the selected year');
      return;
    }
    
    const holiday = {
      date: newHoliday.date,
      name: newHoliday.name.trim(),
      type: newHoliday.type
    };
    
    setHolidays(prev => [...prev, holiday].sort((a, b) => new Date(a.date) - new Date(b.date)));
    setNewHoliday({ date: '', name: '', type: 'national' });
    setError('');
  };

  const removeHoliday = (index) => {
    setHolidays(prev => prev.filter((_, i) => i !== index));
  };

  const saveCalendarConfig = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const configToSave = {
        ...calendarConfig,
        holidays: holidays,
        year: selectedYear
      };
      
      await attendanceApi.updateCalendarConfig(selectedYear, configToSave);
      
      setSuccess('Calendar configuration saved successfully!');
      
      // Refresh working days preview
      const preview = {};
      for (let month = 1; month <= 12; month++) {
        const workingDays = await attendanceApi.getWorkingDaysInMonth(selectedYear, month);
        preview[month] = workingDays;
      }
      setWorkingDaysPreview(preview);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save calendar configuration: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getMonthName = (month) => {
    return new Date(selectedYear, month - 1, 1).toLocaleDateString('en-IN', { month: 'long' });
  };

  const getSaturdaysInMonth = (year, month) => {
    const saturdays = [];
    const date = new Date(year, month - 1, 1);
    
    while (date.getMonth() === month - 1) {
      if (date.getDay() === 6) { // Saturday
        saturdays.push(new Date(date));
      }
      date.setDate(date.getDate() + 1);
    }
    
    return saturdays;
  };

  const getOffSaturdays = (year, month, offSaturdayWeeks) => {
    if (offSaturdayWeeks === 'none') return [];
    
    const saturdays = getSaturdaysInMonth(year, month);
    
    if (offSaturdayWeeks === '1,2,3,4') {
      return saturdays;
    }
    
    const weeks = offSaturdayWeeks.split(',').map(w => parseInt(w));
    return saturdays.filter((_, index) => weeks.includes(index + 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                Calendar Management
              </h1>
              <p className="text-gray-600">
                Configure working days and holidays for India timezone
              </p>
            </div>
          </div>
          
          {/* Year Selector */}
          <div className="flex items-center space-x-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() + i - 1;
                return (
                  <option key={year} value={year}>{year}</option>
                );
              })}
            </select>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Basic Settings */}
          {calendarConfig && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-600" />
                Working Day Rules
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alternate Saturdays Off
                  </label>
                  <select
                    value={calendarConfig.alternate_saturdays_off || '2,4'}
                    onChange={(e) => handleConfigChange('alternate_saturdays_off', e.target.value)}
                    disabled={!isAdmin}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    {Object.entries(alternateSaturdayOptions).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="wfh_counts_as_presence"
                    checked={calendarConfig.wfh_counts_as_presence || false}
                    onChange={(e) => handleConfigChange('wfh_counts_as_presence', e.target.checked)}
                    disabled={!isAdmin}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                  />
                  <label htmlFor="wfh_counts_as_presence" className="ml-2 block text-sm text-gray-700">
                    Count WFH as presence for attendance rate
                  </label>
                </div>
                
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                  <strong>Fixed Rules:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• Sundays are always OFF</li>
                    <li>• Timezone: Asia/Kolkata (IST)</li>
                    <li>• Working days calculated automatically</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Holiday Management */}
          {isAdmin && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Holiday Management
              </h2>
              
              {/* Add New Holiday */}
              <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-md font-medium text-gray-800">Add New Holiday</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
                    min={`${selectedYear}-01-01`}
                    max={`${selectedYear}-12-31`}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  <input
                    type="text"
                    value={newHoliday.name}
                    onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Holiday name"
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  <select
                    value={newHoliday.type}
                    onChange={(e) => setNewHoliday(prev => ({ ...prev, type: e.target.value }))}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(holidayTypes).map(([value, config]) => (
                      <option key={value} value={value}>{config.label}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={addHoliday}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Holiday</span>
                </button>
              </div>
              
              {/* Holiday List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {holidays.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No holidays configured for {selectedYear}</p>
                ) : (
                  holidays.map((holiday, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium bg-${holidayTypes[holiday.type].color}-100 text-${holidayTypes[holiday.type].color}-800`}>
                          {holidayTypes[holiday.type].label}
                        </span>
                        <span className="font-medium">
                          {new Date(holiday.date).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </span>
                        <span className="text-gray-700">{holiday.name}</span>
                      </div>
                      
                      <button
                        onClick={() => removeHoliday(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Save Button */}
          {isAdmin && (
            <button
              onClick={saveCalendarConfig}
              disabled={saving}
              className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Calendar Configuration'}</span>
            </button>
          )}
        </div>

        {/* Working Days Preview */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Working Days Preview - {selectedYear}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
              const workingDays = workingDaysPreview[month] || 0;
              const totalDays = new Date(selectedYear, month, 0).getDate();
              const monthHolidays = holidays.filter(h => {
                const holidayDate = new Date(h.date);
                return holidayDate.getMonth() === month - 1;
              });
              
              return (
                <div key={month} className="border border-gray-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    {getMonthName(month)}
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Total Days:</span>
                      <span className="font-medium">{totalDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Working Days:</span>
                      <span className="font-medium text-green-600">{workingDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Holidays:</span>
                      <span className="font-medium text-red-600">{monthHolidays.length}</span>
                    </div>
                  </div>
                  
                  {monthHolidays.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500 space-y-1">
                        {monthHolidays.map((holiday, idx) => (
                          <div key={idx} className="truncate" title={holiday.name}>
                            {new Date(holiday.date).getDate()}: {holiday.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Total Working Days in {selectedYear}:</strong> {' '}
              <span className="text-lg font-bold">
                {Object.values(workingDaysPreview).reduce((sum, days) => sum + days, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarManager;