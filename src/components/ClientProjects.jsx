import React, { useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { LoadingSpinner } from '@/shared/components/LoadingStates';

const ClientProjects = () => {
  const { supabase } = useSupabase();
  const { showToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from client_projects table first
      let { data: projectsData, error: projectsError } = await supabase
        .from('client_projects')
        .select(`
          *,
          clients:client_id (
            id,
            company_name,
            contact_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.log('client_projects table not found, using mock data');
        // Fallback to mock data if table doesn't exist
        projectsData = generateMockProjects();
      }

      setProjects(projectsData || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
      // Use mock data as fallback
      setProjects(generateMockProjects());
    } finally {
      setLoading(false);
    }
  };

  const generateMockProjects = () => {
    return [
      {
        id: 1,
        project_name: 'E-commerce Website Redesign',
        description: 'Complete redesign of online store with modern UI/UX',
        status: 'in_progress',
        priority: 'high',
        start_date: '2024-01-15',
        end_date: '2024-03-15',
        progress: 65,
        budget: 50000,
        platform: 'Shopify',
        clients: {
          company_name: 'TechCorp Solutions',
          contact_name: 'John Smith',
          email: 'john@techcorp.com'
        }
      },
      {
        id: 2,
        project_name: 'Corporate Portfolio Site',
        description: 'Professional portfolio website for startup company',
        status: 'completed',
        priority: 'medium',
        start_date: '2023-12-01',
        end_date: '2024-01-20',
        progress: 100,
        budget: 25000,
        platform: 'WordPress',
        clients: {
          company_name: 'StartupXYZ',
          contact_name: 'Sarah Johnson',
          email: 'sarah@startupxyz.com'
        }
      },
      {
        id: 3,
        project_name: 'Custom Web Application',
        description: 'Custom dashboard and reporting system',
        status: 'in_progress',
        priority: 'high',
        start_date: '2023-11-15',
        end_date: '2024-02-28',
        progress: 80,
        budget: 75000,
        platform: 'React + Node.js',
        clients: {
          company_name: 'FinanceInc',
          contact_name: 'Michael Brown',
          email: 'michael@financeinc.com'
        }
      },
      {
        id: 4,
        project_name: 'Mobile App Development',
        description: 'Cross-platform mobile application',
        status: 'planning',
        priority: 'medium',
        start_date: '2024-02-01',
        end_date: '2024-05-01',
        progress: 15,
        budget: 60000,
        platform: 'React Native',
        clients: {
          company_name: 'MobileFirst Ltd',
          contact_name: 'Emily Davis',
          email: 'emily@mobilefirst.com'
        }
      }
    ];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'on_hold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredProjects = projects.filter(project => {
    if (selectedFilter === 'all') return true;
    return project.status === selectedFilter;
  });

  const handleViewProject = (projectId) => {
    showToast(`Viewing project ${projectId}`, 'info');
    // Navigate to project detail view
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="lg" showText text="Loading projects..." />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">📁</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Client Projects</h3>
            <p className="text-xs text-gray-600">Active and recent client projects</p>
          </div>
        </div>
        
        {/* Filter Dropdown */}
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Projects</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="planning">Planning</option>
          <option value="on_hold">On Hold</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📂</div>
            <p className="text-gray-500">No projects found</p>
            <p className="text-xs text-gray-400 mt-1">
              {selectedFilter === 'all' ? 'No projects available' : `No ${selectedFilter.replace('_', ' ')} projects`}
            </p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">{project.project_name}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                      {project.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`text-xs font-medium ${getPriorityColor(project.priority)}`}>
                      {project.priority?.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                    <div>
                      <span className="font-medium">Client:</span> {project.clients?.company_name || 'Unknown'}
                    </div>
                    <div>
                      <span className="font-medium">Platform:</span> {project.platform || 'Not specified'}
                    </div>
                    <div>
                      <span className="font-medium">Start Date:</span> {new Date(project.start_date).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">End Date:</span> {new Date(project.end_date).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">Progress</span>
                      <span className="text-xs text-gray-500">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="ml-4 flex flex-col space-y-2">
                  <button
                    onClick={() => handleViewProject(project.id)}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                  {project.budget && (
                    <div className="text-xs text-gray-500 text-center">
                      Budget: ${project.budget.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {filteredProjects.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Showing {filteredProjects.length} of {projects.length} projects</span>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              View All Projects →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProjects;