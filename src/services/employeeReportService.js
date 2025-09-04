import { supabase } from '../shared/lib/supabase';

/**
 * Service for handling employee report data from Supabase
 */
export class EmployeeReportService {
  /**
   * Fetch all submissions for a specific employee
   * @param {string} employeeName - Name of the employee
   * @param {string} employeePhone - Phone number of the employee (optional)
   * @returns {Promise<Array>} Array of submissions with user details
   */
  static async getEmployeeSubmissions(employeeName, employeePhone = null) {
    try {
      // First, find the user by name (and optionally phone)
      let userQuery = supabase
        .from('unified_users')
        .select('id, name, email, phone, role, department')
        .ilike('name', `%${employeeName}%`);
      
      if (employeePhone) {
        userQuery = userQuery.eq('phone', employeePhone);
      }
      
      const { data: users, error: userError } = await userQuery;
      
      if (userError) {
        throw new Error(`Error fetching user: ${userError.message}`);
      }
      
      if (!users || users.length === 0) {
        return [];
      }
      
      // Use the first matching user
      const user = users[0];
      
      // Fetch monthly form submissions
      const { data: monthlySubmissions, error: monthlyError } = await supabase
        .from('monthly_form_submissions')
        .select(`
          id,
          user_id,
          submission_month,
          form_type,
          form_data,
          created_at,
          updated_at
        `)
        .eq('user_id', user.id)
        .order('submission_month', { ascending: true });
      
      if (monthlyError) {
        throw new Error(`Error fetching monthly submissions: ${monthlyError.message}`);
      }
      
      // Fetch legacy submissions for backward compatibility
      const { data: legacySubmissions, error: legacyError } = await supabase
        .from('submissions')
        .select('*')
        .ilike('employee_name', `%${employeeName}%`)
        .order('month_key', { ascending: true });
      
      if (legacyError) {
        console.warn('Error fetching legacy submissions:', legacyError.message);
      }
      
      // Transform and combine submissions
      const transformedMonthly = this.transformMonthlySubmissions(monthlySubmissions || [], user);
      const transformedLegacy = this.transformLegacySubmissions(legacySubmissions || []);
      
      // Combine and sort by month
      const allSubmissions = [...transformedMonthly, ...transformedLegacy]
        .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
      
      return allSubmissions;
    } catch (error) {
      console.error('Error in getEmployeeSubmissions:', error);
      throw error;
    }
  }
  
  /**
   * Transform monthly form submissions to match expected format
   * @param {Array} submissions - Raw monthly submissions
   * @param {Object} user - User details
   * @returns {Array} Transformed submissions
   */
  static transformMonthlySubmissions(submissions, user) {
    return submissions.map(sub => {
      const formData = sub.form_data || {};
      
      // Extract month key from submission_month (YYYY-MM-DD -> YYYY-MM)
      const monthKey = sub.submission_month ? sub.submission_month.substring(0, 7) : null;
      
      return {
        id: sub.id,
        monthKey,
        employee: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          department: user.department
        },
        scores: this.extractScores(formData),
        learning: formData.learning || [],
        kpis: formData.kpis || [],
        clientRelationships: formData.clientRelationships || [],
        manager: formData.manager || {},
        created_at: sub.created_at,
        updated_at: sub.updated_at,
        form_type: sub.form_type,
        raw_form_data: formData
      };
    });
  }
  
  /**
   * Transform legacy submissions to match expected format
   * @param {Array} submissions - Raw legacy submissions
   * @returns {Array} Transformed submissions
   */
  static transformLegacySubmissions(submissions) {
    return submissions.map(sub => {
      return {
        id: sub.id,
        monthKey: sub.month_key,
        employee: {
          name: sub.employee_name,
          phone: sub.employee_phone,
          department: sub.department
        },
        scores: {
          overall: sub.overall_score || 0,
          kpiScore: sub.kpi_score || 0,
          learningScore: sub.learning_score || 0,
          relationshipScore: sub.relationship_score || 0
        },
        learning: sub.learning || [],
        kpis: sub.kpis || [],
        clientRelationships: sub.client_relationships || [],
        manager: {
          comments: sub.manager_comments,
          score: sub.manager_score
        },
        created_at: sub.created_at,
        updated_at: sub.updated_at,
        isLegacy: true
      };
    });
  }
  
  /**
   * Extract scores from form data
   * @param {Object} formData - Form data object
   * @returns {Object} Extracted scores
   */
  static extractScores(formData) {
    // Handle different score field variations
    const overall = formData.overall_score || formData.overallScore || formData.total_score || 0;
    const kpiScore = formData.kpi_score || formData.kpiScore || formData.performance_score || 0;
    const learningScore = formData.learning_score || formData.learningScore || 0;
    const relationshipScore = formData.relationship_score || formData.relationshipScore || formData.client_score || 0;
    
    return {
      overall: Number(overall) || 0,
      kpiScore: Number(kpiScore) || 0,
      learningScore: Number(learningScore) || 0,
      relationshipScore: Number(relationshipScore) || 0
    };
  }
  
  /**
   * Calculate yearly summary for an employee
   * @param {Array} submissions - Employee submissions
   * @returns {Object} Yearly summary statistics
   */
  static calculateYearlySummary(submissions) {
    if (!submissions || submissions.length === 0) {
      return null;
    }
    
    let totalKpi = 0;
    let totalLearning = 0;
    let totalRelationship = 0;
    let totalOverall = 0;
    let monthsWithLearningShortfall = 0;
    
    submissions.forEach(s => {
      totalKpi += s.scores?.kpiScore || 0;
      totalLearning += s.scores?.learningScore || 0;
      totalRelationship += s.scores?.relationshipScore || 0;
      totalOverall += s.scores?.overall || 0;
      
      // Check learning hours (360 minutes = 6 hours)
      const learningMinutes = (s.learning || []).reduce((sum, e) => sum + (e.durationMins || 0), 0);
      if (learningMinutes < 360) {
        monthsWithLearningShortfall++;
      }
    });
    
    const totalMonths = submissions.length;
    const round1 = (num) => Math.round(num * 10) / 10;
    
    return {
      avgKpi: round1(totalKpi / totalMonths),
      avgLearning: round1(totalLearning / totalMonths),
      avgRelationship: round1(totalRelationship / totalMonths),
      avgOverall: round1(totalOverall / totalMonths),
      totalMonths,
      monthsWithLearningShortfall
    };
  }
  
  /**
   * Get improvement recommendations based on performance
   * @param {Object} yearlySummary - Yearly summary data
   * @returns {string} Formatted recommendations
   */
  static getImprovementRecommendations(yearlySummary) {
    if (!yearlySummary) {
      return "No data available for recommendations.";
    }
    
    const learningShortfall = yearlySummary.monthsWithLearningShortfall > 0;
    const lowKPIScore = yearlySummary.avgKpi < 7;
    const lowRelationshipScore = yearlySummary.avgRelationship < 7;
    
    let recommendations = [];
    
    if (learningShortfall) {
      recommendations.push("Focus on dedicating at least 6 hours per month to learning to avoid appraisal delays.");
    }
    
    if (lowKPIScore) {
      recommendations.push("Review KPI performance to identify areas for improvement and focus on key metrics.");
    }
    
    if (lowRelationshipScore) {
      recommendations.push("Improve client relationship management by scheduling more regular check-ins and proactively addressing issues.");
    }
    
    if (recommendations.length === 0) {
      return "No specific recommendations at this time. Keep up the great work!";
    }
    
    return recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n');
  }
}

export default EmployeeReportService;