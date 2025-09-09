/**
 * Test Payment Proof Validation Logic
 * This script tests the payment validation functions directly
 */

// Import the isDriveUrl function logic
const isDriveUrl = (u) => /https?:\/\/(drive|docs)\.google\.com\//i.test(u || "");

// Test validation function from the components
const validatePaymentProof = (formData) => {
  const errors = [];
  if (formData.paymentStatus && formData.paymentProofUrl) {
    Object.keys(formData.paymentStatus).forEach(clientId => {
      const status = formData.paymentStatus[clientId];
      const proofUrl = formData.paymentProofUrl[clientId] || '';
      const clientName = `Client ${clientId}`;
      
      if ((status === 'completed' || status === 'partial')) {
        if (!proofUrl.trim()) {
          errors.push(`${clientName}: Payment proof URL is required for ${status} status`);
        } else if (!isDriveUrl(proofUrl)) {
          errors.push(`${clientName}: Payment proof must be a valid Google Drive URL`);
        }
      }
    });
  }
  return errors;
};

// Test scenarios
const testScenarios = [
  {
    name: 'Valid completed payment with Google Drive proof',
    formData: {
      paymentStatus: { 'client1': 'completed' },
      paymentProofUrl: { 'client1': 'https://drive.google.com/file/d/test123/view' }
    },
    shouldPass: true
  },
  {
    name: 'Invalid completed payment without proof URL',
    formData: {
      paymentStatus: { 'client1': 'completed' },
      paymentProofUrl: { 'client1': '' }
    },
    shouldPass: false
  },
  {
    name: 'Invalid completed payment with non-Google Drive URL',
    formData: {
      paymentStatus: { 'client1': 'completed' },
      paymentProofUrl: { 'client1': 'https://example.com/receipt.pdf' }
    },
    shouldPass: false
  },
  {
    name: 'Valid partial payment with Google Docs proof',
    formData: {
      paymentStatus: { 'client1': 'partial' },
      paymentProofUrl: { 'client1': 'https://docs.google.com/document/d/test456/edit' }
    },
    shouldPass: true
  },
  {
    name: 'Valid pending payment without proof (allowed)',
    formData: {
      paymentStatus: { 'client1': 'pending' },
      paymentProofUrl: { 'client1': '' }
    },
    shouldPass: true
  },
  {
    name: 'Invalid partial payment without proof URL',
    formData: {
      paymentStatus: { 'client1': 'partial' },
      paymentProofUrl: { 'client1': '' }
    },
    shouldPass: false
  }
];

console.log('🧪 Testing Payment Proof Validation Logic\n');

let passedTests = 0;
let totalTests = testScenarios.length;

testScenarios.forEach((scenario, index) => {
  const errors = validatePaymentProof(scenario.formData);
  const passed = errors.length === 0;
  const testResult = passed === scenario.shouldPass;
  
  const status = testResult ? '✅ PASS' : '❌ FAIL';
  console.log(`Test ${index + 1}: ${status} - ${scenario.name}`);
  
  if (errors.length > 0) {
    console.log(`   Validation Errors: ${errors.join(', ')}`);
  }
  
  if (!testResult) {
    console.log(`   Expected: ${scenario.shouldPass ? 'Pass' : 'Fail'}, Got: ${passed ? 'Pass' : 'Fail'}`);
  }
  
  if (testResult) passedTests++;
  console.log('');
});

console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('✅ All payment proof validation tests passed!');
  console.log('\n🔍 Analysis: The validation logic is working correctly.');
  console.log('The issue might be:');
  console.log('1. The validation is being bypassed in some UI flow');
  console.log('2. There\'s a direct database update that skips frontend validation');
  console.log('3. The test is accessing a different form or component');
} else {
  console.log('❌ Some validation tests failed - logic needs to be fixed');
}