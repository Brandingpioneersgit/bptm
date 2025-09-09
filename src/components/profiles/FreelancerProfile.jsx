import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import moment from 'moment';

const FreelancerProfile = ({ 
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
  
  const [freelancerData, setFreelancerData] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [earnings, setEarnings] = useState([]);
  
  // Freelancer KPI State Variables
  const [freelancerKPIs, setFreelancerKPIs] = useState({
    client_satisfaction: 0,
    project_delivery: 0,
    quality_score: 0,
    communication_rating: 0,
    deadline_adherence: 0,
    technical_skills: 0,
    creativity_score: 0,
    earnings_growth: 0
  });
  const [showKPIModal, setShowKPIModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [clientFeedback, setClientFeedback] = useState([]);

  // Fetch freelancer-specific data
  useEffect(() => {
    const fetchFreelancerData = async () => {
      try {
        setLoading(true);
        
        // Calculate freelancer metrics
        const currentMonthData = monthlyData.filter(item => 
          moment(item.created_at).format('YYYY-MM') === moment().format('YYYY-MM')
        );
        
        const totalEarnings = currentMonthData.reduce((sum, item) => 
          sum + (item.earnings || 0), 0
        );
        
        const avgRating = currentMonthData.length > 0 
          ? Math.round((currentMonthData.reduce((sum, item) => sum + (item.client_rating || 0), 0) / currentMonthData.length) * 10) / 10
          : 0;
        
        // Fetch active projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('freelancer_projects')
          .select('*')
          .eq('freelancer_id', profileData?.user_id)
          .in('status', ['active', 'pending'])
          .order('created_at', { ascending: false });
          
        if (projectsError && projectsError.code !== 'PGRST116') {
          console.error('Error fetching projects:', projectsError);
        }
        
        // Fetch earnings history
        const { data: earningsData, error: earningsError } = await supabase
          .from('freelancer_earnings')
          .select('*')
          .eq('freelancer_id', profileData?.user_id)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (earningsError && earningsError.code !== 'PGRST116') {
          console.error('Error fetching earnings:', earningsError);
        }
        
        setFreelancerData({
          totalEarnings: totalEarnings,
          avgRating: avgRating,
          completedProjects: currentMonthData.filter(item => item.status === 'completed').length,
          activeProjects: (projectsData || []).filter(p => p.status === 'active').length,
          totalProjects: currentMonthData.length,
          onTimeDelivery: currentMonthData.length > 0 
            ? Math.round((currentMonthData.filter(item => item.delivered_on_time).length / currentMonthData.length) * 100)
            : 0
        });
        
        setProjects(projectsData || []);
        setEarnings(earningsData || []);
        
        // Fetch freelancer KPIs
        const { data: kpiData, error: kpiError } = await supabase
          .from('freelancer_kpis')
          .select('*')
          .eq('freelancer_id', profileData?.user_id)
          .single();
          
        if (kpiData && !kpiError) {
          setFreelancerKPIs({
            client_satisfaction: kpiData.client_satisfaction || 0,
            project_delivery: kpiData.project_delivery || 0,
            quality_score: kpiData.quality_score || 0,
            communication_rating: kpiData.communication_rating || 0,
            deadline_adherence: kpiData.deadline_adherence || 0,
            technical_skills: kpiData.technical_skills || 0,
            creativity_score: kpiData.creativity_score || 0,
            earnings_growth: kpiData.earnings_growth || 0
          });
        }
        
        // Fetch client feedback
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('client_feedback')
          .select('*')
          .eq('freelancer_id', profileData?.user_id)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (feedbackData && !feedbackError) {
          setClientFeedback(feedbackData);
        }
        
      } catch (error) {
        console.error('Error fetching freelancer data:', error);
        showToast('Failed to load freelancer data', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFreelancerData();
  }, [supabase, showToast, monthlyData, profileData?.user_id]);

  const handleEditProfile = () => {
    setEditFormData({
      name: profileData?.name || '',
      email: profileData?.email || '',
      phone: profileData?.phone || '',
      location: profileData?.location || '',
      bio: profileData?.bio || '',
      skills: profileData?.skills || [],
      hourly_rate: profileData?.hourly_rate || '',
      portfolio_url: profileData?.portfolio_url || '',
      linkedin_url: profileData?.linkedin_url || '',
      specializations: profileData?.specializations || [],
      availability: profileData?.availability || 'full-time'
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

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-lg ${
        i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
      }`}>
        ⭐
      </span>
    ));
  };

  const getAvailabilityColor = () => {
    switch (profileData?.availability) {
      case 'full-time': return 'bg-green-100 text-green-800';
      case 'part-time': return 'bg-blue-100 text-blue-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Freelancer KPI Management Functions
  const handleSaveFreelancerKPIs = async () => {
    try {
      const { error } = await supabase
        .from('freelancer_kpis')
        .upsert({
          freelancer_id: profileData?.user_id,
          client_satisfaction: freelancerKPIs.client_satisfaction,
          project_delivery: freelancerKPIs.project_delivery,
          quality_score: freelancerKPIs.quality_score,
          communication_rating: freelancerKPIs.communication_rating,
          deadline_adherence: freelancerKPIs.deadline_adherence,
          technical_skills: freelancerKPIs.technical_skills,
          creativity_score: freelancerKPIs.creativity_score,
          earnings_growth: freelancerKPIs.earnings_growth,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setShowKPIModal(false);
      showToast('Freelancer KPIs updated successfully', 'success');
    } catch (error) {
      console.error('Error saving freelancer KPIs:', error);
      showToast('Failed to update KPIs', 'error');
    }
  };

  const calculateFreelancerScore = () => {
    const values = Object.values(freelancerKPIs);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
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

  // Show loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner size="large" showText={true} text="Loading freelancer profile data..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Completion Alert */}
      {profileCompletion < 90 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-yellow-600 mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Complete Your Freelancer Profile ({profileCompletion}%)
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                A complete profile helps clients find and trust your services.
              </p>
            </div>
            <button
              onClick={handleEditProfile}
              className="ml-auto bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
            >
              Complete Now
            </button>
          </div>
        </div>
      )}

      {/* Freelancer Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Earnings</h3>
              <div className="text-3xl font-bold">${freelancerData.totalEarnings || 0}</div>
              <p className="text-green-100 text-sm">This month</p>
            </div>
            <div className="text-4xl opacity-80">💰</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Rating</h3>
              <div className="text-3xl font-bold">{freelancerData.avgRating || 0}/5</div>
              <p className="text-blue-100 text-sm">Average rating</p>
            </div>
            <div className="text-4xl opacity-80">⭐</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Projects</h3>
              <div className="text-3xl font-bold">{freelancerData.activeProjects || 0}</div>
              <p className="text-purple-100 text-sm">Active projects</p>
            </div>
            <div className="text-4xl opacity-80">📊</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">On-Time</h3>
              <div className="text-3xl font-bold">{freelancerData.onTimeDelivery || 0}%</div>
              <p className="text-orange-100 text-sm">Delivery rate</p>
            </div>
            <div className="text-4xl opacity-80">⏰</div>
          </div>
        </div>
      </div>

      {/* Freelancer KPI Dashboard */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Freelancer Performance Dashboard</h2>
            <p className="text-gray-600 text-sm">Track your project-based KPIs and client satisfaction</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Overall Score</div>
              <div className={`text-2xl font-bold ${getScoreColor(calculateFreelancerScore())}`}>
                {calculateFreelancerScore()}%
              </div>
            </div>
            <button
              onClick={() => setShowKPIModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update KPIs
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Project Overview', icon: '📊' },
              { id: 'performance', label: 'Performance Metrics', icon: '🎯' },
              { id: 'feedback', label: 'Client Feedback', icon: '💬' },
              { id: 'earnings', label: 'Earnings Analytics', icon: '💰' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
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
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Client Satisfaction', value: freelancerKPIs.client_satisfaction, color: 'blue' },
              { label: 'Project Delivery', value: freelancerKPIs.project_delivery, color: 'green' },
              { label: 'Quality Score', value: freelancerKPIs.quality_score, color: 'purple' },
              { label: 'Communication', value: freelancerKPIs.communication_rating, color: 'orange' }
            ].map((kpi, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{kpi.label}</span>
                  <span className={`text-lg font-bold text-${kpi.color}-600`}>{kpi.value}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-${kpi.color}-500 transition-all duration-300`}
                    style={{ width: `${kpi.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'performance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Deadline Adherence', value: freelancerKPIs.deadline_adherence, color: 'red' },
              { label: 'Technical Skills', value: freelancerKPIs.technical_skills, color: 'indigo' },
              { label: 'Creativity Score', value: freelancerKPIs.creativity_score, color: 'pink' },
              { label: 'Earnings Growth', value: freelancerKPIs.earnings_growth, color: 'yellow' }
            ].map((kpi, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{kpi.label}</span>
                  <span className={`text-lg font-bold text-${kpi.color}-600`}>{kpi.value}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-${kpi.color}-500 transition-all duration-300`}
                    style={{ width: `${kpi.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'feedback' && (
          <div className="space-y-4">
            {clientFeedback.length > 0 ? (
              clientFeedback.map((feedback, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">{feedback.client_name}</div>
                    <div className="flex items-center">
                      {getRatingStars(feedback.rating)}
                      <span className="ml-2 text-sm text-gray-600">({feedback.rating}/5)</span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mb-2">{feedback.comment}</p>
                  <div className="text-xs text-gray-500">
                    Project: {feedback.project_title} • {moment(feedback.created_at).format('MMM DD, YYYY')}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">💬</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Client Feedback</h3>
                <p className="text-gray-600">Client feedback will appear here as you complete projects.</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'earnings' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">💰 Total Earnings</h3>
              <div className="text-2xl font-bold text-green-600">${freelancerData.totalEarnings || 0}</div>
              <p className="text-green-700 text-sm">This month</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">📈 Growth Rate</h3>
              <div className="text-2xl font-bold text-blue-600">{freelancerKPIs.earnings_growth}%</div>
              <p className="text-blue-700 text-sm">Month over month</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">⏱️ Hourly Rate</h3>
              <div className="text-2xl font-bold text-purple-600">${profileData?.hourly_rate || 0}</div>
              <p className="text-purple-700 text-sm">Per hour</p>
            </div>
          </div>
        )}
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Professional Profile</h2>
          <button
            onClick={handleEditProfile}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Profile
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="text-gray-900">{profileData?.name || 'Not provided'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="text-gray-900">{profileData?.email || 'Not provided'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <div className="text-gray-900">{profileData?.phone || 'Not provided'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <div className="text-gray-900">{profileData?.location || 'Not provided'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate</label>
            <div className="text-gray-900">${profileData?.hourly_rate || 'Not set'}/hour</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAvailabilityColor()}`}>
              {profileData?.availability || 'Not specified'}
            </span>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <div className="text-gray-900">{profileData?.bio || 'No bio provided'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio</label>
            <div className="text-gray-900">
              {profileData?.portfolio_url ? (
                <a href={profileData.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                  View Portfolio
                </a>
              ) : (
                'Not provided'
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
            <div className="text-gray-900">
              {profileData?.linkedin_url ? (
                <a href={profileData.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                  View LinkedIn
                </a>
              ) : (
                'Not provided'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skills & Specializations */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Skills & Specializations</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Core Skills</h3>
            {profileData?.skills && profileData.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No skills listed</p>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Specializations</h3>
            {profileData?.specializations && profileData.specializations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profileData.specializations.map((spec, index) => (
                  <span
                    key={index}
                    className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No specializations listed</p>
            )}
          </div>
        </div>
        
        {(!profileData?.skills || profileData.skills.length === 0) && 
         (!profileData?.specializations || profileData.specializations.length === 0) && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Skills Listed</h3>
            <p className="text-gray-600 mb-4">Add your skills and specializations to attract clients.</p>
            <button
              onClick={handleEditProfile}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Skills
            </button>
          </div>
        )}
      </div>

      {/* Active Projects */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Active Projects</h2>
        
        {projects.length > 0 ? (
          <div className="space-y-4">
            {projects.slice(0, 5).map((project, index) => (
              <div key={project.id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{project.title}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    project.status === 'active' ? 'bg-green-100 text-green-800' :
                    project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">{project.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Client: {project.client_name}</span>
                  <span>Due: {moment(project.deadline).format('MMM DD, YYYY')}</span>
                  <span>Budget: ${project.budget}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Projects</h3>
            <p className="text-gray-600">Your active projects will appear here.</p>
          </div>
        )}
      </div>

      {/* Earnings History */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Earnings History</h2>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const month = moment().subtract(i, 'months').format('YYYY-MM');
              return (
                <option key={month} value={month}>
                  {moment(month).format('MMMM YYYY')}
                </option>
              );
            })}
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-600 mb-1">Total Earned</h3>
            <div className="text-2xl font-bold text-green-900">
              ${earnings.filter(item => 
                moment(item.created_at).format('YYYY-MM') === selectedMonth
              ).reduce((sum, item) => sum + (item.amount || 0), 0)}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-600 mb-1">Projects</h3>
            <div className="text-2xl font-bold text-blue-900">
              {monthlyData.filter(item => 
                moment(item.created_at).format('YYYY-MM') === selectedMonth
              ).length}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-600 mb-1">Avg Rating</h3>
            <div className="text-2xl font-bold text-purple-900">
              {(() => {
                const monthSubmissions = monthlyData.filter(item => 
                  moment(item.created_at).format('YYYY-MM') === selectedMonth
                );
                return monthSubmissions.length > 0 
                  ? Math.round((monthSubmissions.reduce((sum, item) => sum + (item.client_rating || 0), 0) / monthSubmissions.length) * 10) / 10
                  : 0;
              })()}/5
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-orange-600 mb-1">On-Time</h3>
            <div className="text-2xl font-bold text-orange-900">
              {(() => {
                const monthSubmissions = monthlyData.filter(item => 
                  moment(item.created_at).format('YYYY-MM') === selectedMonth
                );
                return monthSubmissions.length > 0 
                  ? Math.round((monthSubmissions.filter(item => item.delivered_on_time).length / monthSubmissions.length) * 100)
                  : 0;
              })()}%
            </div>
          </div>
        </div>
        
        {earnings.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">💰</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Earnings Yet</h3>
            <p className="text-gray-600">Your earnings history will appear here once you complete projects.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {earnings.slice(0, 10).map((earning, index) => (
                  <tr key={earning.id || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {moment(earning.created_at).format('MMM DD, YYYY')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {earning.project_title || 'Project'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {earning.client_name || 'Client'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ${earning.amount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRatingStars(earning.client_rating || 0)}
                        <span className="ml-2 text-sm text-gray-600">
                          {earning.client_rating || 0}/5
                        </span>
                      </div>
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
              <h3 className="text-xl font-semibold text-gray-900">Edit Freelancer Profile</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editFormData.location || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                  <input
                    type="number"
                    value={editFormData.hourly_rate || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                <select
                  value={editFormData.availability || 'full-time'}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, availability: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio URL</label>
                  <input
                    type="url"
                    value={editFormData.portfolio_url || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, portfolio_url: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://your-portfolio.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={editFormData.linkedin_url || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={editFormData.bio || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell clients about your experience and expertise..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Freelancer KPI Modal */}
      {showKPIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Update Freelancer KPIs</h3>
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
              {/* Client & Project Section */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-4">🎯 Client & Project Metrics</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client Satisfaction (%)
                    </label>
                    <input
                      type="number"
                      value={freelancerKPIs.client_satisfaction}
                      onChange={(e) => setFreelancerKPIs({...freelancerKPIs, client_satisfaction: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Delivery (%)
                    </label>
                    <input
                      type="number"
                      value={freelancerKPIs.project_delivery}
                      onChange={(e) => setFreelancerKPIs({...freelancerKPIs, project_delivery: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quality Score (%)
                    </label>
                    <input
                      type="number"
                      value={freelancerKPIs.quality_score}
                      onChange={(e) => setFreelancerKPIs({...freelancerKPIs, quality_score: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Communication Rating (%)
                    </label>
                    <input
                      type="number"
                      value={freelancerKPIs.communication_rating}
                      onChange={(e) => setFreelancerKPIs({...freelancerKPIs, communication_rating: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              {/* Performance & Skills Section */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-4">🚀 Performance & Skills</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline Adherence (%)
                    </label>
                    <input
                      type="number"
                      value={freelancerKPIs.deadline_adherence}
                      onChange={(e) => setFreelancerKPIs({...freelancerKPIs, deadline_adherence: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Technical Skills (%)
                    </label>
                    <input
                      type="number"
                      value={freelancerKPIs.technical_skills}
                      onChange={(e) => setFreelancerKPIs({...freelancerKPIs, technical_skills: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Creativity Score (%)
                    </label>
                    <input
                      type="number"
                      value={freelancerKPIs.creativity_score}
                      onChange={(e) => setFreelancerKPIs({...freelancerKPIs, creativity_score: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Earnings Growth (%)
                    </label>
                    <input
                      type="number"
                      value={freelancerKPIs.earnings_growth}
                      onChange={(e) => setFreelancerKPIs({...freelancerKPIs, earnings_growth: parseInt(e.target.value) || 0})}
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
                  <h3 className="font-semibold text-gray-900">Overall Freelancer Score</h3>
                  <p className="text-sm text-gray-600">Based on all project-based KPIs</p>
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(calculateFreelancerScore())}`}>
                  {calculateFreelancerScore()}%
                </div>
              </div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(calculateFreelancerScore())}`}
                  style={{ width: `${calculateFreelancerScore()}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowKPIModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFreelancerKPIs}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save KPIs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreelancerProfile;