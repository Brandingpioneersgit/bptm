// Test script to verify payment API validation
const BASE_URL = 'http://localhost:8000';
const submissionId = 'f1d77279-37db-49b9-bc56-dda5e8205b4a';

async function testPaymentAPIValidation() {
  console.log('🧪 Testing Payment API Validation\n');
  
  // Test 1: Try to update payment status to completed without proof URL
  console.log('Test 1: Update payment to completed without proof URL');
  try {
    const response = await fetch(`${BASE_URL}/api/payments/${submissionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentStatus: { 'client1': 'completed' }
        // No paymentProofUrl provided
      })
    });
    
    const result = await response.json();
    
    if (response.status === 400 && result.error.includes('Payment proof URL is required')) {
      console.log('✅ PASS - Correctly rejected completed status without proof URL');
      console.log(`   Error: ${result.error}\n`);
    } else {
      console.log('❌ FAIL - Should have rejected completed status without proof URL');
      console.log(`   Status: ${response.status}, Response: ${JSON.stringify(result)}\n`);
    }
  } catch (error) {
    console.log(`❌ ERROR - ${error.message}\n`);
  }
  
  // Test 2: Try to update payment status to partial with invalid URL
  console.log('Test 2: Update payment to partial with invalid URL');
  try {
    const response = await fetch(`${BASE_URL}/api/payments/${submissionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentStatus: { 'client1': 'partial' },
        paymentProofUrl: { 'client1': 'https://example.com/invalid-url' }
      })
    });
    
    const result = await response.json();
    
    if (response.status === 400 && result.error.includes('valid Google Drive URL')) {
      console.log('✅ PASS - Correctly rejected partial status with invalid URL');
      console.log(`   Error: ${result.error}\n`);
    } else {
      console.log('❌ FAIL - Should have rejected partial status with invalid URL');
      console.log(`   Status: ${response.status}, Response: ${JSON.stringify(result)}\n`);
    }
  } catch (error) {
    console.log(`❌ ERROR - ${error.message}\n`);
  }
  
  // Test 3: Try to update payment status to completed with valid Google Drive URL
  console.log('Test 3: Update payment to completed with valid Google Drive URL');
  try {
    const response = await fetch(`${BASE_URL}/api/payments/${submissionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentStatus: { 'client1': 'completed' },
        paymentProofUrl: { 'client1': 'https://drive.google.com/file/d/1234567890/view' }
      })
    });
    
    const result = await response.json();
    
    if (response.status === 404) {
      console.log('✅ PASS - Validation passed (payment not found is expected for test data)');
      console.log(`   Error: ${result.error}\n`);
    } else if (response.status === 200) {
      console.log('✅ PASS - Payment updated successfully with valid URL');
      console.log(`   Response: ${JSON.stringify(result)}\n`);
    } else {
      console.log('❌ FAIL - Unexpected response');
      console.log(`   Status: ${response.status}, Response: ${JSON.stringify(result)}\n`);
    }
  } catch (error) {
    console.log(`❌ ERROR - ${error.message}\n`);
  }
  
  // Test 4: Try to update payment status to pending (should not require proof URL)
  console.log('Test 4: Update payment to pending (no proof URL required)');
  try {
    const response = await fetch(`${BASE_URL}/api/payments/${submissionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentStatus: { 'client1': 'pending' }
        // No paymentProofUrl needed for pending
      })
    });
    
    const result = await response.json();
    
    if (response.status === 404) {
      console.log('✅ PASS - Validation passed for pending status (payment not found is expected)');
      console.log(`   Error: ${result.error}\n`);
    } else if (response.status === 200) {
      console.log('✅ PASS - Payment updated successfully to pending');
      console.log(`   Response: ${JSON.stringify(result)}\n`);
    } else {
      console.log('❌ FAIL - Unexpected response for pending status');
      console.log(`   Status: ${response.status}, Response: ${JSON.stringify(result)}\n`);
    }
  } catch (error) {
    console.log(`❌ ERROR - ${error.message}\n`);
  }
  
  console.log('📊 Payment API validation tests completed!');
  console.log('\n🔍 Analysis:');
  console.log('- The API now enforces payment proof validation');
  console.log('- Tests that try to bypass validation should fail with 400 status');
  console.log('- This should prevent the TestSprite test from updating payment status without proof');
}

// Run the tests
testPaymentAPIValidation().catch(console.error);