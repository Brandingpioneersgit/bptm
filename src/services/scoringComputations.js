/**
 * Scoring Computations for Monthly Operating System
 * Handles accountability, output, learning, and monthly scoring calculations
 */

import { supabase } from '../database/supabaseClient';

/**
 * Clamp a value between min and max
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate Accountability Score (0-10)
 * Project-based: actual projects vs expected projects
 * Unit-based: delivered units vs expected units (when available)
 */
export async function calculateAccountabilityScore(userId, month, year) {
  try {
    // Get expected projects from user entity mappings
    const { data: mappings, error: mappingsError } = await supabase
      .from('user_entity_mappings')
      .select('expected_projects, expected_units')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (mappingsError) throw mappingsError;

    const expectedProjects = mappings.reduce((sum, mapping) => sum + (mapping.expected_projects || 0), 0);
    const expectedUnits = mappings.reduce((sum, mapping) => sum + (mapping.expected_units || 0), 0);

    // Get actual projects (distinct entity_ids with monthly_rows)
    const { data: monthlyRows, error: rowsError } = await supabase
      .from('monthly_rows')
      .select('entity_id, kpi_json')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .in('status', ['draft', 'submitted', 'approved']);

    if (rowsError) throw rowsError;

    const actualProjects = new Set(monthlyRows.map(row => row.entity_id)).size;
    
    // Project-based accountability
    const accountabilityProjects = clamp((actualProjects / Math.max(expectedProjects, 1)) * 10, 0, 10);

    // Unit-based accountability (when delivered_units exists in kpi_json)
    let accountabilityUnits = 10; // Default to max if no units tracking
    const totalDeliveredUnits = monthlyRows.reduce((sum, row) => {
      const kpiData = row.kpi_json || {};
      return sum + (kpiData.delivered_units || 0);
    }, 0);

    if (expectedUnits > 0) {
      accountabilityUnits = clamp((totalDeliveredUnits / Math.max(expectedUnits, 1)) * 10, 0, 10);
    }

    // Take the lower score as the accountability cap
    const finalAccountability = Math.min(accountabilityProjects, accountabilityUnits);

    return {
      accountability_score: parseFloat(finalAccountability.toFixed(2)),
      expected_projects: expectedProjects,
      actual_projects: actualProjects,
      expected_units: expectedUnits,
      delivered_units: totalDeliveredUnits
    };
  } catch (error) {
    console.error('Error calculating accountability score:', error);
    return { accountability_score: 0, error: error.message };
  }
}

/**
 * Calculate Provisional Output Score (0-10)
 * Based on submission status and review notes
 */
export async function calculateOutputScore(userId, month, year) {
  try {
    const { data: monthlyRows, error } = await supabase
      .from('monthly_rows')
      .select('status, review_notes')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year);

    if (error) throw error;

    if (monthlyRows.length === 0) {
      return { output_score: 0, row_scores: [] };
    }

    const rowScores = monthlyRows.map(row => {
      let score = 5; // Default entity row score

      if (['submitted', 'approved'].includes(row.status) && 
          row.review_notes && 
          row.review_notes.trim().length > 0 && 
          !row.review_notes.toLowerCase().includes('rework')) {
        score = 7; // Positive review
      } else if (row.status === 'returned' || 
                 (row.review_notes && row.review_notes.toLowerCase().includes('rework'))) {
        score = 3; // Returned for rework
      }

      return score;
    });

    const averageScore = rowScores.reduce((sum, score) => sum + score, 0) / rowScores.length;

    return {
      output_score: parseFloat(averageScore.toFixed(2)),
      row_scores: rowScores
    };
  } catch (error) {
    console.error('Error calculating output score:', error);
    return { output_score: 0, error: error.message };
  }
}

/**
 * Calculate Learning Component (0-10)
 * Based on learning minutes for the month
 */
export async function calculateLearningComponent(userId, month, year) {
  try {
    const { data: monthlyRows, error } = await supabase
      .from('monthly_rows')
      .select('learning_json')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year);

    if (error) throw error;

    let totalLearningMinutes = 0;
    const learningEntries = [];

    monthlyRows.forEach(row => {
      const learningData = row.learning_json || [];
      if (Array.isArray(learningData)) {
        learningData.forEach(entry => {
          if (entry.topic && entry.url && entry.applied_where && entry.minutes) {
            totalLearningMinutes += parseInt(entry.minutes) || 0;
            learningEntries.push(entry);
          }
        });
      }
    });

    const learningComponent = Math.min(totalLearningMinutes / 360, 1) * 10;

    // Check if appraisal delay is needed
    const needsAppraisalDelay = totalLearningMinutes < 360;

    if (needsAppraisalDelay) {
      await recordAppraisalDelay(userId, month, year, totalLearningMinutes);
    }

    return {
      learning_component: parseFloat(learningComponent.toFixed(2)),
      learning_minutes: totalLearningMinutes,
      learning_entries: learningEntries,
      needs_appraisal_delay: needsAppraisalDelay
    };
  } catch (error) {
    console.error('Error calculating learning component:', error);
    return { learning_component: 0, error: error.message };
  }
}

/**
 * Record appraisal delay for insufficient learning
 */
async function recordAppraisalDelay(userId, month, year, learningMinutes) {
  try {
    const { error } = await supabase
      .from('appraisal_delays')
      .upsert({
        user_id: userId,
        month,
        year,
        reason: 'insufficient_learning',
        deficit_minutes: 360 - learningMinutes,
        delay_months: 1,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,month,year,reason'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error recording appraisal delay:', error);
  }
}

/**
 * Calculate Discipline Component (0-10)
 * Based on attendance data from monthly_attendance_cache
 */
export async function calculateDisciplineComponent(userId, month, year) {
  try {
    // Get discipline component from monthly attendance cache
    const { data: attendanceData, error } = await supabase
      .from('monthly_attendance_cache')
      .select('discipline_component, office_attendance_rate, meeting_attendance_rate, office_days_present, working_days_expected')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK
      throw error;
    }

    if (attendanceData) {
      return {
        discipline_component: parseFloat(attendanceData.discipline_component) || 0.0,
        office_attendance_rate: parseFloat(attendanceData.office_attendance_rate) || 0.0,
        meeting_attendance_rate: parseFloat(attendanceData.meeting_attendance_rate) || 0.0,
        office_days_present: attendanceData.office_days_present || 0,
        working_days_expected: attendanceData.working_days_expected || 0
      };
    }

    // If no attendance data found, try to compute it
    try {
      // Import attendance API to compute monthly attendance
      const { computeMonthlyAttendance } = await import('../api/attendanceApi');
      await computeMonthlyAttendance(userId, year, month);
      
      // Try to fetch again after computation
      const { data: newAttendanceData, error: newError } = await supabase
        .from('monthly_attendance_cache')
        .select('discipline_component, office_attendance_rate, meeting_attendance_rate, office_days_present, working_days_expected')
        .eq('user_id', userId)
        .eq('month', month)
        .eq('year', year)
        .single();

      if (!newError && newAttendanceData) {
        return {
          discipline_component: parseFloat(newAttendanceData.discipline_component) || 0.0,
          office_attendance_rate: parseFloat(newAttendanceData.office_attendance_rate) || 0.0,
          meeting_attendance_rate: parseFloat(newAttendanceData.meeting_attendance_rate) || 0.0,
          office_days_present: newAttendanceData.office_days_present || 0,
          working_days_expected: newAttendanceData.working_days_expected || 0
        };
      }
    } catch (computeError) {
      console.warn('Could not compute attendance data:', computeError);
    }

    // Fallback to default score if no attendance data available
    return {
      discipline_component: 8.0, // Default good score
      office_attendance_rate: 0.0,
      meeting_attendance_rate: 0.0,
      office_days_present: 0,
      working_days_expected: 0
    };
  } catch (error) {
    console.error('Error calculating discipline component:', error);
    return {
      discipline_component: 8.0, // Default
      office_attendance_rate: 0.0,
      meeting_attendance_rate: 0.0,
      office_days_present: 0,
      working_days_expected: 0
    };
  }
}

/**
 * Calculate Row Score (0-10) per entity row
 * Weighted mean of accountability and provisional output
 */
export async function calculateRowScore(userId, entityId, month, year) {
  try {
    const accountability = await calculateAccountabilityScore(userId, month, year);
    const output = await calculateOutputScore(userId, month, year);

    // Weighted mean: accountability (50%) + output (50%)
    const rowScore = (accountability.accountability_score * 0.5) + (output.output_score * 0.5);

    return {
      row_score: parseFloat(rowScore.toFixed(2)),
      accountability_score: accountability.accountability_score,
      output_score: output.output_score
    };
  } catch (error) {
    console.error('Error calculating row score:', error);
    return { row_score: 0, error: error.message };
  }
}

/**
 * Calculate User Month Score (0-100)
 * Weighted combination of row scores, learning, and discipline
 */
export async function calculateUserMonthScore(userId, month, year) {
  try {
    const accountability = await calculateAccountabilityScore(userId, month, year);
    const output = await calculateOutputScore(userId, month, year);
    const learning = await calculateLearningComponent(userId, month, year);
    const discipline = await calculateDisciplineComponent(userId, month, year);

    // Average row score (accountability + output weighted mean)
    const avgRowScore = (accountability.accountability_score * 0.5) + (output.output_score * 0.5);

    // User Month Score calculation
    // Row scores contribute up to 80 points (avgRowScore * 8)
    // Learning contributes up to 10 points
    // Discipline contributes up to 10 points
    const rowPoints = avgRowScore * 8; // Up to 80 points
    const learningPoints = learning.learning_component; // Up to 10 points
    const disciplinePoints = discipline.discipline_component; // Up to 10 points

    const userMonthScore = Math.round(rowPoints + learningPoints + disciplinePoints);

    return {
      user_month_score: clamp(userMonthScore, 0, 100),
      breakdown: {
        avg_row_score: parseFloat(avgRowScore.toFixed(2)),
        row_points: parseFloat(rowPoints.toFixed(2)),
        learning_component: learning.learning_component,
        learning_minutes: learning.learning_minutes,
        discipline_component: discipline.discipline_component,
        accountability_score: accountability.accountability_score,
        output_score: output.output_score
      },
      flags: {
        needs_appraisal_delay: learning.needs_appraisal_delay
      }
    };
  } catch (error) {
    console.error('Error calculating user month score:', error);
    return { user_month_score: 0, error: error.message };
  }
}

/**
 * Recompute all scores for a user and month
 */
export async function recomputeUserMonth(userId, month, year) {
  try {
    const scores = await calculateUserMonthScore(userId, month, year);
    
    // Update monthly_rows with computed scores
    const { error: updateError } = await supabase
      .from('monthly_rows')
      .update({
        computed_scores: scores,
        last_computed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year);

    if (updateError) throw updateError;

    return scores;
  } catch (error) {
    console.error('Error recomputing user month:', error);
    return { error: error.message };
  }
}