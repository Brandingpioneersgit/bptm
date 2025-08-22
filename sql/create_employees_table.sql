-- Function to create employees table if it doesn't exist
CREATE OR REPLACE FUNCTION create_employees_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create employees table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    phone text NOT NULL UNIQUE,
    email text,
    department text NOT NULL CHECK (department IN ('Web', 'Marketing', 'Operations Head', 'Web Head', 'HR')),
    role jsonb NOT NULL DEFAULT '[]'::jsonb, -- array of roles: ['Developer', 'Designer', etc.]
    status text DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Departed')),
    hire_date date,
    departure_date date,
    departure_reason text,
    profile_image_url text,
    emergency_contact jsonb, -- object with emergency contact details
    address jsonb, -- object with address details
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Ensure unique combination of name and phone
    CONSTRAINT unique_employee_identity UNIQUE (name, phone)
  );
  
  -- Create indexes for faster searches
  CREATE INDEX IF NOT EXISTS idx_employees_name ON public.employees(name);
  CREATE INDEX IF NOT EXISTS idx_employees_phone ON public.employees(phone);
  CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
  CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
  
  -- Create index on name and phone combination for quick lookups
  CREATE INDEX IF NOT EXISTS idx_employees_identity ON public.employees(name, phone);
  
  -- Enable RLS (Row Level Security)
  ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
  
  -- Create policy to allow all operations for authenticated users
  DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.employees;
  CREATE POLICY "Allow all operations for authenticated users" ON public.employees
    FOR ALL USING (true);
    
  -- Grant permissions
  GRANT ALL ON public.employees TO authenticated;
  GRANT ALL ON public.employees TO anon;
  
  -- Create trigger to update updated_at timestamp
  CREATE OR REPLACE FUNCTION update_employees_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  
  DROP TRIGGER IF EXISTS trigger_update_employees_updated_at ON public.employees;
  CREATE TRIGGER trigger_update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION update_employees_updated_at();
  
  RAISE NOTICE 'Employees table created successfully';
END;
$$;

-- Execute the function to create the table
SELECT create_employees_table();