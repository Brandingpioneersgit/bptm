/**
 * Enhanced Client Creation System
 * 
 * This module provides robust client creation with:
 * - Comprehensive validation
 * - Error handling and user feedback
 * - Loading states and confirmations
 * - Rollback capabilities
 * - Real-time duplicate detection
 */

import React, { useState, useCallback, useRef } from 'react';
import { unifiedValidator } from '@/shared/utils/unifiedValidation.js';

// Legacy validation utilities - use unifiedValidator for new code
export const ClientValidation = {
  validateClientName: (name) => {
    const result = unifiedValidator.validateField('client.name', name);
    return result.isValid ? [] : result.errors;
  },

  validateServices: (services) => {
    const result = unifiedValidator.validateField('client.services', services);
    return result.isValid ? [] : result.errors;
  },

  validateClientData: (clientData, existingClients = []) => {
    const validation = unifiedValidator.validateClientData(clientData, existingClients);
    return {
      errors: validation.errors,
      warnings: validation.warnings
    };
  }
};

// Note: Validation logic has been moved to unifiedValidation.js

// Enhanced client creation hook
export const useEnhancedClientCreation = (supabase, onSuccess, onError) => {
  const [isCreating, setIsCreating] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [validationWarnings, setValidationWarnings] = useState([]);
  const [creationStatus, setCreationStatus] = useState(null);
  const lastCreationRef = useRef(null);

  const createClient = useCallback(async (clientData, selectedServices = [], serviceFrequencies = {}) => {
    // Prevent duplicate creation attempts
    if (isCreating) {
      console.log('⚠️ Client creation already in progress');
      return { success: false, error: 'Creation already in progress' };
    }

    setIsCreating(true);
    setCreationStatus('validating');
    setValidationErrors({});
    setValidationWarnings([]);

    try {
      // Step 1: Validate client data
      console.log('🔍 Validating client data...');
      
      // Get existing clients for duplicate check
      const existingClients = await supabase
        .from('clients')
        .select('name')
        .then(({ data }) => data || []);

      // Process services
      const processedServices = selectedServices.map(service => ({
        service,
        frequency: serviceFrequencies[service] || 'Monthly',
        notes: '',
        added_date: new Date().toISOString()
      }));

      const dataToValidate = {
        ...clientData,
        services: processedServices
      };

      const validation = ClientValidation.validateClientData(dataToValidate, existingClients);
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setValidationWarnings(validation.warnings);
        setCreationStatus('validation_failed');
        return { 
          success: false, 
          error: 'Validation failed', 
          validationErrors: validation.errors,
          validationWarnings: validation.warnings 
        };
      }

      setValidationWarnings(validation.warnings);
      
      // Step 2: Create the client
      setCreationStatus('creating');
      console.log('💾 Creating client in database...');

      const clientToSave = {
        name: clientData.name.trim(),
        team: clientData.team,
        client_type: clientData.client_type,
        status: 'Active',
        services: processedServices,
        contact_email: clientData.contact_email?.trim() || '',
        contact_phone: clientData.contact_phone?.trim() || '',
        scope_notes: clientData.scope_notes?.trim() || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Create with transaction safety
      const { data: createdClient, error: createError } = await supabase
        .from('clients')
        .insert([clientToSave])
        .select()
        .single();

      if (createError) {
        console.error('❌ Database creation error:', createError);
        throw new Error(`Database error: ${createError.message}`);
      }

      // Step 3: Verify creation
      setCreationStatus('verifying');
      console.log('✅ Verifying client creation...');

      const { data: verificationData, error: verifyError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', createdClient.id)
        .single();

      if (verifyError || !verificationData) {
        console.error('❌ Verification failed:', verifyError);
        
        // Attempt rollback
        try {
          await supabase
            .from('clients')
            .delete()
            .eq('id', createdClient.id);
          console.log('🔄 Rolled back failed client creation');
        } catch (rollbackError) {
          console.error('❌ Rollback failed:', rollbackError);
        }
        
        throw new Error('Client creation could not be verified');
      }

      // Step 4: Success
      setCreationStatus('success');
      lastCreationRef.current = {
        client: verificationData,
        timestamp: Date.now()
      };

      console.log('🎉 Client created successfully:', verificationData.name);
      
      if (onSuccess) {
        onSuccess(verificationData);
      }

      return {
        success: true,
        client: verificationData,
        message: `Client "${verificationData.name}" created successfully`
      };

    } catch (error) {
      console.error('❌ Client creation failed:', error);
      
      setCreationStatus('error');
      const errorMessage = error.message || 'Unknown error occurred';
      
      if (onError) {
        onError(error);
      }

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsCreating(false);
      // Clear status after delay
      setTimeout(() => {
        setCreationStatus(null);
      }, 5000);
    }
  }, [isCreating, supabase, onSuccess, onError]);

  const resetValidation = useCallback(() => {
    setValidationErrors({});
    setValidationWarnings([]);
    setCreationStatus(null);
  }, []);

  return {
    createClient,
    isCreating,
    validationErrors,
    validationWarnings,
    creationStatus,
    resetValidation,
    lastCreation: lastCreationRef.current
  };
};

// Status indicator component
export const ClientCreationStatus = ({ status, errors, warnings, className = '' }) => {
  if (!status && Object.keys(errors).length === 0 && warnings.length === 0) {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'validating':
        return {
          icon: '🔍',
          text: 'Validating client data...',
          color: 'bg-blue-50 border-blue-200 text-blue-700'
        };
      case 'creating':
        return {
          icon: '💾',
          text: 'Creating client in database...',
          color: 'bg-blue-50 border-blue-200 text-blue-700'
        };
      case 'verifying':
        return {
          icon: '✅',
          text: 'Verifying creation...',
          color: 'bg-blue-50 border-blue-200 text-blue-700'
        };
      case 'success':
        return {
          icon: '🎉',
          text: 'Client created successfully!',
          color: 'bg-green-50 border-green-200 text-green-700'
        };
      case 'error':
        return {
          icon: '❌',
          text: 'Creation failed',
          color: 'bg-red-50 border-red-200 text-red-700'
        };
      case 'validation_failed':
        return {
          icon: '⚠️',
          text: 'Please fix validation errors',
          color: 'bg-yellow-50 border-yellow-200 text-yellow-700'
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className={`border rounded-lg p-3 ${className}`}>
      {statusConfig && (
        <div className={`flex items-center gap-2 p-2 rounded ${statusConfig.color} mb-2`}>
          <span>{statusConfig.icon}</span>
          <span className="text-sm font-medium">{statusConfig.text}</span>
          {(status === 'creating' || status === 'validating' || status === 'verifying') && (
            <div className="ml-auto">
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      )}

      {/* Validation Errors */}
      {Object.keys(errors).length > 0 && (
        <div className="mb-2">
          <h4 className="text-sm font-medium text-red-700 mb-2">❌ Please fix these errors:</h4>
          <ul className="list-disc list-inside space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field} className="text-sm text-red-600">
                <strong>{field.replace('_', ' ')}:</strong> {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation Warnings */}
      {warnings.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-yellow-700 mb-2">⚠️ Warnings:</h4>
          <ul className="list-disc list-inside space-y-1">
            {warnings.map((warning, index) => (
              <li key={index} className="text-sm text-yellow-600">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Real-time duplicate name checker
export const DuplicateNameChecker = ({ clientName, existingClients, onDuplicateFound }) => {
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  React.useEffect(() => {
    if (!clientName || !clientName.trim()) {
      setIsDuplicate(false);
      setSuggestions([]);
      return;
    }

    const normalizedName = clientName.trim().toLowerCase();
    const duplicate = existingClients.some(client => 
      client.name.toLowerCase().trim() === normalizedName
    );

    setIsDuplicate(duplicate);

    if (duplicate) {
      // Generate suggestions
      const baseName = clientName.trim();
      const newSuggestions = [
        `${baseName} (New)`,
        `${baseName} 2`,
        `${baseName} Corp`,
        `${baseName} LLC`
      ].filter(suggestion => 
        !existingClients.some(client => 
          client.name.toLowerCase().trim() === suggestion.toLowerCase()
        )
      ).slice(0, 3);

      setSuggestions(newSuggestions);
      
      if (onDuplicateFound) {
        onDuplicateFound(duplicate, newSuggestions);
      }
    } else {
      setSuggestions([]);
      if (onDuplicateFound) {
        onDuplicateFound(false, []);
      }
    }
  }, [clientName, existingClients, onDuplicateFound]);

  if (!isDuplicate) {
    return null;
  }

  return (
    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center gap-2 text-red-700 text-sm font-medium mb-2">
        <span>⚠️</span>
        <span>A client with this name already exists</span>
      </div>
      
      {suggestions.length > 0 && (
        <div>
          <p className="text-xs text-red-600 mb-2">Suggested alternatives:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  // This would be handled by parent component
                  const event = new CustomEvent('suggestionClick', { detail: suggestion });
                  document.dispatchEvent(event);
                }}
                className="px-2 py-1 text-xs bg-white border border-red-300 rounded hover:bg-red-50 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};