import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import moment from 'moment';
import { INTERN_PROFILE_CONFIG } from '../../shared/config/uiConfig';

const InternProfile = ({ 
  profileData, 
  monthlyData, 
  onProfileUpdate, 
  profileCompletion,
  calendarEvents,
  selectedMonth,
  onMonthChange 
}) => {
  const { supabase } = useSupabase();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [internData, setInternData] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [learningGoals, setLearningGoals] = useState([]);
  const [mentorFeedback, setMentorFeedback] = useState([]);
  
  // Learning KPI state variables
  const [learningKPIs, setLearningKPIs] = useState({
    skill_development: 0,
    learning_hours: 0,
    goal_completion: 0,
    mentor_rating: 0,
    project_quality: 0,
    technical_growth: 0,
    soft_skills: 0,
    initiative_score: 0
  });
  const [showKPIModal, setShowKPIModal] = useState(false);
  const [activeTab, setActiveTab] = useState('learning-overview');
  const [academicProgress, setAcademicProgress] = useState({});

  // Fetch intern-specific data
  useEffect(() => {
    const fetchInternData = async () => {
      try {
        setLoading(true);
        
        // Calculate learning progress
        const currentMonthData = monthlyData.filter(item => 
          moment(item.created_at).format('YYYY-MM') === moment().format('YYYY-MM')
        );
        
        const totalLearningHours = currentMonthData.reduce((sum, item) => 
          sum + (item.learning_hours || 0), 0
        );
        
        const avgPerformance = currentMonthData.length > 0 
          ? Math.round(currentMonthData.reduce((sum, item) => sum + (item.performance_score || 0), 0) / currentMonthData.length)
          : 0;
        
        // Fetch learning goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('intern_learning_goals')
          .select('*')
          .eq('user_id', profileData?.user_id)
          .order('created_at', { ascending: false });
          
        if (goalsError && goalsError.code !== 'PGRST116') {
          console.error('Error fetching learning goals:', goalsError);
        }
        
        // Fetch mentor feedback
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('mentor_feedback')
          .select('*')
          .eq('intern_id', profileData?.user_id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (feedbackError && feedbackError.code !== 'PGRST116') {
          console.error('Error fetching mentor feedback:', feedbackError);
        }
        
        setLearningData({
          totalHours: totalLearningHours,
          avgPerformance: avgPerformance,
          completedTasks: currentMonthData.filter(item => item.status === 'completed').length,
          totalTasks: currentMonthData.length,
          skillsLearned: currentMonthData.reduce((skills, item) => {
            if (item.skills_practiced) {
              return [...skills, ...item.skills_practiced.filter(skill => !skills.includes(skill))];
            }
            return skills;
          }, []).length
        });
        
        setLearningGoals(goalsData || []);
        setMentorFeedback(feedbackData || []);
        
        // Fetch learning KPIs
        const { data: kpiData, error: kpiError } = await supabase
          .from('intern_kpis')
          .select('*')
          .eq('user_id', profileData?.user_id)
          .eq('month', moment().format('YYYY-MM'))
          .single();
          
        if (kpiData && !kpiError) {
          setLearningKPIs({
            skill_development: kpiData.skill_development || 0,
            learning_hours: kpiData.learning_hours || 0,
            goal_completion: kpiData.goal_completion || 0,
            mentor_rating: kpiData.mentor_rating || 0,
            project_quality: kpiData.project_quality || 0,
            technical_growth: kpiData.technical_growth || 0,
            soft_skills: kpiData.soft_skills || 0,
            initiative_score: kpiData.initiative_score || 0
          });
        }
        
        // Fetch academic progress
        const { data: academicData, error: academicError } = await supabase
          .from('intern_academic_progress')
          .select('*')
          .eq('user_id', profileData?.user_id)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (academicData && academicData.length > 0 && !academicError) {
          setAcademicProgress(academicData[0]);
        }
        
      } catch (error) {
        console.error('Error fetching intern data:', error);
        showToast('Failed to load learning data', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInternData();
  }, [supabase, showToast, monthlyData, profileData?.user_id]);

  const handleEditProfile = () => {
    setEditFormData({
      name: profileData?.name || '',
      email: profileData?.email || '',
      phone: profileData?.phone || '',
      university: profileData?.university || '',
      major: profileData?.major || '',
      graduation_year: profileData?.graduation_year || '',
      bio: profileData?.bio || '',
      interests: profileData?.interests || '',
      career_goals: profileData?.career_goals || '',
      learning_objectives: profileData?.learning_objectives || ''
    });
    navigate('/profile-edit');
  };

  const handleSaveProfile = async () => {
    try {
      await onProfileUpdate(editFormData);
      setShowEditModal(false);
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update profile', 'error');
    }
  };

  const getProgressPercentage = () => {
    if (learningData.totalTasks === 0) return 0;
    return Math.round((learningData.completedTasks / learningData.totalTasks) * 100);
  };

  // Learning KPI management functions
  const handleSaveLearningKPIs = async () => {
    try {
      const { error } = await supabase
        .from('intern_kpis')
        .upsert({
          user_id: profileData?.user_id,
          month: moment().format('YYYY-MM'),
          ...learningKPIs,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      setShowKPIModal(false);
      showToast('Learning KPIs updated successfully', 'success');
    } catch (error) {
      console.error('Error saving learning KPIs:', error);
      showToast('Failed to update learning KPIs', 'error');
    }
  };

  const calculateLearningScore = () => {
    const scores = Object.values(learningKPIs);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading intern profile data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Completion Alert */}
      {profileCompletion < 80 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-yellow-600 mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                {INTERN_PROFILE_CONFIG.profileCompletion.title} ({profileCompletion}%)
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                {INTERN_PROFILE_CONFIG.profileCompletion.description}
              </p>
            </div>
            <button
              onClick={handleEditProfile}
              className="ml-auto bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
            >
              {INTERN_PROFILE_CONFIG.profileCompletion.buttonText}
            </button>
          </div>
        </div>
      )}

      {/* Learning Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">{INTERN_PROFILE_CONFIG.learningOverview.learningHours.title}</h3>
              <div className="text-3xl font-bold">{learningData.totalHours || 0}</div>
              <p className="text-blue-100 text-sm">{INTERN_PROFILE_CONFIG.learningOverview.learningHours.subtitle}</p>
            </div>
            <div className="text-4xl opacity-80">{INTERN_PROFILE_CONFIG.learningOverview.learningHours.icon}</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">{INTERN_PROFILE_CONFIG.learningOverview.progress.title}</h3>
              <div className="text-3xl font-bold">{getProgressPercentage()}%</div>
              <p className="text-green-100 text-sm">{INTERN_PROFILE_CONFIG.learningOverview.progress.subtitle}</p>
            </div>
            <div className="text-4xl opacity-80">{INTERN_PROFILE_CONFIG.learningOverview.progress.icon}</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">{INTERN_PROFILE_CONFIG.learningOverview.performance.title}</h3>
              <div className="text-3xl font-bold">{learningData.avgPerformance || 0}%</div>
              <p className="text-purple-100 text-sm">{INTERN_PROFILE_CONFIG.learningOverview.performance.subtitle}</p>
            </div>
            <div className="text-4xl opacity-80">{INTERN_PROFILE_CONFIG.learningOverview.performance.icon}</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">{INTERN_PROFILE_CONFIG.learningOverview.skills.title}</h3>
              <div className="text-3xl font-bold">{learningData.skillsLearned || 0}</div>
              <p className="text-orange-100 text-sm">{INTERN_PROFILE_CONFIG.learningOverview.skills.subtitle}</p>
            </div>
            <div className="text-4xl opacity-80">{INTERN_PROFILE_CONFIG.learningOverview.skills.icon}</div>
          </div>
        </div>
      </div>

      {/* Learning KPI Dashboard */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{INTERN_PROFILE_CONFIG.kpiDashboard.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{INTERN_PROFILE_CONFIG.kpiDashboard.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">{INTERN_PROFILE_CONFIG.kpiDashboard.overallScoreLabel}</div>
              <div className={`text-2xl font-bold ${getScoreColor(calculateLearningScore())}`}>
                {calculateLearningScore()}%
              </div>
            </div>
            <button
              onClick={() => setShowKPIModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {INTERN_PROFILE_CONFIG.kpiDashboard.updateButton}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'learning-overview', ...INTERN_PROFILE_CONFIG.tabs.learningOverview },
              { id: 'skill-development', ...INTERN_PROFILE_CONFIG.tabs.skillDevelopment },
              { id: 'academic-progress', ...INTERN_PROFILE_CONFIG.tabs.academicProgress },
              { id: 'mentor-feedback', ...INTERN_PROFILE_CONFIG.tabs.mentorFeedback }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'learning-overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries({
              'Skill Development': { value: learningKPIs.skill_development, icon: '🚀' },
              'Learning Hours': { value: learningKPIs.learning_hours, icon: '⏰' },
              'Goal Completion': { value: learningKPIs.goal_completion, icon: '✅' },
              'Mentor Rating': { value: learningKPIs.mentor_rating, icon: '⭐' },
              'Project Quality': { value: learningKPIs.project_quality, icon: '💎' },
              'Technical Growth': { value: learningKPIs.technical_growth, icon: '💻' },
              'Soft Skills': { value: learningKPIs.soft_skills, icon: '🤝' },
              'Initiative Score': { value: learningKPIs.initiative_score, icon: '🎯' }
            }).map(([label, data]) => (
              <div key={label} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{data.icon} {label}</span>
                  <span className={`text-lg font-bold ${getScoreColor(data.value)}`}>
                    {data.value}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(data.value)}`}
                    style={{ width: `${data.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'skill-development' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">{INTERN_PROFILE_CONFIG.skillDevelopment.technicalSkills.title}</h3>
                <div className="text-2xl font-bold text-blue-700">{learningKPIs.technical_growth}%</div>
                <p className="text-sm text-blue-600">{INTERN_PROFILE_CONFIG.skillDevelopment.technicalSkills.subtitle}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">{INTERN_PROFILE_CONFIG.skillDevelopment.softSkills.title}</h3>
                <div className="text-2xl font-bold text-green-700">{learningKPIs.soft_skills}%</div>
                <p className="text-sm text-green-600">{INTERN_PROFILE_CONFIG.skillDevelopment.softSkills.subtitle}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">{INTERN_PROFILE_CONFIG.skillDevelopment.initiative.title}</h3>
                <div className="text-2xl font-bold text-purple-700">{learningKPIs.initiative_score}%</div>
                <p className="text-sm text-purple-600">{INTERN_PROFILE_CONFIG.skillDevelopment.initiative.subtitle}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'academic-progress' && (
          <div className="space-y-6">
            {academicProgress && Object.keys(academicProgress).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{INTERN_PROFILE_CONFIG.academicProgress.title}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{INTERN_PROFILE_CONFIG.academicProgress.labels.currentGPA}:</span>
                      <span className="font-medium">{academicProgress.gpa || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{INTERN_PROFILE_CONFIG.academicProgress.labels.creditsCompleted}:</span>
                      <span className="font-medium">{academicProgress.credits_completed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{INTERN_PROFILE_CONFIG.academicProgress.labels.yearLevel}:</span>
                      <span className="font-medium">{academicProgress.year_level || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{INTERN_PROFILE_CONFIG.academicProgress.currentCoursesTitle}</h3>
                  <div className="space-y-1">
                    {academicProgress.current_courses ? (
                      academicProgress.current_courses.map((course, index) => (
                        <div key={index} className="text-sm text-gray-600">{course}</div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">{INTERN_PROFILE_CONFIG.academicProgress.noCoursesMessage}</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">{INTERN_PROFILE_CONFIG.academicProgress.emptyState.icon}</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{INTERN_PROFILE_CONFIG.academicProgress.emptyState.title}</h3>
                <p className="text-gray-600">{INTERN_PROFILE_CONFIG.academicProgress.emptyState.message}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'mentor-feedback' && (
          <div className="space-y-4">
            {mentorFeedback && mentorFeedback.length > 0 ? (
              mentorFeedback.map((feedback, index) => (
                <div key={feedback.id || index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💬</span>
                      <span className="font-medium text-gray-900">{feedback.mentor_name || 'Mentor'}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {moment(feedback.created_at).format('MMM DD, YYYY')}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{feedback.feedback_text}</p>
                  {feedback.rating && (
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-600">{INTERN_PROFILE_CONFIG.mentorFeedback.ratingLabel}:</span>
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className={`text-sm ${
                            i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}>
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">{INTERN_PROFILE_CONFIG.mentorFeedback.emptyState.icon}</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{INTERN_PROFILE_CONFIG.mentorFeedback.emptyState.title}</h3>
                <p className="text-gray-600">{INTERN_PROFILE_CONFIG.mentorFeedback.emptyState.message}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{INTERN_PROFILE_CONFIG.personalInfo.title}</h2>
          <button
            onClick={handleEditProfile}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {INTERN_PROFILE_CONFIG.personalInfo.editButton}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{INTERN_PROFILE_CONFIG.personalInfo.labels.fullName}</label>
            <div className="text-gray-900">{profileData?.name || INTERN_PROFILE_CONFIG.personalInfo.defaultValues.notProvided}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{INTERN_PROFILE_CONFIG.personalInfo.labels.email}</label>
            <div className="text-gray-900">{profileData?.email || INTERN_PROFILE_CONFIG.personalInfo.defaultValues.notProvided}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{INTERN_PROFILE_CONFIG.personalInfo.labels.phone}</label>
            <div className="text-gray-900">{profileData?.phone || INTERN_PROFILE_CONFIG.personalInfo.defaultValues.notProvided}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{INTERN_PROFILE_CONFIG.personalInfo.labels.university}</label>
            <div className="text-gray-900">{profileData?.university || INTERN_PROFILE_CONFIG.personalInfo.defaultValues.notProvided}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{INTERN_PROFILE_CONFIG.personalInfo.labels.major}</label>
            <div className="text-gray-900">{profileData?.major || INTERN_PROFILE_CONFIG.personalInfo.defaultValues.notProvided}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{INTERN_PROFILE_CONFIG.personalInfo.labels.graduationYear}</label>
            <div className="text-gray-900">{profileData?.graduation_year || INTERN_PROFILE_CONFIG.personalInfo.defaultValues.notProvided}</div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{INTERN_PROFILE_CONFIG.personalInfo.labels.bio}</label>
            <div className="text-gray-900">{profileData?.bio || INTERN_PROFILE_CONFIG.personalInfo.defaultValues.noBio}</div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{INTERN_PROFILE_CONFIG.personalInfo.labels.learningObjectives}</label>
            <div className="text-gray-900">{profileData?.learning_objectives || INTERN_PROFILE_CONFIG.personalInfo.defaultValues.noObjectives}</div>
          </div>
        </div>
      </div>

      {/* Learning Goals */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{INTERN_PROFILE_CONFIG.learningGoals.title}</h2>
        
        {learningGoals.length > 0 ? (
          <div className="space-y-4">
            {learningGoals.slice(0, 5).map((goal, index) => (
              <div key={goal.id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{goal.title}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    goal.status === INTERN_PROFILE_CONFIG.learningGoals.statusLabels.completed ? 'bg-green-100 text-green-800' :
                    goal.status === INTERN_PROFILE_CONFIG.learningGoals.statusLabels.in_progress ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {goal.status || INTERN_PROFILE_CONFIG.learningGoals.statusLabels.pending}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">{goal.description}</p>
                <div className="flex items-center text-xs text-gray-500">
                  <span>{INTERN_PROFILE_CONFIG.learningGoals.targetLabel} {moment(goal.target_date).format('MMM DD, YYYY')}</span>
                  {goal.progress && (
                    <span className="ml-4">{INTERN_PROFILE_CONFIG.learningGoals.progressLabel} {goal.progress}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">{INTERN_PROFILE_CONFIG.learningGoals.emptyState.icon}</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{INTERN_PROFILE_CONFIG.learningGoals.emptyState.title}</h3>
            <p className="text-gray-600 mb-4">{INTERN_PROFILE_CONFIG.learningGoals.emptyState.message}</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              {INTERN_PROFILE_CONFIG.learningGoals.emptyState.buttonText}
            </button>
          </div>
        )}
      </div>

      {/* Mentor Feedback */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Mentor Feedback</h2>
        
        {mentorFeedback.length > 0 ? (
          <div className="space-y-4">
            {mentorFeedback.map((feedback, index) => (
              <div key={feedback.id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{feedback.mentor_name}</h3>
                  <span className="text-sm text-gray-500">
                    {moment(feedback.created_at).format('MMM DD, YYYY')}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{feedback.feedback}</p>
                {feedback.rating && (
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">Rating:</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-lg ${
                          i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}>
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">💬</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Feedback Yet</h3>
            <p className="text-gray-600">Mentor feedback will appear here as you progress through your internship.</p>
          </div>
        )}
      </div>

      {/* Monthly Learning Tracking */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{INTERN_PROFILE_CONFIG.monthlyProgress.title}</h2>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {Array.from({ length: 6 }, (_, i) => {
              const month = moment().subtract(i, 'months').format('YYYY-MM');
              return (
                <option key={month} value={month}>
                  {moment(month).format('MMMM YYYY')}
                </option>
              );
            })}
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-600 mb-1">{INTERN_PROFILE_CONFIG.monthlyProgress.stats.tasks}</h3>
            <div className="text-2xl font-bold text-blue-900">
              {monthlyData.filter(item => 
                moment(item.created_at).format('YYYY-MM') === selectedMonth
              ).length}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-600 mb-1">{INTERN_PROFILE_CONFIG.monthlyProgress.stats.completed}</h3>
            <div className="text-2xl font-bold text-green-900">
              {monthlyData.filter(item => 
                moment(item.created_at).format('YYYY-MM') === selectedMonth && 
                item.status === 'completed'
              ).length}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-600 mb-1">{INTERN_PROFILE_CONFIG.monthlyProgress.stats.avgScore}</h3>
            <div className="text-2xl font-bold text-purple-900">
              {(() => {
                const monthSubmissions = monthlyData.filter(item => 
                  moment(item.created_at).format('YYYY-MM') === selectedMonth
                );
                return monthSubmissions.length > 0 
                  ? Math.round(monthSubmissions.reduce((sum, item) => sum + (item.performance_score || 0), 0) / monthSubmissions.length)
                  : 0;
              })()}%
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-orange-600 mb-1">{INTERN_PROFILE_CONFIG.monthlyProgress.stats.hours}</h3>
            <div className="text-2xl font-bold text-orange-900">
              {monthlyData.filter(item => 
                moment(item.created_at).format('YYYY-MM') === selectedMonth
              ).reduce((sum, item) => sum + (item.learning_hours || 0), 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{INTERN_PROFILE_CONFIG.recentActivities.title}</h2>
        
        {monthlyData.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">{INTERN_PROFILE_CONFIG.recentActivities.emptyState.icon}</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{INTERN_PROFILE_CONFIG.recentActivities.emptyState.title}</h3>
            <p className="text-gray-600">{INTERN_PROFILE_CONFIG.recentActivities.emptyState.message}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{INTERN_PROFILE_CONFIG.recentActivities.tableHeaders.date}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{INTERN_PROFILE_CONFIG.recentActivities.tableHeaders.activity}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{INTERN_PROFILE_CONFIG.recentActivities.tableHeaders.hours}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{INTERN_PROFILE_CONFIG.recentActivities.tableHeaders.score}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{INTERN_PROFILE_CONFIG.recentActivities.tableHeaders.status}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyData.slice(0, 10).map((activity, index) => (
                  <tr key={activity.id || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {moment(activity.created_at).format('MMM DD, YYYY')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.submission_type || 'Learning Task'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.learning_hours || 0}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        (activity.performance_score || 0) >= 80 ? 'bg-green-100 text-green-800' :
                        (activity.performance_score || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {activity.performance_score || 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                        activity.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">{INTERN_PROFILE_CONFIG.editModal.title}</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{INTERN_PROFILE_CONFIG.editModal.labels.fullName}</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{INTERN_PROFILE_CONFIG.editModal.labels.phone}</label>
                  <input
                    type="tel"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{INTERN_PROFILE_CONFIG.editModal.labels.university}</label>
                  <input
                    type="text"
                    value={editFormData.university || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, university: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{INTERN_PROFILE_CONFIG.editModal.labels.major}</label>
                  <input
                    type="text"
                    value={editFormData.major || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, major: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{INTERN_PROFILE_CONFIG.editModal.labels.graduationYear}</label>
                <input
                  type="number"
                  value={editFormData.graduation_year || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, graduation_year: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="2020"
                  max="2030"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{INTERN_PROFILE_CONFIG.editModal.labels.interests}</label>
                <input
                  type="text"
                  value={editFormData.interests || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, interests: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={INTERN_PROFILE_CONFIG.editModal.placeholders.interests}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{INTERN_PROFILE_CONFIG.editModal.labels.learningObjectives}</label>
                <textarea
                  value={editFormData.learning_objectives || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, learning_objectives: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={INTERN_PROFILE_CONFIG.editModal.placeholders.learningObjectives}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{INTERN_PROFILE_CONFIG.editModal.labels.careerGoals}</label>
                <textarea
                  value={editFormData.career_goals || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, career_goals: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={INTERN_PROFILE_CONFIG.editModal.placeholders.careerGoals}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{INTERN_PROFILE_CONFIG.editModal.labels.bio}</label>
                <textarea
                  value={editFormData.bio || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={INTERN_PROFILE_CONFIG.editModal.placeholders.bio}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {INTERN_PROFILE_CONFIG.editModal.buttons.cancel}
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {INTERN_PROFILE_CONFIG.editModal.buttons.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Learning KPI Modal */}
      {showKPIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">{INTERN_PROFILE_CONFIG.kpiModal.title}</h3>
              <button
                onClick={() => setShowKPIModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Learning Development Section */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-4">{INTERN_PROFILE_CONFIG.kpiModal.sections.learningDevelopment}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {INTERN_PROFILE_CONFIG.kpiModal.labels.skillDevelopment}
                    </label>
                    <input
                      type="number"
                      value={learningKPIs.skill_development}
                      onChange={(e) => setLearningKPIs({...learningKPIs, skill_development: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {INTERN_PROFILE_CONFIG.kpiModal.labels.learningHours}
                    </label>
                    <input
                      type="number"
                      value={learningKPIs.learning_hours}
                      onChange={(e) => setLearningKPIs({...learningKPIs, learning_hours: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {INTERN_PROFILE_CONFIG.kpiModal.labels.goalCompletion}
                    </label>
                    <input
                      type="number"
                      value={learningKPIs.goal_completion}
                      onChange={(e) => setLearningKPIs({...learningKPIs, goal_completion: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {INTERN_PROFILE_CONFIG.kpiModal.labels.mentorRating}
                    </label>
                    <input
                      type="number"
                      value={learningKPIs.mentor_rating}
                      onChange={(e) => setLearningKPIs({...learningKPIs, mentor_rating: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              {/* Performance & Growth Section */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-4">{INTERN_PROFILE_CONFIG.kpiModal.sections.performanceGrowth}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {INTERN_PROFILE_CONFIG.kpiModal.labels.projectQuality}
                    </label>
                    <input
                      type="number"
                      value={learningKPIs.project_quality}
                      onChange={(e) => setLearningKPIs({...learningKPIs, project_quality: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {INTERN_PROFILE_CONFIG.kpiModal.labels.technicalGrowth}
                    </label>
                    <input
                      type="number"
                      value={learningKPIs.technical_growth}
                      onChange={(e) => setLearningKPIs({...learningKPIs, technical_growth: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {INTERN_PROFILE_CONFIG.kpiModal.labels.softSkills}
                    </label>
                    <input
                      type="number"
                      value={learningKPIs.soft_skills}
                      onChange={(e) => setLearningKPIs({...learningKPIs, soft_skills: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {INTERN_PROFILE_CONFIG.kpiModal.labels.initiativeScore}
                    </label>
                    <input
                      type="number"
                      value={learningKPIs.initiative_score}
                      onChange={(e) => setLearningKPIs({...learningKPIs, initiative_score: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Overall Score Display */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{INTERN_PROFILE_CONFIG.kpiModal.overallScore.title}</h3>
                  <p className="text-sm text-gray-600">{INTERN_PROFILE_CONFIG.kpiModal.overallScore.description}</p>
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(calculateLearningScore())}`}>
                  {calculateLearningScore()}%
                </div>
              </div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(calculateLearningScore())}`}
                  style={{ width: `${calculateLearningScore()}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowKPIModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {INTERN_PROFILE_CONFIG.kpiModal.buttons.cancel}
              </button>
              <button
                onClick={handleSaveLearningKPIs}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {INTERN_PROFILE_CONFIG.kpiModal.buttons.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternProfile;