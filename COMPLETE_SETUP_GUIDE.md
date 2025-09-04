# Complete Database Setup Guide

## Overview
This guide provides step-by-step instructions to set up a comprehensive database for the Business Performance Tracking and Management (BPTM) system. The setup includes 23+ tables covering all aspects of employee management, performance tracking, incentives, authentication, and analytics.

## 📋 What Will Be Created

### Core Tables (9 tables)
- `employees` - Employee master data
- `submissions` - Monthly performance submissions
- `performance_metrics` - Performance tracking data
- `monthly_rows` - Monthly data aggregation
- `users` - Basic user information
- `entities` - Business entities
- `user_entity_mappings` - User-entity relationships
- `attendance_daily` - Daily attendance records
- `login_tracking` - Login activity tracking

### Performance Management (4 tables)
- `employee_performance` - Detailed performance evaluations
- `performance_concerns` - Performance issue tracking
- `performance_improvement_plans` - PIP management
- `pip_progress_reviews` - PIP progress tracking

### Incentives System (4 tables)
- `incentive_types` - Available incentive types
- `employee_incentives` - Incentive applications
- `incentive_approvals` - Approval workflow tracking
- `incentive_payments` - Payment processing

### Authentication & Security (5 tables)
- `user_accounts` - Comprehensive user management
- `user_sessions` - Session management
- `login_attempts` - Security monitoring
- `password_reset_tokens` - Password reset functionality
- `user_permissions` - Granular permissions

### Analytics & Monitoring (1 table)
- `dashboard_usage` - Dashboard usage analytics

## 🚀 Step-by-Step Setup Instructions

### Prerequisites
1. Access to Supabase project with admin privileges
2. Supabase SQL Editor access
3. All SQL files downloaded to your local machine

### Setup Steps

#### Step 1: Create Core Function
```sql
-- Copy and paste the contents of: step1_create_function.sql
```
**What it does:** Creates the `update_updated_at_column()` function needed for automatic timestamp updates.

#### Step 2: Create Core Tables
```sql
-- Copy and paste the contents of: step2_create_tables.sql
```
**What it does:** Creates the main tables (employees, submissions, performance_metrics, etc.) with proper schemas.

#### Step 3: Create Triggers
```sql
-- Copy and paste the contents of: step3_create_triggers.sql
```
**What it does:** Sets up automatic `updated_at` timestamp triggers for all tables.

#### Step 4: Enable Row Level Security
```sql
-- Copy and paste the contents of: step4_enable_rls.sql
```
**What it does:** Enables RLS and creates basic security policies for all tables.

#### Step 5: Set Permissions and Indexes
```sql
-- Copy and paste the contents of: step5_permissions_indexes.sql
```
**What it does:** Grants necessary permissions and creates performance indexes.

#### Step 6: Insert Test Data
```sql
-- Copy and paste the contents of: step6_insert_test_data.sql
```
**What it does:** Inserts comprehensive test data for all core tables.

#### Step 7: Verify Core Setup
```sql
-- Copy and paste the contents of: step7_verify_setup.sql
```
**What it does:** Verifies that core tables are created and populated correctly.

#### Step 8: Create Dashboard Analytics
```sql
-- Copy and paste the contents of: step8_create_dashboard_usage.sql
```
**What it does:** Creates dashboard usage tracking table for analytics.

#### Step 9: Create Performance Management Tables
```sql
-- Copy and paste the contents of: step9_create_performance_tables.sql
```
**What it does:** Creates advanced performance management tables (employee_performance, performance_concerns, PIPs).

#### Step 10: Create Incentives System
```sql
-- Copy and paste the contents of: step10_create_incentives_tables.sql
```
**What it does:** Creates complete incentives system with types, applications, approvals, and payments.

#### Step 11: Create Authentication System
```sql
-- Copy and paste the contents of: step11_create_auth_tables.sql
```
**What it does:** Creates comprehensive authentication and user management system.

#### Step 12: Final Verification
```sql
-- Copy and paste the contents of: step12_final_verification.sql
```
**What it does:** Performs complete verification of all tables, relationships, and functionality.

## 📊 Test Data Included

### Employee Data
- **10 employees** across different departments (Engineering, Marketing, Sales, HR, Finance)
- **5 managers** with proper hierarchical relationships
- **Complete profiles** with contact information, roles, and departments

### Performance Data
- **Monthly submissions** for the last 3 months
- **Performance metrics** with scores and evaluations
- **Sample performance concerns** for testing workflows
- **Performance improvement plans** with progress tracking

### Incentives Data
- **5 incentive types** (Referral, Testimonial, Video, Performance, Innovation)
- **Sample applications** in different approval stages
- **Approval workflow** examples

### Authentication Data
- **User accounts** for all employees
- **Sample login attempts** for security testing
- **Role-based permissions** setup

### Analytics Data
- **Dashboard usage** tracking examples
- **User interaction** data for analytics testing

## 🔐 Security Features

### Row Level Security (RLS)
- ✅ Enabled on all sensitive tables
- ✅ Policies for authenticated and anonymous users
- ✅ Role-based access control

### Authentication & Authorization
- ✅ Comprehensive user account management
- ✅ Session tracking and management
- ✅ Login attempt monitoring
- ✅ Password reset functionality
- ✅ Granular permission system

### Data Integrity
- ✅ Foreign key constraints
- ✅ Check constraints for data validation
- ✅ Unique constraints where appropriate
- ✅ Automatic timestamp management

## 🎯 Key Features Enabled

### Performance Management
- ✅ **Employee Performance Scoring** (0-10 scale across multiple dimensions)
- ✅ **Low Performer Identification** and tracking
- ✅ **Performance Concerns Form** for struggling employees
- ✅ **Performance Improvement Plans (PIP)** with progress tracking
- ✅ **Automated Performance Reviews** and evaluations

### Employee Incentives
- ✅ **Multiple Incentive Types** (hiring bonuses, testimonials, videos, etc.)
- ✅ **Proof Submission** and verification system
- ✅ **Multi-level Approval Workflow** (Manager → HR → Admin)
- ✅ **Payment Processing** integration ready
- ✅ **Incentive Analytics** and reporting

### Authentication & Access Control
- ✅ **Role-based Access** (Employee, Manager, HR, Admin)
- ✅ **Session Management** with security monitoring
- ✅ **Login Attempt Tracking** for security
- ✅ **Password Reset** functionality
- ✅ **Granular Permissions** system

### Analytics & Monitoring
- ✅ **Dashboard Usage Tracking** for user behavior analysis
- ✅ **Performance Analytics** across departments
- ✅ **Attendance Monitoring** and reporting
- ✅ **Security Event Logging** and monitoring

### Form Management
- ✅ **Employee Onboarding** process
- ✅ **Monthly Performance Submissions**
- ✅ **Performance Concerns** reporting
- ✅ **Incentive Applications** and approvals
- ✅ **Leave and Attendance** management

## 🧪 Testing Your Setup

### 1. Verify Table Creation
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```
You should see 23+ tables listed.

### 2. Test Data Integrity
```sql
-- Check employee count
SELECT COUNT(*) FROM employees;

-- Check performance data
SELECT COUNT(*) FROM employee_performance;

-- Check incentive types
SELECT * FROM incentive_types;
```

### 3. Test Authentication
```sql
-- Check user accounts
SELECT user_id, role, department FROM user_accounts;
```

### 4. Test Dashboard Functionality
- Navigate to your application dashboard
- Verify that all forms load correctly
- Test employee performance scoring
- Test incentive application process
- Verify authentication flows

## 🔧 Troubleshooting

### Common Issues

1. **"Function does not exist" error**
   - Ensure you run `step1_create_function.sql` first
   - The `update_updated_at_column()` function must exist before creating triggers

2. **"Table already exists" error**
   - Most scripts include `IF NOT EXISTS` clauses
   - You can safely re-run these scripts
   - If needed, drop tables and recreate

3. **Foreign key constraint errors**
   - Ensure you run scripts in the exact order specified
   - The `employees` table must exist before other tables that reference it

4. **Permission denied errors**
   - Verify you have admin access to your Supabase project
   - Check that you're using the correct database

5. **RLS policy errors**
   - RLS policies are created automatically
   - Test with authenticated users to ensure policies work

### Verification Queries

```sql
-- Check all foreign key relationships
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY' AND tc.table_schema='public';
```

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 📞 Support

If you encounter any issues:

1. **Check the order** - Ensure scripts are run in the correct sequence
2. **Verify permissions** - Confirm admin access to Supabase
3. **Review error messages** - Most errors indicate missing dependencies
4. **Test incrementally** - Verify each step before proceeding

## 🎉 Next Steps

After completing the database setup:

1. **Test Application Integration**
   - Verify all forms work with the new database structure
   - Test authentication flows
   - Validate data submission and retrieval

2. **Create Test Users**
   - Use the employee onboarding form to add new employees
   - Test different user roles and permissions
   - Verify role-based access control

3. **Test Performance Management**
   - Use the Performance Scoring tool
   - Create performance concerns for low performers
   - Test PIP creation and progress tracking

4. **Test Incentive System**
   - Submit incentive applications
   - Test approval workflows
   - Verify payment processing integration

5. **Monitor Analytics**
   - Check dashboard usage analytics
   - Review performance metrics
   - Monitor security events

---

**🎊 Congratulations!** Your comprehensive BPTM database is now ready for production use with full functionality across all modules including performance management, incentives, authentication, and analytics.

**Total Setup Time:** Approximately 15-20 minutes
**Total Tables Created:** 23+ tables
**Features Enabled:** All core BPTM functionality
**Security Level:** Enterprise-grade with RLS and comprehensive authentication