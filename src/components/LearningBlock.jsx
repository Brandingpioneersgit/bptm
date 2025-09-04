import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useToast } from '@/shared/components/Toast';
import { useDataSync } from './DataSyncContext';

// Learning Block Component
export const LearningBlock = ({ 
  employeeId = null, 
  isManager = false,
  showProgress = true,
  showRecommendations = true,
  compact = false
}) => {
  const { user, role } = useUnifiedAuth();
  const { notify } = useToast();
  const { employees } = useDataSync();
  const [learningData, setLearningData] = useState({
    currentCourses: [],
    completedCourses: [],
    recommendations: [],
    skills: [],
    certifications: [],
    learningPath: null
  });
  const [selectedEmployee, setSelectedEmployee] = useState(employeeId || user?.id);
  const [activeTab, setActiveTab] = useState('current');
  const [loading, setLoading] = useState(false);

  // Learning categories
  const categories = [
    { id: 'technical', name: 'Technical Skills', icon: '💻', color: 'blue' },
    { id: 'soft-skills', name: 'Soft Skills', icon: '🤝', color: 'green' },
    { id: 'leadership', name: 'Leadership', icon: '👑', color: 'purple' },
    { id: 'marketing', name: 'Marketing', icon: '📈', color: 'orange' },
    { id: 'design', name: 'Design', icon: '🎨', color: 'pink' },
    { id: 'business', name: 'Business', icon: '💼', color: 'indigo' }
  ];

  // Sample learning data
  useEffect(() => {
    loadLearningData();
  }, [selectedEmployee]);

  const loadLearningData = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const sampleData = {
        currentCourses: [
          {
            id: 1,
            title: 'Advanced React Development',
            provider: 'Tech Academy',
            category: 'technical',
            progress: 65,
            duration: '8 weeks',
            deadline: '2024-03-15',
            instructor: 'John Smith',
            rating: 4.8,
            thumbnail: '💻',
            description: 'Master advanced React concepts including hooks, context, and performance optimization.'
          },
          {
            id: 2,
            title: 'Digital Marketing Fundamentals',
            provider: 'Marketing Pro',
            category: 'marketing',
            progress: 30,
            duration: '6 weeks',
            deadline: '2024-04-01',
            instructor: 'Sarah Johnson',
            rating: 4.6,
            thumbnail: '📈',
            description: 'Learn the basics of digital marketing including SEO, social media, and analytics.'
          },
          {
            id: 3,
            title: 'Team Leadership Skills',
            provider: 'Leadership Institute',
            category: 'leadership',
            progress: 80,
            duration: '4 weeks',
            deadline: '2024-02-28',
            instructor: 'Mike Wilson',
            rating: 4.9,
            thumbnail: '👑',
            description: 'Develop essential leadership skills for managing and motivating teams.'
          }
        ],
        completedCourses: [
          {
            id: 4,
            title: 'JavaScript ES6+ Mastery',
            provider: 'Code Academy',
            category: 'technical',
            completedDate: '2024-01-15',
            grade: 'A+',
            certificate: true,
            rating: 4.7,
            thumbnail: '⚡',
            skills: ['JavaScript', 'ES6', 'Async/Await', 'Modules']
          },
          {
            id: 5,
            title: 'Project Management Basics',
            provider: 'PM Institute',
            category: 'business',
            completedDate: '2023-12-20',
            grade: 'A',
            certificate: true,
            rating: 4.5,
            thumbnail: '📋',
            skills: ['Project Planning', 'Risk Management', 'Team Coordination']
          }
        ],
        recommendations: [
          {
            id: 6,
            title: 'Advanced SEO Strategies',
            provider: 'SEO Masters',
            category: 'marketing',
            duration: '5 weeks',
            rating: 4.8,
            price: '$199',
            thumbnail: '🔍',
            reason: 'Based on your role as SEO Specialist',
            skills: ['Technical SEO', 'Content Strategy', 'Analytics']
          },
          {
            id: 7,
            title: 'UI/UX Design Principles',
            provider: 'Design School',
            category: 'design',
            duration: '6 weeks',
            rating: 4.9,
            price: '$249',
            thumbnail: '🎨',
            reason: 'Recommended for your career growth',
            skills: ['User Research', 'Wireframing', 'Prototyping']
          }
        ],
        skills: [
          { name: 'JavaScript', level: 85, category: 'technical' },
          { name: 'React', level: 75, category: 'technical' },
          { name: 'SEO', level: 90, category: 'marketing' },
          { name: 'Team Leadership', level: 60, category: 'leadership' },
          { name: 'Project Management', level: 70, category: 'business' }
        ],
        certifications: [
          {
            id: 1,
            name: 'Google Analytics Certified',
            issuer: 'Google',
            date: '2024-01-10',
            expires: '2025-01-10',
            verified: true,
            thumbnail: '📊'
          },
          {
            id: 2,
            name: 'React Developer Certification',
            issuer: 'Meta',
            date: '2023-11-15',
            expires: '2025-11-15',
            verified: true,
            thumbnail: '⚛️'
          }
        ],
        learningPath: {
          title: 'Full-Stack Developer Path',
          progress: 45,
          totalCourses: 12,
          completedCourses: 5,
          estimatedCompletion: '6 months',
          nextMilestone: 'Backend Development Fundamentals'
        }
      };
      
      setLearningData(sampleData);
      setLoading(false);
    }, 500);
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSkillLevelColor = (level) => {
    if (level >= 80) return 'bg-green-100 text-green-800';
    if (level >= 60) return 'bg-blue-100 text-blue-800';
    if (level >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.color : 'gray';
  };

  const enrollInCourse = (courseId) => {
    notify({
      title: 'Enrollment Successful',
      message: 'You have been enrolled in the course',
      type: 'success'
    });
  };

  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);

  if (compact) {
    return (
      <div className="card-brand p-4">
        <h3 className="text-lg font-semibold text-brand-text mb-4 flex items-center space-x-2">
          <span>📚</span>
          <span>Learning Progress</span>
        </h3>
        
        <div className="space-y-3">
          {learningData.currentCourses.slice(0, 3).map(course => (
            <div key={course.id} className="flex items-center space-x-3">
              <span className="text-2xl">{course.thumbnail}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-brand-text">{course.title}</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className={`h-2 rounded-full ${getProgressColor(course.progress)}`}
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-sm text-brand-text-secondary">{course.progress}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-brand p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-brand-text flex items-center space-x-2">
              <span>📚</span>
              <span>Learning & Development</span>
            </h2>
            <p className="text-brand-text-secondary mt-1">
              Track progress and discover new learning opportunities
            </p>
          </div>
          
          {isManager && (
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.role}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Learning Path Progress */}
      {learningData.learningPath && (
        <div className="card-brand p-6">
          <h3 className="text-lg font-semibold text-brand-text mb-4 flex items-center space-x-2">
            <span>🛤️</span>
            <span>Learning Path</span>
          </h3>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-brand-text">{learningData.learningPath.title}</h4>
              <span className="text-sm text-brand-text-secondary">
                {learningData.learningPath.completedCourses}/{learningData.learningPath.totalCourses} courses
              </span>
            </div>
            
            <div className="w-full bg-white rounded-full h-3 mb-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${learningData.learningPath.progress}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-sm text-brand-text-secondary">
              <span>Next: {learningData.learningPath.nextMilestone}</span>
              <span>Est. completion: {learningData.learningPath.estimatedCompletion}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="card-brand p-6">
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'current', label: 'Current Courses', icon: '📖' },
            { id: 'completed', label: 'Completed', icon: '✅' },
            { id: 'recommendations', label: 'Recommendations', icon: '💡' },
            { id: 'skills', label: 'Skills', icon: '🎯' },
            { id: 'certifications', label: 'Certifications', icon: '🏆' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {/* Current Courses */}
            {activeTab === 'current' && (
              <div className="space-y-4">
                {learningData.currentCourses.map(course => (
                  <div key={course.id} className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-4">
                      <span className="text-3xl">{course.thumbnail}</span>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-brand-text">{course.title}</h4>
                            <p className="text-sm text-brand-text-secondary">
                              {course.provider} • {course.instructor}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm text-brand-text-secondary">Due: {new Date(course.deadline).toLocaleDateString()}</div>
                            <div className="flex items-center space-x-1 text-sm">
                              <span>⭐</span>
                              <span>{course.rating}</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-brand-text-secondary mb-3">{course.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{course.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getProgressColor(course.progress)}`}
                                style={{ width: `${course.progress}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <button className="btn-brand-primary px-4 py-2 text-sm">
                            Continue
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Completed Courses */}
            {activeTab === 'completed' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {learningData.completedCourses.map(course => (
                  <div key={course.id} className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{course.thumbnail}</span>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-brand-text">{course.title}</h4>
                        <p className="text-sm text-brand-text-secondary mb-2">
                          {course.provider} • Completed {new Date(course.completedDate).toLocaleDateString()}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Grade: {course.grade}
                            </span>
                            {course.certificate && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                📜 Certified
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-1 text-sm">
                            <span>⭐</span>
                            <span>{course.rating}</span>
                          </div>
                        </div>
                        
                        {course.skills && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {course.skills.map(skill => (
                                <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {activeTab === 'recommendations' && showRecommendations && (
              <div className="space-y-4">
                {learningData.recommendations.map(course => (
                  <div key={course.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-4">
                      <span className="text-3xl">{course.thumbnail}</span>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-brand-text">{course.title}</h4>
                            <p className="text-sm text-brand-text-secondary">
                              {course.provider} • {course.duration}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">{course.price}</div>
                            <div className="flex items-center space-x-1 text-sm">
                              <span>⭐</span>
                              <span>{course.rating}</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-blue-700 mb-2">💡 {course.reason}</p>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {course.skills.map(skill => (
                            <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                        
                        <button 
                          onClick={() => enrollInCourse(course.id)}
                          className="btn-brand-primary px-4 py-2 text-sm"
                        >
                          Enroll Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            {activeTab === 'skills' && (
              <div className="space-y-4">
                {categories.map(category => {
                  const categorySkills = learningData.skills.filter(skill => skill.category === category.id);
                  if (categorySkills.length === 0) return null;
                  
                  return (
                    <div key={category.id} className="bg-slate-50 p-4 rounded-lg">
                      <h4 className="font-medium text-brand-text mb-3 flex items-center space-x-2">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </h4>
                      
                      <div className="space-y-3">
                        {categorySkills.map(skill => (
                          <div key={skill.name} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-brand-text">{skill.name}</span>
                            
                            <div className="flex items-center space-x-3">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${getProgressColor(skill.level)}`}
                                  style={{ width: `${skill.level}%` }}
                                ></div>
                              </div>
                              
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                getSkillLevelColor(skill.level)
                              }`}>
                                {skill.level}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Certifications */}
            {activeTab === 'certifications' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {learningData.certifications.map(cert => (
                  <div key={cert.id} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{cert.thumbnail}</span>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-brand-text">{cert.name}</h4>
                        <p className="text-sm text-brand-text-secondary mb-2">
                          Issued by {cert.issuer}
                        </p>
                        
                        <div className="text-xs text-brand-text-secondary space-y-1">
                          <div>Issued: {new Date(cert.date).toLocaleDateString()}</div>
                          <div>Expires: {new Date(cert.expires).toLocaleDateString()}</div>
                        </div>
                        
                        {cert.verified && (
                          <div className="mt-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              ✅ Verified
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningBlock;