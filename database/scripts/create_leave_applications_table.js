import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createLeaveApplicationsTable() {
  try {
    console.log('🏖️ Creating leave_applications table...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create leave_applications table
        CREATE TABLE IF NOT EXISTS public.leave_applications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          employee_name VARCHAR(255) NOT NULL,
          employee_email VARCHAR(255) NOT NULL,
          employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
          leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('sick', 'vacation', 'personal', 'wfh', 'emergency', 'maternity', 'paternity')),
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          reason TEXT,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
          approved_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
          approved_at TIMESTAMP WITH TIME ZONE,
          rejection_reason TEXT,
          total_days INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
          is_half_day BOOLEAN DEFAULT false,
          emergency_contact VARCHAR(255),
          backup_person VARCHAR(255),
          work_handover TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_leave_applications_employee_email ON public.leave_applications(employee_email);
        CREATE INDEX IF NOT EXISTS idx_leave_applications_status ON public.leave_applications(status);
        CREATE INDEX IF NOT EXISTS idx_leave_applications_dates ON public.leave_applications(start_date, end_date);
        CREATE INDEX IF NOT EXISTS idx_leave_applications_leave_type ON public.leave_applications(leave_type);
        
        -- Add RLS policies
        ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;
        
        -- Policy: Users can view their own applications
        CREATE POLICY "Users can view own leave applications" ON public.leave_applications
          FOR SELECT USING (employee_email = auth.jwt() ->> 'email');
        
        -- Policy: Users can insert their own applications
        CREATE POLICY "Users can create own leave applications" ON public.leave_applications
          FOR INSERT WITH CHECK (employee_email = auth.jwt() ->> 'email');
        
        -- Policy: Users can update their own pending applications
        CREATE POLICY "Users can update own pending applications" ON public.leave_applications
          FOR UPDATE USING (employee_email = auth.jwt() ->> 'email' AND status = 'pending');
        
        -- Policy: Managers can view all applications (simplified for now)
        CREATE POLICY "Public read access for leave applications" ON public.leave_applications
          FOR SELECT USING (true);
        
        -- Policy: Public insert access (for demo purposes)
        CREATE POLICY "Public insert access for leave applications" ON public.leave_applications
          FOR INSERT WITH CHECK (true);
        
        -- Add trigger for updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        CREATE TRIGGER update_leave_applications_updated_at
          BEFORE UPDATE ON public.leave_applications
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `
    });
    
    if (error) {
      console.error('❌ Error creating leave_applications table:', error);
      return;
    }
    
    console.log('✅ leave_applications table created successfully!');
    
    // Add some sample data
    console.log('📝 Adding sample leave applications...');
    
    const { data: sampleData, error: sampleError } = await supabase
      .from('leave_applications')
      .insert([
        {
          employee_name: 'Rahul Sharma',
          employee_email: 'rahul.sharma@testcompany.com',
          leave_type: 'vacation',
          start_date: '2024-02-15',
          end_date: '2024-02-17',
          reason: 'Family vacation to Goa',
          status: 'approved'
        },
        {
          employee_name: 'Priya Patel',
          employee_email: 'priya.patel@testcompany.com',
          leave_type: 'sick',
          start_date: '2024-02-10',
          end_date: '2024-02-10',
          reason: 'Fever and cold',
          status: 'approved',
          is_half_day: true
        },
        {
          employee_name: 'Amit Kumar',
          employee_email: 'amit.kumar@testcompany.com',
          leave_type: 'wfh',
          start_date: '2024-02-12',
          end_date: '2024-02-14',
          reason: 'Home renovation work',
          status: 'pending'
        }
      ]);
    
    if (sampleError) {
      console.error('⚠️ Error adding sample data:', sampleError);
    } else {
      console.log('✅ Sample leave applications added successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error in createLeaveApplicationsTable:', error);
  }
}

// Run the function
createLeaveApplicationsTable().then(() => {
  console.log('🏖️ Leave applications table setup complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Failed to create leave applications table:', error);
  process.exit(1);
});