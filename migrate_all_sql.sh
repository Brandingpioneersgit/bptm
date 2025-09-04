#!/bin/bash

# Script to migrate all SQL files to Supabase migrations
# This script will copy all SQL files from sql_scripts_for_supabase to supabase/migrations
# with proper timestamps and dependency resolution

set -e

echo "🚀 Starting migration of all SQL files to Supabase..."

# Base timestamp (increment by 1 minute for each file)
BASE_TIMESTAMP="20240102000000"

# Array of SQL files in dependency order
SQL_FILES=(
    "00_optimized_employees_schema.sql"
    "01_create_employees_table.sql"
    "02_create_clients_table.sql"
    "17_monthly_os_foundation_schema.sql"
    "03_create_submissions_table.sql"
    "04_create_employee_signups_table.sql"
    "05_create_employee_exits_table.sql"
    "06_create_tools_table.sql"
    "07_create_user_sessions_table.sql"
    "08_create_submission_workflow_table.sql"
    "09_create_performance_metrics_table.sql"
    "10_create_dashboard_usage_table.sql"
    "11_create_leave_applications_table.sql"
    "11_create_login_attempts_table.sql"
    "12_enhance_employees_table_profile_fields.sql"
    "13_employee_onboarding_schema.sql"
    "14_employee_incentives_schema.sql"
    "15_performance_concerns_schema.sql"
    "16_arcade_system_schema.sql"
    "18_attendance_system_schema.sql"
    "19_seo_module_schema.sql"
    "20_growth_reports_table.sql"
)

# Function to increment timestamp
increment_timestamp() {
    local timestamp=$1
    local increment=$2
    
    # Extract components
    local year=${timestamp:0:4}
    local month=${timestamp:4:2}
    local day=${timestamp:6:2}
    local hour=${timestamp:8:2}
    local minute=${timestamp:10:2}
    local second=${timestamp:12:2}
    
    # Convert to epoch and add minutes
    local epoch=$(date -j -f "%Y%m%d%H%M%S" "$timestamp" "+%s" 2>/dev/null || echo "0")
    if [ "$epoch" = "0" ]; then
        # Fallback for different date command
        epoch=$(python3 -c "import datetime; print(int(datetime.datetime($year,$month,$day,$hour,$minute,$second).timestamp()))") 2>/dev/null || echo "1704153600"
    fi
    
    local new_epoch=$((epoch + increment * 60))
    
    # Convert back to timestamp format
    date -r $new_epoch "+%Y%m%d%H%M%S" 2>/dev/null || python3 -c "import datetime; print(datetime.datetime.fromtimestamp($new_epoch).strftime('%Y%m%d%H%M%S'))"
}

# Create migrations directory if it doesn't exist
mkdir -p database/migrations

# Counter for timestamp increment
counter=1

echo "📁 Processing ${#SQL_FILES[@]} SQL files..."

for sql_file in "${SQL_FILES[@]}"; do
    if [ -f "database/scripts/$sql_file" ]; then
        # Generate new timestamp
        new_timestamp=$(increment_timestamp $BASE_TIMESTAMP $counter)
        
        # Create migration filename
        migration_name=$(echo "$sql_file" | sed 's/^[0-9]*_//' | sed 's/\.sql$//')
        migration_file="${new_timestamp}_${migration_name}.sql"
        
        echo "📄 Copying $sql_file -> $migration_file"
        
        # Copy file with header comment
        {
            echo "-- Migration: $migration_name"
            echo "-- Source: $sql_file"
            echo "-- Timestamp: $new_timestamp"
            echo ""
            cat "database/scripts/$sql_file"
        } > "database/migrations/$migration_file"
        
        counter=$((counter + 1))
    else
        echo "⚠️  Warning: $sql_file not found, skipping..."
    fi
done

echo "✅ Migration files created successfully!"
echo "📋 Files in database/migrations:"
ls -la database/migrations/

echo ""
echo "🔧 Next steps:"
echo "1. Review the migration files in database/migrations/"
echo "2. Run: supabase db push --password 'BPtools@4321' --yes"
echo "3. Check for any conflicts or errors"
echo ""
echo "⚡ Ready to push all migrations to Supabase!"