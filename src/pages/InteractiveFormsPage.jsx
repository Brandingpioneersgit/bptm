import React, { useState } from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import InteractiveKPIForm from '@/components/InteractiveKPIForm';
import QuickSubmissionForm from '@/components/QuickSubmissionForm';
import KPIDashboard from '@/components/KPIDashboard';
import {
  Target,
  MessageSquare,
  Star,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart3,
  TrendingUp,
  Calendar,
  Users,
  Award,
  BookOpen,
  Send,
  Plus,
  Eye,
  Filter,
  Grid,
  List
} from 'lucide-react';

const InteractiveFormsPage = () => {
  const { user } = useUnifiedAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedFormType, setSelectedFormType] = useState('feedback');
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  // Form types configuration
  const formTypes = [
    {
      id: 'feedback',
      title: 'Submit Feedback',
      description: 'Share your thoughts, suggestions, and concerns',
      icon: MessageSquare,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'review',
      title: 'Performance Review',
      description: 'Conduct self-assessment and peer reviews',
      icon: Star,
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'goal',
      title: 'Set Goals',
      description: 'Define and track your professional goals',
      icon: Target,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'task',
      title: 'Quick Tasks',
      description: 'Log daily tasks and activities',
      icon: CheckCircle,
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      id: 'concern',
      title: 'Report Concerns',
      description: 'Report workplace issues or concerns',
      icon: AlertCircle,
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  // Main navigation tabs
  const mainTabs = [
    {
      id: 'dashboard',
      title: 'KPI Dashboard',
      description: 'View and manage your KPIs',
      icon: BarChart3,
      color: 'blue'
    },
    {
      id: 'kpi-form',
      title: 'Update KPIs',
      description: 'Submit monthly KPI data',
      icon: Target,
      color: 'green'
    },
    {
      id: 'submissions',
      title: 'Quick Submissions',
      description: 'Submit feedback, reviews, and more',
      icon: Send,
      color: 'purple'
    }
  ];

  // Handle form submission success
  const handleFormSubmissionSuccess = (data) => {
    console.log('Form submitted successfully:', data);
    // Could trigger a refresh of the dashboard or show success message
  };

  // Render form type selector
  const renderFormTypeSelector = () => {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Choose Form Type</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-3'
        }`}>
          {formTypes.map((formType) => {
            const Icon = formType.icon;
            const isSelected = selectedFormType === formType.id;
            
            return (
              <button
                key={formType.id}
                onClick={() => setSelectedFormType(formType.id)}
                className={`${
                  viewMode === 'grid' ? 'p-4' : 'p-3 flex items-center gap-4'
                } w-full text-left border-2 rounded-xl transition-all hover:shadow-md ${
                  isSelected
                    ? `${formType.borderColor} ${formType.bgColor} shadow-md`
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`${
                  viewMode === 'grid' ? 'mb-3' : ''
                } flex items-center gap-3`}>
                  <div className={`p-2 rounded-lg ${
                    isSelected ? `bg-${formType.color}-100` : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      isSelected ? `text-${formType.color}-600` : 'text-gray-600'
                    }`} />
                  </div>
                  {viewMode === 'list' && (
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{formType.title}</h4>
                      <p className="text-sm text-gray-600">{formType.description}</p>
                    </div>
                  )}
                </div>
                
                {viewMode === 'grid' && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">{formType.title}</h4>
                    <p className="text-sm text-gray-600">{formType.description}</p>
                  </div>
                )}
                
                {isSelected && (
                  <div className={`${
                    viewMode === 'grid' ? 'mt-3' : 'ml-auto'
                  } flex items-center gap-1 text-sm font-medium text-${formType.color}-600`}>
                    <CheckCircle className="w-4 h-4" />
                    Selected
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render main content based on active tab
  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <KPIDashboard 
            employeeId={user?.id}
            showForm={false}
            viewMode="dashboard"
          />
        );
      
      case 'kpi-form':
        return (
          <InteractiveKPIForm 
            employeeId={user?.id}
            onSubmit={handleFormSubmissionSuccess}
            showHeader={true}
            compact={false}
          />
        );
      
      case 'submissions':
        return (
          <div className="space-y-6">
            {renderFormTypeSelector()}
            <QuickSubmissionForm 
              type={selectedFormType}
              onSubmit={handleFormSubmissionSuccess}
              compact={false}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Interactive Forms
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your KPIs, submit feedback, and track your performance
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm text-gray-600">Welcome back,</div>
                <div className="font-medium text-gray-900">
                  {user?.user_metadata?.full_name || user?.email || 'User'}
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {mainTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? `border-${tab.color}-500 text-${tab.color}-600`
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{tab.title}</span>
                    <span className="sm:hidden">{tab.title.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Tab Description */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              {(() => {
                const activeTabConfig = mainTabs.find(tab => tab.id === activeTab);
                const Icon = activeTabConfig?.icon || FileText;
                return <Icon className="w-5 h-5 text-blue-600" />;
              })()}
              <p className="text-blue-800 font-medium">
                {mainTabs.find(tab => tab.id === activeTab)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="space-y-6">
          {renderMainContent()}
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-gray-900">Performance Trend</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">+12.5%</p>
            <p className="text-sm text-gray-600">vs last month</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-gray-900">This Month</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">8.7/10</p>
            <p className="text-sm text-gray-600">Average score</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-purple-600" />
              <h3 className="font-medium text-gray-900">Submissions</h3>
            </div>
            <p className="text-2xl font-bold text-purple-600">24</p>
            <p className="text-sm text-gray-600">Total this year</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveFormsPage;