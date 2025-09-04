# Database Setup Instructions

## Quick Setup

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Setup Script**
   - Copy the entire content of `setup_complete_database.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Verify Setup**
   - Check that all tables are created in the Table Editor
   - Verify sample data is inserted

## What This Script Creates

### Core Tables
- `employees` - Employee information and profiles
- `clients` - Client directory and management
- `user_accounts` - Authentication and user management
- `submissions` - Monthly submissions and reports
- `monthly_kpi_reports` - KPI tracking and scoring
- `employee_performance` - Performance evaluations
- `client_onboarding` - Client onboarding process

### Sample Data
- 5 sample employees across different departments
- 5 sample clients with various service types
- Sample KPI data for current month

### Features
- Row Level Security (RLS) enabled
- Automatic timestamp updates
- Performance indexes
- Data validation constraints

## After Setup

Once the database is set up:
1. Restart your development server
2. Test the employee onboarding form
3. Check the client directory
4. Verify performance scoring works

## Troubleshooting

If you encounter errors:
1. Make sure you have the necessary permissions in Supabase
2. Check if any tables already exist and might conflict
3. Run the script in smaller chunks if needed

## Next Steps

After successful setup, you can:
- Add more employees and clients through the UI
- Enter KPI scores for testing
- Generate performance reports
- Test all dashboard features