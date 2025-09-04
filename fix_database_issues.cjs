#!/usr/bin/env node

/**
 * Database Issues Fix Script
 * 
 * This script helps identify and fix database table issues in the BPTM application.
 * Run this after executing the create_essential_missing_tables.sql script in Supabase.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Essential tables that should exist after running the SQL script
const essentialTables = [
  'unified_users',
  'clients', 
  'employees',
  'submissions',
  'monthly_kpi_reports',
  'employee_performance',
  'monthly_form_submissions',
  'employee_kpis',
  'employee_attendance',
  'notifications',
  'user_accounts',
  'system_notifications',
  'dashboard_configurations',
  'tools'
];

// Tables that exist but might be unused
const potentiallyUnusedTables = [
  'login_tracking'
];

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      return false; // Table doesn't exist
    }
    
    return !error;
  } catch (err) {
    return false;
  }
}

async function checkEssentialTables() {
  console.log('🔍 Checking essential tables...');
  
  const results = {
    existing: [],
    missing: []
  };
  
  for (const table of essentialTables) {
    const exists = await checkTableExists(table);
    if (exists) {
      results.existing.push(table);
      console.log(`✅ ${table}`);
    } else {
      results.missing.push(table);
      console.log(`❌ ${table}`);
    }
  }
  
  return results;
}

async function testDatabaseConnection() {
  console.log('🔗 Testing database connection...');
  
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (err) {
    console.log('❌ Database connection error:', err.message);
    return false;
  }
}

async function checkDataIntegrity() {
  console.log('\n📊 Checking data integrity...');
  
  const checks = [
    { table: 'clients', description: 'Client records' },
    { table: 'employees', description: 'Employee records' },
    { table: 'unified_users', description: 'Unified user records' },
    { table: 'submissions', description: 'Form submissions' }
  ];
  
  for (const check of checks) {
    try {
      const { count, error } = await supabase
        .from(check.table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${check.description}: Error - ${error.message}`);
      } else {
        console.log(`✅ ${check.description}: ${count} records`);
      }
    } catch (err) {
      console.log(`❌ ${check.description}: ${err.message}`);
    }
  }
}

async function generateFixReport() {
  console.log('\n📋 Generating fix report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    databaseConnection: false,
    essentialTables: { existing: [], missing: [] },
    recommendations: []
  };
  
  // Test connection
  report.databaseConnection = await testDatabaseConnection();
  
  if (!report.databaseConnection) {
    report.recommendations.push('Fix database connection issues first');
    return report;
  }
  
  // Check essential tables
  report.essentialTables = await checkEssentialTables();
  
  // Generate recommendations
  if (report.essentialTables.missing.length > 0) {
    report.recommendations.push(
      `Create missing tables: ${report.essentialTables.missing.join(', ')}`
    );
    report.recommendations.push(
      'Run the create_essential_missing_tables.sql script in Supabase SQL Editor'
    );
  }
  
  if (report.essentialTables.existing.length === essentialTables.length) {
    report.recommendations.push('All essential tables exist - proceed with application testing');
  }
  
  // Check data integrity
  await checkDataIntegrity();
  
  return report;
}

async function main() {
  console.log('🚀 BPTM Database Fix Script');
  console.log('================================\n');
  
  try {
    const report = await generateFixReport();
    
    console.log('\n📋 SUMMARY REPORT');
    console.log('==================');
    console.log(`Database Connection: ${report.databaseConnection ? '✅ Working' : '❌ Failed'}`);
    console.log(`Essential Tables: ${report.essentialTables.existing.length}/${essentialTables.length} exist`);
    
    if (report.essentialTables.missing.length > 0) {
      console.log('\n❌ MISSING TABLES:');
      report.essentialTables.missing.forEach(table => {
        console.log(`   - ${table}`);
      });
    }
    
    console.log('\n🔧 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    
    // Save report to file
    const reportPath = path.join(__dirname, 'database_fix_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    if (report.essentialTables.missing.length === 0 && report.databaseConnection) {
      console.log('\n🎉 Database is ready! All essential tables exist.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Database needs attention. Please follow the recommendations above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkTableExists,
  checkEssentialTables,
  testDatabaseConnection,
  generateFixReport
};