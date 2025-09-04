// Arcade Program Validation Utilities

/**
 * Check if user is eligible for Arcade Program
 * @param {Object} user - User object with role and department info
 * @returns {Object} - { isEligible: boolean, reason: string }
 */
export const checkArcadeEligibility = (user) => {
  // If no user provided, assume not eligible
  if (!user) {
    return {
      isEligible: false,
      reason: 'User information not available'
    };
  }

  // Interns are not eligible
  if (user?.role === 'intern' || user?.userType === 'intern' || user?.user_category === 'intern') {
    return {
      isEligible: false,
      reason: 'Interns are not eligible for the Arcade Program'
    };
  }

  // HR department employees are not eligible
  if (user?.department === 'HR' || user?.department === 'hr' || user?.role === 'HR') {
    return {
      isEligible: false,
      reason: 'HR department employees are not eligible for the Arcade Program'
    };
  }

  // Check employment type - handle various formats
  const employmentType = user?.employment_type || user?.employee_type;
  const isFullTime = employmentType === 'full-time' || 
                    employmentType === 'fulltime' || 
                    employmentType === 'full_time' || 
                    employmentType === 'Full-time' || 
                    employmentType === 'Full Time';
  
  // If employment type is not specified, assume eligible (for backward compatibility)
  if (employmentType && !isFullTime) {
    return {
      isEligible: false,
      reason: 'Only full-time employees are eligible for the Arcade Program'
    };
  }

  return {
    isEligible: true,
    reason: 'User is eligible for the Arcade Program'
  };
};

/**
 * Validate activity submission
 * @param {Object} activity - Activity data
 * @param {Object} user - User object
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateActivitySubmission = (activity, user) => {
  const errors = [];

  // Check eligibility first
  const eligibility = checkArcadeEligibility(user);
  if (!eligibility.isEligible) {
    errors.push(eligibility.reason);
  }

  // Required fields
  if (!activity.activity_type) {
    errors.push('Activity category is required');
  }

  if (!activity.activity_subtype) {
    errors.push('Activity type is required');
  }

  if (!activity.description || activity.description.trim().length < 10) {
    errors.push('Description must be at least 10 characters long');
  }

  // Proof URL validation for certain activities
  const requiresProof = [
    'google_review',
    'video_testimonial',
    'bp_reel',
    'full_video'
  ];

  if (requiresProof.includes(activity.activity_subtype) && !activity.proof_url) {
    errors.push('Proof URL is required for this activity type');
  }

  // URL format validation
  if (activity.proof_url && !isValidUrl(activity.proof_url)) {
    errors.push('Please provide a valid URL for proof');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate redemption request
 * @param {Object} redemption - Redemption data
 * @param {number} currentPoints - User's current points
 * @param {Object} user - User object
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateRedemptionRequest = (redemption, currentPoints, user) => {
  const errors = [];

  // Check eligibility
  const eligibility = checkArcadeEligibility(user);
  if (!eligibility.isEligible) {
    errors.push(eligibility.reason);
  }

  // Required fields
  if (!redemption.reward_id) {
    errors.push('Reward selection is required');
  }

  if (!redemption.points_required || redemption.points_required <= 0) {
    errors.push('Invalid points requirement');
  }

  // Sufficient points check
  if (currentPoints < redemption.points_required) {
    errors.push(`Insufficient points. You have ${currentPoints} points but need ${redemption.points_required}`);
  }

  // WFH special validation - requires minimum 50 points balance
  if (redemption.reward_type === 'wfh' && (currentPoints - redemption.points_required) < 50) {
    errors.push('WFH redemption requires maintaining a minimum balance of 50 points');
  }

  // Manager approval required for WFH
  if (redemption.reward_type === 'wfh' && !redemption.manager_approval_requested) {
    errors.push('Manager approval is required for WFH redemption');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate escalation entry (HR/Team Leader only)
 * @param {Object} escalation - Escalation data
 * @param {Object} user - User creating the escalation
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateEscalationEntry = (escalation, user) => {
  const errors = [];

  // Only HR or Team Leaders can create escalations
  const authorizedRoles = ['hr', 'team_leader', 'manager', 'operations_head'];
  if (!authorizedRoles.includes(user?.role?.toLowerCase())) {
    errors.push('Only HR, Team Leaders, Managers, or Operations Head can create escalations');
  }

  // Required fields
  if (!escalation.employee_id) {
    errors.push('Employee selection is required');
  }

  if (!escalation.escalation_type) {
    errors.push('Escalation type is required');
  }

  if (!escalation.points_deducted || escalation.points_deducted <= 0) {
    errors.push('Points deduction must be greater than 0');
  }

  if (!escalation.reason || escalation.reason.trim().length < 20) {
    errors.push('Reason must be at least 20 characters long');
  }

  // Maximum points deduction limits
  const maxDeductions = {
    'client_complaint': 30,
    'missed_meeting': 10,
    'performance_issue': 10,
    'behavioral_issue': 15,
    'other': 20
  };

  const maxAllowed = maxDeductions[escalation.escalation_type] || 20;
  if (escalation.points_deducted > maxAllowed) {
    errors.push(`Maximum ${maxAllowed} points can be deducted for ${escalation.escalation_type}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Check if points are about to expire
 * @param {Array} pointsHistory - Array of point earning records
 * @returns {Object} - { hasExpiring: boolean, expiringPoints: number, expirationDate: string }
 */
export const checkPointsExpiration = (pointsHistory) => {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  let expiringPoints = 0;
  let nearestExpiration = null;

  pointsHistory.forEach(record => {
    const earnedDate = new Date(record.created_at);
    const expirationDate = new Date(earnedDate);
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);

    // Check if points expire within 30 days
    if (expirationDate <= thirtyDaysFromNow && expirationDate > new Date()) {
      expiringPoints += record.points_earned;
      if (!nearestExpiration || expirationDate < nearestExpiration) {
        nearestExpiration = expirationDate;
      }
    }
  });

  return {
    hasExpiring: expiringPoints > 0,
    expiringPoints,
    expirationDate: nearestExpiration ? nearestExpiration.toLocaleDateString() : null
  };
};

/**
 * Validate business hours for certain activities
 * @param {string} activityType - Type of activity
 * @returns {Object} - { isValidTime: boolean, message: string }
 */
export const validateBusinessHours = (activityType) => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday

  // Activities that should be during business hours
  const businessHourActivities = [
    'client_referral',
    'tactical_goals',
    'strategic_goals'
  ];

  if (businessHourActivities.includes(activityType)) {
    // Check if it's weekend
    if (day === 0 || day === 6) {
      return {
        isValidTime: false,
        message: 'This activity can only be logged during business days (Monday-Friday)'
      };
    }

    // Check if it's business hours (9 AM - 6 PM)
    if (hour < 9 || hour >= 18) {
      return {
        isValidTime: false,
        message: 'This activity can only be logged during business hours (9 AM - 6 PM)'
      };
    }
  }

  return {
    isValidTime: true,
    message: 'Activity can be logged at this time'
  };
};

/**
 * Helper function to validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether URL is valid
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Calculate performance impact for annual review
 * @param {number} totalPoints - Total points earned in the year
 * @returns {Object} - { impactPercentage: number, grade: string, description: string }
 */
export const calculatePerformanceImpact = (totalPoints) => {
  let grade = 'Poor';
  let impactPercentage = 0;
  let description = 'Below expectations';

  if (totalPoints >= 500) {
    grade = 'Excellent';
    impactPercentage = 5;
    description = 'Outstanding engagement in Arcade Program';
  } else if (totalPoints >= 300) {
    grade = 'Good';
    impactPercentage = 3;
    description = 'Good engagement in Arcade Program';
  } else if (totalPoints >= 150) {
    grade = 'Average';
    impactPercentage = 2;
    description = 'Average engagement in Arcade Program';
  } else if (totalPoints >= 50) {
    grade = 'Below Average';
    impactPercentage = 1;
    description = 'Below average engagement in Arcade Program';
  }

  return {
    impactPercentage,
    grade,
    description
  };
};

/**
 * Rate limiting for activity submissions
 * @param {Array} recentActivities - Recent activities by user
 * @param {string} activityType - Type of activity being submitted
 * @returns {Object} - { canSubmit: boolean, message: string, waitTime: number }
 */
export const checkRateLimit = (recentActivities, activityType) => {
  const now = new Date();
  const today = now.toDateString();
  
  // Count activities of same type today
  const todayActivities = recentActivities.filter(activity => {
    const activityDate = new Date(activity.created_at).toDateString();
    return activityDate === today && activity.activity_subtype === activityType;
  });

  // Daily limits for different activity types
  const dailyLimits = {
    'whatsapp_appreciation': 3,
    'google_review': 1,
    'video_testimonial': 1,
    'client_referral': 2,
    'bp_reel': 5,
    'full_video': 3,
    'monthly_attendance': 1,
    'employee_referral': 1,
    'tactical_goals': 1,
    'strategic_goals': 1,
    'poll_first': 1,
    'poll_second': 1,
    'poll_third': 1
  };

  const limit = dailyLimits[activityType] || 5;
  
  if (todayActivities.length >= limit) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const waitTime = tomorrow.getTime() - now.getTime();
    
    return {
      canSubmit: false,
      message: `Daily limit of ${limit} submissions reached for this activity type. Try again tomorrow.`,
      waitTime: Math.ceil(waitTime / (1000 * 60 * 60)) // hours
    };
  }

  return {
    canSubmit: true,
    message: `You can submit ${limit - todayActivities.length} more ${activityType} activities today`,
    waitTime: 0
  };
};