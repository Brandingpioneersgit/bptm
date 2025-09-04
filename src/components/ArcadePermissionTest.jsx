import React, { useState } from 'react';
import { checkArcadeEligibility } from '../utils/arcadeValidation';

const ArcadePermissionTest = () => {
  const [testResults, setTestResults] = useState([]);

  const testUsers = [
    { id: 1, name: 'John Manager', role: 'manager', employment_type: 'full_time', department: 'management' },
    { id: 2, name: 'Jane Employee', role: 'employee', employment_type: 'full_time', department: 'operations' },
    { id: 3, name: 'Bob Intern', role: 'intern', employment_type: 'intern', department: 'operations' },
    { id: 4, name: 'Alice HR', role: 'hr', employment_type: 'full_time', department: 'hr' },
    { id: 5, name: 'Carol Part-time', role: 'employee', employment_type: 'part_time', department: 'operations' }
  ];

  const runPermissionTests = () => {
    const results = testUsers.map(user => {
      const eligibility = checkArcadeEligibility(user);
      return {
        user: user.name,
        role: user.role,
        employmentType: user.employment_type,
        department: user.department,
        isEligible: eligibility.isEligible,
        reason: eligibility.reason || 'Eligible for arcade program'
      };
    });
    setTestResults(results);
  };

  const getStatusColor = (isEligible) => {
    return isEligible ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  };

  const getStatusIcon = (isEligible) => {
    return isEligible ? '✅' : '❌';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🎮 Arcade Permission Test</h2>
        <p className="text-gray-600 mb-4">
          This test verifies that arcade permissions work correctly for different user types.
        </p>
        <button
          onClick={runPermissionTests}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Run Permission Tests
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Test Results:</h3>
          <div className="grid gap-4">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  result.isEligible ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getStatusIcon(result.isEligible)}</span>
                    <div>
                      <h4 className="font-semibold text-gray-800">{result.user}</h4>
                      <p className="text-sm text-gray-600">
                        {result.role} • {result.employmentType} • {result.department}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(result.isEligible)}`}>
                    {result.isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-700">
                    <strong>Reason:</strong> {result.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Expected Results:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✅ Manager (full-time, management) - Should be eligible</li>
              <li>✅ Employee (full-time, operations) - Should be eligible</li>
              <li>❌ Intern - Should be excluded from arcade program</li>
              <li>❌ HR - Should be excluded from arcade program</li>
              <li>❌ Part-time Employee - Should be excluded (non-full-time)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArcadePermissionTest;