import React, { useEffect, useMemo, useState, useCallback, Fragment } from "react";
import { Modal } from "@/shared/components/Modal";
import { useSupabase } from "./SupabaseProvider";
import { LoginModal } from "./LoginModal";
import { EMPTY_SUBMISSION, ADMIN_TOKEN } from "@/shared/lib/constants";
import { EmployeeForm } from "./EmployeeForm";
import { ManagerDashboard } from "./ManagerDashboard";
import { NewReportDashboard } from "./NewReportDashboard";
import { ManagerEditEmployee } from "./ManagerEditEmployee";
import { EmployeePersonalDashboard } from "./EmployeePersonalDashboard";
import { HeaderBrand } from "@/shared/components/HeaderBrand";
import { useFetchSubmissions } from "./useFetchSubmissions";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { ToastProvider, useToast } from "@/shared/components/Toast";

function useHash() {
  const initial = typeof window === 'undefined' ? '' : (window.location.hash || '');
  const [hash, setHash] = useState(initial);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

import { ModalContext, useModal } from "@/shared/components/ModalContext";


export function AppContent() {
  const hash = useHash();
  const { allSubmissions, loading, error } = useFetchSubmissions();
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    userType: null,
    currentUser: null,
    loginError: ''
  });
  const [loginForm, setLoginForm] = useState({
    name: '',
    phone: '',
    userType: 'employee'
  });
  const [view, setView] = useState('form');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null, inputLabel: '', inputValue: '', onClose: () => setModalState(s => ({ ...s, isOpen: false })) });
  const openModal = (title, message, onConfirm = null, onCancel = null, inputLabel = '', inputValue = '') => {
    setModalState({ isOpen: true, title, message, onConfirm, onCancel, inputLabel, inputValue, onClose: () => setModalState(s => ({ ...s, isOpen: false })) });
  };
  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  useEffect(() => {
    if (hash === '#/manager') {
      if (!authState.isLoggedIn && (!showLoginModal || loginForm.userType !== 'manager')) {
        setLoginForm(prev => ({ ...prev, userType: 'manager' }));
        setShowLoginModal(true);
      }
    } else if (hash === '#/employee') {
      if (!authState.isLoggedIn && (!showLoginModal || loginForm.userType !== 'employee')) {
        setLoginForm(prev => ({ ...prev, userType: 'employee' }));
        setShowLoginModal(true);
      }
    } else if (hash === '#/dashboard' && authState.isLoggedIn) {
      if (authState.userType === 'manager') {
        setView('managerDashboard');
      } else {
        setView('employeeDashboard');
      }
    } else if (hash === '' || hash === '#/') {
      setView('form');
      if (showLoginModal && hash !== '#/manager' && hash !== '#/employee') {
        setShowLoginModal(false);
      }
    }
  }, [hash, authState.isLoggedIn, authState.userType]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthState(prev => ({ ...prev, loginError: '' }));

    if (loginForm.userType === 'manager') {
      if (loginForm.phone === ADMIN_TOKEN) {
        setAuthState({
          isLoggedIn: true,
          userType: 'manager',
          currentUser: { name: 'Manager', role: 'Administrator' },
          loginError: ''
        });
        setShowLoginModal(false);
        
        // Wait for data to load before navigating to dashboard
        if (!loading && !error) {
          setView('managerDashboard');
          window.location.hash = '#/dashboard';
        } else if (!error) {
          // Data still loading, navigate anyway but let component handle loading state
          setView('managerDashboard');
          window.location.hash = '#/dashboard';
        }
      } else {
        setAuthState(prev => ({ ...prev, loginError: 'Invalid manager credentials. Please check your admin token.' }));
      }
    } else {
      // Employee login validation
      if (!loginForm.name.trim() || !loginForm.phone.trim()) {
        setAuthState(prev => ({ ...prev, loginError: 'Please enter both name and phone number.' }));
        return;
      }

      // Check if data is still loading
      if (loading) {
        setAuthState(prev => ({ ...prev, loginError: 'Loading employee data. Please wait...' }));
        return;
      }

      // Check for database error
      if (error) {
        setAuthState(prev => ({ ...prev, loginError: `Database error: ${error}` }));
        return;
      }

      // Check if data is available
      if (!allSubmissions || allSubmissions.length === 0) {
        setAuthState(prev => ({ ...prev, loginError: 'No employee records found. Please ensure you have submitted a form or contact administrator.' }));
        return;
      }

      try {
        // Improved matching logic with better normalization
        const normalizedName = loginForm.name.trim().toLowerCase().replace(/\s+/g, ' ');
        const normalizedPhone = loginForm.phone.trim();
        
        const employeeSubmissions = allSubmissions.filter(s => {
          if (!s.employee?.name || !s.employee?.phone) return false;
          
          const submissionName = s.employee.name.trim().toLowerCase().replace(/\s+/g, ' ');
          const submissionPhone = s.employee.phone.trim();
          
          return submissionName === normalizedName && submissionPhone === normalizedPhone;
        });

        const hasCompletedSubmission = employeeSubmissions.some(s => !s.isDraft);

        if (employeeSubmissions.length > 0 && hasCompletedSubmission) {
          setAuthState({
            isLoggedIn: true,
            userType: 'employee',
            currentUser: { ...employeeSubmissions[0].employee },
            loginError: ''
          });
          setShowLoginModal(false);
          setView('employeeDashboard');
          window.location.hash = '#/dashboard';
        } else if (employeeSubmissions.length > 0) {
          setAuthState(prev => ({ ...prev, loginError: 'You have draft submissions but need to complete at least one form before accessing your dashboard.' }));
        } else {
          setAuthState(prev => ({ ...prev, loginError: `No records found for ${normalizedName} with phone ${normalizedPhone}. Please check your details or submit a form first.` }));
        }
      } catch (error) {
        console.error('Employee login error:', error);
        setAuthState(prev => ({ ...prev, loginError: 'Login failed due to unexpected error. Please try again.' }));
      }
    }
  };

  const handleLogout = () => {
    setAuthState({
      isLoggedIn: false,
      userType: null,
      currentUser: null,
      loginError: ''
    });
    setLoginForm({
      name: '',
      phone: '',
      userType: 'employee'
    });
    setView('form');
    setSelectedEmployee(null);
    setShowLoginModal(false);
    window.location.hash = '';
  };

  const handleViewEmployeeReport = useCallback((employeeName, employeePhone) => {
    setSelectedEmployee({ name: employeeName, phone: employeePhone });
    setView('employeeReport');
  }, []);

  const handleBackToDashboard = useCallback(() => {
    if (authState.userType === 'manager') {
      setView('managerDashboard');
    } else {
      setView('employeeDashboard');
      window.location.hash = '#/dashboard';
    }
    setSelectedEmployee(null);
  }, [authState.userType]);

  const handleEditEmployee = useCallback((employeeName, employeePhone) => {
    setSelectedEmployee({ name: employeeName, phone: employeePhone });
    setView('editEmployee');
  }, []);

  const handleEditReport = useCallback((employeeName, employeePhone) => {
    setSelectedEmployee({ name: employeeName, phone: employeePhone });
    setView('editReport');
  }, []);

  const renderCurrentView = () => {
    switch (view) {
      case 'managerDashboard':
        return <ManagerDashboard onViewReport={handleViewEmployeeReport} onEditEmployee={handleEditEmployee} onEditReport={handleEditReport} />;
      case 'employeeReport':
        if (!selectedEmployee) return (
          <div className="max-w-xl mx-auto bg-yellow-50 border border-yellow-200 rounded-xl p-4">Missing employee context. Returning to dashboard…</div>
        );
        return (
          <NewReportDashboard 
            employeeName={selectedEmployee.name} 
            employeePhone={selectedEmployee.phone} 
            onBack={handleBackToDashboard} 
          />
        );
      case 'editEmployee':
        if (!selectedEmployee) return (
          <div className="max-w-xl mx-auto bg-yellow-50 border border-yellow-200 rounded-xl p-4">Missing employee context. Returning to dashboard…</div>
        );
        return (
          <ManagerEditEmployee 
            employee={selectedEmployee}
            onBack={handleBackToDashboard}
          />
        );
      case 'editReport':
        if (!selectedEmployee) return (
          <div className="max-w-xl mx-auto bg-yellow-50 border border-yellow-200 rounded-xl p-4">Missing employee context. Returning to dashboard…</div>
        );
        return (
          <EmployeeForm 
            currentUser={selectedEmployee}
            isManagerEdit={true}
            onBack={handleBackToDashboard}
          />
        );
      case 'employeeDashboard':
        return (
          <EmployeePersonalDashboard 
            employee={authState.currentUser}
            onBack={() => {
              setView('form');
              window.location.hash = '';
            }}
          />
        );
      default:
        return <EmployeeForm currentUser={authState.isLoggedIn && authState.userType === 'employee' ? authState.currentUser : null} />;
    }
  };

  const openLoginModal = (userType) => {
    setLoginForm(prev => ({ 
      ...prev, 
      userType, 
      ...(prev.userType !== userType ? { name: '', phone: '' } : {})
    }));
    setAuthState(prev => ({ ...prev, loginError: '' }));
    setShowLoginModal(true);
    window.location.hash = userType === 'manager' ? '#/manager' : '#/employee';
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-900 font-sans">
        <Modal {...modalState} />
        <header className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg shadow-blue-100/20 z-20">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <HeaderBrand />
              <div className="flex items-center gap-2 sm:gap-3">
                {authState.isLoggedIn ? (
                  <>
                    <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      {authState.userType === 'manager' ? 'Manager Dashboard' : `Welcome, ${authState.currentUser?.name}`}
                    </div>
                    
                    <div className="lg:hidden flex items-center gap-1 text-xs text-gray-600">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="truncate max-w-20">
                        {authState.userType === 'manager' ? 'Manager' : authState.currentUser?.name?.split(' ')[0]}
                      </span>
                    </div>
                    
                    {authState.userType === 'employee' && view !== 'employeeDashboard' && (
                      <button
                        onClick={() => {
                          setView('employeeDashboard');
                          window.location.hash = '#/dashboard';
                        }}
                        className="text-xs sm:text-sm px-2 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation"
                      >
                        <span className="hidden sm:inline">My Dashboard</span>
                        <span className="sm:hidden">Dashboard</span>
                      </button>
                    )}
                    
                    {view !== 'form' && (
                      <button
                        onClick={() => {
                          setView('form');
                          window.location.hash = '';
                        }}
                        className="text-xs sm:text-sm px-2 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation"
                      >
                        <span className="hidden sm:inline">Submit Report</span>
                        <span className="sm:hidden">Form</span>
                      </button>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="text-xs sm:text-sm px-2 sm:px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation"
                    >
                      <span className="hidden sm:inline">Log Out</span>
                      <span className="sm:hidden">Exit</span>
                    </button>
                  </>
                ) : (
                  <div className="text-xs sm:text-sm text-gray-600">
                    Have an account? Check footer to login
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <ErrorBoundary>
            {renderCurrentView()}
          </ErrorBoundary>
        </main>
        <footer className="bg-white/90 backdrop-blur-lg border-t border-gray-200 mt-auto py-6 sm:py-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="text-center space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm text-gray-600">
                <span>Created for Branding Pioneers Agency</span>
                <span className="hidden sm:inline text-gray-400">•</span>
                <span>Employee Performance Management System</span>
                <span className="hidden sm:inline text-gray-400">•</span>
                <span>v12 (Form-First)</span>
              </div>
              
              {!authState.isLoggedIn && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    Already submitted a form? Login to view your dashboard:
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => openLoginModal('employee')}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation font-medium"
                    >
                      👥 Employee Login
                    </button>
                    <button
                      onClick={() => openLoginModal('manager')}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 active:from-gray-800 active:to-gray-900 transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation font-medium"
                    >
                      📋 Manager Login
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Note: You need to complete at least one form submission before you can login to your employee dashboard.
                  </p>
                </div>
              )}
            </div>
          </div>
        </footer>
        
        {showLoginModal && (
          <LoginModal 
            loginForm={loginForm}
            setLoginForm={setLoginForm}
            onLogin={handleLogin}
            loginError={authState.loginError}
            onClose={() => {
              setShowLoginModal(false);
              setAuthState(prev => ({ ...prev, loginError: '' }));
              window.location.hash = '';
            }}
          />
        )}
      </div>
      </ToastProvider>
    </ModalContext.Provider>
  );
}
