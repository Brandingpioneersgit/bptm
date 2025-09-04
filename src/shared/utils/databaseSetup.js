// Database setup and table creation utilities

/**
 * Comprehensive database setup utility for BPTM application
 */
export class DatabaseSetupManager {
  constructor(supabaseInstance, notifyFunction) {
    this.supabase = supabaseInstance;
    this.notify = notifyFunction;
    this.tableChecks = new Map();
  }

  /**
   * Check if a table exists and has the required columns
   */
  async checkTableStructure(tableName, requiredColumns = []) {
    try {
      // Try to fetch table structure
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('does not exist')) {
          return { exists: false, missingColumns: requiredColumns };
        }
        throw error;
      }

      // Check for missing columns by trying to select them
      if (requiredColumns.length > 0) {
        const missingColumns = [];
        
        for (const column of requiredColumns) {
          try {
            await this.supabase
              .from(tableName)
              .select(column)
              .limit(1);
          } catch (columnError) {
            if (columnError.code === '42703' || columnError.message.includes('does not exist')) {
              missingColumns.push(column);
            }
          }
        }

        return { exists: true, missingColumns };
      }

      return { exists: true, missingColumns: [] };
    } catch (error) {
      console.error(`Error checking table ${tableName}:`, error);
      return { exists: false, missingColumns: requiredColumns, error };
    }
  }

  /**
   * Create employees table with all required columns
   */
  async createEmployeesTable() {
    try {
      const { error } = await this.supabase.rpc('create_employees_table_if_not_exists');
      
      if (error) {
        // Fallback: try direct SQL creation
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS employees (
            id BIGSERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT UNIQUE,
            department TEXT,
            role TEXT[],
            status TEXT DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          -- Create indexes for better performance
          CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);
          CREATE INDEX IF NOT EXISTS idx_employees_phone ON employees(phone);
          CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
          CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
        `;
        
        const { error: sqlError } = await this.supabase.rpc('exec_sql', { sql: createTableSQL });
        
        if (sqlError) {
          throw sqlError;
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to create employees table:', error);
      return { success: false, error };
    }
  }

  /**
   * Create clients table with all required columns
   */
  async createClientsTable() {
    try {
      const { error } = await this.supabase.rpc('create_clients_table_if_not_exists');
      
      if (error) {
        // Fallback: try direct SQL creation
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS clients (
            id BIGSERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            team TEXT,
            client_type TEXT DEFAULT 'regular',
            department TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          -- Create indexes for better performance
          CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
          CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
          CREATE INDEX IF NOT EXISTS idx_clients_team ON clients(team);
          CREATE INDEX IF NOT EXISTS idx_clients_department ON clients(department);
        `;
        
        const { error: sqlError } = await this.supabase.rpc('exec_sql', { sql: createTableSQL });
        
        if (sqlError) {
          throw sqlError;
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to create clients table:', error);
      return { success: false, error };
    }
  }

  /**
   * Create submissions table with all required columns
   */
  async createSubmissionsTable() {
    try {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS submissions (
          id BIGSERIAL PRIMARY KEY,
          employee_name TEXT NOT NULL,
          employee_phone TEXT,
          department TEXT,
          role TEXT[],
          month_key TEXT NOT NULL,
          attendance_wfo INTEGER DEFAULT 0,
          attendance_wfh INTEGER DEFAULT 0,
          tasks_completed INTEGER DEFAULT 0,
          ai_table_link TEXT,
          clients JSONB DEFAULT '[]'::jsonb,
          learning_activities JSONB DEFAULT '[]'::jsonb,
          ai_usage_notes TEXT,
          feedback_company TEXT,
          feedback_hr TEXT,
          feedback_management TEXT,
          user_phone TEXT,
          submitted_at TIMESTAMPTZ DEFAULT NOW(),
          scores JSONB DEFAULT '{}'::jsonb,
          discipline JSONB DEFAULT '{}'::jsonb,
          kpi_score DECIMAL(4,2) DEFAULT 0,
          learning_score DECIMAL(4,2) DEFAULT 0,
          relationship_score DECIMAL(4,2) DEFAULT 0,
          overall_score DECIMAL(4,2) DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_submissions_employee_name ON submissions(employee_name);
        CREATE INDEX IF NOT EXISTS idx_submissions_month_key ON submissions(month_key);
        CREATE INDEX IF NOT EXISTS idx_submissions_department ON submissions(department);
        CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);
        
        -- Create unique constraint to prevent duplicate submissions
        CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_unique 
        ON submissions(employee_name, month_key);
      `;
      
      const { error } = await this.supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to create submissions table:', error);
      return { success: false, error };
    }
  }

  /**
   * Comprehensive database setup - creates all required tables
   */
  async setupDatabase() {
    const results = {
      employees: { success: false },
      clients: { success: false },
      submissions: { success: false }
    };

    try {
      // Create employees table
      this.notify({
        type: 'info',
        title: 'Setting up database',
        message: 'Creating employees table...',
        duration: 3000
      });
      
      results.employees = await this.createEmployeesTable();
      
      // Create clients table
      this.notify({
        type: 'info',
        title: 'Setting up database',
        message: 'Creating clients table...',
        duration: 3000
      });
      
      results.clients = await this.createClientsTable();
      
      // Create submissions table
      this.notify({
        type: 'info',
        title: 'Setting up database',
        message: 'Creating submissions table...',
        duration: 3000
      });
      
      results.submissions = await this.createSubmissionsTable();
      
      // Check overall success
      const allSuccessful = Object.values(results).every(result => result.success);
      
      if (allSuccessful) {
        this.notify({
          type: 'success',
          title: 'Database Setup Complete',
          message: 'All required tables have been created successfully!',
          duration: 5000
        });
      } else {
        const failedTables = Object.entries(results)
          .filter(([_, result]) => !result.success)
          .map(([table, _]) => table);
          
        this.notify({
          type: 'warning',
          title: 'Partial Database Setup',
          message: `Some tables could not be created: ${failedTables.join(', ')}. Manual setup may be required.`,
          duration: 8000
        });
      }
      
      return { success: allSuccessful, results };
      
    } catch (error) {
      console.error('Database setup failed:', error);
      
      this.notify({
        type: 'error',
        title: 'Database Setup Failed',
        message: 'Unable to set up database tables. Please contact your administrator.',
        duration: 8000
      });
      
      return { success: false, error, results };
    }
  }

  /**
   * Validate database setup and provide guidance
   */
  async validateSetup() {
    const requiredTables = {
      employees: ['name', 'phone', 'department', 'role', 'status'],
      clients: ['name', 'status', 'team', 'client_type'],
      submissions: ['employee_name', 'month_key', 'submitted_at']
    };

    const validation = {};
    const issues = [];

    for (const [tableName, requiredColumns] of Object.entries(requiredTables)) {
      const check = await this.checkTableStructure(tableName, requiredColumns);
      validation[tableName] = check;

      if (!check.exists) {
        issues.push(`Table '${tableName}' does not exist`);
      } else if (check.missingColumns.length > 0) {
        issues.push(`Table '${tableName}' is missing columns: ${check.missingColumns.join(', ')}`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      validation
    };
  }

  /**
   * Show setup guidance modal
   */
  showSetupGuidance(issues = []) {
    const content = `
      <div class="space-y-4">
        <div class="text-center">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            🔧 Database Setup Required
          </h3>
        </div>
        
        ${issues.length > 0 ? `
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 class="font-medium text-yellow-800 mb-2">Issues Found:</h4>
            <ul class="text-sm text-yellow-700 space-y-1">
              ${issues.map(issue => `<li>• ${issue}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 class="font-medium text-blue-800 mb-2">Quick Setup Options:</h4>
          <div class="text-sm text-blue-700 space-y-2">
            <p><strong>Option 1:</strong> Click "Auto Setup" to automatically create required tables</p>
            <p><strong>Option 2:</strong> Contact your administrator for manual setup</p>
            <p><strong>Option 3:</strong> Follow the database setup guide in the documentation</p>
          </div>
        </div>
        
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="font-medium text-gray-900 mb-2">What happens next?</h4>
          <ul class="text-sm text-gray-600 space-y-1">
            <li>• Required database tables will be created</li>
            <li>• Form submissions will work properly</li>
            <li>• Employee and client data will sync correctly</li>
            <li>• Dashboard data will display as expected</li>
          </ul>
        </div>
      </div>
    `;

    return {
      title: 'Database Setup Required',
      content,
      actions: [
        {
          label: 'Auto Setup',
          onClick: () => this.setupDatabase(),
          variant: 'primary'
        },
        {
          label: 'Setup Guide',
          onClick: () => window.open('/docs/database-setup', '_blank'),
          variant: 'secondary'
        },
        {
          label: 'Cancel',
          onClick: () => {},
          variant: 'secondary'
        }
      ]
    };
  }
}

/**
 * Utility function to create database setup manager
 */
export function createDatabaseSetup(supabase, notify) {
  return new DatabaseSetupManager(supabase, notify);
}

/**
 * Quick validation function for forms
 */
export async function validateDatabaseForForm(supabase, notify, requiredTables = ['employees', 'clients', 'submissions']) {
  const setupManager = createDatabaseSetup(supabase, notify);
  
  for (const tableName of requiredTables) {
    const check = await setupManager.checkTableStructure(tableName);
    
    if (!check.exists) {
      notify({
        type: 'warning',
        title: 'Database Setup Needed',
        message: `The ${tableName} table is not set up. Some features may not work properly.`,
        duration: 6000
      });
      
      return { isValid: false, missingTable: tableName, setupManager };
    }
  }
  
  return { isValid: true, setupManager };
}