# BP Tactical Meeting - Supabase Database Setup

This directory contains all the SQL scripts needed to set up the complete database for the BP Tactical Meeting project in Supabase.

## Required Tables

The project requires the following 6 tables to be created in your Supabase database:

1. **employees** - Core employee information and management
2. **clients** - Client management and relationship tracking
3. **submissions** - Form submissions and employee performance data
4. **employee_signups** - New employee registration and onboarding
5. **employee_exits** - Employee departure tracking and exit interviews
6. **incentive_types & incentive_applications** - Employee incentive system for rewards and reimbursements

## Setup Instructions

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to the "SQL Editor" section
3. Create a new query for each script

### Step 2: Run SQL Scripts in Order

**IMPORTANT:** Run these scripts in the exact order listed below:

#### 1. Create Employees Table
```sql
-- Copy and paste the contents of: 01_create_employees_table.sql
```

#### 2. Create Clients Table
```sql
-- Copy and paste the contents of: 02_create_clients_table.sql
```

#### 3. Create Submissions Table
```sql
-- Copy and paste the contents of: 03_create_submissions_table.sql
```

#### 4. Create Employee Signups Table
```sql
-- Copy and paste the contents of: 04_create_employee_signups_table.sql
```

#### 5. Create Employee Exits Table
```sql
-- Copy and paste the contents of: 05_create_employee_exits_table.sql
```

#### 6. Create Employee Incentives System
```sql
-- Copy and paste the contents of: 14_employee_incentives_schema.sql
```

### Step 3: Verify Installation

After running all scripts, verify the tables were created successfully:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('employees', 'clients', 'submissions', 'employee_signups', 'employee_exits', 'incentive_types', 'incentive_applications')
ORDER BY table_name;

-- Check sample data was inserted
SELECT 'employees' as table_name, COUNT(*) as record_count FROM employees
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'submissions', COUNT(*) FROM submissions
UNION ALL
SELECT 'employee_signups', COUNT(*) FROM employee_signups
UNION ALL
SELECT 'employee_exits', COUNT(*) FROM employee_exits
UNION ALL
SELECT 'incentive_types', COUNT(*) FROM incentive_types
UNION ALL
SELECT 'incentive_applications', COUNT(*) FROM incentive_applications;
```

## Table Descriptions

### 1. Employees Table
- **Purpose**: Core employee information management
- **Key Features**: 
  - Personal and contact information
  - Department and role management
  - Employment status tracking
  - Emergency contacts and addresses
  - Profile images and notes
- **Sample Data**: 10 employees across different departments

### 2. Clients Table
- **Purpose**: Client relationship and project management
- **Key Features**:
  - Client information and contact details
  - Service scopes and billing information
  - Contract management and retainer tracking
  - Client status and priority levels
  - Industry and company size classification
- **Sample Data**: 8 clients with various service types

### 3. Submissions Table
- **Purpose**: Employee performance and form submission data
- **Key Features**:
  - Monthly performance submissions
  - Attendance and KPI tracking
  - Learning and development records
  - Feedback and scoring systems
  - AI task management
- **Sample Data**: 6 submissions with comprehensive performance data

### 4. Employee Signups Table
- **Purpose**: New employee registration and onboarding
- **Key Features**:
  - Complete personal and professional information
  - Education and experience tracking
  - Document management (resume, certificates)
  - HR workflow and approval process
  - Onboarding status tracking
- **Sample Data**: 4 employee signup records in various stages

### 5. Employee Exits Table
- **Purpose**: Employee departure tracking and exit interviews
- **Key Features**:
  - Exit reason and feedback collection
  - Asset return tracking
  - Handover management
  - Financial settlement tracking
  - HR approval workflow
- **Sample Data**: 4 exit records with different scenarios

### 6. Employee Incentives System
- **Purpose**: Employee incentive and reward management
- **Key Features**:
  - Three incentive types: hiring recommendations (₹3000), client testimonials (₹1000), promotional videos (₹500)
  - Proof upload system for each incentive type
  - HR approval workflow for incentive applications
  - Razorpay integration for reimbursement processing
  - Manager reporting dashboard for disbursed incentives
  - Automatic eligibility tracking (3-month requirement for hiring incentives)
- **Sample Data**: 3 predefined incentive types with proper amounts and eligibility periods

## Security Features

All tables include:
- **Row Level Security (RLS)** enabled
- **Proper permissions** for authenticated and anonymous users
- **Indexes** for optimal query performance
- **Triggers** for automatic timestamp updates
- **Data validation** through CHECK constraints

## Views and Functions

Each table includes:
- **Summary views** for easy data analysis
- **Helper functions** for common operations
- **Analytics queries** for reporting

## Troubleshooting

### If Tables Already Exist
If you need to recreate tables, uncomment the DROP statements at the top of each script:
```sql
-- DROP TABLE IF EXISTS public.table_name CASCADE;
```

### Permission Issues
Ensure your Supabase project has the proper permissions set. The scripts include permission grants for both authenticated and anonymous users.

### Data Conflicts
The scripts use `ON CONFLICT DO NOTHING` to prevent duplicate data insertion if you run them multiple times.

## Next Steps

After setting up the database:
1. Update your application's Supabase configuration
2. Test form submissions to ensure data flows correctly
3. Verify all CRUD operations work as expected
4. Test the application's local mode fallback (if applicable)

## Support

If you encounter any issues during setup:
1. Check the Supabase logs for detailed error messages
2. Ensure all scripts are run in the correct order
3. Verify your Supabase project has sufficient permissions
4. Check that your database has enough storage space

---

**Note**: These scripts are designed to work with Supabase PostgreSQL. They include all necessary features for the BP Tactical Meeting project including RLS policies, proper indexing, and sample data for testing.