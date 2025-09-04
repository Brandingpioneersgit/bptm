import React, { useState, useEffect, useMemo } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { Section } from '@/shared/components/ui';
import ProfileSummary from './ProfileSummary';
import MonthlyFormWorkflow from './MonthlyFormWorkflow';
import PerformanceKPI from './PerformanceKPI';
import DisciplineTracking from './DisciplineTracking';
import { FeedbackNPS } from './FeedbackNPS';
import { LearningGrowth } from './LearningGrowth';
import { GrowthAnalytics } from './GrowthAnalytics';
import { SuperadminControls } from './SuperadminControls';
import { 
  UserIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  PresentationChartLineIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

// Progress Bar Component
const ProgressBar = ({ sections, currentSection }) => {
  const completedSections = sections.filter(section => section.completed).length;
  const totalSections = sections.length;
  const progressPercentage = (completedSections / totalSections) * 100;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Dashboard Progress</h3>
        <span className="text-sm font-medium text-gray-600">
          {completedSections}/{totalSections} sections completed
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div 
          className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {/* Section Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {sections.map((section, index) => (
          <div 
            key={section.id}
            className={`flex items-center space-x-2 p-2 rounded-lg text-sm ${
              section.id === currentSection 
                ? 'bg-blue-100 border border-blue-300'
                : section.completed 
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <span className="text-lg">
              {section.completed ? '✅' : section.id === currentSection ? '🔄' : '⭕'}
            </span>
            <span className={`font-medium ${
              section.id === currentSection 
                ? 'text-blue-700'
                : section.completed 
                  ? 'text-green-700'
                  : 'text-gray-600'
            }`}>
              {section.name}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-gray-500 text-center">
        Complete all sections to unlock your full dashboard potential
      </div>
    </div>
  );
};

// Info Badge Component
const InfoBadge = ({ title, description, type = 'info' }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const iconColor = type === 'warning' ? 'text-yellow-600' : type === 'success' ? 'text-green-600' : 'text-blue-600';
  const bgColor = type === 'warning' ? 'bg-yellow-50 border-yellow-200' : type === 'success' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200';
  
  return (
    <div className={`border rounded-lg p-3 ${bgColor}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center space-x-2">
          <InformationCircleIcon className={`h-4 w-4 ${iconColor}`} />
          <span className="text-sm font-medium text-gray-900">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUpIcon className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-4 w-4 text-gray-500" />
        )}
      </button>
      
      {isOpen && (
        <div className="mt-2 text-sm text-gray-700">
          {description}
        </div>
      )}
    </div>
  );
};

// FAQ Component
const FAQSection = () => {
  const faqs = [
    {
      question: "How is my performance score calculated?",
      answer: "Your performance score is calculated as the average of all your completed KPIs for the current month. Each KPI is weighted equally, and the final score is updated in real-time as you complete more KPIs."
    },
    {
      question: "What happens if I don't complete my learning hours?",
      answer: "You need to complete at least 6 hours of learning per month. If you haven't met this requirement, you won't be able to submit your monthly report or request performance reviews until the learning target is achieved."
    },
    {
      question: "How does the discipline score work?",
      answer: "Your discipline score is calculated based on: Attendance (40%), Communication logs (30%), Meeting participation (20%), and Timely submissions (10%). Each component is scored and weighted to give you an overall discipline rating."
    },
    {
      question: "Can I edit my submitted data?",
      answer: "Most data can be edited until the monthly deadline. However, some fields may be locked by managers or after certain approval processes. Contact your manager if you need to modify locked data."
    },
    {
      question: "Who can see my performance data?",
      answer: "Your direct manager, HR team, and superadmins can view your performance data. Peer feedback is anonymized, and client feedback is shared with relevant stakeholders for improvement purposes."
    }
  ];
  
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <QuestionMarkCircleIcon className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h3>
      </div>
      
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <InfoBadge
            key={index}
            title={faq.question}
            description={faq.answer}
            type="info"
          />
        ))}
      </div>
    </div>
  );
};

// Tab Navigation Component
const TabNavigation = ({ activeTab, setActiveTab, completionStatus, currentUser }) => {
  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon, completed: completionStatus.profile },
    { id: 'monthly', name: 'Monthly Forms', icon: DocumentTextIcon, completed: completionStatus.monthly },
    { id: 'performance', name: 'Performance & KPI', icon: ChartBarIcon, completed: completionStatus.performance },
    { id: 'discipline', name: 'Discipline', icon: ClockIcon, completed: completionStatus.discipline },
    { id: 'feedback', name: 'Feedback & NPS', icon: ChatBubbleLeftRightIcon, completed: completionStatus.feedback },
    { id: 'learning', name: 'Learning & Growth', icon: AcademicCapIcon, completed: completionStatus.learning },
    { id: 'analytics', name: 'Analytics', icon: PresentationChartLineIcon, completed: completionStatus.analytics }
  ];
  
  // Add superadmin tab if user has admin privileges
  if (currentUser?.role === 'superadmin' || currentUser?.is_admin) {
    tabs.push({
      id: 'superadmin',
      name: 'Superadmin',
      icon: ShieldCheckIcon,
      completed: true
    });
  }

  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.name}</span>
              {tab.completed && tab.id !== 'superadmin' && (
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

// Welcome Header Component
const WelcomeHeader = ({ employee, overallScore }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };
  
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">
            {getGreeting()}, {employee?.name || 'Employee'}! 👋
          </h1>
          <p className="text-blue-100 mb-1">
            {employee?.department} • {employee?.role?.[0] || 'Employee'}
          </p>
          <p className="text-blue-200 text-sm">
            Welcome to your comprehensive employee dashboard
          </p>
        </div>
        
        {overallScore !== null && (
          <div className="text-center bg-white bg-opacity-20 rounded-lg p-4">
            <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore.toFixed(1)}
            </div>
            <div className="text-sm text-blue-100">Overall Score</div>
          </div>
        )}
      </div>
    </div>
  );
};

// Quick Stats Component
const QuickStats = ({ employee, stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.profileCompletion}%</div>
        <div className="text-sm text-gray-600">Profile Complete</div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-green-600">{stats.monthlyFormsCompleted}</div>
        <div className="text-sm text-gray-600">Forms Completed</div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-purple-600">{stats.kpisTracked}</div>
        <div className="text-sm text-gray-600">KPIs Tracked</div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-orange-600">{stats.disciplineScore}/100</div>
        <div className="text-sm text-gray-600">Discipline Score</div>
      </div>
    </div>
  );
};

export const EmployeeDashboard = ({ employeeId }) => {
  const supabase = useSupabase();
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [dashboardStats, setDashboardStats] = useState({
    profileCompletion: 0,
    monthlyFormsCompleted: 0,
    kpisTracked: 0,
    disciplineScore: 0,
    feedbackScore: 0,
    learningHours: 0,
    analyticsScore: 0
  });
  
  const [completionStatus, setCompletionStatus] = useState({
    profile: false,
    monthly: false,
    performance: false,
    discipline: false,
    feedback: false,
    learning: false,
    analytics: false
  });
  
  // Define dashboard sections
  const sections = useMemo(() => [
    {
      id: 'profile',
      name: 'Profile',
      icon: '👤',
      completed: dashboardStats.profileCompletion >= 80
    },
    {
      id: 'accountability',
      name: 'Accountability',
      icon: '📋',
      completed: dashboardStats.monthlyFormsCompleted > 0
    },
    {
      id: 'performance',
      name: 'Performance',
      icon: '📊',
      completed: dashboardStats.kpisTracked > 0
    },
    {
      id: 'discipline',
      name: 'Discipline',
      icon: '📅',
      completed: dashboardStats.disciplineScore >= 70
    }
  ], [dashboardStats]);
  
  // Calculate overall score
  const overallScore = useMemo(() => {
    const scores = [
      dashboardStats.profileCompletion,
      dashboardStats.monthlyFormsCompleted > 0 ? 100 : 0,
      dashboardStats.kpisTracked > 0 ? 85 : 0, // Placeholder KPI score
      dashboardStats.disciplineScore,
      dashboardStats.feedbackScore || 0,
      dashboardStats.learningHours * 16.67 || 0, // Convert 6 hours to percentage (6/6 * 100)
      dashboardStats.analyticsScore || 0
    ].filter(score => score > 0);
    
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }, [dashboardStats]);
  
  // Load employee data
  useEffect(() => {
    const loadEmployeeData = async () => {
      if (!employeeId) return;
      
      setLoading(true);
      try {
        // Load employee profile
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('*')
          .eq('id', employeeId)
          .single();
        
        if (employeeError) throw employeeError;
        setEmployee(employeeData);
        
        // Load dashboard statistics
        await loadDashboardStats(employeeData);
        
      } catch (error) {
        console.error('Error loading employee data:', error);
        notify('Failed to load employee data', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    loadEmployeeData();
  }, [employeeId, supabase, notify]);
  
  const loadDashboardStats = async (employeeData) => {
    try {
      // Calculate profile completion
      const profileFields = ['name', 'phone', 'department', 'role', 'joining_date'];
      const completedFields = profileFields.filter(field => employeeData[field]).length;
      const profileCompletion = Math.round((completedFields / profileFields.length) * 100);
      
      // Count monthly forms completed
      const { data: formsData, error: formsError } = await supabase
        .from('submissions')
        .select('id')
        .eq('employee_name', employeeData.name);
      
      if (formsError) throw formsError;
      const monthlyFormsCompleted = formsData?.length || 0;
      
      // Count KPIs tracked
      const { data: kpisData, error: kpisError } = await supabase
        .from('employee_kpis')
        .select('id')
        .eq('employee_id', employeeData.id);
      
      if (kpisError) throw kpisError;
      const kpisTracked = kpisData?.length || 0;
      
      // Calculate discipline score (simplified)
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('employee_attendance')
        .select('status')
        .eq('employee_id', employeeData.id)
        .like('date', `${currentMonth}%`);
      
      if (attendanceError) throw attendanceError;
      
      const presentDays = attendanceData?.filter(record => 
        ['present', 'wfh'].includes(record.status)
      ).length || 0;
      const disciplineScore = Math.min(Math.round((presentDays / 25) * 100), 100);
      
      setDashboardStats({
        profileCompletion,
        monthlyFormsCompleted,
        kpisTracked,
        disciplineScore
      });
      
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };
  
  const handleSectionComplete = (sectionId) => {
    // This would be called when a section is completed
    // For now, we'll just refresh the stats
    if (employee) {
      loadDashboardStats(employee);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Not Found</h2>
          <p className="text-gray-600">The requested employee profile could not be loaded.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <WelcomeHeader employee={employee} overallScore={overallScore} />
        
        {/* Quick Stats */}
        <QuickStats employee={employee} stats={dashboardStats} />
        
        {/* Progress Bar */}
        <ProgressBar sections={sections} currentSection={activeTab} />
        
        {/* Tab Navigation */}
        <TabNavigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          completionStatus={completionStatus}
          currentUser={employee}
        />
        
        {/* Main Content */}
        <div className="space-y-6">
          {activeTab === 'profile' && (
            <ProfileSummary 
              employee={employee} 
              onUpdate={() => handleSectionComplete('profile')}
            />
          )}
          
          {activeTab === 'monthly' && (
            <MonthlyFormWorkflow 
              employee={employee} 
              onSubmit={() => handleSectionComplete('monthly')}
            />
          )}
          
          {activeTab === 'performance' && (
            <PerformanceKPI 
              employee={employee} 
              onUpdate={() => handleSectionComplete('performance')}
            />
          )}
          
          {activeTab === 'discipline' && (
            <DisciplineTracking 
              employee={employee} 
              onUpdate={() => handleSectionComplete('discipline')}
            />
          )}
          
          {activeTab === 'feedback' && (
            <FeedbackNPS 
              employee={employee} 
              onUpdate={() => handleSectionComplete('feedback')}
            />
          )}
          
          {activeTab === 'learning' && (
            <LearningGrowth 
              employee={employee} 
              onUpdate={() => handleSectionComplete('learning')}
            />
          )}
          
          {activeTab === 'analytics' && (
            <GrowthAnalytics 
              employee={employee} 
              onUpdate={() => handleSectionComplete('analytics')}
            />
          )}
          
          {activeTab === 'superadmin' && (
            <SuperadminControls 
              currentUser={employee}
            />
          )}
        </div>
        
        {/* FAQ Section */}
        <div className="mt-8">
          <FAQSection />
        </div>
        
        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Employee Dashboard • Branding Pioneers • {new Date().getFullYear()}</p>
          <p className="mt-1">
            Need help? Contact your manager or HR department
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;