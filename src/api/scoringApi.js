/**
 * Scoring API Endpoints for Monthly Operating System
 * Handles computation requests and score reporting
 */

import { supabase } from '../database/supabaseClient';
import {
  calculateAccountabilityScore,
  calculateOutputScore,
  calculateLearningComponent,
  calculateDisciplineComponent,
  calculateRowScore,
  calculateUserMonthScore,
  recomputeUserMonth
} from '../services/scoringComputations';
import { sanitizeInput } from '../utils/inputSanitization';

/**
 * POST /monthly/{id}/compute
 * Returns row_score + user_month_score preview for a specific monthly row
 */
export async function computeMonthlyRowScore(monthlyRowId) {
  try {
    // Validate input
    const sanitizedId = sanitizeInput(monthlyRowId);
    if (!sanitizedId) {
      return { error: 'Invalid monthly row ID', status: 400 };
    }

    // Get monthly row details
    const { data: monthlyRow, error: rowError } = await supabase
      .from('monthly_rows')
      .select('user_id, entity_id, month, year, status')
      .eq('id', sanitizedId)
      .single();

    if (rowError) {
      return { error: 'Monthly row not found', status: 404 };
    }

    const { user_id, entity_id, month, year } = monthlyRow;

    // Calculate row score
    const rowScore = await calculateRowScore(user_id, entity_id, month, year);
    
    // Calculate user month score
    const userMonthScore = await calculateUserMonthScore(user_id, month, year);

    return {
      monthly_row_id: sanitizedId,
      row_score: rowScore,
      user_month_score: userMonthScore,
      computed_at: new Date().toISOString(),
      status: 200
    };
  } catch (error) {
    console.error('Error computing monthly row score:', error);
    return { error: error.message, status: 500 };
  }
}

/**
 * POST /users/{id}/recompute?month=YYYY-MM
 * Recompute everything after edits for a specific user and month
 */
export async function recomputeUserScores(userId, month) {
  try {
    // Validate inputs
    const sanitizedUserId = sanitizeInput(userId);
    const sanitizedMonth = sanitizeInput(month);
    
    if (!sanitizedUserId || !sanitizedMonth) {
      return { error: 'Invalid user ID or month format', status: 400 };
    }

    // Parse month (YYYY-MM format)
    const [year, monthNum] = sanitizedMonth.split('-');
    if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
      return { error: 'Invalid month format. Use YYYY-MM', status: 400 };
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', sanitizedUserId)
      .single();

    if (userError) {
      return { error: 'User not found', status: 404 };
    }

    // Recompute all scores
    const scores = await recomputeUserMonth(sanitizedUserId, parseInt(monthNum), parseInt(year));

    if (scores.error) {
      return { error: scores.error, status: 500 };
    }

    // Log the recomputation
    await supabase
      .from('change_audit')
      .insert({
        table_name: 'monthly_rows',
        operation: 'recompute',
        user_id: sanitizedUserId,
        changed_data: {
          month: parseInt(monthNum),
          year: parseInt(year),
          recomputed_scores: scores
        },
        changed_by: sanitizedUserId,
        changed_at: new Date().toISOString()
      });

    return {
      user_id: sanitizedUserId,
      month: sanitizedMonth,
      scores,
      recomputed_at: new Date().toISOString(),
      status: 200
    };
  } catch (error) {
    console.error('Error recomputing user scores:', error);
    return { error: error.message, status: 500 };
  }
}

/**
 * GET /reports/user-month-score?userId=&month=YYYY-MM
 * Get detailed user month score report
 */
export async function getUserMonthScoreReport(userId, month) {
  try {
    // Validate inputs
    const sanitizedUserId = sanitizeInput(userId);
    const sanitizedMonth = sanitizeInput(month);
    
    if (!sanitizedUserId || !sanitizedMonth) {
      return { error: 'Invalid user ID or month format', status: 400 };
    }

    // Parse month
    const [year, monthNum] = sanitizedMonth.split('-');
    if (!year || !monthNum) {
      return { error: 'Invalid month format. Use YYYY-MM', status: 400 };
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, user_type')
      .eq('id', sanitizedUserId)
      .single();

    if (userError) {
      return { error: 'User not found', status: 404 };
    }

    // Calculate all score components
    const accountability = await calculateAccountabilityScore(sanitizedUserId, parseInt(monthNum), parseInt(year));
    const output = await calculateOutputScore(sanitizedUserId, parseInt(monthNum), parseInt(year));
    const learning = await calculateLearningComponent(sanitizedUserId, parseInt(monthNum), parseInt(year));
    const discipline = await calculateDisciplineComponent(sanitizedUserId, parseInt(monthNum), parseInt(year));
    const userMonthScore = await calculateUserMonthScore(sanitizedUserId, parseInt(monthNum), parseInt(year));

    // Get monthly rows for additional context
    const { data: monthlyRows, error: rowsError } = await supabase
      .from('monthly_rows')
      .select('id, entity_id, status, work_summary, submitted_at, approved_at')
      .eq('user_id', sanitizedUserId)
      .eq('month', parseInt(monthNum))
      .eq('year', parseInt(year));

    if (rowsError) {
      console.error('Error fetching monthly rows:', rowsError);
    }

    // Check for appraisal delays
    const { data: appraisalDelays, error: delaysError } = await supabase
      .from('appraisal_delays')
      .select('*')
      .eq('user_id', sanitizedUserId)
      .eq('month', parseInt(monthNum))
      .eq('year', parseInt(year));

    if (delaysError) {
      console.error('Error fetching appraisal delays:', delaysError);
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        user_type: user.user_type
      },
      period: {
        month: parseInt(monthNum),
        year: parseInt(year),
        month_name: new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'long' })
      },
      scores: {
        accountability: accountability.accountability_score,
        output: output.output_score,
        learning: learning.learning_component,
        discipline: discipline.discipline_component,
        user_month_score: userMonthScore.user_month_score
      },
      details: {
        accountability_details: accountability,
        output_details: output,
        learning_details: learning,
        discipline_details: discipline,
        breakdown: userMonthScore.breakdown
      },
      monthly_rows: monthlyRows || [],
      appraisal_delays: appraisalDelays || [],
      flags: {
        needs_appraisal_delay: learning.needs_appraisal_delay,
        has_pending_submissions: (monthlyRows || []).some(row => row.status === 'draft'),
        all_approved: (monthlyRows || []).every(row => row.status === 'approved')
      },
      generated_at: new Date().toISOString(),
      status: 200
    };
  } catch (error) {
    console.error('Error generating user month score report:', error);
    return { error: error.message, status: 500 };
  }
}

/**
 * GET /reports/team-summary?month=YYYY-MM&teamId=
 * Get team summary report for on-time submissions, average scores, learning compliance
 */
export async function getTeamSummaryReport(month, teamId = null) {
  try {
    // Validate inputs
    const sanitizedMonth = sanitizeInput(month);
    
    if (!sanitizedMonth) {
      return { error: 'Invalid month format', status: 400 };
    }

    // Parse month
    const [year, monthNum] = sanitizedMonth.split('-');
    if (!year || !monthNum) {
      return { error: 'Invalid month format. Use YYYY-MM', status: 400 };
    }

    // Build user filter query
    let userQuery = supabase
      .from('users')
      .select('id, name, user_type');

    if (teamId) {
      // If teamId is provided, filter by team (assuming team info in user_entity_mappings)
      const { data: teamUsers, error: teamError } = await supabase
        .from('user_entity_mappings')
        .select('user_id')
        .eq('entity_id', teamId)
        .eq('is_active', true);

      if (teamError) {
        console.error('Error fetching team users:', teamError);
      } else {
        const userIds = teamUsers.map(mapping => mapping.user_id);
        userQuery = userQuery.in('id', userIds);
      }
    }

    const { data: users, error: usersError } = await userQuery;

    if (usersError) {
      return { error: 'Error fetching users', status: 500 };
    }

    // Calculate metrics for each user
    const userMetrics = await Promise.all(
      users.map(async (user) => {
        const userScore = await calculateUserMonthScore(user.id, parseInt(monthNum), parseInt(year));
        const learning = await calculateLearningComponent(user.id, parseInt(monthNum), parseInt(year));
        
        // Check submission status
        const { data: submissions, error: submissionsError } = await supabase
          .from('monthly_rows')
          .select('status, submitted_at')
          .eq('user_id', user.id)
          .eq('month', parseInt(monthNum))
          .eq('year', parseInt(year));

        const hasSubmissions = submissions && submissions.length > 0;
        const onTimeSubmission = hasSubmissions && submissions.some(s => 
          s.status !== 'draft' && s.submitted_at
        );
        const learningCompliant = learning.learning_minutes >= 360;

        return {
          user_id: user.id,
          name: user.name,
          user_type: user.user_type,
          user_month_score: userScore.user_month_score,
          learning_minutes: learning.learning_minutes,
          learning_compliant: learningCompliant,
          has_submissions: hasSubmissions,
          on_time_submission: onTimeSubmission
        };
      })
    );

    // Calculate team aggregates
    const totalUsers = userMetrics.length;
    const onTimeSubmissions = userMetrics.filter(u => u.on_time_submission).length;
    const learningCompliant = userMetrics.filter(u => u.learning_compliant).length;
    const averageScore = totalUsers > 0 ? 
      userMetrics.reduce((sum, u) => sum + u.user_month_score, 0) / totalUsers : 0;
    const averageLearningMinutes = totalUsers > 0 ?
      userMetrics.reduce((sum, u) => sum + u.learning_minutes, 0) / totalUsers : 0;

    return {
      period: {
        month: parseInt(monthNum),
        year: parseInt(year),
        month_name: new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'long' })
      },
      team_metrics: {
        total_users: totalUsers,
        on_time_submissions_count: onTimeSubmissions,
        on_time_submissions_percentage: totalUsers > 0 ? Math.round((onTimeSubmissions / totalUsers) * 100) : 0,
        learning_compliant_count: learningCompliant,
        learning_compliance_percentage: totalUsers > 0 ? Math.round((learningCompliant / totalUsers) * 100) : 0,
        average_user_month_score: Math.round(averageScore * 100) / 100,
        average_learning_minutes: Math.round(averageLearningMinutes)
      },
      user_details: userMetrics,
      generated_at: new Date().toISOString(),
      status: 200
    };
  } catch (error) {
    console.error('Error generating team summary report:', error);
    return { error: error.message, status: 500 };
  }
}

/**
 * Batch compute scores for multiple users
 * Useful for end-of-month processing
 */
export async function batchComputeScores(userIds, month, year) {
  try {
    const results = await Promise.all(
      userIds.map(async (userId) => {
        try {
          const scores = await recomputeUserMonth(userId, month, year);
          return { user_id: userId, success: true, scores };
        } catch (error) {
          return { user_id: userId, success: false, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
      total_processed: userIds.length,
      successful_count: successful.length,
      failed_count: failed.length,
      successful_users: successful,
      failed_users: failed,
      processed_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in batch compute scores:', error);
    return { error: error.message };
  }
}