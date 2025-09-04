import { supabase } from '../shared/lib/supabase';

/**
 * Monthly Report Service
 * Handles fetching and processing data for monthly reports from Supabase
 */
export class MonthlyReportService {
  /**
   * Fetch users from unified_users table
   */
  static async fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('unified_users')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Fetch monthly form submissions for a specific month
   * @param {string} monthKey - Format: 'YYYY-MM'
   * @returns {Promise<Array>} Array of submissions with user details
   */
  static async fetchMonthlySubmissions(monthKey) {
    if (!supabase) {
      console.warn('Supabase not available, returning empty array');
      return [];
    }

    try {
      // Convert monthKey to first day of month for database query
      const [year, month] = monthKey.split('-');
      const submissionMonth = `${year}-${month}-01`;

      const { data, error } = await supabase
        .from('monthly_form_submissions')
        .select(`
          *,
          unified_users!user_id (
            id,
            name,
            email,
            phone,
            role,
            user_category,
            department
          )
        `)
        .eq('submission_month', submissionMonth);

      if (error) {
        console.error('Error fetching monthly submissions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchMonthlySubmissions:', error);
      return [];
    }
  }

  /**
   * Fetch legacy submissions for backward compatibility
   * @param {string} monthKey - Format: 'YYYY-MM'
   * @returns {Promise<Array>} Array of legacy submissions
   */
  static async fetchLegacySubmissions(monthKey) {
    if (!supabase) {
      console.warn('Supabase not available, returning empty array');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('month_key', monthKey);

      if (error) {
        console.error('Error fetching legacy submissions:', error);
        return [];
      }

      // Transform legacy data to match expected format
      return (data || []).map(submission => ({
        ...submission,
        unified_users: {
          name: submission.employee_name,
          phone: submission.employee_phone,
          department: submission.department,
          role: Array.isArray(submission.role) ? submission.role[0] : submission.role,
          user_category: 'employee'
        },
        form_data: {
          overall_score: submission.overall_score,
          kpi_score: submission.kpi_score,
          learning_score: submission.learning_score,
          relationship_score: submission.relationship_score,
          tasks_completed: submission.tasks_completed,
          attendance_wfo: submission.attendance_wfo,
          attendance_wfh: submission.attendance_wfh
        }
      }));
    } catch (error) {
      console.error('Error in fetchLegacySubmissions:', error);
      return [];
    }
  }

  /**
   * Get monthly report data combining users and submissions
   */
  static async getMonthlyReportData(selectedMonth) {
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const monthKey = selectedMonth; // Format: "YYYY-MM"

      // Fetch users and submissions in parallel
      const [users, monthlySubmissions, legacySubmissions] = await Promise.all([
        this.fetchUsers(),
        this.fetchMonthlySubmissions(year, month),
        this.fetchLegacySubmissions(monthKey)
      ]);

      // Combine submissions from both tables
      const allSubmissions = [
        ...monthlySubmissions.map(sub => ({
          ...sub,
          source: 'monthly_form_submissions',
          employeeId: sub.user_id,
          employee: sub.user,
          performance_score: this.extractPerformanceScore(sub),
          totalScore: this.extractPerformanceScore(sub)
        })),
        ...legacySubmissions.map(sub => ({
          ...sub,
          source: 'submissions',
          employeeId: sub.employee_name, // Legacy format
          employee: sub.unified_users,
          performance_score: this.extractPerformanceScore(sub),
          totalScore: this.extractPerformanceScore(sub)
        }))
      ];

      return {
        users,
        submissions: allSubmissions,
        monthKey,
        year,
        month
      };
    } catch (error) {
      console.error('Error getting monthly report data:', error);
      throw error;
    }
  }

  /**
   * Extract performance score from submission data
   * @param {Object} submission - Submission object
   * @returns {number} Performance score (0-100)
   */
  static extractPerformanceScore(submission) {
    // Try different score fields that might exist in form_data
    const formData = submission.form_data || {};
    
    // Look for various score fields in form_data first
    const scoreFields = [
      'overall_score',
      'performance_score', 
      'total_score',
      'kpi_score',
      'average_score'
    ];
    
    for (const field of scoreFields) {
      const score = formData[field];
      if (typeof score === 'number' && score > 0) {
        // Convert to 0-100 scale if needed
        return score > 10 ? score : score * 10;
      }
    }
    
    // Fallback to direct submission properties (legacy format)
    for (const field of scoreFields) {
      const score = submission[field];
      if (typeof score === 'number' && score > 0) {
        return score > 10 ? score : score * 10;
      }
    }
    
    // Fallback: calculate average of available scores from form_data
    const availableScores = [
      formData.kpi_score,
      formData.learning_score,
      formData.relationship_score,
      formData.discipline_score
    ].filter(score => typeof score === 'number' && score > 0);
    
    if (availableScores.length > 0) {
      const average = availableScores.reduce((sum, score) => sum + score, 0) / availableScores.length;
      return average > 10 ? average : average * 10;
    }
    
    // Fallback: calculate average of available scores from direct properties (legacy)
    const legacyScores = [
      submission.kpi_score,
      submission.learning_score,
      submission.relationship_score,
      submission.overall_score
    ].filter(score => typeof score === 'number' && score > 0);
    
    if (legacyScores.length > 0) {
      const average = legacyScores.reduce((sum, score) => sum + score, 0) / legacyScores.length;
      return average > 10 ? average : average * 10;
    }
    
    return 0;
  }

  /**
   * Get department breakdown for monthly report
   */
  static calculateDepartmentBreakdown(users, submissions) {
    const breakdown = {};
    
    // Initialize departments from users
    users.forEach(user => {
      const dept = user.department || 'Unknown';
      if (!breakdown[dept]) {
        breakdown[dept] = {
          employees: 0,
          submissions: 0,
          totalScore: 0,
          scoreCount: 0
        };
      }
      breakdown[dept].employees++;
    });

    // Add submission data
    submissions.forEach(submission => {
      const dept = submission.employee?.department || submission.department || 'Unknown';
      if (breakdown[dept]) {
        breakdown[dept].submissions++;
        const score = submission.performance_score || submission.totalScore || 0;
        if (score > 0) {
          breakdown[dept].totalScore += score;
          breakdown[dept].scoreCount++;
        }
      }
    });

    // Calculate averages and format result
    return Object.entries(breakdown).map(([department, data]) => ({
      department,
      employees: data.employees,
      submissions: data.submissions,
      avgScore: data.scoreCount > 0 ? (data.totalScore / data.scoreCount).toFixed(1) : '0.0',
      submissionRate: data.employees > 0 ? ((data.submissions / data.employees) * 100).toFixed(1) : '0.0'
    }));
  }

  /**
   * Calculate monthly metrics
   */
  static calculateMonthlyMetrics(users, submissions) {
    const activeEmployees = users.filter(user => user.status === 'active').length;
    const totalSubmissions = submissions.length;
    const uniqueSubmitters = new Set(
      submissions.map(sub => sub.employeeId || sub.user_id || sub.employee?.name)
    ).size;
    
    const avgSubmissionsPerEmployee = activeEmployees > 0 
      ? (totalSubmissions / activeEmployees).toFixed(1) 
      : '0.0';
    
    // Calculate performance metrics
    const performanceScores = submissions
      .map(sub => sub.performance_score || sub.totalScore || 0)
      .filter(score => score > 0);
    
    const avgPerformance = performanceScores.length > 0 
      ? (performanceScores.reduce((sum, score) => sum + score, 0) / performanceScores.length).toFixed(1)
      : '0.0';

    const submissionRate = activeEmployees > 0 
      ? ((uniqueSubmitters / activeEmployees) * 100).toFixed(1) 
      : '0.0';

    return {
      activeEmployees,
      totalSubmissions,
      uniqueSubmitters,
      avgSubmissionsPerEmployee,
      avgPerformance,
      submissionRate
    };
  }
}

export default MonthlyReportService;