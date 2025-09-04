import React, { useState, useMemo, useEffect } from 'react';
import { useModal } from '@/shared/components/ModalContext';
import { useToast } from '@/shared/components/Toast';
import { useSupabase } from './SupabaseProvider';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { Section } from '@/shared/components/ui';
import { monthLabel, thisMonthKey } from '@/shared/lib/constants';
import QuoteOfTheDay from './QuoteOfTheDay';
import { AnimatedButton, FadeTransition } from '@/shared/components/Transitions';
import { LoadingSpinner, CardSkeleton } from '@/shared/components/LoadingStates';
import { useMobileResponsive } from '../hooks/useMobileResponsive';
import DashboardLayout from './layouts/DashboardLayout';
import configService from '@/shared/services/configService';

// Get configuration from centralized service
const getInternConfig = () => {
  return {
    defaultInternshipWeeks: 24,
    skillCategories: ['Frontend', 'Backend', 'Tools', 'Design'],
    projectStatuses: ['upcoming', 'in-progress', 'completed'],
    roadmapPhases: [
      { name: 'Foundation', weeks: '1-6', description: 'Learn company processes and basic skills' },
      { name: 'Development', weeks: '7-18', description: 'Work on real projects and advanced skills' },
      { name: 'Specialization', weeks: '19-24', description: 'Choose specialization and independent work' }
    ]
  };
};

const ProgressBar = ({ current, total, label, color = 'blue' }) => {
  const percentage = Math.min((current / total) * 100, 100);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">{current}/{total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            color === 'blue' ? 'bg-blue-500' :
            color === 'green' ? 'bg-green-500' :
            color === 'orange' ? 'bg-orange-500' :
            'bg-purple-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-500">{Math.round(percentage)}% Complete</div>
    </div>
  );
}

const SkillBar = ({ skill, level, category }) => {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{skill}</span>
        <span className="text-gray-600">{level}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-400 to-blue-600"
          style={{ width: `${level}%` }}
        />
      </div>
      {category && (
        <div className="text-xs text-gray-500">{category}</div>
      )}
    </div>
  );
};

const ProjectCard = ({ project, onViewDetails }) => {
  const statusColors = {
    completed: 'bg-green-100 text-green-800 border-green-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    upcoming: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const statusIcons = {
    completed: '✅',
    'in-progress': '🔄',
    upcoming: '📅'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-gray-900 text-sm">{project.title}</h4>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[project.status]}`}>
          {statusIcons[project.status]} {project.status.replace('-', ' ')}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
      
      <div className="space-y-2 mb-3">
        <div className="text-xs text-gray-500">
          <strong>Technologies:</strong> {project.technologies.join(', ')}
        </div>
        <div className="text-xs text-gray-500">
          <strong>Duration:</strong> {project.startDate} - {project.endDate}
        </div>
      </div>
      
      {project.rating && (
        <div className="flex items-center gap-1 mb-3">
          <span className="text-yellow-500">⭐</span>
          <span className="text-sm font-medium">{project.rating}/10</span>
        </div>
      )}
      
      <button
        onClick={() => onViewDetails(project)}
        className="w-full px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
      >
        View Details
      </button>
    </div>
  );
};

const RoadmapPhase = ({ phase, isActive }) => {
  const [statusColors, setStatusColors] = useState({
    completed: 'bg-green-500',
    'in-progress': 'bg-blue-500',
    upcoming: 'bg-gray-300'
  });

  useEffect(() => {
    const loadStatusColors = async () => {
      try {
        const dashboardConfig = await configService.getDashboardConfig('intern');
        if (dashboardConfig.statusColors) {
          setStatusColors(dashboardConfig.statusColors);
        }
      } catch (error) {
        console.error('Error loading status colors:', error);
      }
    };
    loadStatusColors();
  }, []);

  const progressPercentage = (phase.completedGoals / phase.goals.length) * 100;

  return (
    <div className={`relative p-4 rounded-xl border-2 transition-all ${
      isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-4 h-4 rounded-full ${statusColors[phase.status]}`} />
        <h4 className="font-semibold text-gray-900">{phase.phase}</h4>
      </div>
      
      <div className="space-y-2 mb-3">
        {phase.goals.map((goal, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span className={index < phase.completedGoals ? 'text-green-600' : 'text-gray-400'}>
              {index < phase.completedGoals ? '✅' : '⭕'}
            </span>
            <span className={index < phase.completedGoals ? 'text-gray-900' : 'text-gray-500'}>
              {goal}
            </span>
          </div>
        ))}
      </div>
      
      <ProgressBar 
        current={phase.completedGoals} 
        total={phase.goals.length} 
        label="Phase Progress"
        color={phase.status === 'completed' ? 'green' : phase.status === 'in-progress' ? 'blue' : 'gray'}
      />
    </div>
  );
};

function InternDashboard({ onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [intern, setIntern] = useState(null);
  const [projects, setProjects] = useState([]);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [skills, setSkills] = useState({ technical: [], soft: [] });
  const [roadmap, setRoadmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { openModal, closeModal } = useModal();
  const { notify } = useToast();
  const { user } = useUnifiedAuth();
  const { supabase } = useSupabase();

  // Load intern data from backend
  useEffect(() => {
    if (user) {
      loadInternData();
    }
  }, [user]);

  const loadInternData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (supabase) {
        // Load from Supabase
        const { data: internProfile, error: profileError } = await supabase
          .from('intern_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        const { data: internProjects, error: projectsError } = await supabase
          .from('intern_projects')
          .select('*')
          .eq('intern_id', user.id)
          .order('start_date', { ascending: true });

        if (projectsError) throw projectsError;

        const { data: reports, error: reportsError } = await supabase
          .from('intern_weekly_reports')
          .select('*')
          .eq('intern_id', user.id)
          .order('week_number', { ascending: false })
          .limit(10);

        if (reportsError) throw reportsError;

        const { data: skillsData, error: skillsError } = await supabase
          .from('intern_skills')
          .select('*')
          .eq('intern_id', user.id);

        if (skillsError) throw skillsError;

        // Process and set data
        setIntern(internProfile || createDefaultInternProfile());
        setProjects(internProjects || []);
        setWeeklyReports(reports || []);
        setSkills(processSkillsData(skillsData || []));
        setRoadmap(generateRoadmapFromData(internProfile, internProjects));
      } else {
        // Fallback to localStorage or create default data
        const savedInternData = localStorage.getItem(`intern_data_${user.id}`);
        if (savedInternData) {
          const data = JSON.parse(savedInternData);
          setIntern(data.intern);
          setProjects(data.projects);
          setWeeklyReports(data.weeklyReports);
          setSkills(data.skills);
          setRoadmap(data.roadmap);
        } else {
          // Create default intern data using centralized config
          const defaultData = await configService.generateDefaultData('intern', user);
          if (defaultData.intern) {
            setIntern(defaultData.intern);
            setSkills(defaultData.skills);
            setRoadmap(defaultData.roadmap);
          } else {
            // Fallback to local default data
            const fallbackData = createDefaultInternData();
            setIntern(fallbackData.intern);
            setProjects(fallbackData.projects);
            setWeeklyReports(fallbackData.weeklyReports);
            setSkills(fallbackData.skills);
            setRoadmap(fallbackData.roadmap);
          }
        }
      }
    } catch (error) {
      console.error('Error loading intern data:', error);
      setError(error.message);
      notify({ 
        type: 'error', 
        title: 'Data Loading Error', 
        message: 'Failed to load intern dashboard data. Using offline mode.' 
      });
      
      // Create fallback data using centralized config
      try {
        const fallbackData = await configService.generateDefaultData('intern', user);
        if (fallbackData.intern) {
          setIntern(fallbackData.intern);
          setSkills(fallbackData.skills);
          setRoadmap(fallbackData.roadmap);
        } else {
          throw new Error('No default data available');
        }
      } catch (configError) {
        console.error('Error loading config fallback:', configError);
        // Final fallback to local data
        const localFallback = createDefaultInternData();
        setIntern(localFallback.intern);
        setProjects(localFallback.projects);
        setWeeklyReports(localFallback.weeklyReports);
        setSkills(localFallback.skills);
        setRoadmap(localFallback.roadmap);
      }
    } finally {
      setLoading(false);
    }
  };

  const createDefaultInternProfile = () => {
    const config = getInternConfig();
    return {
      id: user.id,
      name: user.name || 'Intern User',
      email: user.email,
      studentId: `INT${new Date().getFullYear()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days ago
      department: user.department || 'General',
      mentor: 'Assigned Mentor',
      currentWeek: 8,
      totalWeeks: config.defaultInternshipWeeks,
      internshipType: 'Full-time',
      status: 'active'
    };
  };

  const createDefaultInternData = () => {
    const config = getInternConfig();
    return {
      intern: createDefaultInternProfile(),
      projects: [
        {
          id: 1,
          title: 'Onboarding Project',
          description: 'Complete the company onboarding process and basic training',
          status: config.projectStatuses[2], // 'completed'
          startDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          technologies: ['Company Tools', 'Basic Training'],
          learningOutcomes: ['Company processes', 'Team structure', 'Basic tools'],
          rating: 8.0
        },
        {
          id: 2,
          title: 'First Real Project',
          description: 'Work on a real project assignment with team supervision',
          status: config.projectStatuses[1], // 'in-progress'
          startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          technologies: ['React', 'JavaScript', 'Git'],
          learningOutcomes: ['Real-world development', 'Code reviews', 'Team collaboration'],
          rating: null
        }
      ],
      skills: {
        technical: [
          { name: 'JavaScript', level: 65, category: config.skillCategories[0] },
          { name: 'React', level: 55, category: config.skillCategories[0] },
          { name: 'HTML/CSS', level: 80, category: config.skillCategories[0] },
          { name: 'Git', level: 70, category: config.skillCategories[2] }
        ],
        soft: [
          { name: 'Communication', level: 75 },
          { name: 'Time Management', level: 70 },
          { name: 'Problem Solving', level: 65 },
          { name: 'Teamwork', level: 80 }
        ]
      },
      weeklyReports: [
        {
          week: 8,
          date: new Date().toISOString().split('T')[0],
          hoursWorked: 40,
          tasksCompleted: 6,
          learningHours: 8,
          feedback: 'Good progress on current project. Keep up the momentum.',
          challenges: 'Understanding complex component architecture',
          achievements: 'Completed user interface mockups'
        }
      ],
      roadmap: config.roadmapPhases.map((phase, index) => ({
        phase: `${phase.name} (Weeks ${phase.weeks})`,
        status: index === 0 ? 'completed' : index === 1 ? 'in-progress' : 'upcoming',
        goals: phase.description.split(' and ').concat(['Team integration', 'Skill development']),
        completedGoals: index === 0 ? 3 : index === 1 ? 1 : 0
      }))
    };
  };

  const processSkillsData = (skillsData) => {
    if (!skillsData || !Array.isArray(skillsData)) {
      return {
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
      };
    }
    
    const technical = skillsData.filter(skill => skill.category === 'technical');
    const soft = skillsData.filter(skill => skill.category === 'soft');
    
    return {
      technical: technical.length > 0 ? technical : [
        { name: 'JavaScript', level: 60, category: 'Programming' },
        { name: 'HTML/CSS', level: 75, category: 'Frontend' },
        { name: 'Git', level: 65, category: 'Tools' }
      ],
      soft: soft.length > 0 ? soft : [
        { name: 'Communication', level: 70 },
        { name: 'Problem Solving', level: 65 },
        { name: 'Teamwork', level: 80 }
      ]
    };
  };

  const generateRoadmapFromData = (internProfile, projects) => {
    if (!internProfile) return [];
    
    const currentWeek = internProfile.currentWeek || 1;
    const totalWeeks = internProfile.totalWeeks || 24;
    
    return [
      {
        phase: 'Foundation (Weeks 1-6)',
        status: currentWeek > 6 ? 'completed' : currentWeek >= 1 ? 'in-progress' : 'upcoming',
        goals: ['Learn company processes', 'Basic skills', 'Team integration'],
        completedGoals: Math.min(3, Math.max(0, Math.floor((currentWeek - 1) / 2)))
      },
      {
        phase: `Development (Weeks 7-${Math.floor(totalWeeks * 0.75)})`,
        status: currentWeek > Math.floor(totalWeeks * 0.75) ? 'completed' : currentWeek >= 7 ? 'in-progress' : 'upcoming',
        goals: ['Real project work', 'Advanced skills', 'Mentorship', 'Code reviews'],
        completedGoals: Math.min(4, Math.max(0, currentWeek - 6))
      },
      {
        phase: `Specialization (Weeks ${Math.floor(totalWeeks * 0.75) + 1}-${totalWeeks})`,
        status: currentWeek >= Math.floor(totalWeeks * 0.75) + 1 ? 'in-progress' : 'upcoming',
        goals: ['Specialization choice', 'Independent project', 'Presentation', 'Career planning'],
        completedGoals: Math.min(4, Math.max(0, currentWeek - Math.floor(totalWeeks * 0.75)))
      }
    ];
  };

  const overallProgress = useMemo(() => {
    if (!intern) return 0;
    return Math.round((intern.currentWeek / intern.totalWeeks) * 100);
  }, [intern]);

  const averageSkillLevel = useMemo(() => {
    if (!skills.technical.length) return 0;
    const totalLevels = skills.technical.reduce((sum, skill) => sum + skill.level, 0);
    return Math.round(totalLevels / skills.technical.length);
  }, [skills.technical]);

  const handleProjectDetails = (project) => {
    openModal(
      `Project: ${project.title}`,
      <div className="space-y-4">
        <p className="text-gray-700">{project.description}</p>
        
        <div>
          <h4 className="font-semibold mb-2">Technologies Used:</h4>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {tech}
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">Learning Outcomes:</h4>
          <ul className="list-disc list-inside space-y-1">
            {project.learningOutcomes.map((outcome, index) => (
              <li key={index} className="text-gray-700 text-sm">{outcome}</li>
            ))}
          </ul>
        </div>
        
        {project.rating && (
          <div className="flex items-center gap-2">
            <span className="font-semibold">Performance Rating:</span>
            <span className="text-yellow-500">⭐</span>
            <span className="font-medium">{project.rating}/10</span>
          </div>
        )}
      </div>,
      closeModal
    );
  };

  const handleSubmitWeeklyReport = () => {
    openModal(
      'Submit Weekly Report',
      <WeeklyReportForm 
        intern={intern}
        onSubmit={async (reportData) => {
          try {
            const newReport = {
              ...reportData,
              intern_id: user.id,
              week: intern.currentWeek + 1,
              date: new Date().toISOString().split('T')[0],
              id: Date.now()
            };

            if (supabase) {
              const { error } = await supabase
                .from('intern_weekly_reports')
                .insert([newReport]);
              
              if (error) throw error;
            } else {
              // Save to localStorage
              const updatedReports = [newReport, ...weeklyReports];
              setWeeklyReports(updatedReports);
              
              const internData = {
                intern: { ...intern, currentWeek: intern.currentWeek + 1 },
                projects,
                weeklyReports: updatedReports,
                skills,
                roadmap
              };
              localStorage.setItem(`intern_data_${user.id}`, JSON.stringify(internData));
            }

            setWeeklyReports(prev => [newReport, ...prev]);
            setIntern(prev => ({ ...prev, currentWeek: prev.currentWeek + 1 }));
            
            notify({ 
              type: 'success', 
              title: 'Report Submitted', 
              message: 'Your weekly report has been submitted successfully!' 
            });
            closeModal();
            
            // Refresh data to update progress
            await loadInternData();
          } catch (error) {
            console.error('Error submitting report:', error);
            notify({ 
              type: 'error', 
              title: 'Submission Failed', 
              message: error.message || 'Failed to submit weekly report' 
            });
          }
        }}
        onCancel={closeModal}
      />,
      closeModal
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'projects', label: 'Projects', icon: '💼' },
    { id: 'skills', label: 'Skills', icon: '🎯' },
    { id: 'roadmap', label: 'Roadmap', icon: '🗺️' },
    { id: 'reports', label: 'Reports', icon: '📝' }
  ];

  if (loading) {
    return (
      <FadeTransition show={true}>
        <div className="max-w-6xl mx-auto space-y-6">
          <CardSkeleton />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <CardSkeleton />
        </div>
      </FadeTransition>
    );
  }

  if (!intern) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Intern Profile Found</h2>
          <p className="text-gray-600 mb-4">
            {error || 'Unable to load your intern profile. Please contact your mentor.'}
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 rounded-2xl shadow-xl text-white p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-lg">
              🎓
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">Intern Dashboard</h1>
              <p className="text-orange-100 font-medium text-lg">Track your learning journey and progress</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 font-medium shadow-lg hover:scale-105"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
              📅
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Week Progress</h3>
              <p className="text-sm text-gray-600">Current internship week</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-2">{intern.currentWeek}/{intern.totalWeeks}</div>
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div 
              className="h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${(intern.currentWeek / intern.totalWeeks) * 100}%` }}
            />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
              💼
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Projects</h3>
              <p className="text-sm text-gray-600">Completed projects</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-2">{projects.filter(p => p.status === 'completed').length}/{projects.length}</div>
          <div className="w-full bg-green-200 rounded-full h-3">
            <div 
              className="h-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-300"
              style={{ width: `${projects.length > 0 ? (projects.filter(p => p.status === 'completed').length / projects.length) * 100 : 0}%` }}
            />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
              🎯
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Skills</h3>
              <p className="text-sm text-gray-600">Average skill level</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-600 mb-2">{Math.round([...skills.technical, ...skills.soft].reduce((sum, skill) => sum + skill.level, 0) / [...skills.technical, ...skills.soft].length) || 0}%</div>
          <div className="w-full bg-purple-200 rounded-full h-3">
            <div 
              className="h-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.round([...skills.technical, ...skills.soft].reduce((sum, skill) => sum + skill.level, 0) / [...skills.technical, ...skills.soft].length) || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="border-b border-gray-100">
          <nav className="flex space-x-2 px-6 py-2" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                }`}
              >
                <span className="mr-2 text-base">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-lg">
              {intern.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{intern.name}</h1>
              <p className="text-gray-600">{intern.department} Intern</p>
              <p className="text-sm text-gray-500">Student ID: {intern.studentId} • Mentor: {intern.mentor}</p>
              <p className="text-xs text-orange-600 mt-1">💡 Track your learning journey, projects, and skill development in one place</p>
            </div>
          </div>
          <AnimatedButton
            onClick={onBack}
            variant="outline"
            className="self-start sm:self-auto"
          >
            ← Back to Login
          </AnimatedButton>
        </div>
        
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{overallProgress}%</div>
            <div className="text-sm text-gray-600">Internship Progress</div>
            <div className="text-xs text-gray-500">Week {intern.currentWeek} of {intern.totalWeeks}</div>
            <div className="text-xs text-orange-500 mt-1">📅 Time remaining: {intern.totalWeeks - intern.currentWeek} weeks</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{intern.projects.filter(p => p.status === 'completed').length}</div>
            <div className="text-sm text-gray-600">Projects Completed</div>
            <div className="text-xs text-gray-500">{intern.projects.length} total projects</div>
            <div className="text-xs text-orange-500 mt-1">🎯 Click Projects tab to view details</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{averageSkillLevel}%</div>
            <div className="text-sm text-gray-600">Average Skill Level</div>
            <div className="text-xs text-gray-500">{intern.skills.technical.length} skills tracked</div>
            <div className="text-xs text-orange-500 mt-1">📈 View Skills tab for detailed breakdown</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">📋 How to Use Your Dashboard</h3>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Welcome to your internship dashboard! Use the tabs above to navigate between different sections: 
                  <strong>Overview</strong> shows your progress summary, <strong>Projects</strong> displays your assignments, 
                  <strong>Skills</strong> tracks your development, <strong>Roadmap</strong> shows your learning path, 
                  and <strong>Reports</strong> contains your weekly submissions.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">📈 Progress Overview</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Updated weekly</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Track your overall internship progress and key milestones</p>
                  <ProgressBar 
                    current={intern.currentWeek} 
                    total={intern.totalWeeks} 
                    label="Internship Timeline"
                    color="orange"
                  />
                  <ProgressBar 
                    current={intern.projects.filter(p => p.status === 'completed').length} 
                    total={intern.projects.length} 
                    label="Projects Completed"
                    color="green"
                  />
                  <ProgressBar 
                    current={intern.weeklyReports.reduce((sum, r) => sum + r.learningHours, 0)} 
                    total={intern.currentWeek * 6} 
                    label="Learning Hours"
                    color="blue"
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">🎯 Current Focus</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">This week</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Your current assignments and weekly goals</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Active Project</h4>
                    {intern.projects.find(p => p.status === 'in-progress') ? (
                      <div>
                        <p className="text-blue-800 font-medium">
                          {intern.projects.find(p => p.status === 'in-progress').title}
                        </p>
                        <p className="text-blue-700 text-sm mt-1">
                          {intern.projects.find(p => p.status === 'in-progress').description}
                        </p>
                      </div>
                    ) : (
                      <p className="text-blue-800">No active project</p>
                    )}
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-medium text-orange-900 mb-2">This Week's Goals</h4>
                    <p className="text-xs text-orange-700 mb-2">💡 These goals are set by your mentor and updated weekly</p>
                    <ul className="text-orange-800 text-sm space-y-1">
                      <li>• Complete dashboard API integration</li>
                      <li>• Attend React advanced patterns workshop</li>
                      <li>• Submit weekly progress report</li>
                      <li>• Client meeting preparation</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div>
                   <div className="flex items-center gap-2 mb-2">
                     <h3 className="text-lg font-semibold text-gray-900">📝 Recent Activity</h3>
                     <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Last 2 weeks</span>
                   </div>
                   <p className="text-sm text-gray-600 mb-4">Your recent weekly reports and mentor feedback</p>
                   <div className="space-y-3">
                     {intern.weeklyReports.slice(0, 2).map((report, index) => (
                       <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                         <div className="flex justify-between items-start mb-2">
                           <h4 className="font-medium text-gray-900">Week {report.week} Report</h4>
                           <span className="text-sm text-gray-500">{report.date}</span>
                         </div>
                         <p className="text-sm text-gray-700 mb-2">{report.feedback}</p>
                         <div className="grid grid-cols-3 gap-4 text-sm">
                           <div>
                             <span className="font-medium text-gray-600">Hours:</span> {report.hoursWorked}
                           </div>
                           <div>
                             <span className="font-medium text-gray-600">Tasks:</span> {report.tasksCompleted}
                           </div>
                           <div>
                             <span className="font-medium text-gray-600">Learning:</span> {report.learningHours}h
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
                 
                 <div>
                   <QuoteOfTheDay isManager={false} />
                 </div>
               </div>
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">💼 Project Portfolio</h3>
                <button
                  onClick={handleSubmitWeeklyReport}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  📝 Submit Weekly Report
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onViewDetails={handleProjectDetails}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">🎯 Skill Development</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">💻 Technical Skills</h4>
                  <div className="space-y-4">
                    {intern.skills.technical.map((skill, index) => (
                      <SkillBar 
                        key={index}
                        skill={skill.name}
                        level={skill.level}
                        category={skill.category}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">🤝 Soft Skills</h4>
                  <div className="space-y-4">
                    {intern.skills.soft.map((skill, index) => (
                      <SkillBar 
                        key={index}
                        skill={skill.name}
                        level={skill.level}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Roadmap Tab */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">🗺️ Internship Roadmap</h3>
              
              <div className="space-y-4">
                {intern.roadmap.map((phase, index) => (
                  <RoadmapPhase 
                    key={index}
                    phase={phase}
                    isActive={phase.status === 'in-progress'}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">📝 Weekly Reports</h3>
                <button
                  onClick={handleSubmitWeeklyReport}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  ➕ New Report
                </button>
              </div>
              
              <div className="space-y-4">
                {weeklyReports.map((report, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">Week {report.week} Report</h4>
                        <p className="text-sm text-gray-500">{report.date}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Hours: {report.hoursWorked}</div>
                        <div className="text-sm text-gray-600">Learning: {report.learningHours}h</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">📈 Achievements</h5>
                        <p className="text-sm text-gray-600">{report.achievements}</p>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">🎯 Challenges</h5>
                        <p className="text-sm text-gray-600">{report.challenges}</p>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">💬 Mentor Feedback</h5>
                        <p className="text-sm text-gray-600">{report.feedback}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Tasks Completed:</span> {report.tasksCompleted}
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Learning Hours:</span> {report.learningHours}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Weekly Report Form Component
function WeeklyReportForm({ intern, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    hoursWorked: 40,
    tasksCompleted: '',
    learningHours: 6,
    achievements: '',
    challenges: '',
    goals: '',
    feedback: ''
  });

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-blue-900 mb-2">Week {intern.currentWeek + 1} Report</h4>
        <p className="text-blue-800 text-sm">
          Submit your weekly progress report for review by your mentor.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hours Worked This Week
          </label>
          <input
            type="number"
            name="hoursWorked"
            value={formData.hoursWorked}
            onChange={handleInputChange}
            min="0"
            max="60"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Learning Hours This Week
          </label>
          <input
            type="number"
            name="learningHours"
            value={formData.learningHours}
            onChange={handleInputChange}
            min="0"
            max="40"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tasks Completed This Week
        </label>
        <textarea
          name="tasksCompleted"
          value={formData.tasksCompleted}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="List the main tasks you completed this week..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Key Achievements
        </label>
        <textarea
          name="achievements"
          value={formData.achievements}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="What did you accomplish this week that you're proud of?"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Challenges Faced
        </label>
        <textarea
          name="challenges"
          value={formData.challenges}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="What difficulties did you encounter and how did you handle them?"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Goals for Next Week
        </label>
        <textarea
          name="goals"
          value={formData.goals}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="What do you plan to focus on next week?"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Comments (Optional)
        </label>
        <textarea
          name="feedback"
          value={formData.feedback}
          onChange={handleInputChange}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="Any additional thoughts or feedback for your mentor..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
        >
          Submit Report
        </button>
      </div>
    </form>
  );
}

export default InternDashboard;