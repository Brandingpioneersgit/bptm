/**
 * Mock Data Configuration
 * Centralized mock data that should eventually be replaced with database calls
 */

// Mock System Activities
export const MOCK_SYSTEM_ACTIVITIES = [
  {
    id: 1,
    activity: "Employee Performance Review",
    user: "John Manager",
    time: "2 hours ago",
    status: "Completed"
  },
  {
    id: 2,
    activity: "System Backup",
    user: "System",
    time: "4 hours ago",
    status: "Completed"
  },
  {
    id: 3,
    activity: "New Employee Onboarding",
    user: "HR Team",
    time: "6 hours ago",
    status: "In Progress"
  },
  {
    id: 4,
    activity: "Client Meeting",
    user: "Sales Team",
    time: "8 hours ago",
    status: "Completed"
  }
];

// Mock User Activity Metrics
export const MOCK_USER_METRICS = {
  dailyActiveUsers: 38,
  weeklyActiveUsers: 42,
  monthlyActiveUsers: 45
};

// Mock Performance Metrics
export const MOCK_PERFORMANCE_METRICS = {
  averagePerformanceScore: 8.2,
  submissionRate: 94,
  clientSatisfaction: 94
};

// Mock Active Users Data
export const MOCK_ACTIVE_USERS = {
  employees: 125,
  interns: 15,
  freelancers: 8,
  managers: 12
};

// Mock Dynamic Stats
export const MOCK_DYNAMIC_STATS = {
  sales: { value: "₹2.5M", change: "+12%" },
  hr: { value: "156", change: "+8" },
  finance: { value: "₹1.2M", change: "+5%" },
  intern: { value: "15", change: "+3" }
};

// Mock Intern Data
export const MOCK_INTERN_DATA = {
  profile: {
    name: "Alex Johnson",
    studentId: "INT2024001",
    email: "alex.johnson@company.com",
    phone: "+91 9876543210",
    startDate: "2024-01-15",
    endDate: "2024-07-15",
    department: "Web Development",
    mentor: "Sarah Wilson",
    currentWeek: 12,
    totalWeeks: 24,
    internshipType: "Full-time",
    status: "Active"
  },
  projects: [
    {
      id: 1,
      title: "Onboarding Project",
      description: "Learn company processes and basic web development setup",
      status: "completed",
      startDate: "2024-01-15",
      endDate: "2024-02-15",
      technologies: ["HTML", "CSS", "JavaScript"],
      learningOutcomes: [
        "Understanding of company workflow",
        "Basic web development skills",
        "Version control with Git"
      ],
      rating: 4.5
    },
    {
      id: 2,
      title: "First Real Project",
      description: "Build a responsive landing page for client",
      status: "in-progress",
      startDate: "2024-02-16",
      endDate: "2024-04-15",
      technologies: ["React", "Tailwind CSS", "JavaScript"],
      learningOutcomes: [
        "React component development",
        "Responsive design principles",
        "Client communication skills"
      ],
      rating: null
    }
  ],
  skills: {
    technical: [
      { name: "JavaScript", level: 75, category: "Programming" },
      { name: "React", level: 60, category: "Framework" },
      { name: "HTML/CSS", level: 85, category: "Markup" },
      { name: "Git", level: 70, category: "Version Control" }
    ],
    soft: [
      { name: "Communication", level: 80, category: "Interpersonal" },
      { name: "Time Management", level: 75, category: "Organizational" },
      { name: "Problem Solving", level: 70, category: "Analytical" },
      { name: "Teamwork", level: 85, category: "Collaborative" }
    ]
  },
  weeklyReports: [
    {
      week: 12,
      date: "2024-04-01",
      hoursWorked: 40,
      tasksCompleted: 8,
      learningHours: 10,
      feedback: "Great progress on React components",
      challenges: "Understanding state management",
      achievements: "Completed responsive design module"
    },
    {
      week: 11,
      date: "2024-03-25",
      hoursWorked: 38,
      tasksCompleted: 7,
      learningHours: 12,
      feedback: "Good improvement in coding practices",
      challenges: "CSS Grid layout",
      achievements: "Built first React component"
    }
  ],
  roadmap: [
    {
      phase: "Foundation",
      status: "completed",
      goals: ["Learn HTML/CSS", "Understand JavaScript basics", "Git workflow"],
      completedGoals: ["Learn HTML/CSS", "Understand JavaScript basics", "Git workflow"]
    },
    {
      phase: "Framework Learning",
      status: "in-progress",
      goals: ["Master React basics", "Component lifecycle", "State management"],
      completedGoals: ["Master React basics"]
    },
    {
      phase: "Project Development",
      status: "upcoming",
      goals: ["Build full-stack app", "API integration", "Testing"],
      completedGoals: []
    }
  ]
};

// Mock Employee Data for Ads Executive
export const MOCK_ADS_EMPLOYEE_DATA = {
  ytdAvgScore: 8.5,
  lastMonthScore: 9.2,
  activeAccounts: 15,
  avgRoas90d: 4.2
};

// Mock Client Data for Ads Executive
export const MOCK_ADS_CLIENTS = [
  {
    id: 1,
    name: "TechCorp Solutions",
    type: "B2B",
    platforms: ["Google Ads", "LinkedIn"],
    roas: 4.5,
    spend: 50000
  },
  {
    id: 2,
    name: "Fashion Boutique",
    type: "B2C",
    platforms: ["Facebook", "Instagram"],
    roas: 3.8,
    spend: 25000
  },
  {
    id: 3,
    name: "Local Restaurant",
    type: "Local",
    platforms: ["Google Ads", "Facebook"],
    roas: 5.2,
    spend: 15000
  }
];

// Mock Monthly Performance Trends for Interns
export const MOCK_MONTHLY_PERFORMANCE = [
  { month: "January 2024", grade: "B+", score: 82 },
  { month: "February 2024", grade: "A-", score: 87 },
  { month: "March 2024", grade: "A", score: 91 },
  { month: "April 2024", grade: "A+", score: 95 }
];

// Mock Calendar Events
export const MOCK_CALENDAR_EVENTS = [
  {
    id: 1,
    title: "Team Meeting",
    date: "2024-04-15",
    type: "meeting",
    description: "Weekly team sync"
  },
  {
    id: 2,
    title: "System Maintenance",
    date: "2024-04-20",
    type: "maintenance",
    description: "Scheduled server maintenance"
  },
  {
    id: 3,
    title: "Project Deadline",
    date: "2024-04-25",
    type: "deadline",
    description: "Client project delivery"
  },
  {
    id: 4,
    title: "Holiday",
    date: "2024-04-30",
    type: "holiday",
    description: "Public holiday"
  }
];

// Mock Employee Performance Data
export const MOCK_EMPLOYEE_PERFORMANCE = [
  {
    id: 1,
    name: "John Doe",
    department: "Web",
    performance: 85,
    status: "Active"
  },
  {
    id: 2,
    name: "Jane Smith",
    department: "Social Media",
    performance: 92,
    status: "Active"
  },
  {
    id: 3,
    name: "Mike Johnson",
    department: "Ads",
    performance: 78,
    status: "Active"
  },
  {
    id: 4,
    name: "Sarah Wilson",
    department: "SEO",
    performance: 88,
    status: "Active"
  }
];

// Mock Daily Reports for Interns
export const MOCK_DAILY_REPORTS = [
  {
    id: 1,
    intern: "Alex Johnson",
    date: "2024-04-15",
    hours: 8,
    productivity: 85,
    learning: 90,
    status: "Submitted"
  },
  {
    id: 2,
    intern: "Emma Davis",
    date: "2024-04-15",
    hours: 7.5,
    productivity: 78,
    learning: 85,
    status: "Pending Review"
  },
  {
    id: 3,
    intern: "Ryan Chen",
    date: "2024-04-15",
    hours: 8,
    productivity: 92,
    learning: 88,
    status: "Approved"
  }
];

// Mock Profile Data Templates
export const MOCK_PROFILE_TEMPLATES = {
  superAdmin: {
    personalInfo: {
      fullName: "Admin User",
      email: "admin@company.com",
      phone: "+91 9876543210",
      dateOfBirth: "1985-01-15",
      address: "123 Admin Street, City"
    },
    professionalInfo: {
      role: "Super Admin",
      department: "Administration",
      joiningDate: "2020-01-01",
      employeeId: "SA001",
      manager: "CEO",
      securityClearance: "Level 5 - Full Access"
    }
  },
  hr: {
    personalInfo: {
      fullName: "HR Manager",
      email: "hr@company.com",
      phone: "+91 9876543211",
      dateOfBirth: "1988-03-20",
      address: "456 HR Avenue, City"
    },
    professionalInfo: {
      role: "HR Manager",
      department: "Human Resources",
      joiningDate: "2021-06-15",
      employeeId: "HR001",
      manager: "Operations Head",
      securityClearance: "Level 3 - HR Access"
    }
  },
  intern: {
    personalInfo: {
      fullName: "Intern Student",
      email: "intern@company.com",
      phone: "+91 9876543212",
      dateOfBirth: "2002-08-10",
      address: "789 Student Lane, City"
    },
    professionalInfo: {
      role: "Intern",
      department: "Web Development",
      joiningDate: "2024-01-15",
      employeeId: "INT001",
      manager: "Development Lead",
      securityClearance: "Level 1 - Basic Access"
    }
  }
};

// Mock Form Data
export const MOCK_FORM_DATA = {
  adsExecutive: {
    clients: [
      { value: "client1", label: "TechCorp Solutions" },
      { value: "client2", label: "Fashion Boutique" },
      { value: "client3", label: "Local Restaurant" }
    ],
    months: [
      { value: "2024-01", label: "January 2024" },
      { value: "2024-02", label: "February 2024" },
      { value: "2024-03", label: "March 2024" },
      { value: "2024-04", label: "April 2024" }
    ]
  }
};

// Mock Dashboard Statistics
export const MOCK_DASHBOARD_STATS = {
  superAdmin: {
    totalEmployees: 156,
    activeProjects: 23,
    monthlyRevenue: "₹2.5M",
    clientSatisfaction: 94
  },
  hr: {
    totalEmployees: 156,
    pendingReviews: 23,
    newHires: 8,
    departments: 12
  },
  manager: {
    teamSize: 25,
    activeProjects: 12,
    completionRate: 85,
    teamPerformance: 88
  }
};

// Export all mock data as a single object for easy access
export const MOCK_DATA = {
  systemActivities: MOCK_SYSTEM_ACTIVITIES,
  userMetrics: MOCK_USER_METRICS,
  performanceMetrics: MOCK_PERFORMANCE_METRICS,
  activeUsers: MOCK_ACTIVE_USERS,
  dynamicStats: MOCK_DYNAMIC_STATS,
  internData: MOCK_INTERN_DATA,
  adsEmployeeData: MOCK_ADS_EMPLOYEE_DATA,
  adsClients: MOCK_ADS_CLIENTS,
  monthlyPerformance: MOCK_MONTHLY_PERFORMANCE,
  calendarEvents: MOCK_CALENDAR_EVENTS,
  employeePerformance: MOCK_EMPLOYEE_PERFORMANCE,
  dailyReports: MOCK_DAILY_REPORTS,
  profileTemplates: MOCK_PROFILE_TEMPLATES,
  formData: MOCK_FORM_DATA,
  dashboardStats: MOCK_DASHBOARD_STATS
};