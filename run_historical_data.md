# Running the Comprehensive 6-Month Historical Data Script

## Instructions

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Historical Data Script**
   - Copy the contents of `comprehensive_6month_historical_data.sql`
   - Paste it into the Supabase SQL Editor
   - Execute the script

3. **What This Script Does**
   - Creates 6 months of historical data (August 2024 - January 2025)
   - Populates data for all 14 roles:
     - SEO Employee, Social Media, YouTube SEO
     - Accountant, HR, Sales, Ads, Design
     - Web Developer, Intern, Freelancer
     - Manager, Operations Head, Super Admin
   
4. **Data Created**
   - **User Accounts**: Test credentials for all 14 roles
   - **Monthly KPI Reports**: 6 months of performance data per role
   - **Submissions**: Monthly work submissions with client data
   - **Performance Metrics**: Detailed performance tracking
   - **Client Feedback**: Customer satisfaction scores and feedback
   - **Learning Goals**: Professional development tracking

5. **Test Credentials**
   All test accounts use the pattern:
   - Email: `{role}@test.com` (e.g., `seo@test.com`)
   - Password: `test123`

6. **Verification**
   After running the script, you should see:
   - Summary of records created in each table
   - Dashboard test results showing average scores
   - Success confirmation messages

## Next Steps

After running this script:
1. Test each role dashboard with the new historical data
2. Verify KPI calculations and trends
3. Test PDF report generation
4. Confirm all role-specific features work correctly

## Troubleshooting

If you encounter any errors:
1. Ensure all required tables exist (run setup scripts first)
2. Check that RLS policies allow data insertion
3. Verify UUID extensions are enabled
4. Contact support if issues persist