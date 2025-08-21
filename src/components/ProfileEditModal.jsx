import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { DEPARTMENTS, ROLES_BY_DEPT } from './constants';

export function ProfileEditModal({ isOpen, onClose, employee, onSave, isFirstTime = false }) {
  const [form, setForm] = useState({
    photoUrl: '',
    joiningDate: '',
    dob: '',
    education: '',
    certifications: '',
    skills: '',
    department: '',
    role: [],
    directManager: '',
    reportingStructure: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, title: "Personal Info", fields: ['photoUrl', 'joiningDate', 'dob'] },
    { id: 2, title: "Education & Skills", fields: ['education', 'certifications', 'skills'] },
    { id: 3, title: "Role & Reporting", fields: ['department', 'role', 'directManager', 'reportingStructure'] }
  ];

  useEffect(() => {
    if (employee) {
      setForm({
        photoUrl: employee.photoUrl || '',
        joiningDate: employee.joiningDate || '',
        dob: employee.dob || '',
        education: employee.education || '',
        certifications: employee.certifications || '',
        skills: employee.skills || '',
        department: employee.department || '',
        role: employee.role || [],
        directManager: employee.directManager || '',
        reportingStructure: employee.reportingStructure || '',
      });
    }
  }, [employee, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleRoleChange = (newRoles) => {
    setForm(prev => ({ ...prev, role: newRoles }));
  };

  const validateCurrentStep = () => {
    const currentStepData = steps.find(s => s.id === currentStep);
    const errors = {};
    
    currentStepData.fields.forEach(field => {
      if (field === 'photoUrl' && !form[field]) {
        errors[field] = 'Profile photo helps colleagues recognize you';
      }
      if (field === 'joiningDate' && !form[field]) {
        errors[field] = 'Required for calculating tenure and benefits';
      }
      if (field === 'education' && !form[field]) {
        errors[field] = 'Educational background is important for role matching';
      }
      if (field === 'skills' && !form[field]) {
        errors[field] = 'Skills help with project assignments and career growth';
      }
      if (field === 'department' && !form[field]) {
        errors[field] = 'Department is required for reporting structure';
      }
      if (field === 'role' && (!form[field] || form[field].length === 0)) {
        errors[field] = 'Role clarity is essential for performance evaluation';
      }
      if (field === 'directManager' && !form[field]) {
        errors[field] = 'Manager information is needed for reporting hierarchy';
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep() && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateCurrentStep()) {
      onSave(form);
    }
  };

  const getCompletionPercentage = () => {
    const totalFields = ['photoUrl', 'joiningDate', 'dob', 'education', 'certifications', 'skills', 'department', 'role', 'directManager'];
    const completedFields = totalFields.filter(field => {
      if (field === 'role') return form[field] && form[field].length > 0;
      return form[field] && form[field].toString().trim().length > 0;
    });
    return Math.round((completedFields.length / totalFields.length) * 100);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-xl transition-all">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title className="text-lg font-bold text-white">
                      {isFirstTime ? '🎉 Welcome! Complete Your Profile' : '📝 Update Your Profile'}
                    </Dialog.Title>
                    <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
                  </div>
                  
                  {isFirstTime && (
                    <div className="bg-white/10 rounded-lg p-3 mb-4">
                      <p className="text-white/90 text-sm">
                        Complete your profile to unlock all features and help us provide the best experience for you!
                      </p>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="bg-white/20 rounded-full h-3 mb-2">
                    <div 
                      className="bg-white rounded-full h-3 transition-all duration-500"
                      style={{ width: `${getCompletionPercentage()}%` }}
                    ></div>
                  </div>
                  <div className="text-white/80 text-sm">
                    {getCompletionPercentage()}% Complete
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  {/* Step Navigation */}
                  <div className="flex justify-between items-center mb-6">
                    {steps.map((step, index) => (
                      <div key={step.id} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep >= step.id 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {currentStep > step.id ? '✓' : step.id}
                        </div>
                        <span className={`ml-2 text-sm font-medium ${
                          currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </span>
                        {index < steps.length - 1 && (
                          <div className={`w-8 h-0.5 mx-4 ${
                            currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                          }`}></div>
                        )}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Step 1: Personal Info */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Profile Photo URL *
                            {fieldErrors.photoUrl && <span className="text-red-500 text-xs ml-2">{fieldErrors.photoUrl}</span>}
                          </label>
                          <input
                            name="photoUrl"
                            type="url"
                            value={form.photoUrl}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                              fieldErrors.photoUrl ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="https://drive.google.com/your-photo.jpg"
                          />
                          <p className="text-xs text-gray-500 mt-1">Use Google Drive, LinkedIn, or company directory photo</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Joining Date *
                              {fieldErrors.joiningDate && <span className="text-red-500 text-xs ml-2">{fieldErrors.joiningDate}</span>}
                            </label>
                            <input
                              name="joiningDate"
                              type="date"
                              value={form.joiningDate}
                              onChange={handleChange}
                              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                                fieldErrors.joiningDate ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                            <input
                              name="dob"
                              type="date"
                              value={form.dob}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Optional - for birthday celebrations</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Education & Skills */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Education & Skills</h3>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Education *
                            {fieldErrors.education && <span className="text-red-500 text-xs ml-2">{fieldErrors.education}</span>}
                          </label>
                          <input
                            name="education"
                            type="text"
                            value={form.education}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                              fieldErrors.education ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="e.g., B.Tech Computer Science, MBA Marketing"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
                          <textarea
                            name="certifications"
                            value={form.certifications}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="Google Ads Certified, AWS Solutions Architect, PMP, etc."
                          />
                          <p className="text-xs text-gray-500 mt-1">List relevant professional certifications</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Skills & Tools *
                            {fieldErrors.skills && <span className="text-red-500 text-xs ml-2">{fieldErrors.skills}</span>}
                          </label>
                          <textarea
                            name="skills"
                            value={form.skills}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                              fieldErrors.skills ? 'border-red-300' : 'border-gray-300'
                            }`}
                            rows={3}
                            placeholder="Photoshop, JavaScript, Google Analytics, Facebook Ads, SEO tools, etc."
                          />
                          <p className="text-xs text-gray-500 mt-1">List technical skills, software, and tools you're proficient in</p>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Role & Reporting */}
                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Role & Reporting Structure</h3>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Department *
                            {fieldErrors.department && <span className="text-red-500 text-xs ml-2">{fieldErrors.department}</span>}
                          </label>
                          <select
                            name="department"
                            value={form.department}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                              fieldErrors.department ? 'border-red-300' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select Department</option>
                            {DEPARTMENTS.map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role(s) *
                            {fieldErrors.role && <span className="text-red-500 text-xs ml-2">{fieldErrors.role}</span>}
                          </label>
                          <select
                            multiple
                            value={form.role}
                            onChange={(e) => handleRoleChange(Array.from(e.target.selectedOptions, option => option.value))}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                              fieldErrors.role ? 'border-red-300' : 'border-gray-300'
                            }`}
                            size="4"
                          >
                            {(ROLES_BY_DEPT[form.department] || []).map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple roles</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Direct Manager *
                            {fieldErrors.directManager && <span className="text-red-500 text-xs ml-2">{fieldErrors.directManager}</span>}
                          </label>
                          <input
                            name="directManager"
                            type="text"
                            value={form.directManager}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                              fieldErrors.directManager ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Your direct reporting manager's name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Structure Notes</label>
                          <textarea
                            name="reportingStructure"
                            value={form.reportingStructure}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            placeholder="Any additional details about your reporting structure or team dynamics"
                          />
                        </div>
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <div className="text-sm text-gray-500 self-center">
                        Step {currentStep} of {steps.length}
                      </div>

                      {currentStep < steps.length ? (
                        <button
                          type="button"
                          onClick={nextStep}
                          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Complete Profile
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
