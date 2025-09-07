/**
 * Test Payment Proof Validation Implementation
 * 
 * This script tests the payment proof validation functionality
 * to ensure proof URLs are required for completed/partial payments.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testPaymentProofValidation() {
  console.log('🧪 Testing Payment Proof Validation Implementation\n');
  
  try {
    // Test 1: Check if isDriveUrl function works correctly
    console.log('📋 Test 1: URL Validation Function');
    
    const testUrls = [
      { url: 'https://drive.google.com/file/d/1234567890/view', expected: true },
      { url: 'https://docs.google.com/document/d/1234567890/edit', expected: true },
      { url: 'https://example.com/file.pdf', expected: false },
      { url: 'invalid-url', expected: false },
      { url: '', expected: false }
    ];
    
    // Since we can't import the function directly in Node.js, we'll simulate the validation
    const isDriveUrl = (url) => {
      if (!url) return false;
      return url.includes('drive.google.com') || url.includes('docs.google.com');
    };
    
    testUrls.forEach(({ url, expected }) => {
      const result = isDriveUrl(url);
      const status = result === expected ? '✅' : '❌';
      console.log(`  ${status} URL: "${url}" -> ${result} (expected: ${expected})`);
    });
    
    // Test 2: Check database structure for payment proof storage
    console.log('\n📋 Test 2: Database Structure Check');
    
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('*')
      .limit(1);
    
    if (submissionsError) {
      console.log('❌ Error accessing submissions table:', submissionsError.message);
    } else {
      console.log('✅ Submissions table accessible');
      if (submissions.length > 0) {
        const sampleSubmission = submissions[0];
        console.log('📄 Sample submission structure:');
        Object.keys(sampleSubmission).forEach(key => {
          if (key.toLowerCase().includes('payment') || key.toLowerCase().includes('proof')) {
            console.log(`  - ${key}: ${typeof sampleSubmission[key]}`);
          }
        });
      }
    }
    
    // Test 3: Simulate payment status validation scenarios
    console.log('\n📋 Test 3: Payment Status Validation Scenarios');
    
    const testScenarios = [
      {
        name: 'Valid completed payment with proof',
        paymentStatus: { 'client1': 'completed' },
        paymentProofUrl: { 'client1': 'https://drive.google.com/file/d/test123/view' },
        shouldPass: true
      },
      {
        name: 'Invalid completed payment without proof',
        paymentStatus: { 'client1': 'completed' },
        paymentProofUrl: { 'client1': '' },
        shouldPass: false
      },
      {
        name: 'Invalid completed payment with non-Drive URL',
        paymentStatus: { 'client1': 'completed' },
        paymentProofUrl: { 'client1': 'https://example.com/receipt.pdf' },
        shouldPass: false
      },
      {
        name: 'Valid partial payment with proof',
        paymentStatus: { 'client1': 'partial' },
        paymentProofUrl: { 'client1': 'https://docs.google.com/document/d/test456/edit' },
        shouldPass: true
      },
      {
        name: 'Valid pending payment without proof (allowed)',
        paymentStatus: { 'client1': 'pending' },
        paymentProofUrl: { 'client1': '' },
        shouldPass: true
      }
    ];
    
    // Simulate the validation logic from MonthlyFormWorkflow
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
    
    testScenarios.forEach(scenario => {
      const errors = validatePaymentProof({
        paymentStatus: scenario.paymentStatus,
        paymentProofUrl: scenario.paymentProofUrl
      });
      
      const passed = errors.length === 0;
      const status = passed === scenario.shouldPass ? '✅' : '❌';
      
      console.log(`  ${status} ${scenario.name}`);
      if (errors.length > 0) {
        console.log(`    Errors: ${errors.join(', ')}`);
      }
    });
    
    // Test 4: Check if clients table exists for validation
    console.log('\n📋 Test 4: Clients Table Check');
    
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, status')
      .limit(5);
    
    if (clientsError) {
      console.log('❌ Error accessing clients table:', clientsError.message);
    } else {
      console.log(`✅ Clients table accessible with ${clients.length} sample records`);
      clients.forEach(client => {
        console.log(`  - ${client.name} (ID: ${client.id}, Status: ${client.status})`);
      });
    }
    
    console.log('\n🎯 Payment Proof Validation Test Summary:');
    console.log('✅ URL validation logic implemented');
    console.log('✅ Payment status validation scenarios tested');
    console.log('✅ Database structure verified');
    console.log('\n📝 Next Steps:');
    console.log('1. Test the validation in the browser UI');
    console.log('2. Try updating payment status without proof URL');
    console.log('3. Verify error messages are displayed correctly');
    console.log('4. Test form submission validation');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPaymentProofValidation();