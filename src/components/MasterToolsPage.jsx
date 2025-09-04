import React, { useState } from 'react';
import { useUnifiedAuth } from '@/shared/hooks/useUnifiedAuth';
import { useToast } from '@/shared/hooks/useToast';

// Master Tools Page Component
const MasterToolsPage = ({ onNavigateToDashboard }) => {
  const { user, role } = useUnifiedAuth();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState('productivity');

  // Tool categories and tools
  const toolCategories = {
    productivity: {
      name: 'Productivity Tools',
      icon: '⚡',
      tools: [
        {
          name: 'Task Manager',
          description: 'Manage your daily tasks and projects',
          icon: '📋',
          url: '#',
          category: 'Internal'
        },
        {
          name: 'Time Tracker',
          description: 'Track time spent on different activities',
          icon: '⏰',
          url: '#',
          category: 'Internal'
        },
        {
          name: 'Calendar Integration',
          description: 'Sync with Google Calendar and other services',
          icon: '📅',
          url: '#',
          category: 'Integration'
        },
        {
          name: 'Note Taking',
          description: 'Quick notes and documentation',
          icon: '📝',
          url: '#',
          category: 'Internal'
        }
      ]
    },
    marketing: {
      name: 'Marketing Tools',
      icon: '📈',
      tools: [
        {
          name: 'Google Analytics',
          description: 'Website analytics and insights',
          icon: '📊',
          url: 'https://analytics.google.com',
          category: 'External'
        },
        {
          name: 'Google Search Console',
          description: 'Monitor website search performance',
          icon: '🔍',
          url: 'https://search.google.com/search-console',
          category: 'External'
        },
        {
          name: 'Facebook Ads Manager',
          description: 'Manage Facebook and Instagram ads',
          icon: '📱',
          url: 'https://business.facebook.com/adsmanager',
          category: 'External'
        },
        {
          name: 'Google Ads',
          description: 'Manage Google advertising campaigns',
          icon: '🎯',
          url: 'https://ads.google.com',
          category: 'External'
        }
      ]
    },
    design: {
      name: 'Design Tools',
      icon: '🎨',
      tools: [
        {
          name: 'Canva',
          description: 'Create graphics and designs',
          icon: '🖼️',
          url: 'https://canva.com',
          category: 'External'
        },
        {
          name: 'Figma',
          description: 'Collaborative design tool',
          icon: '🎭',
          url: 'https://figma.com',
          category: 'External'
        },
        {
          name: 'Adobe Creative Suite',
          description: 'Professional design software',
          icon: '🎪',
          url: 'https://adobe.com',
          category: 'External'
        },
        {
          name: 'Unsplash',
          description: 'Free high-quality images',
          icon: '📸',
          url: 'https://unsplash.com',
          category: 'External'
        }
      ]
    },
    development: {
      name: 'Development Tools',
      icon: '💻',
      tools: [
        {
          name: 'GitHub',
          description: 'Code repository and collaboration',
          icon: '🐙',
          url: 'https://github.com',
          category: 'External'
        },
        {
          name: 'VS Code',
          description: 'Code editor and IDE',
          icon: '⚙️',
          url: 'https://code.visualstudio.com',
          category: 'External'
        },
        {
          name: 'Netlify',
          description: 'Web hosting and deployment',
          icon: '🌐',
          url: 'https://netlify.com',
          category: 'External'
        },
        {
          name: 'Supabase',
          description: 'Backend as a service',
          icon: '🗄️',
          url: 'https://supabase.com',
          category: 'External'
        }
      ]
    },
    communication: {
      name: 'Communication Tools',
      icon: '💬',
      tools: [
        {
          name: 'Slack',
          description: 'Team communication and collaboration',
          icon: '💼',
          url: 'https://slack.com',
          category: 'External'
        },
        {
          name: 'Zoom',
          description: 'Video conferencing and meetings',
          icon: '📹',
          url: 'https://zoom.us',
          category: 'External'
        },
        {
          name: 'Email Templates',
          description: 'Pre-designed email templates',
          icon: '📧',
          url: '#',
          category: 'Internal'
        },
        {
          name: 'WhatsApp Business',
          description: 'Business messaging platform',
          icon: '📱',
          url: 'https://business.whatsapp.com',
          category: 'External'
        }
      ]
    }
  };

  const handleToolClick = (tool) => {
    if (tool.category === 'External' && tool.url !== '#') {
      window.open(tool.url, '_blank');
      toast({
        title: `Opening ${tool.name}`,
        description: 'Tool opened in new tab',
        variant: 'default'
      });
    } else if (tool.category === 'Internal') {
      toast({
        title: `${tool.name} - Coming Soon`,
        description: 'This internal tool is under development',
        variant: 'default'
      });
    }
  };

  const currentTools = toolCategories[activeCategory]?.tools || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-brand p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-brand-text">Master Tools</h2>
            <p className="text-brand-text-secondary mt-1">
              Access all your essential tools in one place
            </p>
          </div>
          <button
            onClick={() => onNavigateToDashboard?.('agency')}
            className="btn-brand-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="card-brand p-6">
        <div className="flex flex-wrap gap-2">
          {Object.entries(toolCategories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                activeCategory === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="card-brand p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-brand-text flex items-center">
            <span className="mr-2 text-2xl">{toolCategories[activeCategory]?.icon}</span>
            {toolCategories[activeCategory]?.name}
          </h3>
          <p className="text-brand-text-secondary mt-1">
            {currentTools.length} tools available
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentTools.map((tool, index) => (
            <div
              key={index}
              onClick={() => handleToolClick(tool)}
              className="bg-slate-50 dark:bg-slate-700 p-6 rounded-lg cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border border-slate-200 dark:border-slate-600"
            >
              <div className="text-center">
                <div className="text-4xl mb-3">{tool.icon}</div>
                <h4 className="font-semibold text-brand-text mb-2">{tool.name}</h4>
                <p className="text-sm text-brand-text-secondary mb-3">
                  {tool.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tool.category === 'External'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {tool.category}
                  </span>
                  {tool.category === 'External' && tool.url !== '#' && (
                    <span className="text-xs text-brand-text-secondary">🔗 External</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(toolCategories).map(([key, category]) => (
          <div key={key} className="card-brand p-6 text-center">
            <div className="text-2xl mb-2">{category.icon}</div>
            <div className="text-2xl font-bold text-brand-primary mb-1">
              {category.tools.length}
            </div>
            <div className="text-sm text-brand-text-secondary">
              {category.name.replace(' Tools', '')}
            </div>
          </div>
        ))}
      </div>

      {/* Role-based Tool Recommendations */}
      {role && (
        <div className="card-brand p-6">
          <h3 className="text-lg font-semibold text-brand-text mb-4">
            Recommended for {role}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Role-specific recommendations */}
            {role.includes('SEO') && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900">SEO Tools</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Google Search Console, Analytics, and keyword research tools
                </p>
              </div>
            )}
            {role.includes('Designer') && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900">Design Tools</h4>
                <p className="text-sm text-purple-700 mt-1">
                  Canva, Figma, and Adobe Creative Suite for your design needs
                </p>
              </div>
            )}
            {role.includes('Developer') && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900">Development Tools</h4>
                <p className="text-sm text-green-700 mt-1">
                  GitHub, VS Code, and deployment platforms
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterToolsPage;