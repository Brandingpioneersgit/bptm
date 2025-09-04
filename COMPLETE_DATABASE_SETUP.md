# Complete Database Setup Guide

## 🎯 Overview

This guide provides step-by-step instructions to set up all required database tables for the BP Tactical Meeting application, including the new Performance Concerns and Employee Performance Tracking system.

## 📋 Required Tables

The application requires the following tables to be created in your Supabase database:

### Core Tables
1. **employees** - Employee information and management
2. **clients** - Client management and relationship tracking
3. **submissions** - Form submissions and employee performance data
4. **employee_signups** - New employee registration and onboarding
5. **employee_exits** - Employee departure tracking and exit interviews

### Authentication & Security
6. **user_accounts** - User login credentials and authentication
7. **user_sessions** - Session management and tracking
8. **login_attempts** - Security monitoring and login attempt tracking

### Performance & Analytics
9. **performance_metrics** - KPI tracking and historical performance data
10. **employee_performance** - Employee performance scores and evaluations
11. **performance_concerns** - Performance concerns form submissions
12. **performance_improvement_plans** - PIP management and tracking
13. **pip_progress_reviews** - PIP progress review records

### Incentives & Rewards
14. **incentive_types** - Types of employee incentives available
15. **incentive_applications** - Employee incentive applications and approvals

### Additional Features
16. **tools** - Master tools library
17. **leave_applications** - Leave and WFH applications
18. **submission_workflow** - Workflow management for submissions
19. **dashboard_usage** - Dashboard usage analytics

## 🚀 Setup Instructions

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to the **SQL Editor** section
3. Click **New Query**

### Step 2: Run SQL Scripts in Order

**IMPORTANT:** Run these scripts in the exact order listed below to ensure proper table dependencies:

#### 1. Core Employee Management
```sql
-- Copy and paste the contents of: 01_create_employees_table.sql
```

#### 2. Client Management
```sql
-- Copy and paste the contents of: 02_create_clients_table.sql
```

#### 3. Form Submissions
```sql
-- Copy and paste the contents of: 03_create_submissions_table.sql
```

#### 4. Employee Onboarding
```sql
-- Copy and paste the contents of: 04_create_employee_signups_table.sql
```

#### 5. Employee Exits
```sql
-- Copy and paste the contents of: 05_create_employee_exits_table.sql
```

#### 6. Tools Library
```sql
-- Copy and paste the contents of: 06_create_tools_table.sql
```

#### 7. Authentication System
```sql
-- Copy and paste the contents of: 07_create_user_sessions_table.sql
```

#### 8. Workflow Management
```sql
-- Copy and paste the contents of: 08_create_submission_workflow_table.sql
```

#### 9. Performance Analytics
```sql
-- Copy and paste the contents of: 09_create_performance_metrics_table.sql
```

#### 10. Dashboard Analytics
```sql
-- Copy and paste the contents of: 10_create_dashboard_usage_table.sql
```

#### 11. Leave Applications
```sql
-- Copy and paste the contents of: 11_create_leave_applications_table.sql
```

#### 12. Security Monitoring
```sql
-- Copy and paste the contents of: 11_create_login_attempts_table.sql
```

#### 13. Enhanced Employee Profiles
```sql
-- Copy and paste the contents of: 12_enhance_employees_table_profile_fields.sql
```

#### 14. Employee Onboarding Enhancement
```sql
-- Copy and paste the contents of: 13_employee_onboarding_schema.sql
```

#### 15. Employee Incentives System
```sql
-- Copy and paste the contents of: 14_employee_incentives_schema.sql
```

#### 16. Performance Concerns & Tracking (NEW)
```sql
-- Copy and paste the contents of: 15_performance_concerns_schema.sql
```

### Step 3: Verify Setup

After running all scripts, verify that all tables were created successfully:

```sql
-- Check all created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see all 19+ tables listed above.

### Step 4: Test Key Functionality

#### Test Employee Performance System
```sql
-- Check if performance tables exist
SELECT COUNT(*) FROM employee_performance;
SELECT COUNT(*) FROM performance_concerns;
```

#### Test Authentication System
```sql
-- Check if user accounts exist
SELECT COUNT(*) FROM user_accounts;
```

#### Test Incentives System
```sql
-- Check incentive types
SELECT * FROM incentive_types;
```

## 🔐 Security Features

The database includes comprehensive security features:

- **Row Level Security (RLS)** on all sensitive tables
- **Authentication policies** for user access control
- **Role-based permissions** for managers, HR, and employees
- **Audit logging** for performance evaluations and incentive approvals

## 📊 Key Features Enabled

### Performance Management
- ✅ Employee performance scoring (0-10 scale)
- ✅ Low performer identification and tracking
- ✅ Performance concerns form for struggling employees
- ✅ Performance Improvement Plan (PIP) management
- ✅ Progress tracking and reviews

### Authentication & Access Control
- ✅ Login requirements for all forms
- ✅ Role-based access (Employee, Manager, HR, Admin)
- ✅ Session management and security monitoring
- ✅ Automatic logout and session expiry

### Employee Incentives
- ✅ Multiple incentive types (hiring, testimonials, videos)
- ✅ Proof submission and verification
- ✅ HR approval workflow
- ✅ Razorpay integration for disbursements

### Comprehensive Form Management
- ✅ Employee onboarding and exit processes
- ✅ Leave and WFH applications
- ✅ Client management and tracking
- ✅ Monthly performance submissions

## 🛠️ Troubleshooting

### Common Issues

1. **"Table already exists" error**
   - Some scripts include `IF NOT EXISTS` clauses
   - You can safely re-run these scripts

2. **Foreign key constraint errors**
   - Ensure you run scripts in the exact order specified
   - The `employees` table must be created before other tables that reference it

3. **Permission denied errors**
   - Ensure you're using the correct Supabase project
   - Check that you have admin access to the database

4. **RLS policy errors**
   - RLS policies are automatically created with the tables
   - Test with authenticated users to ensure policies work correctly

### Verification Queries

```sql
-- Check table relationships
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
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 🎉 Next Steps

After completing the database setup:

1. **Test the application** - All forms should now work with authentication
2. **Create test users** - Add employees through the onboarding form
3. **Test performance scoring** - Use the Performance Scoring tool to evaluate employees
4. **Test low performer flow** - Mark an employee as low performer and test the Performance Concerns form
5. **Test incentives** - Submit and approve incentive applications

## 📞 Support

If you encounter any issues during setup:

1. Check the individual SQL files for detailed comments
2. Verify your Supabase project permissions
3. Ensure all scripts are run in the correct order
4. Test with sample data to verify functionality

---

**Note**: This is a one-time setup. Once completed, your application will have full database connectivity and all features will function properly, including the new Performance Concerns system for employees with low performance scores.