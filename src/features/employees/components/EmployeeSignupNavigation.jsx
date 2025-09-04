import React, { useState } from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useAppNavigation } from '@/utils/navigation';
import EmployeeSignupForm from './EmployeeSignupForm';
import HRApprovalWorkflow from './HRApprovalWorkflow';
import { ExitWorkflowManagement } from './ExitWorkflowManagement';
import { EmployeeExitForm } from './EmployeeExitForm';
import { useModal } from '@/shared/components/ModalContext';

export function EmployeeSignupNavigation() {
  const { user, userCategory: userRole } = useUnifiedAuth();
  const navigation = useAppNavigation();
  const { openModal, closeModal } = useModal();
  const [activeView, setActiveView] = useState('overview');
  
  const openSignupForm = () => {
    // Navigate to employee signup page instead of opening modal
    navigation.navigate('/employee-signup');
  };
  
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Management</h1>
        <p className="text-gray-600">Manage employee signups and HR approval workflows</p>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Employee Signup */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee Signup</h3>
            <p className="text-gray-600 mb-4">Submit an application to join our team</p>
            <button
              onClick={openSignupForm}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Apply Now
            </button>
          </div>
        </div>
        
        {/* HR Workflow (Manager/HR only) */}
        {(userRole === 'manager' || userRole === 'hr') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">HR Approval Workflow</h3>
              <p className="text-gray-600 mb-4">Review and approve employee applications</p>
              <button
                onClick={() => setActiveView('hr-workflow')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Review Applications
              </button>
            </div>
          </div>
        )}
        
        {/* Employee Directory */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">📖</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee Directory</h3>
            <p className="text-gray-600 mb-4">View all current employees</p>
            <button
              onClick={() => setActiveView('directory')}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              View Directory
            </button>
          </div>
        </div>
        
        {/* Employee Onboarding */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee Onboarding</h3>
            <p className="text-gray-600 mb-4">Complete onboarding form for new employees</p>
            <button
              onClick={() => navigation.navigateToPath('/employee-onboarding')}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Start Onboarding
            </button>
          </div>
        </div>
        
        {/* Employee Incentives */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee Incentives</h3>
            <p className="text-gray-600 mb-4">Apply for hiring, testimonial, and promotional incentives</p>
            <button
              onClick={() => navigation.navigateToPath('/employee-incentives')}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            >
              Apply for Incentives
            </button>
          </div>
        </div>
        
        {/* HR Incentive Approval (Manager/HR only) */}
         {(userRole === 'manager' || userRole === 'hr') && (
           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
             <div className="text-center">
               <div className="text-4xl mb-4">💰</div>
               <h3 className="text-lg font-semibold text-gray-900 mb-2">HR Incentive Approval</h3>
               <p className="text-gray-600 mb-4">Review and approve employee incentive applications</p>
               <button
                 onClick={() => navigation.navigateToPath('/hr-incentive-approval')}
                 className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
               >
                 Review Incentives
               </button>
             </div>
           </div>
         )}
        
        {/* Manager Incentive Reporting */}
        {(userRole === 'manager' || userRole === 'hr') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Incentive Reporting</h3>
              <p className="text-gray-600 mb-4">View analytics and reports for employee incentives</p>
              <button
                onClick={() => navigation.navigateToPath('/manager-incentive-reporting')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                View Reports
              </button>
            </div>
          </div>
        )}
        
        {/* Exit Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🚪</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Exit Management</h3>
            <p className="text-gray-600 mb-4">Manage employee exits and offboarding</p>
            <button
              onClick={() => setActiveView('exit-workflow')}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Manage Exits
            </button>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">New employee signup form created</span>
            <span className="text-gray-400">• Just now</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">HR approval workflow implemented</span>
            <span className="text-gray-400">• Just now</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-gray-600">Employee management system enhanced</span>
            <span className="text-gray-400">• Just now</span>
          </div>
        </div>
      </div>
      
      {/* Help & Documentation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">📚 How it Works</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <div className="flex items-start space-x-2">
            <span className="font-medium">1.</span>
            <span>Candidates fill out the comprehensive signup form with personal, professional, and background information</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium">2.</span>
            <span>HR team receives notifications and can review applications in the approval workflow</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium">3.</span>
            <span>Applications can be approved (creating employee records) or rejected with feedback</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium">4.</span>
            <span>Approved employees are automatically added to the employee directory and system</span>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderDirectory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Directory</h2>
          <p className="text-gray-600">View all current employees</p>
        </div>
        <button
          onClick={() => setActiveView('overview')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          ← Back to Overview
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Employee Directory</h3>
          <p className="text-gray-600 mb-4">
            The employee directory will be integrated with the existing employee management system.
          </p>
          <p className="text-sm text-gray-500">
            This will show all employees from the employees table, including those approved through the signup process.
          </p>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button
              onClick={() => setActiveView('overview')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              📊 Overview
            </button>
            
            {(userRole === 'manager' || userRole === 'hr') && (
              <button
                onClick={() => setActiveView('hr-workflow')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeView === 'hr-workflow'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                📋 HR Workflow
              </button>
            )}
            
            <button
              onClick={() => setActiveView('directory')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === 'directory'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              📖 Directory
            </button>
            
            <button
              onClick={() => setActiveView('exit-workflow')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === 'exit-workflow'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              🚪 Exit Management
            </button>
          </nav>
        </div>
        
        {/* Content */}
        {activeView === 'overview' && renderOverview()}
        {activeView === 'hr-workflow' && (userRole === 'manager' || userRole === 'hr') && <HRApprovalWorkflow />}
        {activeView === 'directory' && renderDirectory()}
        {activeView === 'exit-workflow' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Exit Management</h2>
                <p className="text-gray-600">Manage employee exits and offboarding process</p>
              </div>
              <button
                onClick={() => setActiveView('overview')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                ← Back to Overview
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Employee Exit Form</h3>
                <p className="text-gray-600 mb-4">
                  Employees can submit exit requests through this form. The form captures
                  exit details, conducts exit interviews, and manages asset returns.
                </p>
                <EmployeeExitForm />
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Exit Workflow Management</h3>
                <p className="text-gray-600 mb-4">
                  HR and managers can review, approve, and track employee exit requests.
                  Monitor the complete exit process from submission to completion.
                </p>
                <ExitWorkflowManagement />
              </div>
            </div>
          </div>
        )}
        
        {/* Unauthorized Access */}
        {activeView === 'hr-workflow' && userRole !== 'manager' && userRole !== 'hr' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
              <p className="text-gray-600">
                HR Approval Workflow is only available to managers and HR personnel.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeSignupNavigation;