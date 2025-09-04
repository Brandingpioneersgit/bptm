import React from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeSignupForm from '../components/EmployeeSignupForm';

const EmployeeSignupPage = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-brand-text">
            Employee Signup Form
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <EmployeeSignupForm onClose={handleClose} />
        </div>
      </div>
    </div>
  );
};

export default EmployeeSignupPage;