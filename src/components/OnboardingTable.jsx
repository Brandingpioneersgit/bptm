import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/database/supabaseClient';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useToast } from '@/shared/components/Toast';
import { InputSanitizer } from '@/shared/utils/securityUtils';

const OnboardingTable = () => {
  const { user } = useUnifiedAuth();
  const { showToast } = useToast();
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    userType: '',
    roleLabel: '',
    managerId: null,
    timezone: 'Asia/Kolkata'
  });
  
  const [entityMappings, setEntityMappings] = useState([]);
  const [availableEntities, setAvailableEntities] = useState([]);
  const [availableManagers, setAvailableManagers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  
  // Load initial data
  useEffect(() => {
    if (user) {
      loadOnboardingData();
    }
  }, [user]);
  
  const loadOnboardingData = async () => {
    try {
      setIsLoading(true);
      
      // Load user profile
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        userType: user.user_type || '',
        roleLabel: user.role_label || '',
        managerId: user.manager_id || null,
        timezone: user.timezone || 'Asia/Kolkata'
      });
      
      // Load existing entity mappings
      const { data: mappings, error: mappingsError } = await supabase
        .from('user_entity_mappings')
        .select(`
          *,
          entities (*)
        `)
        .eq('user_id', authState.user.id);
      
      if (mappingsError) throw mappingsError;
      
      setEntityMappings(mappings || []);
      
      // Check if onboarding is locked (has any approved monthly rows)
      const { data: monthlyRows, error: monthlyError } = await supabase
        .from('monthly_rows')
        .select('id')
        .eq('user_id', authState.user.id)
        .eq('status', 'approved')
        .limit(1);
      
      if (monthlyError) throw monthlyError;
      
      setIsLocked(monthlyRows && monthlyRows.length > 0);
      
      // Load available entities
      const { data: entities, error: entitiesError } = await supabase
        .from('entities')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (entitiesError) throw entitiesError;
      
      setAvailableEntities(entities || []);
      
      // Load available managers
      const { data: managers, error: managersError } = await supabase
        .from('users')
        .select('id, name, role_label')
        .in('role_label', ['Manager', 'Supervisor', 'Team Lead'])
        .neq('id', authState.user.id)
        .order('name');
      
      if (managersError) throw managersError;
      
      setAvailableManagers(managers || []);
      
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
      showToast('Failed to load onboarding data', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleProfileChange = (field, value) => {
    if (isLocked) return;
    setProfile(prev => ({ ...prev, [field]: value }));
  };
  
  const addEntityMapping = () => {
    if (isLocked) return;
    
    const newMapping = {
      id: `temp_${Date.now()}`,
      entity_type: 'Client',
      entity_id: '',
      entity_name: '',
      scope_summary: '',
      start_date: new Date().toISOString().split('T')[0],
      expected_projects: 1,
      expected_units: 0,
      active: true,
      isNew: true
    };
    
    setEntityMappings(prev => [...prev, newMapping]);
  };
  
  const updateEntityMapping = (index, field, value) => {
    if (isLocked) return;
    
    setEntityMappings(prev => prev.map((mapping, i) => 
      i === index ? { ...mapping, [field]: value } : mapping
    ));
  };
  
  const removeEntityMapping = (index) => {
    if (isLocked) return;
    setEntityMappings(prev => prev.filter((_, i) => i !== index));
  };
  
  const createNewEntity = async (entityData) => {
    try {
      const { data, error } = await supabase
        .from('entities')
        .insert({
          entity_type: entityData.entity_type,
          name: entityData.name,
          scope_summary: entityData.scope_summary,
          start_date: entityData.start_date
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setAvailableEntities(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Failed to create entity:', error);
      throw error;
    }
  };
  
  const saveOnboarding = async () => {
    if (isLocked) {
      showToast('Onboarding is locked and cannot be modified', 'warning');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Validate profile data
      if (!profile.name || !profile.email || !profile.roleLabel) {
        throw new Error('Please fill in all required profile fields');
      }
      
      // Validate entity mappings
      for (const mapping of entityMappings) {
        if (!mapping.entity_id && !mapping.entity_name) {
          throw new Error('Please select or create an entity for all mappings');
        }
        if (mapping.expected_projects < 0 || mapping.expected_units < 0) {
          throw new Error('Expected projects and units must be non-negative');
        }
      }
      
      // Update user profile
      const { error: profileError } = await supabase
        .from('users')
        .update({
          name: InputSanitizer.sanitizeInput(profile.name.trim()),
          phone: profile.phone ? InputSanitizer.sanitizePhone(profile.phone.trim()) : null,
          role_label: InputSanitizer.sanitizeInput(profile.roleLabel.trim()),
          manager_id: profile.managerId,
          timezone: profile.timezone
        })
        .eq('id', authState.user.id);
      
      if (profileError) throw profileError;
      
      // Process entity mappings
      for (const mapping of entityMappings) {
        let entityId = mapping.entity_id;
        
        // Create new entity if needed
        if (!entityId && mapping.entity_name) {
          const newEntity = await createNewEntity({
            entity_type: mapping.entity_type,
            name: mapping.entity_name,
            scope_summary: mapping.scope_summary,
            start_date: mapping.start_date
          });
          entityId = newEntity.id;
        }
        
        if (entityId) {
          // Insert or update mapping
          const mappingData = {
            user_id: authState.user.id,
            entity_id: entityId,
            expected_projects: mapping.expected_projects || 0,
            expected_units: mapping.expected_units || 0,
            active: mapping.active !== false
          };
          
          if (mapping.isNew) {
            const { error: insertError } = await supabase
              .from('user_entity_mappings')
              .insert(mappingData);
            
            if (insertError) throw insertError;
          } else {
            const { error: updateError } = await supabase
              .from('user_entity_mappings')
              .update(mappingData)
              .eq('id', mapping.id);
            
            if (updateError) throw updateError;
          }
        }
      }
      
      showToast('Onboarding saved successfully', 'success');
      
      // Reload data to reflect changes
      await loadOnboardingData();
      
    } catch (error) {
      console.error('Failed to save onboarding:', error);
      showToast(error.message || 'Failed to save onboarding', 'error');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading onboarding data...</span>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Onboarding Profile</h1>
            <p className="text-gray-600 mt-1">
              Complete your profile and entity mappings for the monthly operating system
            </p>
          </div>
          {isLocked && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-yellow-800">Locked</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Profile is locked due to approved monthly submissions
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleProfileChange('name', e.target.value)}
              disabled={isLocked}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="Enter your full name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => handleProfileChange('phone', e.target.value)}
              disabled={isLocked}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="Enter your phone number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Type
            </label>
            <input
              type="text"
              value={profile.userType}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Label *
            </label>
            <input
              type="text"
              value={profile.roleLabel}
              onChange={(e) => handleProfileChange('roleLabel', e.target.value)}
              disabled={isLocked}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="e.g., Developer, Manager, Sales Executive"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manager
            </label>
            <select
              value={profile.managerId || ''}
              onChange={(e) => handleProfileChange('managerId', e.target.value || null)}
              disabled={isLocked}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select a manager</option>
              {availableManagers.map(manager => (
                <option key={manager.id} value={manager.id}>
                  {manager.name} ({manager.role_label})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Entity Mappings Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Entity Mappings</h2>
          {!isLocked && (
            <button
              onClick={addEntityMapping}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Mapping
            </button>
          )}
        </div>
        
        {entityMappings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No entity mappings configured.</p>
            {!isLocked && (
              <p className="text-sm mt-2">Click "Add Mapping" to assign yourself to clients or projects.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {entityMappings.map((mapping, index) => (
              <div key={mapping.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entity Type
                    </label>
                    <select
                      value={mapping.entity_type || 'Client'}
                      onChange={(e) => updateEntityMapping(index, 'entity_type', e.target.value)}
                      disabled={isLocked}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="Client">Client</option>
                      <option value="Project">Project</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entity
                    </label>
                    <select
                      value={mapping.entity_id || ''}
                      onChange={(e) => {
                        const entityId = e.target.value;
                        const entity = availableEntities.find(e => e.id === entityId);
                        updateEntityMapping(index, 'entity_id', entityId);
                        if (entity) {
                          updateEntityMapping(index, 'entity_name', entity.name);
                        }
                      }}
                      disabled={isLocked}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select or create new</option>
                      {availableEntities
                        .filter(e => e.entity_type === mapping.entity_type)
                        .map(entity => (
                          <option key={entity.id} value={entity.id}>
                            {entity.name}
                          </option>
                        ))
                      }
                    </select>
                    {!mapping.entity_id && (
                      <input
                        type="text"
                        value={mapping.entity_name || ''}
                        onChange={(e) => updateEntityMapping(index, 'entity_name', e.target.value)}
                        disabled={isLocked}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 mt-2"
                        placeholder="Or enter new entity name"
                      />
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Projects
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={mapping.expected_projects || 0}
                      onChange={(e) => updateEntityMapping(index, 'expected_projects', parseInt(e.target.value) || 0)}
                      disabled={isLocked}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Units
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={mapping.expected_units || 0}
                      onChange={(e) => updateEntityMapping(index, 'expected_units', parseInt(e.target.value) || 0)}
                      disabled={isLocked}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scope Summary
                  </label>
                  <textarea
                    value={mapping.scope_summary || ''}
                    onChange={(e) => updateEntityMapping(index, 'scope_summary', e.target.value)}
                    disabled={isLocked}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="Brief description of your role/responsibilities for this entity"
                  />
                </div>
                
                {!isLocked && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => removeEntityMapping(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove Mapping
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Save Button */}
      {!isLocked && (
        <div className="flex justify-end">
          <button
            onClick={saveOnboarding}
            disabled={isSaving}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Onboarding'}
          </button>
        </div>
      )}
    </div>
  );
};

export default OnboardingTable;