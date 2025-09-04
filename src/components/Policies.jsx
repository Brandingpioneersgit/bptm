import React from 'react';

const Policies = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Company Policies</h1>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-3">📋 Policy Information</h2>
              <p className="text-blue-800">
                This page will contain company policies and guidelines. The content is currently being prepared and will be available soon.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🏢 HR Policies</h3>
                <p className="text-gray-600">Employee handbook, code of conduct, and HR guidelines.</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🔒 Security Policies</h3>
                <p className="text-gray-600">Data protection, access control, and security protocols.</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">💼 Work Policies</h3>
                <p className="text-gray-600">Remote work guidelines, attendance, and performance standards.</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📞 Communication Policies</h3>
                <p className="text-gray-600">Internal communication guidelines and protocols.</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3">⚠️ Important Notice</h3>
              <p className="text-yellow-800">
                For immediate policy questions or clarifications, please contact the HR department.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Policies;