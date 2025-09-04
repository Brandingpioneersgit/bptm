// Dashboard Configuration System
// Centralized configuration for all dashboard components

export const DASHBOARD_CONFIGS = {
  intern: {
    defaultProfile: {
      internshipType: 'Full-time',
      status: 'active',
      totalWeeks: 24,
      department: 'General',
      mentor: 'Assigned Mentor'
    },
    defaultSkills: {
      technical: [
        { name: 'JavaScript', level: 60, category: 'Programming' },
        { name: 'HTML/CSS', level: 75, category: 'Frontend' },
        { name: 'Git', level: 65, category: 'Tools' }
      ],
      soft: [
        { name: 'Communication', level: 70 },
        { name: 'Problem Solving', level: 65 },
        { name: 'Teamwork', level: 80 }
      ]
    },
    roadmapPhases: [
      {
        name: 'Foundation',
        weekRange: [1, 6],
        goals: ['Learn company processes', 'Basic skills', 'Team integration']
      },
      {
        name: 'Development', 
        weekRange: [7, 18],
        goals: ['Real project work', 'Advanced skills', 'Mentorship', 'Code reviews']
      },
      {
        name: 'Specialization',
        weekRange: [19, 24],
        goals: ['Specialization choice', 'Independent project', 'Presentation', 'Career planning']
      }
    ],
    statusColors: {
      completed: 'bg-green-500',
      'in-progress': 'bg-blue-500',
      upcoming: 'bg-gray-300'
    },
    projectStatuses: {
      completed: { color: 'text-green-600', icon: '✅' },
      'in-progress': { color: 'text-blue-600', icon: '🔄' },
      upcoming: { color: 'text-gray-500', icon: '⏳' }
    }
  },

  adsExecutive: {
    performanceBands: {
      A: { min: 90, color: 'text-green-600' },
      B: { min: 80, color: 'text-blue-600' },
      C: { min: 70, color: 'text-yellow-600' },
      D: { min: 0, color: 'text-red-600' }
    },
    clientTypes: ['SMB', 'Large', 'Enterprise'],
    platforms: [
      { id: 'google', name: 'Google Ads', icon: '🔍' },
      { id: 'meta', name: 'Meta Ads', icon: '📘' },
      { id: 'linkedin', name: 'LinkedIn Ads', icon: '💼' }
    ],
    metrics: {
      ctr: { name: 'CTR Growth', unit: '%', format: 'percentage' },
      cvr: { name: 'CVR Growth', unit: '%', format: 'percentage' },
      cpl: { name: 'CPL Growth', unit: '%', format: 'percentage' },
      leads: { name: 'Leads Growth', unit: '%', format: 'percentage' },
      roas: { name: 'ROAS Growth', unit: 'x', format: 'multiplier' }
    },
    spendTiers: [
      { name: 'Small', min: 0, max: 50000 },
      { name: 'Medium', min: 50001, max: 150000 },
      { name: 'Large', min: 150001, max: 300000 },
      { name: 'Enterprise', min: 300001, max: Infinity }
    ]
  },

  manager: {
    views: [
      { id: 'controlPanel', name: 'Control Panel', icon: '⚙️' },
      { id: 'leaderboard', name: 'Leaderboard', icon: '🏆' },
      { id: 'clients', name: 'Client Management', icon: '👥' },
      { id: 'reports', name: 'Reports', icon: '📊' }
    ],
    performanceLevels: {
      High: { min: 8, color: 'text-green-600', badge: 'bg-green-100' },
      Medium: { min: 6, color: 'text-blue-600', badge: 'bg-blue-100' },
      Low: { min: 0, color: 'text-red-600', badge: 'bg-red-100' }
    },
    departments: [
      'Sales', 'Marketing', 'Operations', 'HR', 'Finance', 'IT', 'General'
    ],
    sortOptions: [
      { key: 'name', label: 'Name' },
      { key: 'score', label: 'Score' },
      { key: 'department', label: 'Department' },
      { key: 'hours', label: 'Learning Hours' }
    ],
    filters: {
      department: ['All', 'Sales', 'Marketing', 'Operations', 'HR', 'Finance', 'IT'],
      performance: ['All', 'High', 'Medium', 'Low'],
      status: ['All', 'Active', 'Inactive', 'On Leave']
    }
  },

  common: {
    scoreColors: {
      excellent: { min: 85, color: 'text-green-600' },
      good: { min: 75, color: 'text-blue-600' },
      average: { min: 65, color: 'text-yellow-600' },
      poor: { min: 0, color: 'text-red-600' }
    },
    growthIcons: {
      positive: '📈',
      negative: '📉',
      neutral: '➡️'
    },
    loadingStates: {
      loading: 'Loading dashboard data...',
      error: 'Failed to load dashboard data',
      empty: 'No data available',
      offline: 'Working in offline mode'
    },
    dateFormats: {
      display: 'MMM DD, YYYY',
      input: 'YYYY-MM-DD',
      api: 'YYYY-MM-DDTHH:mm:ss.sssZ'
    }
  }
};

// Helper functions for dashboard configurations
export const getDashboardConfig = (dashboardType) => {
  return DASHBOARD_CONFIGS[dashboardType] || {};
};

export const getScoreColor = (score, type = 'common') => {
  const config = DASHBOARD_CONFIGS[type]?.scoreColors || DASHBOARD_CONFIGS.common.scoreColors;
  
  for (const [level, { min, color }] of Object.entries(config)) {
    if (score >= min) {
      return color;
    }
  }
  return config.poor.color;
};

export const getPerformanceLevel = (score, dashboardType = 'manager') => {
  const levels = DASHBOARD_CONFIGS[dashboardType]?.performanceLevels || DASHBOARD_CONFIGS.manager.performanceLevels;
  
  for (const [level, { min }] of Object.entries(levels)) {
    if (score >= min) {
      return level;
    }
  }
  return 'Low';
};

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatPercentage = (value, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};

export const getGrowthIcon = (growth) => {
  if (growth > 0) return DASHBOARD_CONFIGS.common.growthIcons.positive;
  if (growth < 0) return DASHBOARD_CONFIGS.common.growthIcons.negative;
  return DASHBOARD_CONFIGS.common.growthIcons.neutral;
};

// Default data generators
export const generateDefaultInternData = (user) => {
  const config = DASHBOARD_CONFIGS.intern;
  const currentWeek = Math.floor(Math.random() * 12) + 1; // Random week 1-12
  
  return {
    intern: {
      id: user.id,
      name: user.name || 'Intern User',
      email: user.email,
      studentId: `INT${new Date().getFullYear()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      startDate: new Date(Date.now() - currentWeek * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      department: user.department || config.defaultProfile.department,
      mentor: config.defaultProfile.mentor,
      currentWeek,
      totalWeeks: config.defaultProfile.totalWeeks,
      internshipType: config.defaultProfile.internshipType,
      status: config.defaultProfile.status
    },
    skills: config.defaultSkills,
    roadmap: config.roadmapPhases.map((phase, index) => ({
      phase: `${phase.name} (Weeks ${phase.weekRange[0]}-${phase.weekRange[1]})`,
      status: currentWeek > phase.weekRange[1] ? 'completed' : 
              currentWeek >= phase.weekRange[0] ? 'in-progress' : 'upcoming',
      goals: phase.goals,
      completedGoals: Math.min(phase.goals.length, Math.max(0, currentWeek - phase.weekRange[0] + 1))
    }))
  };
};

export const generateDefaultAdsExecutiveData = (user) => {
  const config = DASHBOARD_CONFIGS.adsExecutive;
  
  return {
    employee: {
      id: user.id,
      name: user.name || 'Ads Executive',
      ytdAvgScore: 75 + Math.random() * 20, // 75-95
      lastMonthScore: 70 + Math.random() * 25, // 70-95
      activeAccounts: Math.floor(Math.random() * 10) + 5, // 5-15
      avgRoas90d: 2.5 + Math.random() * 3, // 2.5-5.5
      performanceBand: 'B'
    },
    clients: config.clientTypes.map((type, index) => ({
      id: index + 1,
      name: `${type} Client ${index + 1}`,
      type,
      platforms: config.platforms.slice(0, Math.floor(Math.random() * 2) + 1).map(p => p.id),
      roas: 2 + Math.random() * 4, // 2-6
      spend: config.spendTiers.find(tier => tier.name === type)?.min || 50000
    }))
  };
};

export default DASHBOARD_CONFIGS;