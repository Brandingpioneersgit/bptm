-- Function to create clients table if it doesn't exist
CREATE OR REPLACE FUNCTION create_clients_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create clients table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    client_type text NOT NULL CHECK (client_type IN ('Standard', 'Premium', 'Enterprise')),
    team text NOT NULL CHECK (team IN ('Web', 'Marketing')),
    scope_of_work text,
    services jsonb, -- array of services: ['SEO', 'Social Media', etc.]
    service_scopes jsonb, -- object with service details: {"SEO": {"deliverables": 10, "description": "...", "frequency": "monthly"}}
    status text DEFAULT 'Active' CHECK (status IN ('Active', 'Departed')),
    departed_reason text,
    departed_employees jsonb, -- array of employee names who caused departure
    contact_email text,
    contact_phone text,
    scope_notes text,
    logo_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
  
  -- Create index on name for faster searches
  CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
  
  -- Create index on team for filtering
  CREATE INDEX IF NOT EXISTS idx_clients_team ON public.clients(team);
  
  -- Create index on status for filtering
  CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
  
  -- Enable RLS (Row Level Security)
  ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
  
  -- Create policy to allow all operations for authenticated users
  DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.clients;
  CREATE POLICY "Allow all operations for authenticated users" ON public.clients
    FOR ALL USING (true);
    
  -- Grant permissions
  GRANT ALL ON public.clients TO authenticated;
  GRANT ALL ON public.clients TO anon;
  
  RAISE NOTICE 'Clients table created successfully';
END;
$$;

-- Execute the function to create the table
SELECT create_clients_table();