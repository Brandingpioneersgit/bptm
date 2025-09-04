// Attendance API for Monthly Operating System
// Handles daily attendance capture, monthly calculations, and discipline scoring

import { supabase } from '../database/supabaseClient';
import { sanitizeInput } from '../utils/inputSanitizer';

/**
 * Calendar and Working Days API
 */

// Get calendar configuration for a year
export const getCalendarConfig = async (year) => {
  try {
    const { data, error } = await supabase
      .from('calendar_config')
      .select('*')
      .eq('year', year)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK
      throw error;
    }

    // Return default config if not found
    return data || {
      year,
      alternate_saturdays_off: ['2', '4'],
      holidays: [],
      wfh_counts_as_presence: false
    };
  } catch (error) {
    console.error('Error fetching calendar config:', error);
    throw new Error('Failed to fetch calendar configuration');
  }
};

// Update calendar configuration (admin only)
export const updateCalendarConfig = async (year, config) => {
  try {
    const sanitizedConfig = {
      year: parseInt(year),
      alternate_saturdays_off: config.alternate_saturdays_off || ['2', '4'],
      holidays: config.holidays || [],
      wfh_counts_as_presence: Boolean(config.wfh_counts_as_presence)
    };

    const { data, error } = await supabase
      .from('calendar_config')
      .upsert(sanitizedConfig, { onConflict: 'year' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating calendar config:', error);
    throw new Error('Failed to update calendar configuration');
  }
};

// Get working days for a month
export const getWorkingDaysInMonth = async (year, month) => {
  try {
    const { data, error } = await supabase
      .rpc('get_working_days_in_month', {
        p_year: parseInt(year),
        p_month: parseInt(month)
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error calculating working days:', error);
    throw new Error('Failed to calculate working days');
  }
};

/**
 * Daily Attendance API
 */

// Submit daily attendance (single day)
export const submitDailyAttendance = async (attendanceData) => {
  try {
    const sanitizedData = {
      date: sanitizeInput(attendanceData.date),
      presence: sanitizeInput(attendanceData.presence),
      morning_meeting_attended: Boolean(attendanceData.morning_meeting_attended),
      notes: sanitizeInput(attendanceData.notes || '')
    };

    // Validate presence type
    const validPresenceTypes = ['office', 'wfh', 'leave', 'off'];
    if (!validPresenceTypes.includes(sanitizedData.presence)) {
      throw new Error('Invalid presence type');
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('daily_attendance')
      .upsert({
        user_id: user.id,
        ...sanitizedData
      }, { onConflict: 'user_id,date' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error submitting daily attendance:', error);
    throw new Error('Failed to submit attendance');
  }
};

// Submit bulk daily attendance
export const submitBulkDailyAttendance = async (attendanceArray) => {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    const sanitizedData = attendanceArray.map(item => ({
      user_id: user.id,
      date: sanitizeInput(item.date),
      presence: sanitizeInput(item.presence),
      morning_meeting_attended: Boolean(item.morning_meeting_attended),
      notes: sanitizeInput(item.notes || '')
    }));

    // Validate all presence types
    const validPresenceTypes = ['office', 'wfh', 'leave', 'off'];
    for (const item of sanitizedData) {
      if (!validPresenceTypes.includes(item.presence)) {
        throw new Error(`Invalid presence type: ${item.presence}`);
      }
    }

    const { data, error } = await supabase
      .from('daily_attendance')
      .upsert(sanitizedData, { onConflict: 'user_id,date' })
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error submitting bulk attendance:', error);
    throw new Error('Failed to submit bulk attendance');
  }
};

// Get daily attendance for a user and date range
export const getDailyAttendance = async (userId, startDate, endDate) => {
  try {
    let query = supabase
      .from('daily_attendance')
      .select('*')
      .order('date', { ascending: true });

    // If userId provided and user is manager, filter by user
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching daily attendance:', error);
    throw new Error('Failed to fetch attendance data');
  }
};

// Get attendance for current month
export const getCurrentMonthAttendance = async (userId = null) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  
  return getDailyAttendance(userId, startDate, endDate);
};

/**
 * Monthly Attendance Cache API
 */

// Compute monthly attendance for a user
export const computeMonthlyAttendance = async (userId, year, month) => {
  try {
    const { data, error } = await supabase
      .rpc('compute_monthly_attendance', {
        p_user_id: userId,
        p_year: parseInt(year),
        p_month: parseInt(month)
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error computing monthly attendance:', error);
    throw new Error('Failed to compute monthly attendance');
  }
};

// Get monthly attendance cache
export const getMonthlyAttendanceCache = async (userId, year, month) => {
  try {
    let query = supabase
      .from('monthly_attendance_cache')
      .select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (year) {
      query = query.eq('year', parseInt(year));
    }

    if (month) {
      query = query.eq('month', parseInt(month));
    }

    const { data, error } = await query.order('year', { ascending: false })
                                      .order('month', { ascending: false });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching monthly attendance cache:', error);
    throw new Error('Failed to fetch monthly attendance data');
  }
};

// Get current month attendance cache
export const getCurrentMonthAttendanceCache = async (userId = null) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  return getMonthlyAttendanceCache(userId, year, month);
};

/**
 * Discipline Scoring API
 */

// Get discipline component for scoring
export const getDisciplineComponent = async (userId, year, month) => {
  try {
    const cacheData = await getMonthlyAttendanceCache(userId, year, month);
    
    if (cacheData && cacheData.length > 0) {
      return {
        discipline_component: cacheData[0].discipline_component,
        office_attendance_rate: cacheData[0].office_attendance_rate,
        meeting_attendance_rate: cacheData[0].meeting_attendance_rate,
        office_days_present: cacheData[0].office_days_present,
        working_days_expected: cacheData[0].working_days_expected
      };
    }

    // If no cache, compute it
    await computeMonthlyAttendance(userId, year, month);
    const newCacheData = await getMonthlyAttendanceCache(userId, year, month);
    
    if (newCacheData && newCacheData.length > 0) {
      return {
        discipline_component: newCacheData[0].discipline_component,
        office_attendance_rate: newCacheData[0].office_attendance_rate,
        meeting_attendance_rate: newCacheData[0].meeting_attendance_rate,
        office_days_present: newCacheData[0].office_days_present,
        working_days_expected: newCacheData[0].working_days_expected
      };
    }

    // Fallback to default
    return {
      discipline_component: 0.0,
      office_attendance_rate: 0.0,
      meeting_attendance_rate: 0.0,
      office_days_present: 0,
      working_days_expected: 0
    };
  } catch (error) {
    console.error('Error getting discipline component:', error);
    throw new Error('Failed to get discipline component');
  }
};

/**
 * Reporting API
 */

// Get team attendance summary
export const getTeamAttendanceSummary = async (year, month) => {
  try {
    const { data, error } = await supabase
      .from('monthly_attendance_cache')
      .select(`
        *,
        users!inner(
          id,
          full_name,
          email,
          user_type
        )
      `)
      .eq('year', parseInt(year))
      .eq('month', parseInt(month))
      .order('discipline_component', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching team attendance summary:', error);
    throw new Error('Failed to fetch team attendance summary');
  }
};

// Get attendance compliance metrics
export const getAttendanceComplianceMetrics = async (year, month) => {
  try {
    const teamData = await getTeamAttendanceSummary(year, month);
    
    const totalUsers = teamData.length;
    const highPerformers = teamData.filter(user => user.discipline_component >= 8.0).length;
    const lowPerformers = teamData.filter(user => user.discipline_component < 6.0).length;
    const averageDiscipline = totalUsers > 0 
      ? teamData.reduce((sum, user) => sum + parseFloat(user.discipline_component), 0) / totalUsers
      : 0;
    const averageOfficeAttendance = totalUsers > 0
      ? teamData.reduce((sum, user) => sum + parseFloat(user.office_attendance_rate), 0) / totalUsers
      : 0;
    const averageMeetingAttendance = totalUsers > 0
      ? teamData.reduce((sum, user) => sum + parseFloat(user.meeting_attendance_rate), 0) / totalUsers
      : 0;

    return {
      total_users: totalUsers,
      high_performers: highPerformers,
      low_performers: lowPerformers,
      high_performer_rate: totalUsers > 0 ? (highPerformers / totalUsers) * 100 : 0,
      low_performer_rate: totalUsers > 0 ? (lowPerformers / totalUsers) * 100 : 0,
      average_discipline_score: Math.round(averageDiscipline * 10) / 10,
      average_office_attendance_rate: Math.round(averageOfficeAttendance * 1000) / 10, // as percentage
      average_meeting_attendance_rate: Math.round(averageMeetingAttendance * 1000) / 10, // as percentage
      year,
      month
    };
  } catch (error) {
    console.error('Error calculating compliance metrics:', error);
    throw new Error('Failed to calculate compliance metrics');
  }
};

export default {
  // Calendar
  getCalendarConfig,
  updateCalendarConfig,
  getWorkingDaysInMonth,
  
  // Daily Attendance
  submitDailyAttendance,
  submitBulkDailyAttendance,
  getDailyAttendance,
  getCurrentMonthAttendance,
  
  // Monthly Cache
  computeMonthlyAttendance,
  getMonthlyAttendanceCache,
  getCurrentMonthAttendanceCache,
  
  // Discipline Scoring
  getDisciplineComponent,
  
  // Reporting
  getTeamAttendanceSummary,
  getAttendanceComplianceMetrics
};