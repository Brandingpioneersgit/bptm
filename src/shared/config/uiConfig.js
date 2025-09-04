/**
 * UI Configuration System
 * Centralized configuration for all UI elements, themes, and static content
 */

// Dashboard Card Configurations
export const DASHBOARD_CARDS = {
  superAdmin: [
    {
      title: "Employee Dashboard",
      icon: "Users",
      color: "bg-blue-500",
      stats: "125 Active",
      path: "/employee-dashboard"
    },
    {
      title: "Agency Dashboard",
      icon: "Building",
      color: "bg-green-500",
      stats: "8 Departments",
      path: "/agency-dashboard"
    },
    {
      title: "Intern Dashboard",
      icon: "GraduationCap",
      color: "bg-purple-500",
      stats: "15 Active",
      path: "/intern-dashboard"
    },
    {
      title: "Manager Dashboard",
      icon: "UserCheck",
      color: "bg-orange-500",
      stats: "12 Managers",
      path: "/manager-dashboard"
    },
    {
      title: "Sales Dashboard",
      icon: "TrendingUp",
      color: "bg-red-500",
      stats: "₹2.5M Revenue",
      path: "/sales-dashboard"
    }
  ],
  operationsHead: [
    {
      title: "Marketing Employees",
      icon: "Users",
      color: "bg-blue-500",
      stats: "45 Active",
      path: "/marketing-employees"
    },
    {
      title: "Agency Operations",
      icon: "Settings",
      color: "bg-green-500",
      stats: "Running Smooth",
      path: "/agency-operations"
    },
    {
      title: "Interns",
      icon: "GraduationCap",
      color: "bg-purple-500",
      stats: "15 Active",
      path: "/interns"
    }
  ],
  manager: [
    {
      title: "Employee Dashboard",
      icon: "Users",
      color: "bg-blue-500",
      stats: "25 Employees",
      path: "/employee-dashboard"
    },
    {
      title: "Agency Dashboard",
      icon: "Building",
      color: "bg-green-500",
      stats: "5 Departments",
      path: "/agency-dashboard"
    },
    {
      title: "Intern Dashboard",
      icon: "GraduationCap",
      color: "bg-purple-500",
      stats: "Projects: 12, Completion Rate: 85%",
      path: "/intern-dashboard"
    }
  ],
  hr: [
    {
      title: "Total Employees",
      value: "156",
      icon: "Users",
      className: "bg-blue-50 border-blue-200"
    },
    {
      title: "Pending Reviews",
      value: "23",
      icon: "Clock",
      className: "bg-yellow-50 border-yellow-200"
    },
    {
      title: "New Hires",
      value: "8",
      icon: "UserPlus",
      className: "bg-green-50 border-green-200"
    },
    {
      title: "Departments",
      value: "12",
      icon: "Building",
      className: "bg-purple-50 border-purple-200"
    }
  ]
};

// Navigation Paths
export const NAVIGATION_PATHS = {
  dashboards: {
    agency: "#/agency-dashboard",
    manager: "#/manager-dashboard",
    employee: "#/employee-signup",
    intern: "#/intern-dashboard",
    reports: "#/reports-dashboard",
    arcade: "#/arcade-dashboard",
    superAdmin: "#/super-admin-dashboard",
    operationsHead: "#/operations-head-dashboard",
    hr: "#/hr-dashboard",
    sales: "#/sales-crm-dashboard",
    seo: "#/seo-dashboard",
    ads: "#/ads-dashboard",
    freelancers: "#/freelancers-dashboard"
  },
  profiles: {
    superAdmin: "#/super-admin-profile",
    hr: "#/hr-profile",
    intern: "#/intern-profile",
    manager: "#/manager-profile",
    employee: "#/employee-profile",
    freelancer: "#/freelancer-profile",
    operationsHead: "#/operations-head-profile"
  },
  forms: {
    employeeSignup: "#/employee-signup",
    clientOnboarding: "#/client-onboarding",
    leaveApplication: "#/leave-application",
    performanceReview: "#/performance-review"
  }
};

// Theme Configurations
export const THEMES = {
  light: {
    name: "Light",
    colors: {
      primary: "#3b82f6",
      secondary: "#64748b",
      background: "#ffffff",
      surface: "#f8fafc",
      text: "#1e293b",
      textSecondary: "#64748b",
      border: "#e2e8f0",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6"
    },
    shadows: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
    }
  },
  dark: {
    name: "Dark",
    colors: {
      primary: "#60a5fa",
      secondary: "#94a3b8",
      background: "#0f172a",
      surface: "#1e293b",
      text: "#f1f5f9",
      textSecondary: "#94a3b8",
      border: "#334155",
      success: "#34d399",
      warning: "#fbbf24",
      error: "#f87171",
      info: "#60a5fa"
    },
    shadows: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.3)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.3)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.3)"
    }
  },
  blue: {
    name: "Blue",
    colors: {
      primary: "#2563eb",
      secondary: "#64748b",
      background: "#f8fafc",
      surface: "#ffffff",
      text: "#1e293b",
      textSecondary: "#64748b",
      border: "#e2e8f0",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#2563eb"
    },
    shadows: {
      sm: "0 1px 2px 0 rgb(37 99 235 / 0.1)",
      md: "0 4px 6px -1px rgb(37 99 235 / 0.1)",
      lg: "0 10px 15px -3px rgb(37 99 235 / 0.1)"
    }
  }
};

// Sidebar Configurations
export const SIDEBAR_CONFIG = {
  superAdmin: {
    title: "Super Admin Panel",
    sections: [
      {
        title: "Dashboard",
        items: [
          { label: "Overview", path: "#/super-admin-dashboard", icon: "LayoutDashboard" },
          { label: "Analytics", path: "#/analytics", icon: "BarChart3" }
        ]
      },
      {
        title: "Management",
        items: [
          { label: "Employees", path: "#/employee-management", icon: "Users" },
          { label: "Departments", path: "#/department-management", icon: "Building" },
          { label: "Roles", path: "#/role-management", icon: "Shield" }
        ]
      },
      {
        title: "System",
        items: [
          { label: "Settings", path: "#/system-settings", icon: "Settings" },
          { label: "Audit Logs", path: "#/audit-logs", icon: "FileText" },
          { label: "Backup", path: "#/backup", icon: "Database" }
        ]
      }
    ]
  },
  hr: {
    title: "HR Dashboard",
    sections: [
      {
        title: "Employee Management",
        items: [
          { label: "All Employees", path: "#/employees", icon: "Users" },
          { label: "Onboarding", path: "#/onboarding", icon: "UserPlus" },
          { label: "Performance", path: "#/performance", icon: "TrendingUp" }
        ]
      },
      {
        title: "Reports",
        items: [
          { label: "Monthly Reports", path: "#/monthly-reports", icon: "FileText" },
          { label: "Analytics", path: "#/hr-analytics", icon: "BarChart3" }
        ]
      }
    ]
  },
  manager: {
    title: "Manager Dashboard",
    sections: [
      {
        title: "Team Management",
        items: [
          { label: "My Team", path: "#/my-team", icon: "Users" },
          { label: "Projects", path: "#/projects", icon: "FolderOpen" },
          { label: "Performance", path: "#/team-performance", icon: "TrendingUp" }
        ]
      }
    ]
  }
};

// Status Colors and Icons
export const STATUS_CONFIG = {
  project: {
    completed: { color: "text-green-600", bgColor: "bg-green-100", icon: "CheckCircle" },
    "in-progress": { color: "text-blue-600", bgColor: "bg-blue-100", icon: "Clock" },
    pending: { color: "text-yellow-600", bgColor: "bg-yellow-100", icon: "AlertCircle" },
    upcoming: { color: "text-gray-600", bgColor: "bg-gray-100", icon: "Calendar" }
  },
  employee: {
    active: { color: "text-green-600", bgColor: "bg-green-100", icon: "CheckCircle" },
    inactive: { color: "text-red-600", bgColor: "bg-red-100", icon: "XCircle" },
    pending: { color: "text-yellow-600", bgColor: "bg-yellow-100", icon: "Clock" }
  },
  intern: {
    active: { color: "text-green-600", bgColor: "bg-green-100", icon: "CheckCircle" },
    completed: { color: "text-blue-600", bgColor: "bg-blue-100", icon: "GraduationCap" },
    "on-leave": { color: "text-orange-600", bgColor: "bg-orange-100", icon: "Calendar" }
  }
};

// Progress Bar Colors
export const PROGRESS_COLORS = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  orange: "bg-orange-500",
  purple: "bg-purple-500",
  red: "bg-red-500",
  yellow: "bg-yellow-500"
};

// Calendar Event Types
export const CALENDAR_EVENT_TYPES = {
  maintenance: {
    color: "bg-red-100 text-red-800",
    icon: "Wrench"
  },
  meeting: {
    color: "bg-blue-100 text-blue-800",
    icon: "Users"
  },
  deadline: {
    color: "bg-orange-100 text-orange-800",
    icon: "Clock"
  },
  holiday: {
    color: "bg-green-100 text-green-800",
    icon: "Calendar"
  },
  training: {
    color: "bg-purple-100 text-purple-800",
    icon: "BookOpen"
  }
};

// Default Profile Field Labels
export const PROFILE_FIELD_LABELS = {
  personal: {
    fullName: "Full Name",
    email: "Email",
    phone: "Phone",
    dateOfBirth: "Date of Birth",
    address: "Address"
  },
  professional: {
    role: "Role",
    department: "Department",
    joiningDate: "Joining Date",
    employeeId: "Employee ID",
    manager: "Direct Manager",
    securityClearance: "Security Clearance"
  },
  skills: {
    technical: "Technical Skills",
    soft: "Soft Skills",
    certifications: "Certifications",
    languages: "Languages"
  },
  performance: {
    kpiScore: "KPI Score",
    learningScore: "Learning Score",
    clientRelations: "Client Relations",
    overallRating: "Overall Rating"
  }
};

// Default Values
export const DEFAULT_VALUES = {
  profile: {
    securityClearance: "Level 5 - Full Access",
    department: "Administration",
    role: "Super Admin",
    status: "Active",
    notSet: "Not set"
  },
  metrics: {
    dailyActiveUsers: 38,
    weeklyActiveUsers: 42,
    monthlyActiveUsers: 45,
    averagePerformanceScore: 8.2,
    submissionRate: 94,
    clientSatisfaction: 94
  }
};

// Table Headers
export const TABLE_HEADERS = {
  systemActivity: ["Activity", "User", "Time", "Status"],
  monthlyPerformance: ["Employee", "Department", "Performance", "Status"],
  dailyReports: ["Intern", "Date", "Hours", "Productivity", "Learning", "Status", "Actions"],
  employeeList: ["Name", "Department", "Role", "Status", "Actions"]
};

// Placeholder Messages
export const PLACEHOLDER_MESSAGES = {
  noData: "No data available",
  loading: "Loading...",
  noEmployees: "No employees found",
  noEvents: "No events scheduled for this month",
  noReports: "No reports available",
  noProfile: "No profile found",
  leaderboardData: "Leaderboard data will be displayed here",
  arcadeManagement: "Arcade management panel will be available here"
};

// Filter Options
export const FILTER_OPTIONS = {
  reports: [
    { value: "all", label: "All Reports" },
    { value: "pending", label: "Pending Review" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" }
  ],
  departments: [
    { value: "all", label: "All Departments" },
    { value: "web", label: "Web" },
    { value: "social-media", label: "Social Media" },
    { value: "ads", label: "Ads" },
    { value: "seo", label: "SEO" },
    { value: "hr", label: "HR" },
    { value: "sales", label: "Sales" }
  ],
  status: [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "pending", label: "Pending" }
  ]
};

// Tab Configurations
export const TAB_CONFIGS = {
  intern: [
    { id: "overview", label: "Overview", icon: "Home" },
    { id: "projects", label: "Projects", icon: "FolderOpen" },
    { id: "skills", label: "Skills", icon: "Award" },
    { id: "roadmap", label: "Roadmap", icon: "Map" },
    { id: "reports", label: "Reports", icon: "FileText" }
  ],
  internsDashboard: [
    { id: "daily-report", label: "Daily Report" },
    { id: "my-projects", label: "My Projects" },
    { id: "performance", label: "Performance" },
    { id: "certificate", label: "Certificate" }
  ]
};

// Month Formatting
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Agency Dashboard specific configurations
export const AGENCY_DASHBOARD_CONFIG = {
  title: 'Agency Dashboard',
  welcomeMessage: 'Welcome',
  guestAccess: 'Guest Access',
  myProfile: 'My Profile',
  sections: {
    addNewClient: 'Add New Client',
    dailyInspiration: 'Daily Inspiration',
    performanceLeaderboard: 'Performance Leaderboard',
    live: 'Live',
    performanceDescription: 'Top performers based on monthly submissions and KPIs',
    quickStats: 'Quick Stats',
    projectWorkspaces: 'Project Workspaces',
    onboardingForms: 'Onboarding Forms',
    onboardingDescription: 'Shareable links - send to new employees & clients',
    quickAccess: 'Quick Access'
  },
  navigation: {
    monthlyForm: 'Monthly Form',
    reports: 'Reports',
    tools: 'Tools',
    leaveWfh: 'Leave/WFH',
    addClient: 'Add Client'
  },
  stats: {
    q4Targets: {
      value: '+15%',
      label: 'Q4 Targets'
    },
    newClients: {
      value: '5',
      label: 'New Clients'
    }
  },
  workspaces: {
    clientTracker: 'Client Tracker',
    clientServicing: 'Client Servicing',
    web: 'Web',
    crm: 'CRM',
    hr: 'HR',
    ads: 'Ads',
    seo: 'SEO',
    socialMedia: 'Social Media',
    general: 'General'
  },
  onboarding: {
    employee: {
      title: 'Employee Onboarding',
      description: 'For new employees to fill',
      openForm: 'Open Form',
      copyLink: 'Copy Link',
      shareLabel: 'Share'
    },
    client: {
      title: 'Client Onboarding',
      description: 'For new clients to fill',
      openForm: 'Open Form',
      copyLink: 'Copy Link',
      shareLabel: 'Share'
    }
  },
  quickAccess: {
    organizationChart: 'Organization Chart',
    employeeDirectory: 'Employee Directory',
    clientDirectory: 'Client Directory',
    performanceScoring: 'Performance Scoring',
    performanceConcerns: 'Performance Concerns',
    arcadeProgram: 'Arcade Program',
    companyGuidebook: 'Company Guidebook & Policies'
  },
  alerts: {
    leaveSuccess: 'Leave application submitted successfully!',
    leaveError: 'Error submitting leave application. Please try again.',
    urlCopied: 'URL copied to clipboard!',
    urlCopyError: 'Failed to copy URL. Please copy manually.'
  }
};

// Instructional Text
export const INSTRUCTIONAL_TEXT = {
  internDashboard: {
    overview: "Welcome to your internship dashboard! Here you can track your progress, view projects, and monitor your skill development. Use the tabs above to navigate between different sections.",
    projects: "Click Projects tab to view details about your assigned projects and their current status.",
    skills: "View Skills tab for detailed breakdown of your technical and soft skills progress.",
    timeRemaining: "Time remaining in your internship program."
  },
  certificateEligibility: "You are eligible for a certificate upon successful completion of your internship program."
};

// Intern Profile Configuration
export const INTERN_PROFILE_CONFIG = {
  profileCompletion: {
    title: 'Complete Your Intern Profile',
    description: 'Complete your profile to help mentors understand your learning goals.',
    buttonText: 'Complete Now'
  },
  learningOverview: {
    learningHours: {
      title: 'Learning Hours',
      subtitle: 'This month',
      icon: '📚'
    },
    progress: {
      title: 'Progress',
      subtitle: 'Tasks completed',
      icon: '📈'
    },
    performance: {
      title: 'Performance',
      subtitle: 'Average score',
      icon: '⭐'
    },
    skills: {
      title: 'Skills',
      subtitle: 'New skills',
      icon: '🎯'
    }
  },
  kpiDashboard: {
    title: 'Learning KPI Dashboard',
    description: 'Track your learning progress and development goals',
    overallScoreLabel: 'Overall Learning Score',
    updateButton: 'Update KPIs',
    kpiLabels: {
      skillDevelopment: 'Skill Development',
      learningHours: 'Learning Hours',
      goalCompletion: 'Goal Completion',
      mentorRating: 'Mentor Rating',
      projectQuality: 'Project Quality',
      technicalGrowth: 'Technical Growth',
      softSkills: 'Soft Skills',
      initiativeScore: 'Initiative Score'
    },
    kpiIcons: {
      skillDevelopment: '🚀',
      learningHours: '⏰',
      goalCompletion: '✅',
      mentorRating: '⭐',
      projectQuality: '💎',
      technicalGrowth: '💻',
      softSkills: '🤝',
      initiativeScore: '🎯'
    }
  },
  tabs: {
    learningOverview: { label: 'Learning Overview', icon: '📚' },
    skillDevelopment: { label: 'Skill Development', icon: '🎯' },
    academicProgress: { label: 'Academic Progress', icon: '🎓' },
    mentorFeedback: { label: 'Mentor Feedback', icon: '💬' }
  },
  skillDevelopment: {
    technicalSkills: {
      title: '🚀 Technical Skills',
      subtitle: 'Programming & Tools'
    },
    softSkills: {
      title: '🤝 Soft Skills',
      subtitle: 'Communication & Teamwork'
    },
    initiative: {
      title: '🎯 Initiative',
      subtitle: 'Proactivity & Leadership'
    }
  },
  academicProgress: {
    title: '🎓 Academic Performance',
    currentCoursesTitle: '📚 Current Courses',
    labels: {
      currentGPA: 'Current GPA:',
      creditsCompleted: 'Credits Completed:',
      yearLevel: 'Year Level:'
    },
    emptyState: {
      icon: '🎓',
      title: 'No Academic Data',
      message: 'Academic progress information will appear here when available.'
    },
    noCoursesMessage: 'No courses listed'
  },
  mentorFeedback: {
    title: 'Mentor Feedback',
    ratingLabel: 'Rating:',
    emptyState: {
      icon: '💬',
      title: 'No Feedback Yet',
      message: 'Mentor feedback will appear here as you progress through your internship.'
    }
  },
  personalInfo: {
    title: 'Personal Information',
    editButton: 'Edit Profile',
    labels: {
      fullName: 'Full Name',
      email: 'Email',
      phone: 'Phone',
      university: 'University',
      major: 'Major',
      graduationYear: 'Graduation Year',
      bio: 'Bio',
      learningObjectives: 'Learning Objectives'
    },
    defaultValues: {
      notProvided: 'Not provided',
      noBio: 'No bio provided',
      noObjectives: 'No learning objectives specified'
    }
  },
  learningGoals: {
    title: 'Learning Goals',
    statusLabels: {
      completed: 'completed',
      in_progress: 'in_progress',
      pending: 'pending'
    },
    targetLabel: 'Target:',
    progressLabel: 'Progress:',
    emptyState: {
      icon: '🎯',
      title: 'No Learning Goals Set',
      message: 'Set learning goals to track your progress during the internship.',
      buttonText: 'Add Learning Goal'
    }
  },
  monthlyProgress: {
    title: 'Monthly Learning Progress',
    stats: {
      tasks: 'Tasks',
      completed: 'Completed',
      avgScore: 'Avg Score',
      hours: 'Hours'
    }
  },
  recentActivities: {
    title: 'Recent Activities',
    tableHeaders: {
      date: 'Date',
      activity: 'Activity',
      hours: 'Hours',
      score: 'Score',
      status: 'Status'
    },
    defaultActivity: 'Learning Task',
    emptyState: {
      icon: '📝',
      title: 'No Activities Yet',
      message: 'Your learning activities will appear here as you progress.'
    }
  },
  modals: {
    editProfile: {
      title: 'Edit Intern Profile',
      placeholders: {
        interests: 'e.g., Web Development, Design, Marketing',
        learningObjectives: 'What do you want to learn during this internship?',
        careerGoals: 'What are your long-term career aspirations?',
        bio: 'Tell us about yourself...'
      },
      buttons: {
        cancel: 'Cancel',
        save: 'Save Changes'
      }
    },
    kpiUpdate: {
      title: 'Update Learning KPIs',
      sections: {
        learningDevelopment: {
          title: '📚 Learning Development',
          labels: {
            skillDevelopment: 'Skill Development (%)',
            learningHours: 'Learning Hours (Weekly)',
            goalCompletion: 'Goal Completion (%)',
            mentorRating: 'Mentor Rating (%)'
          }
        },
        performanceGrowth: {
          title: '🚀 Performance & Growth',
          labels: {
            projectQuality: 'Project Quality (%)',
            technicalGrowth: 'Technical Growth (%)',
            softSkills: 'Soft Skills (%)',
            initiativeScore: 'Initiative Score (%)'
          }
        }
      },
      overallScore: {
        title: 'Overall Learning Score',
        description: 'Based on all learning KPIs'
      },
      buttons: {
        cancel: 'Cancel',
        save: 'Save KPIs'
      }
    }
  },
  alerts: {
    profileUpdateSuccess: 'Profile updated successfully',
    profileUpdateError: 'Failed to update profile',
    kpiUpdateSuccess: 'Learning KPIs updated successfully',
    kpiUpdateError: 'Failed to update learning KPIs',
    dataLoadError: 'Failed to load learning data'
  }
};

// Main UI Configuration Object
export const UI_CONFIG = {
  dashboardCards: DASHBOARD_CARDS,
  navigationPaths: NAVIGATION_PATHS,
  themes: THEMES,
  sidebar: SIDEBAR_CONFIG,
  statusColors: STATUS_CONFIG,
  progressBarColors: PROGRESS_COLORS,
  calendarEventTypes: CALENDAR_EVENT_TYPES,
  defaultProfileFields: PROFILE_FIELD_LABELS,
  defaultValues: DEFAULT_VALUES,
  tableHeaders: TABLE_HEADERS,
  placeholderMessages: PLACEHOLDER_MESSAGES,
  filterOptions: FILTER_OPTIONS,
  tabConfigurations: TAB_CONFIGS,
  monthFormatting: { names: MONTH_NAMES, short: MONTH_NAMES_SHORT },
  instructionalText: INSTRUCTIONAL_TEXT,
  agencyDashboard: AGENCY_DASHBOARD_CONFIG,
  personalizedDashboard: {
    roleThemes: {
      SEO: {
        primary: 'from-blue-600 to-blue-700',
        secondary: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        accent: 'text-blue-600',
        gradient: 'bg-gradient-to-r from-blue-500 to-blue-600'
      },
      Ads: {
        primary: 'from-green-600 to-green-700',
        secondary: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        accent: 'text-green-600',
        gradient: 'bg-gradient-to-r from-green-500 to-green-600'
      },
      HR: {
        primary: 'from-purple-600 to-purple-700',
        secondary: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        accent: 'text-purple-600',
        gradient: 'bg-gradient-to-r from-purple-500 to-purple-600'
      },
      'Social Media': {
        primary: 'from-pink-600 to-pink-700',
        secondary: 'bg-pink-50',
        text: 'text-pink-700',
        border: 'border-pink-200',
        accent: 'text-pink-600',
        gradient: 'bg-gradient-to-r from-pink-500 to-pink-600'
      },
      'YouTube SEO': {
        primary: 'from-red-600 to-red-700',
        secondary: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        accent: 'text-red-600',
        gradient: 'bg-gradient-to-r from-red-500 to-red-600'
      },
      'Web Developer': {
        primary: 'from-indigo-600 to-indigo-700',
        secondary: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
        accent: 'text-indigo-600',
        gradient: 'bg-gradient-to-r from-indigo-500 to-indigo-600'
      },
      'Graphic Designer': {
        primary: 'from-orange-600 to-orange-700',
        secondary: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        accent: 'text-orange-600',
        gradient: 'bg-gradient-to-r from-orange-500 to-orange-600'
      },
      Freelancer: {
        primary: 'from-teal-600 to-teal-700',
        secondary: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200',
        accent: 'text-teal-600',
        gradient: 'bg-gradient-to-r from-teal-500 to-teal-600'
      },
      Intern: {
        primary: 'from-cyan-600 to-cyan-700',
        secondary: 'bg-cyan-50',
        text: 'text-cyan-700',
        border: 'border-cyan-200',
        accent: 'text-cyan-600',
        gradient: 'bg-gradient-to-r from-cyan-500 to-cyan-600'
      },
      'Operations Head': {
        primary: 'from-amber-600 to-amber-700',
        secondary: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        accent: 'text-amber-600',
        gradient: 'bg-gradient-to-r from-amber-500 to-amber-600'
      },
      'Super Admin': {
        primary: 'from-slate-600 to-slate-700',
        secondary: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        accent: 'text-slate-600',
        gradient: 'bg-gradient-to-r from-slate-500 to-slate-600'
      },
      default: {
        primary: 'from-gray-600 to-gray-700',
        secondary: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        accent: 'text-gray-600',
        gradient: 'bg-gradient-to-r from-gray-500 to-gray-600'
      }
    },
    roleToDepartment: {
      SEO: 'seo',
      Ads: 'ads',
      HR: 'human_resources',
      'Social Media': 'social_media',
      'YouTube SEO': 'youtube_seo',
      'Web Developer': 'web_development',
      'Graphic Designer': 'creative',
      Freelancer: 'freelancer',
      Intern: 'intern',
      'Operations Head': 'operations',
      'Super Admin': 'administration'
    },
    roleSpecificFeatures: {
      SEO: {
        quickActions: ['Keyword Research', 'SERP Analysis', 'Content Optimization', 'GMB Management'],
        notifications: ['Ranking Updates', 'Client Reports Due', 'Algorithm Changes'],
        widgets: ['keyword_rankings', 'organic_traffic', 'backlink_profile', 'content_performance'],
        kpiPriority: ['organic_traffic', 'keyword_rankings', 'conversion_rate', 'bounce_rate']
      },
      Ads: {
        quickActions: ['Campaign Setup', 'Budget Optimization', 'A/B Testing', 'Performance Review'],
        notifications: ['Budget Alerts', 'Campaign Performance', 'Bid Adjustments'],
        widgets: ['campaign_performance', 'roas_metrics', 'budget_utilization', 'conversion_tracking'],
        kpiPriority: ['roas', 'cpc', 'conversion_rate', 'click_through_rate']
      },
      'Social Media': {
        quickActions: ['Content Scheduling', 'Engagement Analysis', 'Hashtag Research', 'Story Creation'],
        notifications: ['Post Performance', 'Engagement Milestones', 'Content Calendar'],
        widgets: ['engagement_metrics', 'follower_growth', 'content_reach', 'story_performance'],
        kpiPriority: ['engagement_rate', 'follower_growth', 'reach', 'impressions']
      },
      'YouTube SEO': {
        quickActions: ['Video Optimization', 'Thumbnail Design', 'Analytics Review', 'Keyword Tags'],
        notifications: ['Video Performance', 'Subscriber Milestones', 'Trending Topics'],
        widgets: ['video_performance', 'subscriber_growth', 'watch_time', 'ctr_metrics'],
        kpiPriority: ['watch_time', 'subscriber_growth', 'ctr', 'video_views']
      },
      'Web Developer': {
        quickActions: ['Code Review', 'Performance Testing', 'Bug Fixes', 'Feature Development'],
        notifications: ['Build Status', 'Code Reviews', 'Performance Alerts'],
        widgets: ['project_status', 'code_quality', 'performance_metrics', 'deployment_history'],
        kpiPriority: ['code_quality', 'project_completion', 'bug_resolution', 'performance_score']
      },
      'Graphic Designer': {
        quickActions: ['Design Review', 'Asset Creation', 'Brand Guidelines', 'Client Feedback'],
        notifications: ['Design Approvals', 'Project Deadlines', 'Brand Updates'],
        widgets: ['project_portfolio', 'design_feedback', 'asset_library', 'brand_compliance'],
        kpiPriority: ['design_quality', 'project_completion', 'client_satisfaction', 'creativity_score']
      },
      Freelancer: {
        quickActions: ['Project Bidding', 'Time Tracking', 'Invoice Generation', 'Client Communication'],
        notifications: ['Project Invitations', 'Payment Updates', 'Deadline Reminders'],
        widgets: ['project_pipeline', 'earnings_tracker', 'time_management', 'client_ratings'],
        kpiPriority: ['project_completion', 'client_satisfaction', 'earnings', 'time_efficiency']
      },
      Intern: {
        quickActions: ['Learning Modules', 'Task Submission', 'Mentor Meeting', 'Progress Review'],
        notifications: ['Learning Milestones', 'Task Assignments', 'Mentor Feedback'],
        widgets: ['learning_progress', 'task_completion', 'skill_development', 'mentor_feedback'],
        kpiPriority: ['learning_progress', 'task_completion', 'skill_acquisition', 'mentor_rating']
      },
      Manager: {
        quickActions: ['Team Management', 'Performance Reviews', 'Employee Directory', 'Organization Chart', 'Performance Scoring', 'Monthly Reports'],
        notifications: ['Team Performance', 'Performance Reviews Due', 'Team Updates'],
        widgets: ['team_performance', 'employee_metrics', 'performance_overview', 'team_goals'],
        kpiPriority: ['team_productivity', 'employee_satisfaction', 'goal_achievement', 'performance_score']
      },
      HR: {
        quickActions: ['Employee Onboarding', 'Performance Reviews', 'Policy Updates', 'Recruitment', 'Employee Directory', 'Organization Chart', 'Performance Scoring'],
        notifications: ['New Hires', 'Performance Reviews Due', 'Policy Changes'],
        widgets: ['employee_metrics', 'recruitment_pipeline', 'performance_overview', 'policy_compliance'],
        kpiPriority: ['employee_satisfaction', 'retention_rate', 'recruitment_efficiency', 'training_completion']
      },
      'Operations Head': {
        quickActions: ['Team Management', 'Process Optimization', 'Resource Allocation', 'Strategic Planning', 'Employee Directory', 'Organization Chart', 'Performance Scoring'],
        notifications: ['Team Performance', 'Resource Alerts', 'Strategic Updates'],
        widgets: ['team_performance', 'operational_metrics', 'resource_utilization', 'strategic_goals'],
        kpiPriority: ['operational_efficiency', 'team_productivity', 'resource_optimization', 'goal_achievement']
      },
      'Super Admin': {
        quickActions: ['System Monitoring', 'User Management', 'Security Review', 'Data Analytics', 'Employee Directory', 'Organization Chart', 'Performance Scoring'],
        notifications: ['System Alerts', 'Security Updates', 'Performance Metrics'],
        widgets: ['system_health', 'user_analytics', 'security_dashboard', 'performance_overview'],
        kpiPriority: ['system_uptime', 'user_engagement', 'security_score', 'data_integrity']
      }
    },
    baseSidebarSections: [
      { id: 'testimonials', label: 'Testimonials', icon: '💬' },
      { id: 'appreciation', label: 'Appreciation', icon: '🏆' }
    ],
    departmentSections: {
      seo: [
        { id: 'monthly_work', label: 'SEO Campaigns', icon: '📊' },
        { id: 'performance', label: 'Performance', icon: '📈' },
        { id: 'learning_goals', label: 'Learning Goals', icon: '🎯' }
      ],
      ads: [
        { id: 'monthly_work', label: 'Ad Campaigns', icon: '📢' },
        { id: 'performance', label: 'Performance', icon: '📈' },
        { id: 'client_relationships', label: 'Client Relations', icon: '🤝' }
      ],
      human_resources: [
        { id: 'monthly_work', label: 'HR Activities', icon: '👥' },
        { id: 'performance', label: 'Performance', icon: '📈' },
        { id: 'discipline_attendance', label: 'Attendance', icon: '📅' }
      ],
      social_media: [
        { id: 'monthly_work', label: 'Social Campaigns', icon: '📱' },
        { id: 'performance', label: 'Performance', icon: '📈' },
        { id: 'learning_goals', label: 'Learning Goals', icon: '🎯' }
      ],
      web_development: [
        { id: 'monthly_work', label: 'Web Projects', icon: '💻' },
        { id: 'performance', label: 'Performance', icon: '📈' },
        { id: 'learning_goals', label: 'Learning Goals', icon: '🎯' }
      ]
    },
    defaultProfileData: {
      name: '',
      role: '',
      department: '',
      email: '',
      phone: '',
      joining_date: null,
      profile_picture: null
    },
    sections: {
      testimonials: {
        title: 'Client Testimonials',
        emptyMessage: 'No testimonials yet. Keep delivering great work!',
        defaultClientName: 'Anonymous',
        defaultProjectName: 'General Feedback'
      },
      appreciation: {
        title: 'Recognition & Appreciation',
        emptyMessage: 'Keep up the great work to earn recognition!',
        defaultTitle: 'Recognition',
        defaultGivenBy: 'Management',
        defaultCategory: 'General',
        icon: '🏆'
      },
      monthly_work: {
        title: 'Monthly Work Progress',
        emptyMessage: 'No monthly submissions yet. Start tracking your progress!',
        statusLabels: {
          approved: 'Approved',
          pending: 'Pending',
          submitted: 'Submitted'
        },
        fields: {
          projectsCompleted: 'Projects Completed:',
          goalsAchieved: 'Goals Achieved:',
          challenges: 'Challenges:',
          nextMonthGoals: 'Next Month Goals:'
        },
        defaultValues: {
          projectsCompleted: 'N/A',
          goalsAchieved: 'N/A',
          challenges: 'None reported',
          nextMonthGoals: 'N/A'
        }
      },
      performance: {
        title: 'Performance Progress',
        emptyMessage: 'Performance evaluations will appear here.',
        overallScoreLabel: 'Overall Score',
        reviewTitle: 'Performance Review',
        metrics: {
          qualityOfWork: 'Quality of Work',
          teamCollaboration: 'Team Collaboration'
        },
        feedbackLabel: 'Feedback:',
        defaultScore: 'N/A'
      },
      learning_goals: {
        title: 'Learning Goals & Development',
        emptyMessage: 'Set learning goals to track your professional development!',
        statusLabels: {
          completed: 'Completed',
          in_progress: 'In Progress',
          not_started: 'Not Started'
        },
        labels: {
          targetDate: 'Target Date:',
          category: 'Category:',
          progress: 'Progress'
        },
        defaultCategory: 'General'
      },
      client_relationships: {
        title: 'Client Relationships',
        emptyMessage: 'Client relationship data will appear here.',
        defaultProjectName: 'General Relationship',
        satisfactionLabel: 'Satisfaction',
        labels: {
          started: 'Started:',
          status: 'Status:'
        },
        defaultStatus: 'Active'
      },
      discipline_attendance: {
        title: 'Discipline & Attendance',
        emptyMessage: 'Attendance records will appear here.',
        recentAttendanceTitle: 'Recent Attendance',
        stats: {
          daysPresent: 'Days Present',
          lateArrivals: 'Late Arrivals',
          absences: 'Absences'
        },
        statusLabels: {
          present: 'Present',
          late: 'Late',
          absent: 'Absent',
          unknown: 'Unknown'
        },
        timeLabels: {
          in: 'In:',
          out: 'Out:'
        }
      }
    },
    header: {
      backButton: 'Back',
      profileSectionsTitle: 'Profile Sections',
      departmentSuffix: 'Department'
    },
    loading: {
      text: 'Loading your profile...'
    },
    fallback: {
       sectionNotAvailable: 'Section content not available.',
       defaultProfileName: 'My Profile'
     }
   },
  internProfile: INTERN_PROFILE_CONFIG
};