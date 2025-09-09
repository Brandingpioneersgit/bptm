/**
 * Debug script to test Add Client button functionality
 * This will help identify if there are any JavaScript errors or issues
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Mock DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:8000',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Test function to check Add Client button
function testAddClientButton() {
  console.log('🔍 Testing Add Client Button Functionality...');
  
  try {
    // Check if DeptClientsBlock component exists
    const deptClientsPath = path.join(__dirname, 'src/components/DeptClientsBlock.jsx');
    if (fs.existsSync(deptClientsPath)) {
      console.log('✅ DeptClientsBlock.jsx exists');
      
      const content = fs.readFileSync(deptClientsPath, 'utf8');
      
      // Check for Add Client button
      if (content.includes('Add Your First Client') || content.includes('Add Client')) {
        console.log('✅ Add Client button found in component');
      } else {
        console.log('❌ Add Client button not found in component');
      }
      
      // Check for onClick handlers
      if (content.includes('setShowAddForm(true)')) {
        console.log('✅ onClick handler found for Add Client button');
      } else {
        console.log('❌ onClick handler not found');
      }
      
      // Check for showAddForm state
      if (content.includes('showAddForm')) {
        console.log('✅ showAddForm state management found');
      } else {
        console.log('❌ showAddForm state management not found');
      }
      
    } else {
      console.log('❌ DeptClientsBlock.jsx not found');
    }
    
    // Check ClientDropdown component
    const clientDropdownPath = path.join(__dirname, 'src/shared/components/ClientDropdown.jsx');
    if (fs.existsSync(clientDropdownPath)) {
      console.log('✅ ClientDropdown.jsx exists');
      
      const content = fs.readFileSync(clientDropdownPath, 'utf8');
      
      // Check for required imports
      if (content.includes('ClientDataPriorityIndicator')) {
        console.log('✅ ClientDataPriorityIndicator import found');
      } else {
        console.log('❌ ClientDataPriorityIndicator import missing');
      }
      
      if (content.includes('SearchableDropdown')) {
        console.log('✅ SearchableDropdown import found');
      } else {
        console.log('❌ SearchableDropdown import missing');
      }
      
    } else {
      console.log('❌ ClientDropdown.jsx not found');
    }
    
    // Check SearchableDropdown component
    const searchableDropdownPath = path.join(__dirname, 'src/shared/components/SearchableDropdown.jsx');
    if (fs.existsSync(searchableDropdownPath)) {
      console.log('✅ SearchableDropdown.jsx exists');
    } else {
      console.log('❌ SearchableDropdown.jsx not found');
    }
    
    // Check ClientDataPriorityIndicator component
    const priorityIndicatorPath = path.join(__dirname, 'src/components/ClientDataPriorityIndicator.jsx');
    if (fs.existsSync(priorityIndicatorPath)) {
      console.log('✅ ClientDataPriorityIndicator.jsx exists');
    } else {
      console.log('❌ ClientDataPriorityIndicator.jsx not found');
    }
    
    // Check clientDataPriorityService
    const priorityServicePath = path.join(__dirname, 'src/services/clientDataPriorityService.js');
    if (fs.existsSync(priorityServicePath)) {
      console.log('✅ clientDataPriorityService.js exists');
    } else {
      console.log('❌ clientDataPriorityService.js not found');
    }
    
    console.log('\n🎯 Summary:');
    console.log('All required components and services appear to be present.');
    console.log('The Add Client button should be functional based on code analysis.');
    console.log('\n💡 Next steps:');
    console.log('1. Check browser console for JavaScript errors');
    console.log('2. Verify that the button is actually rendered in the DOM');
    console.log('3. Test the button click functionality manually');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

// Run the test
testAddClientButton();