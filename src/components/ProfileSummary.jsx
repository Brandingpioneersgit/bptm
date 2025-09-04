import React, { useState, useEffect, useMemo } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { Section } from '@/shared/components/ui';

// Trophy SVG Component
const TrophyIcon = ({ count }) => (
  <div className="relative inline-flex items-center">
    <svg 
      className="w-8 h-8 text-yellow-500" 
      fill="currentColor" 
      viewBox="0 0 24 24"
    >
      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7V9C15 10.1 15.9 11 17 11V12.5C17 13.6 16.1 14.5 15 14.5V16C17.2 16 19 14.2 19 12V11C20.1 11 21 10.1 21 9ZM9 11V12.5C9 13.6 8.1 14.5 7 14.5V16C9.2 16 11 14.2 11 12V11C12.1 11 13 10.1 13 9V7L7 7V9C7 10.1 7.9 11 9 11Z"/>
    </svg>
    {count > 0 && (
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
        {count}
      </span>
    )}
  </div>
);

// Image URL Validator Component
const ImageUploader = ({ value, onChange, error }) => {
  const [preview, setPreview] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateImageUrl = async (url) => {
    if (!url) {
      setPreview(null);
      setValidationError('');
      return;
    }

    setIsValidating(true);
    setValidationError('');

    try {
      // Check if URL is valid
      new URL(url);
      
      // Check if it's an image by trying to load it
      const img = new Image();
      img.onload = () => {
        setPreview(url);
        setValidationError('');
        setIsValidating(false);
      };
      img.onerror = () => {
        setPreview(null);
        setValidationError('Invalid image URL or image cannot be loaded');
        setIsValidating(false);
      };
      img.src = url;
    } catch (err) {
      setPreview(null);
      setValidationError('Invalid URL format');
      setIsValidating(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateImageUrl(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value]);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Image URL *
        </label>
        <input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://drive.google.com/... or any public image URL"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error || validationError ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {(error || validationError) && (
          <p className="text-red-500 text-sm mt-1">{error || validationError}</p>
        )}
      </div>
      
      {/* Preview */}
      <div className="flex items-center space-x-4">
        {isValidating && (
          <div className="flex items-center space-x-2 text-blue-600">
            <LoadingSpinner size="sm" />
            <span className="text-sm">Validating image...</span>
          </div>
        )}
        
        {preview && !isValidating && (
          <div className="flex items-center space-x-3">
            <img 
              src={preview} 
              alt="Profile preview" 
              className="w-16 h-16 rounded-full object-cover border-2 border-green-500"
            />
            <span className="text-green-600 text-sm font-medium">✓ Valid image</span>
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-500">
        💡 Tip: For Google Drive images, make sure the link is public and use the direct image URL
      </div>
    </div>
  );
};

// Testimonial Badge Logic Component
const TestimonialBadges = ({ testimonials = [] }) => {
  const badgeCount = Math.floor(testimonials.length / 2);
  
  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">
          Testimonial URLs Added: {testimonials.length}
        </span>
        {badgeCount > 0 && (
          <div className="flex items-center space-x-1">
            {Array.from({ length: badgeCount }, (_, i) => (
              <TrophyIcon key={i} count={i + 1} />
            ))}
          </div>
        )}
      </div>
      
      {testimonials.length > 0 && testimonials.length % 2 === 1 && (
        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
          {2 - (testimonials.length % 2)} more needed for next badge
        </div>
      )}
    </div>
  );
};

// Dynamic Add More Component
const DynamicList = ({ items = [], onChange, placeholder, label, maxItems = 10 }) => {
  const addItem = () => {
    if (items.length < maxItems) {
      onChange([...items, '']);
    }
  };

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, value) => {
    const updated = [...items];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <input
            type="url"
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
      
      {items.length < maxItems && (
        <button
          type="button"
          onClick={addItem}
          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
        >
          + Add {label}
        </button>
      )}
    </div>
  );
};

export const ProfileSummary = ({ employee, onUpdate, isEditing = false }) => {
  const supabase = useSupabase();
  const { notify } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [tools, setTools] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    hire_date: '',
    profile_image_url: '',
    current_projects: [],
    current_clients: [],
    key_skills: [],
    tools_assigned: [],
    testimonials: [],
    ...employee
  });

  // Fetch clients and tools from database
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // Fetch clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, name, company_name')
          .eq('status', 'active');
        
        if (clientsError) throw clientsError;
        setClients(clientsData || []);

        // Fetch tools
        const { data: toolsData, error: toolsError } = await supabase
          .from('tools')
          .select('id, name, category')
          .eq('status', 'active');
        
        if (toolsError) throw toolsError;
        setTools(toolsData || []);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        notify('Failed to load clients and tools data', 'error');
      }
    };

    fetchDropdownData();
  }, [supabase, notify]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('employees')
        .upsert({
          ...formData,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      notify('Profile updated successfully!', 'success');
      if (onUpdate) onUpdate(formData);
    } catch (error) {
      console.error('Error saving profile:', error);
      notify('Failed to save profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate testimonial badges
  const testimonialBadges = Math.floor((formData.testimonials?.length || 0) / 2);

  if (!isEditing) {
    // Display mode
    return (
      <Section title="👤 Employee Profile" className="bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Image and Basic Info */}
          <div className="lg:col-span-1">
            <div className="text-center space-y-4">
              {formData.profile_image_url ? (
                <img 
                  src={formData.profile_image_url} 
                  alt={formData.name}
                  className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-blue-500 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full mx-auto bg-gray-200 flex items-center justify-center text-gray-500 text-4xl">
                  👤
                </div>
              )}
              
              <div>
                <h3 className="text-xl font-bold text-gray-900">{formData.name}</h3>
                <p className="text-gray-600">{formData.designation}</p>
                <p className="text-sm text-gray-500">{formData.department}</p>
              </div>
              
              {/* Testimonial Badges */}
              {testimonialBadges > 0 && (
                <div className="flex justify-center">
                  <TestimonialBadges testimonials={formData.testimonials || []} />
                </div>
              )}
            </div>
          </div>
          
          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{formData.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="text-gray-900">{formData.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                <p className="text-gray-900">{formData.hire_date ? new Date(formData.hire_date).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            
            {/* Current Projects/Clients */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Current Clients</h4>
                <div className="space-y-1">
                  {(formData.current_clients || []).map((clientId, index) => {
                    const client = clients.find(c => c.id === clientId);
                    return (
                      <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-2 mb-1">
                        {client?.name || clientId}
                      </span>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Key Skills & Tools</h4>
                <div className="space-y-1">
                  {(formData.key_skills || []).map((skill, index) => (
                    <span key={index} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2 mb-1">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Video Testimonials */}
            {(formData.testimonials?.length || 0) > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Video Testimonials</h4>
                <TestimonialBadges testimonials={formData.testimonials || []} />
                <div className="mt-2 text-sm text-gray-600">
                  {formData.testimonials.length} testimonial{formData.testimonials.length !== 1 ? 's' : ''} uploaded
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>
    );
  }

  // Edit mode
  return (
    <Section title="✏️ Edit Profile" className="bg-white">
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
            <select
              value={formData.department || ''}
              onChange={(e) => updateField('department', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Department</option>
              <option value="Web">Web</option>
              <option value="Marketing">Marketing</option>
              <option value="Operations">Operations</option>
              <option value="HR">HR</option>
              <option value="Sales">Sales</option>
              <option value="Accounts">Accounts</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Designation *</label>
            <input
              type="text"
              value={formData.designation || ''}
              onChange={(e) => updateField('designation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Senior Developer, Marketing Executive"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date</label>
            <input
              type="date"
              value={formData.hire_date || ''}
              onChange={(e) => updateField('hire_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Profile Image */}
        <ImageUploader
          value={formData.profile_image_url}
          onChange={(value) => updateField('profile_image_url', value)}
        />
        
        {/* Current Clients */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Clients</label>
          <select
            multiple
            value={formData.current_clients || []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              updateField('current_clients', selected);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
          >
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name} {client.company_name && `(${client.company_name})`}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple clients</p>
        </div>
        
        {/* Key Skills */}
        <DynamicList
          items={formData.key_skills || []}
          onChange={(items) => updateField('key_skills', items)}
          placeholder="e.g., React, SEO, Content Writing"
          label="Key Skills"
          maxItems={10}
        />
        
        {/* Tools Assigned */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tools Assigned</label>
          <select
            multiple
            value={formData.tools_assigned || []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              updateField('tools_assigned', selected);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
          >
            {tools.map(tool => (
              <option key={tool.id} value={tool.id}>
                {tool.name} {tool.category && `(${tool.category})`}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple tools</p>
        </div>
        
        {/* Video Testimonials */}
        <div>
          <DynamicList
            items={formData.testimonials || []}
            onChange={(items) => updateField('testimonials', items)}
            placeholder="https://youtube.com/watch?v=... (BrandingPioneers channel)"
            label="Video Testimonials"
            maxItems={20}
          />
          <TestimonialBadges testimonials={formData.testimonials || []} />
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <strong>Testimonial Badge Logic:</strong> You earn 1 trophy badge for every 2 testimonials uploaded.
              Testimonials must be uploaded to the BrandingPioneers YouTube channel.
            </p>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading && <LoadingSpinner size="sm" />}
            <span>{loading ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </div>
    </Section>
  );
};

export default ProfileSummary;