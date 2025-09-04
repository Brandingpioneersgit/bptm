import React from 'react';
import { industryOptions, healthcareTypes, getCustomerTerm } from '../data/industryOptions';

/**
 * Step 1: Basic Information Step Component
 * Handles client name, industry, business type, and contact information
 */
const BasicInformationStep = ({ formData, handleInputChange, errors = {} }) => {
  
  const handleNestedChange = (section, field, value) => {
    const updatedSection = { ...formData[section], [field]: value };
    handleInputChange(section, updatedSection);
  };

  const customerTerm = getCustomerTerm(formData.industry);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Basic Information</h2>
      
      {/* Client Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Client Name *
        </label>
        <input
          type="text"
          value={formData.clientName}
          onChange={(e) => handleInputChange('clientName', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.clientName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter client company name"
          required
        />
        {errors.clientName && (
          <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>
        )}
      </div>

      {/* Industry Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Industry *
        </label>
        <select
          value={formData.industry}
          onChange={(e) => handleInputChange('industry', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.industry ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        >
          <option value="">Select Industry</option>
          {industryOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.industry && (
          <p className="mt-1 text-sm text-red-600">{errors.industry}</p>
        )}
      </div>

      {/* Business Type (Healthcare specific) */}
      {formData.industry === 'healthcare' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Healthcare Business Type *
          </label>
          <select
            value={formData.businessType}
            onChange={(e) => handleInputChange('businessType', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.businessType ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            <option value="">Select Business Type</option>
            {healthcareTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.businessType && (
            <p className="mt-1 text-sm text-red-600">{errors.businessType}</p>
          )}
        </div>
      )}

      {/* Contact Person */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Primary Contact Person *
        </label>
        <input
          type="text"
          value={formData.contactPerson}
          onChange={(e) => handleInputChange('contactPerson', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.contactPerson ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter primary contact name"
          required
        />
        {errors.contactPerson && (
          <p className="mt-1 text-sm text-red-600">{errors.contactPerson}</p>
        )}
      </div>

      {/* Contact Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact Email *
        </label>
        <input
          type="email"
          value={formData.contactEmail}
          onChange={(e) => handleInputChange('contactEmail', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.contactEmail ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter contact email"
          required
        />
        {errors.contactEmail && (
          <p className="mt-1 text-sm text-red-600">{errors.contactEmail}</p>
        )}
      </div>

      {/* Contact Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact Phone *
        </label>
        <input
          type="tel"
          value={formData.contactPhone}
          onChange={(e) => handleInputChange('contactPhone', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.contactPhone ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter contact phone number"
          required
        />
        {errors.contactPhone && (
          <p className="mt-1 text-sm text-red-600">{errors.contactPhone}</p>
        )}
      </div>

      {/* Current Website */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Website (if any)
        </label>
        <input
          type="url"
          value={formData.currentWebsite}
          onChange={(e) => handleInputChange('currentWebsite', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://www.example.com"
        />
        <p className="mt-1 text-xs text-gray-500">
          Include https:// or http:// in the URL
        </p>
      </div>

      {/* Brief Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Brief Description of Your Business
        </label>
        <textarea
          value={formData.businessDescription}
          onChange={(e) => handleInputChange('businessDescription', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="4"
          placeholder={`Tell us about your business and what services you provide to your ${customerTerm.toLowerCase()}s...`}
        />
      </div>

      {/* Business Hours */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Hours
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Weekdays</label>
            <input
              type="text"
              value={formData.businessHours?.weekdays || ''}
              onChange={(e) => handleNestedChange('businessHours', 'weekdays', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 9:00 AM - 5:00 PM"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Weekends</label>
            <input
              type="text"
              value={formData.businessHours?.weekends || ''}
              onChange={(e) => handleNestedChange('businessHours', 'weekends', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 10:00 AM - 2:00 PM or Closed"
            />
          </div>
        </div>
      </div>

      {/* Information Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Getting Started:</strong> This information helps us understand your business better and create a customized onboarding experience. All fields marked with * are required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInformationStep;