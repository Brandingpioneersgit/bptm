// Employee exits table management for Supabase

export async function ensureEmployeeExitsTableExists(supabase) {
  if (!supabase) {
    console.log('No Supabase client available - running in local mode');
    return;
  }

  try {
    // Check if table exists by trying to select from it
    const { data, error } = await supabase
      .from('employee_exits')
      .select('id')
      .limit(1);

    if (error && error.code === 'PGRST205') {
      // Table doesn't exist, create it
      console.log('Creating employee_exits table...');
      
      const { error: createError } = await supabase.rpc('create_employee_exits_table');
      
      if (createError) {
        console.error('Error creating employee_exits table:', createError);
        throw createError;
      }
      
      console.log('✅ Employee exits table created successfully');
    } else if (error) {
      throw error;
    } else {
      console.log('✅ Employee exits table already exists');
    }
  } catch (error) {
    console.error('Error ensuring employee_exits table exists:', error);
    throw error;
  }
}

// Create a new employee exit record
export async function createEmployeeExit(supabase, exitData) {
  if (!supabase) {
    console.log('No Supabase client available - using local storage');
    
    // Local storage fallback
    const exitRecords = JSON.parse(localStorage.getItem('employee_exits') || '[]');
    const newExit = {
      ...exitData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    exitRecords.push(newExit);
    localStorage.setItem('employee_exits', JSON.stringify(exitRecords));
    return newExit;
  }

  try {
    await ensureEmployeeExitsTableExists(supabase);
    
    const { data, error } = await supabase
      .from('employee_exits')
      .insert([{
        ...exitData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('*')
      .single();

    if (error) throw error;
    
    console.log('✅ Employee exit record created:', data.employee_name);
    return data;
  } catch (error) {
    console.error('Error creating employee exit record:', error);
    throw error;
  }
}

// Update employee exit status
export async function updateEmployeeExitStatus(supabase, exitId, status, notes = '') {
  if (!supabase) {
    console.log('No Supabase client available - using local storage');
    
    // Local storage fallback
    const exitRecords = JSON.parse(localStorage.getItem('employee_exits') || '[]');
    const updatedRecords = exitRecords.map(exit => {
      if (exit.id === exitId) {
        return {
          ...exit,
          status,
          hr_notes: notes,
          updated_at: new Date().toISOString()
        };
      }
      return exit;
    });
    localStorage.setItem('employee_exits', JSON.stringify(updatedRecords));
    return updatedRecords.find(exit => exit.id === exitId);
  }

  try {
    const { data, error } = await supabase
      .from('employee_exits')
      .update({
        status,
        hr_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', exitId)
      .select('*')
      .single();

    if (error) throw error;
    
    console.log('✅ Employee exit status updated:', data.employee_name, status);
    return data;
  } catch (error) {
    console.error('Error updating employee exit status:', error);
    throw error;
  }
}

// Get all employee exit records
export async function getAllEmployeeExits(supabase) {
  if (!supabase) {
    console.log('No Supabase client available - using local storage');
    return JSON.parse(localStorage.getItem('employee_exits') || '[]');
  }

  try {
    const { data, error } = await supabase
      .from('employee_exits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205') {
        console.log('Employee exits table does not exist');
        return [];
      }
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching employee exits:', error);
    return [];
  }
}

// Get exit records by status
export async function getEmployeeExitsByStatus(supabase, status) {
  if (!supabase) {
    console.log('No Supabase client available - using local storage');
    const exitRecords = JSON.parse(localStorage.getItem('employee_exits') || '[]');
    return exitRecords.filter(exit => exit.status === status);
  }

  try {
    const { data, error } = await supabase
      .from('employee_exits')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205') {
        console.log('Employee exits table does not exist');
        return [];
      }
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching employee exits by status:', error);
    return [];
  }
}

// Get exit statistics
export async function getEmployeeExitStats(supabase) {
  const exits = await getAllEmployeeExits(supabase);
  
  const stats = {
    total: exits.length,
    pending: exits.filter(exit => exit.status === 'pending').length,
    approved: exits.filter(exit => exit.status === 'approved').length,
    completed: exits.filter(exit => exit.status === 'completed').length,
    thisMonth: exits.filter(exit => {
      const exitDate = new Date(exit.created_at);
      const now = new Date();
      return exitDate.getMonth() === now.getMonth() && exitDate.getFullYear() === now.getFullYear();
    }).length
  };
  
  return stats;
}

/*
SQL Schema for employee_exits table:

CREATE TABLE IF NOT EXISTS employee_exits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT,
  employee_name TEXT NOT NULL,
  employee_phone TEXT,
  department TEXT,
  role TEXT[],
  exit_reason TEXT NOT NULL,
  custom_reason TEXT,
  last_working_day DATE NOT NULL,
  notice_period INTEGER DEFAULT 30,
  immediate_exit BOOLEAN DEFAULT FALSE,
  overall_experience TEXT,
  reason_for_leaving TEXT,
  work_environment_feedback TEXT,
  management_feedback TEXT,
  improvement_suggestions TEXT,
  would_recommend_company TEXT,
  assets_to_return TEXT[],
  laptop_returned BOOLEAN DEFAULT FALSE,
  access_cards_returned BOOLEAN DEFAULT FALSE,
  documents_returned BOOLEAN DEFAULT FALSE,
  other_assets TEXT,
  handover_notes TEXT,
  handover_to TEXT,
  pending_tasks TEXT,
  client_handover TEXT,
  final_settlement TEXT,
  hr_notes TEXT,
  manager_approval BOOLEAN DEFAULT FALSE,
  hr_approval BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_exits_employee_name ON employee_exits(employee_name);
CREATE INDEX IF NOT EXISTS idx_employee_exits_status ON employee_exits(status);
CREATE INDEX IF NOT EXISTS idx_employee_exits_created_at ON employee_exits(created_at);
CREATE INDEX IF NOT EXISTS idx_employee_exits_last_working_day ON employee_exits(last_working_day);

-- Enable Row Level Security
ALTER TABLE employee_exits ENABLE ROW LEVEL SECURITY;

-- Create policies for Row Level Security
CREATE POLICY "Enable read access for all users" ON employee_exits FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON employee_exits FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON employee_exits FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON employee_exits FOR DELETE USING (true);
*/