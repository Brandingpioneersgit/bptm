import React, { useState, useCallback } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useDataSync } from '@/components/DataSyncContext';
import { useNotificationSystem } from '@/components/NotificationSystem';
import { CLIENT_SERVICES, DELIVERY_FREQUENCIES, SERVICE_FREQUENCY_DEFAULTS, EMPTY_CLIENT, getServicesForTeam } from '@/features/clients/services/clientServices';
import { Section } from '@/shared/components/ui';

const CLIENT_TYPES = [
  { value: 'Standard', label: 'Standard', description: 'Basic service package' },
  { value: 'Premium', label: 'Premium', description: 'Enhanced service package' },
  { value: 'Enterprise', label: 'Enterprise', description: 'Full-service package' }
];

const TEAMS = [
  { value: 'Web', label: 'Web Team', description: 'Website development, maintenance, and AI tools' },
  { value: 'Marketing', label: 'Marketing Team', description: 'Website development and marketing services' },
  { value: 'Website', label: 'Website Team', description: 'Website development only' }
];

export function ClientAdditionForm({ onClientAdded, onCancel, compact = false }) {
  const supabase = useSupabase();
  const { notify } = useToast();
  const { user, role } = useUnifiedAuth();
  const userRole = role;
  const { addClient } = useDataSync();
  const { addSystemNotification } = useNotificationSystem();
  
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    ...EMPTY_CLIENT,
    team: user?.department || 'Web'
  });
  const [selectedServices, setSelectedServices] = useState([]);
  const [serviceFrequencies, setServiceFrequencies] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  
  const resetForm = useCallback(() => {
    setFormData({
      ...EMPTY_CLIENT,
      team: user?.department || 'Web'
    });
    setSelectedServices([]);
    setServiceFrequencies({});
    setValidationErrors({});
    setCurrentStep(1);
  }, [user?.department]);
  
  const validateStep = useCallback((step) => {
    const errors = {};
    
    if (step === 1) {
      if (!formData.name.trim()) {
        errors.name = 'Client name is required';
      }
      if (!formData.team) {
        errors.team = 'Team selection is required';
      }
      if (!formData.client_type) {
        errors.client_type = 'Client type is required';
      }
    }
    
    if (step === 2) {
      if (selectedServices.length === 0) {
        errors.services = 'At least one service must be selected';
      }
    }
    
    if (step === 3) {
      if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
        errors.contact_email = 'Please enter a valid email address';
      }
      if (formData.contact_phone && !/^[\d\s\-\+\(\)]+$/.test(formData.contact_phone)) {
        errors.contact_phone = 'Please enter a valid phone number';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, selectedServices]);
  
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [validationErrors]);
  
  const handleServiceToggle = useCallback((service) => {
    setSelectedServices(prev => {
      const isSelected = prev.includes(service);
      const newServices = isSelected 
        ? prev.filter(s => s !== service)
        : [...prev, service];
      
      // Set default frequency for newly selected services
      if (!isSelected) {
        setServiceFrequencies(prevFreq => ({
          ...prevFreq,
          [service]: SERVICE_FREQUENCY_DEFAULTS[service] || 'Monthly'
        }));
      }
      
      return newServices;
    });
    
    // Clear services validation error
    if (validationErrors.services) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.services;
        return newErrors;
      });
    }
  }, [validationErrors.services]);
  
  const handleFrequencyChange = useCallback((service, frequency) => {
    setServiceFrequencies(prev => ({
      ...prev,
      [service]: frequency
    }));
  }, []);
  
  const handleNextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, validateStep]);
  
  const handlePrevStep = useCallback(() => {
    setCurrentStep(prev => prev - 1);
  }, []);
  
  const handleSubmit = useCallback(async () => {
    if (!validateStep(3)) return;
    
    setLoading(true);
    
    try {
      // Prepare services data
      const services = selectedServices.map(service => ({
        service,
        frequency: serviceFrequencies[service] || SERVICE_FREQUENCY_DEFAULTS[service] || 'Monthly',
        notes: '',
        added_date: new Date().toISOString()
      }));
      
      // Prepare client data
      const clientData = {
        name: formData.name.trim(),
        team: formData.team,
        client_type: formData.client_type,
        status: 'Active',
        services: selectedServices,
        service_scopes: services.reduce((acc, service) => {
          acc[service.service] = {
            frequency: service.frequency,
            description: service.notes || '',
            deliverables: 0
          };
          return acc;
        }, {}),
        contact_email: formData.contact_email?.trim() || '',
        contact_phone: formData.contact_phone?.trim() || '',
        notes: formData.scope_notes?.trim() || '',
        contract_start_date: formData.start_date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Create client in database
      const { data: createdClient, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Add to sync context
      addClient(createdClient);
      
      // Send notifications
      const notificationData = {
        type: 'success',
        priority: 'medium',
        category: 'client_management',
        title: 'New Client Added',
        message: `${createdClient.name} has been added to the ${createdClient.team} team by ${user?.name || 'Unknown'} (${userRole || 'employee'})`,
        dashboard: 'all',
        metadata: {
          clientId: createdClient.id,
          clientName: createdClient.name,
          team: createdClient.team,
          addedBy: user?.name || 'Unknown',
          addedByRole: userRole || 'employee',
          services: selectedServices
        }
      };
      
      addSystemNotification(notificationData);
      
      // Show success toast
      notify({
        type: 'success',
        title: 'Client Added Successfully',
        message: `${createdClient.name} has been added to the ${createdClient.team} team`
      });
      
      // Reset form and close
      resetForm();
      setIsOpen(false);
      
      // Call callback if provided
      if (onClientAdded) {
        onClientAdded(createdClient);
      }
      
    } catch (error) {
      console.error('Error creating client:', error);
      notify({
        type: 'error',
        title: 'Failed to Add Client',
        message: error.message || 'An unexpected error occurred'
      });
    } finally {
      setLoading(false);
    }
  }, [formData, selectedServices, serviceFrequencies, validateStep, supabase, user, userRole, addClient, addSystemNotification, notify, resetForm, onClientAdded]);
  
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            currentStep >= step
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-600'
          }`}>
            {step}
          </div>
          {step < 3 && (
            <div className={`w-12 h-1 mx-2 ${
              currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
            }`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
  
  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Client Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            validationErrors.name ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Enter client name"
        />
        {validationErrors.name && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Team *
        </label>
        <select
          value={formData.team}
          onChange={(e) => handleInputChange('team', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            validationErrors.team ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          {TEAMS.map(team => (
            <option key={team.value} value={team.value}>
              {team.label}
            </option>
          ))}
        </select>
        {validationErrors.team && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.team}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Client Type *
        </label>
        <div className="grid grid-cols-1 gap-3">
          {CLIENT_TYPES.map(type => (
            <label key={type.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="client_type"
                value={type.value}
                checked={formData.client_type === type.value}
                onChange={(e) => handleInputChange('client_type', e.target.value)}
                className="mr-3 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">{type.label}</div>
                <div className="text-sm text-gray-600">{type.description}</div>
              </div>
            </label>
          ))}
        </div>
        {validationErrors.client_type && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.client_type}</p>
        )}
      </div>
    </div>
  );
  
  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Services & Scope</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Services *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border rounded-lg p-3">
          {getServicesForTeam(formData.team).map(service => (
            <label key={service} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
              <input
                type="checkbox"
                checked={selectedServices.includes(service)}
                onChange={() => handleServiceToggle(service)}
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">{service}</div>
                {selectedServices.includes(service) && (
                  <select
                    value={serviceFrequencies[service] || SERVICE_FREQUENCY_DEFAULTS[service] || 'Monthly'}
                    onChange={(e) => handleFrequencyChange(service, e.target.value)}
                    className="mt-1 text-xs border border-gray-300 rounded px-2 py-1 w-full"
                  >
                    {DELIVERY_FREQUENCIES.map(freq => (
                      <option key={freq} value={freq}>{freq}</option>
                    ))}
                  </select>
                )}
              </div>
            </label>
          ))}
        </div>
        {validationErrors.services && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.services}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Scope Notes
        </label>
        <textarea
          value={formData.scope_notes}
          onChange={(e) => handleInputChange('scope_notes', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe the scope of work, special requirements, or notes..."
        />
      </div>
    </div>
  );
  
  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Email
          </label>
          <input
            type="email"
            value={formData.contact_email}
            onChange={(e) => handleInputChange('contact_email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.contact_email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="client@example.com"
          />
          {validationErrors.contact_email && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.contact_email}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Phone
          </label>
          <input
            type="tel"
            value={formData.contact_phone}
            onChange={(e) => handleInputChange('contact_phone', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.contact_phone ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="+1 (555) 123-4567"
          />
          {validationErrors.contact_phone && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.contact_phone}</p>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Start Date
        </label>
        <input
          type="date"
          value={formData.start_date}
          onChange={(e) => handleInputChange('start_date', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <h4 className="font-medium text-gray-900 mb-3">Summary</h4>
        <div className="space-y-2 text-sm">
          <div><span className="font-medium">Client:</span> {formData.name}</div>
          <div><span className="font-medium">Team:</span> {formData.team}</div>
          <div><span className="font-medium">Type:</span> {formData.client_type}</div>
          <div><span className="font-medium">Services:</span> {selectedServices.join(', ')}</div>
          {formData.contact_email && (
            <div><span className="font-medium">Email:</span> {formData.contact_email}</div>
          )}
          {formData.contact_phone && (
            <div><span className="font-medium">Phone:</span> {formData.contact_phone}</div>
          )}
        </div>
      </div>
    </div>
  );
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={compact 
          ? "w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          : "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        }
      >
        <span className="text-lg">➕</span>
        Add New Client
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add New Client</h2>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    resetForm();
                    if (onCancel) onCancel();
                  }}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>
              {renderStepIndicator()}
            </div>
            
            <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
              <button
                onClick={currentStep === 1 ? () => { setIsOpen(false); resetForm(); if (onCancel) onCancel(); } : handlePrevStep}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {currentStep === 1 ? 'Cancel' : 'Previous'}
              </button>
              
              {currentStep < 3 ? (
                <button
                  onClick={handleNextStep}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {loading ? 'Adding Client...' : 'Add Client'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ClientAdditionForm;