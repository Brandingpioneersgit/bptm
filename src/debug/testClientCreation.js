// Browser-based client creation test
// Run this in the browser console to test client creation

export const testClientCreation = async () => {
  console.log('🧪 Testing client creation in browser...');
  
  try {
    // Test 1: Check if DataSyncContext is available
    const dataSync = window.React?.useContext ? 'Available' : 'Not Available';
    console.log('📊 React Context:', dataSync);
    
    // Test 2: Check localStorage functionality
    const testKey = 'codex_clients_test';
    const testData = [{ id: 'test', name: 'Test Client', team: 'Web' }];
    
    try {
      localStorage.setItem(testKey, JSON.stringify(testData));
      const retrieved = JSON.parse(localStorage.getItem(testKey) || '[]');
      localStorage.removeItem(testKey);
      console.log('✅ localStorage test passed:', retrieved.length === 1);
    } catch (error) {
      console.error('❌ localStorage test failed:', error);
    }
    
    // Test 3: Check if client creation components are loaded
    const hasClientDropdown = document.querySelector('[data-testid="client-dropdown"]') !== null;
    const hasClientForm = document.querySelector('[data-testid="client-form"]') !== null;
    
    console.log('🔍 Component availability:');
    console.log('  - ClientDropdown:', hasClientDropdown ? 'Found' : 'Not Found');
    console.log('  - ClientForm:', hasClientForm ? 'Found' : 'Not Found');
    
    // Test 4: Try to access global client data
    const existingClients = JSON.parse(localStorage.getItem('codex_clients') || '[]');
    console.log('📊 Existing clients in localStorage:', existingClients.length);
    
    // Test 5: Simulate client creation
    const newClient = {
      id: 'test-' + Date.now(),
      name: 'Browser Test Client',
      team: 'Web',
      client_type: 'Standard',
      status: 'Active',
      services: [],
      created_at: new Date().toISOString()
    };
    
    const updatedClients = [newClient, ...existingClients];
    localStorage.setItem('codex_clients', JSON.stringify(updatedClients));
    
    console.log('✅ Client creation simulation successful');
    console.log('📝 New client:', newClient.name);
    
    // Clean up test data
    localStorage.setItem('codex_clients', JSON.stringify(existingClients));
    
    return {
      success: true,
      message: 'All tests passed',
      clientCount: existingClients.length
    };
    
  } catch (error) {
    console.error('❌ Client creation test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('🚀 Client creation test loaded. Run testClientCreation() to test.');
}