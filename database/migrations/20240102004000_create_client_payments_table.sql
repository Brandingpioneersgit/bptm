-- Create client_payments table for storing client payment information

-- Create the function to create the client_payments table
CREATE OR REPLACE FUNCTION create_client_payments_table()
RETURNS void AS $$
BEGIN
    -- Create the client_payments table if it doesn't exist
    CREATE TABLE IF NOT EXISTS client_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        payment_month DATE NOT NULL, -- YYYY-MM-01 format
        amount DECIMAL(12,2),
        payment_date DATE,
        bank VARCHAR(50),
        status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Partial', 'Overdue')),
        remarks TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(client_id, payment_month)
    );
    
    -- Add RLS policies
    ALTER TABLE client_payments ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for all users to view client_payments
    CREATE POLICY client_payments_select_policy ON client_payments
        FOR SELECT USING (true);
    
    -- Create policy for authenticated users to insert/update client_payments
    CREATE POLICY client_payments_insert_policy ON client_payments
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    
    CREATE POLICY client_payments_update_policy ON client_payments
        FOR UPDATE USING (auth.uid() IS NOT NULL);
    
    -- Create policy for authenticated users to delete client_payments
    CREATE POLICY client_payments_delete_policy ON client_payments
        FOR DELETE USING (auth.uid() IS NOT NULL);
END;
$$ LANGUAGE plpgsql;