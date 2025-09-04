import { supabase } from '../lib/supabase';

/**
 * Workspace Service - Provides role-based workspace configurations
 * Manages personalized workspace links and content based on user permissions
 */
class WorkspaceService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get workspace configuration based on user role
   */
  async getWorkspaceConfig(userRole, userId) {
    const cacheKey = `workspace_${userRole}_${userId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const config = await this.generateWorkspaceConfig(userRole, userId);
      this.cache.set(cacheKey, {
        data: config,
        timestamp: Date.now()
      });
      return config;
    } catch (error) {
      console.error('Error fetching workspace config:', error);
      return this.getFallbackConfig(userRole);
    }
  }

  /**
   * Generate role-specific workspace configuration
   */
  async generateWorkspaceConfig(userRole, userId) {
    const baseConfig = {
      clientTracker: {
        title: 'Client Tracker',
        description: 'Track client projects and status',
        type: 'internal',
        path: '/client-directory',
        icon: '👥',
        permissions: ['read']
      },
      projectManagement: {
        title: 'Project Management',
        description: 'Manage ongoing projects',
        type: 'internal',
        path: '/projects',
        icon: '📋',
        permissions: ['read', 'write']
      }
    };

    // Role-specific workspace configurations
    switch (userRole) {
      case 'Super Admin':
        return {
          ...baseConfig,
          adminPanel: {
            title: 'Admin Panel',
            description: 'System administration',
            type: 'internal',
            path: '/admin',
            icon: '⚙️',
            permissions: ['read', 'write', 'delete']
          },
          userManagement: {
            title: 'User Management',
            description: 'Manage system users',
            type: 'internal',
            path: '/user-management',
            icon: '👤',
            permissions: ['read', 'write', 'delete']
          },
          systemReports: {
            title: 'System Reports',
            description: 'View system analytics',
            type: 'internal',
            path: '/reports',
            icon: '📊',
            permissions: ['read']
          },
          databaseAccess: {
            title: 'Database Access',
            description: 'Direct database management',
            type: 'external',
            url: 'https://supabase.com/dashboard',
            icon: '🗄️',
            permissions: ['read', 'write']
          }
        };

      case 'Operations Head':
        return {
          ...baseConfig,
          operationsDashboard: {
            title: 'Operations Dashboard',
            description: 'Monitor operations metrics',
            type: 'internal',
            path: '/operations-dashboard',
            icon: '📈',
            permissions: ['read', 'write']
          },
          teamManagement: {
            title: 'Team Management',
            description: 'Manage team assignments',
            type: 'internal',
            path: '/team-management',
            icon: '👥',
            permissions: ['read', 'write']
          },
          performanceReports: {
            title: 'Performance Reports',
            description: 'View team performance',
            type: 'internal',
            path: '/performance-reports',
            icon: '📊',
            permissions: ['read']
          }
        };

      case 'HR':
        return {
          ...baseConfig,
          hrDashboard: {
            title: 'HR Dashboard',
            description: 'Human resources management',
            type: 'internal',
            path: '/hr-dashboard',
            icon: '👨‍💼',
            permissions: ['read', 'write']
          },
          employeeRecords: {
            title: 'Employee Records',
            description: 'Manage employee information',
            type: 'internal',
            path: '/employee-records',
            icon: '📁',
            permissions: ['read', 'write']
          },
          recruitmentPortal: {
            title: 'Recruitment Portal',
            description: 'Manage hiring process',
            type: 'internal',
            path: '/recruitment',
            icon: '🎯',
            permissions: ['read', 'write']
          }
        };

      case 'Manager':
        return {
          ...baseConfig,
          teamDashboard: {
            title: 'Team Dashboard',
            description: 'Monitor team progress',
            type: 'internal',
            path: '/team-dashboard',
            icon: '👥',
            permissions: ['read', 'write']
          },
          projectReviews: {
            title: 'Project Reviews',
            description: 'Review team submissions',
            type: 'internal',
            path: '/project-reviews',
            icon: '✅',
            permissions: ['read', 'write']
          }
        };

      case 'SEO':
        return {
          ...baseConfig,
          seoTools: {
            title: 'SEO Tools',
            description: 'SEO analysis and tracking',
            type: 'external',
            url: 'https://ahrefs.com',
            icon: '🔍',
            permissions: ['read']
          },
          keywordTracker: {
            title: 'Keyword Tracker',
            description: 'Track keyword rankings',
            type: 'internal',
            path: '/seo-dashboard',
            icon: '📈',
            permissions: ['read', 'write']
          },
          contentPlanner: {
            title: 'Content Planner',
            description: 'Plan SEO content',
            type: 'internal',
            path: '/content-planner',
            icon: '📝',
            permissions: ['read', 'write']
          }
        };

      case 'Ads':
        return {
          ...baseConfig,
          adsPlatforms: {
            title: 'Ads Platforms',
            description: 'Manage advertising campaigns',
            type: 'external',
            url: 'https://ads.google.com',
            icon: '🎯',
            permissions: ['read', 'write']
          },
          campaignTracker: {
            title: 'Campaign Tracker',
            description: 'Track ad performance',
            type: 'internal',
            path: '/ads-dashboard',
            icon: '📊',
            permissions: ['read', 'write']
          },
          budgetManager: {
            title: 'Budget Manager',
            description: 'Manage ad budgets',
            type: 'internal',
            path: '/budget-manager',
            icon: '💰',
            permissions: ['read', 'write']
          }
        };

      case 'Social Media':
        return {
          ...baseConfig,
          socialPlatforms: {
            title: 'Social Platforms',
            description: 'Manage social media accounts',
            type: 'external',
            url: 'https://business.facebook.com',
            icon: '📱',
            permissions: ['read', 'write']
          },
          contentCalendar: {
            title: 'Content Calendar',
            description: 'Plan social media content',
            type: 'internal',
            path: '/social-dashboard',
            icon: '📅',
            permissions: ['read', 'write']
          },
          analyticsHub: {
            title: 'Analytics Hub',
            description: 'Social media analytics',
            type: 'internal',
            path: '/social-analytics',
            icon: '📈',
            permissions: ['read']
          }
        };

      case 'Web Developer':
        return {
          ...baseConfig,
          codeRepository: {
            title: 'Code Repository',
            description: 'Access code repositories',
            type: 'external',
            url: 'https://github.com',
            icon: '💻',
            permissions: ['read', 'write']
          },
          deploymentTools: {
            title: 'Deployment Tools',
            description: 'Manage deployments',
            type: 'external',
            url: 'https://vercel.com',
            icon: '🚀',
            permissions: ['read', 'write']
          },
          devDashboard: {
            title: 'Dev Dashboard',
            description: 'Development metrics',
            type: 'internal',
            path: '/dev-dashboard',
            icon: '⚡',
            permissions: ['read', 'write']
          }
        };

      case 'Graphic Designer':
        return {
          ...baseConfig,
          designTools: {
            title: 'Design Tools',
            description: 'Access design software',
            type: 'external',
            url: 'https://figma.com',
            icon: '🎨',
            permissions: ['read', 'write']
          },
          assetLibrary: {
            title: 'Asset Library',
            description: 'Manage design assets',
            type: 'internal',
            path: '/design-assets',
            icon: '🖼️',
            permissions: ['read', 'write']
          },
          designDashboard: {
            title: 'Design Dashboard',
            description: 'Track design projects',
            type: 'internal',
            path: '/design-dashboard',
            icon: '📐',
            permissions: ['read', 'write']
          }
        };

      case 'Freelancer':
        return {
          projectAssignments: {
            title: 'Project Assignments',
            description: 'View assigned projects',
            type: 'internal',
            path: '/freelancer-projects',
            icon: '📋',
            permissions: ['read']
          },
          timeTracker: {
            title: 'Time Tracker',
            description: 'Track work hours',
            type: 'internal',
            path: '/time-tracker',
            icon: '⏰',
            permissions: ['read', 'write']
          },
          invoicePortal: {
            title: 'Invoice Portal',
            description: 'Manage invoices',
            type: 'internal',
            path: '/invoices',
            icon: '💰',
            permissions: ['read', 'write']
          }
        };

      case 'Intern':
        return {
          learningPath: {
            title: 'Learning Path',
            description: 'Track learning progress',
            type: 'internal',
            path: '/intern-dashboard',
            icon: '📚',
            permissions: ['read', 'write']
          },
          mentorConnect: {
            title: 'Mentor Connect',
            description: 'Connect with mentors',
            type: 'internal',
            path: '/mentor-connect',
            icon: '👨‍🏫',
            permissions: ['read']
          },
          skillAssessment: {
            title: 'Skill Assessment',
            description: 'Take skill assessments',
            type: 'internal',
            path: '/skill-assessment',
            icon: '🎯',
            permissions: ['read', 'write']
          }
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Get fallback configuration for unknown roles
   */
  getFallbackConfig(userRole) {
    return {
      dashboard: {
        title: 'Dashboard',
        description: 'Your personal dashboard',
        type: 'internal',
        path: '/dashboard',
        icon: '📊',
        permissions: ['read']
      },
      profile: {
        title: 'Profile',
        description: 'Manage your profile',
        type: 'internal',
        path: '/profile',
        icon: '👤',
        permissions: ['read', 'write']
      }
    };
  }

  /**
   * Check if user has permission for a workspace
   */
  hasPermission(workspace, requiredPermission) {
    return workspace.permissions && workspace.permissions.includes(requiredPermission);
  }

  /**
   * Get workspace analytics
   */
  async getWorkspaceAnalytics(userId) {
    try {
      const { data, error } = await supabase
        .from('workspace_usage')
        .select('*')
        .eq('user_id', userId)
        .order('accessed_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching workspace analytics:', error);
      return [];
    }
  }

  /**
   * Track workspace access
   */
  async trackWorkspaceAccess(userId, workspaceName, workspaceType) {
    try {
      const { error } = await supabase
        .from('workspace_usage')
        .insert({
          user_id: userId,
          workspace_name: workspaceName,
          workspace_type: workspaceType,
          accessed_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking workspace access:', error);
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export const workspaceService = new WorkspaceService();
export default workspaceService;