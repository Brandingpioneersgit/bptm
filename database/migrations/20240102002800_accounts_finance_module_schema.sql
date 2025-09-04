-- =============================================
-- ACCOUNTS & FINANCE MODULE SCHEMA
-- =============================================
-- This migration creates the comprehensive Accounts & Finance module
-- with recurring marketing payments, web projects, compliance tracking,
-- expenses ledger, and KPIs with 100-point scoring system

-- Enable RLS
ALTER DATABASE postgres SET row_security = on;

-- =============================================
-- CORE TABLES
-- =============================================

-- Accounts & Finance Users Table
CREATE TABLE IF NOT EXISTS af_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('accounts_executive', 'accounts_lead', 'finance_manager', 'admin')),
    department VARCHAR(100) DEFAULT 'Accounts & Finance',
    joining_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring Marketing Clients Table
CREATE TABLE IF NOT EXISTS recurring_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name VARCHAR(255) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('Monthly', 'Quarterly')),
    plan_amount DECIMAL(12,2) NOT NULL,
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    po_contract_number VARCHAR(100),
    am_owner VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring Marketing Payments Table (Monthly Grid)
CREATE TABLE IF NOT EXISTS recurring_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES recurring_clients(id) ON DELETE CASCADE,
    payment_month DATE NOT NULL, -- YYYY-MM-01 format
    amount DECIMAL(12,2),
    payment_date DATE,
    bank VARCHAR(50) CHECK (bank IN ('HDFC - Medappz', 'HDFC BP', 'AXIS BP', 'Kotak BP')),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Partial', 'Overdue')),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, payment_month)
);

-- Web Projects Table (One-time)
CREATE TABLE IF NOT EXISTS web_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    scope_milestone TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    bank VARCHAR(50) CHECK (bank IN ('HDFC - Medappz', 'HDFC BP', 'AXIS BP', 'Kotak BP')),
    status VARCHAR(20) DEFAULT 'Unpaid' CHECK (status IN ('Paid', 'Unpaid', 'Partial')),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Annual Fees Table (Server & Maintenance)
CREATE TABLE IF NOT EXISTS annual_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name VARCHAR(255) NOT NULL,
    plan_amount DECIMAL(12,2) NOT NULL,
    billing_month DATE NOT NULL, -- YYYY-MM-01 format
    invoice_date DATE,
    payment_date DATE,
    bank VARCHAR(50) CHECK (bank IN ('HDFC - Medappz', 'HDFC BP', 'AXIS BP', 'Kotak BP')),
    status VARCHAR(20) DEFAULT 'Unpaid' CHECK (status IN ('Paid', 'Unpaid', 'Partial')),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Tracker Table
CREATE TABLE IF NOT EXISTS compliance_tracker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_month DATE NOT NULL, -- YYYY-MM-01 format
    bookkeeping_monthly BOOLEAN DEFAULT false,
    tds_deposit_monthly BOOLEAN DEFAULT false,
    gst_filing_monthly BOOLEAN DEFAULT false,
    pf_esi_monthly BOOLEAN DEFAULT false,
    quarterly_advance_tax_q1 BOOLEAN DEFAULT false,
    quarterly_advance_tax_q2 BOOLEAN DEFAULT false,
    quarterly_advance_tax_q3 BOOLEAN DEFAULT false,
    quarterly_advance_tax_q4 BOOLEAN DEFAULT false,
    itr_filing_annual BOOLEAN DEFAULT false,
    notes TEXT,
    evidence_links TEXT,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tracking_month)
);

-- Expenses Ledger Table
CREATE TABLE IF NOT EXISTS expenses_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date DATE NOT NULL,
    vendor VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    gstin VARCHAR(15),
    payment_mode VARCHAR(50) NOT NULL CHECK (payment_mode IN ('HDFC - Medappz', 'HDFC BP', 'AXIS BP', 'Kotak BP', 'Cash', 'Card', 'UPI')),
    invoice_number VARCHAR(100),
    project_client VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monthly Accounts Entries Table
CREATE TABLE IF NOT EXISTS af_monthly_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES af_users(id) ON DELETE CASCADE,
    entry_month DATE NOT NULL, -- YYYY-MM-01 format
    
    -- Collections & Timeliness Metrics
    invoices_due_amount DECIMAL(12,2) DEFAULT 0,
    invoices_received_amount DECIMAL(12,2) DEFAULT 0,
    ontime_receipts_count INTEGER DEFAULT 0,
    total_receipts_count INTEGER DEFAULT 0,
    ontime_recovery_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Compliance Metrics
    monthly_completion_percentage DECIMAL(5,2) DEFAULT 0,
    quarterly_advance_tax_ontime BOOLEAN DEFAULT false,
    itr_filed_ontime BOOLEAN DEFAULT false,
    
    -- Accuracy & Hygiene Metrics
    bank_mispostings_count INTEGER DEFAULT 0,
    invoices_reconciled_count INTEGER DEFAULT 0,
    proofs_uploaded_count INTEGER DEFAULT 0,
    accuracy_score DECIMAL(5,2) DEFAULT 0,
    
    -- Expense Discipline Metrics
    expense_report_submitted_ontime BOOLEAN DEFAULT false,
    expense_bills_complete BOOLEAN DEFAULT false,
    
    -- Financial Summary
    total_expenses DECIMAL(12,2) DEFAULT 0,
    net_collections DECIMAL(12,2) DEFAULT 0,
    
    -- Calculated Scores
    collections_timeliness_score DECIMAL(5,2) DEFAULT 0,
    compliance_score DECIMAL(5,2) DEFAULT 0,
    accuracy_hygiene_score DECIMAL(5,2) DEFAULT 0,
    expense_discipline_score DECIMAL(5,2) DEFAULT 0,
    month_score DECIMAL(5,2) DEFAULT 0,
    
    -- Penalties
    statutory_missed_penalty DECIMAL(5,2) DEFAULT 0,
    missing_payment_data_penalty DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, entry_month)
);

-- Accounts & Finance Appraisal Table
CREATE TABLE IF NOT EXISTS af_appraisal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES af_users(id) ON DELETE CASCADE,
    appraisal_month DATE NOT NULL, -- YYYY-MM-01 format
    
    -- Score Components
    collections_timeliness_score DECIMAL(5,2) DEFAULT 0,
    compliance_score DECIMAL(5,2) DEFAULT 0,
    accuracy_hygiene_score DECIMAL(5,2) DEFAULT 0,
    expense_discipline_score DECIMAL(5,2) DEFAULT 0,
    
    -- Penalties
    total_penalties DECIMAL(5,2) DEFAULT 0,
    
    -- Final Scores
    raw_score DECIMAL(5,2) DEFAULT 0,
    final_score DECIMAL(5,2) DEFAULT 0,
    
    -- Performance Band
    performance_band VARCHAR(20) DEFAULT 'Needs Improvement',
    
    -- Comments
    supervisor_comments TEXT,
    employee_comments TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, appraisal_month)
);

-- =============================================
-- SCORING FUNCTIONS
-- =============================================

-- Function to calculate Collections & Timeliness Score (40 points)
CREATE OR REPLACE FUNCTION calculate_af_collections_timeliness_score(
    ontime_recovery_percentage DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    CASE 
        WHEN ontime_recovery_percentage >= 95 THEN RETURN 40;
        WHEN ontime_recovery_percentage >= 90 THEN RETURN 35;
        WHEN ontime_recovery_percentage >= 80 THEN RETURN 28;
        WHEN ontime_recovery_percentage >= 70 THEN RETURN 20;
        ELSE RETURN 10;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate Compliance Score (35 points)
CREATE OR REPLACE FUNCTION calculate_af_compliance_score(
    monthly_completion_percentage DECIMAL,
    quarterly_advance_tax_ontime BOOLEAN,
    itr_filed_ontime BOOLEAN
) RETURNS DECIMAL AS $$
DECLARE
    monthly_score DECIMAL := 0;
    quarterly_score DECIMAL := 0;
    annual_score DECIMAL := 0;
BEGIN
    -- Monthly compliance score (20 points)
    CASE 
        WHEN monthly_completion_percentage = 100 THEN monthly_score := 20;
        WHEN monthly_completion_percentage >= 90 THEN monthly_score := 16;
        WHEN monthly_completion_percentage >= 80 THEN monthly_score := 12;
        WHEN monthly_completion_percentage >= 60 THEN monthly_score := 8;
        ELSE monthly_score := 4;
    END CASE;
    
    -- Quarterly advance tax (8 points)
    IF quarterly_advance_tax_ontime THEN
        quarterly_score := 8;
    ELSE
        quarterly_score := 0;
    END IF;
    
    -- ITR filing (7 points)
    IF itr_filed_ontime THEN
        annual_score := 7;
    ELSE
        annual_score := 0;
    END IF;
    
    RETURN monthly_score + quarterly_score + annual_score;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate Accuracy & Hygiene Score (15 points)
CREATE OR REPLACE FUNCTION calculate_af_accuracy_hygiene_score(
    bank_mispostings_count INTEGER,
    invoices_reconciled_count INTEGER,
    proofs_uploaded_count INTEGER,
    total_invoices_count INTEGER
) RETURNS DECIMAL AS $$
DECLARE
    reconciliation_rate DECIMAL;
    proof_upload_rate DECIMAL;
BEGIN
    -- Calculate rates
    IF total_invoices_count > 0 THEN
        reconciliation_rate := (invoices_reconciled_count::DECIMAL / total_invoices_count) * 100;
        proof_upload_rate := (proofs_uploaded_count::DECIMAL / total_invoices_count) * 100;
    ELSE
        reconciliation_rate := 100;
        proof_upload_rate := 100;
    END IF;
    
    -- Perfect accuracy and hygiene
    IF bank_mispostings_count = 0 AND reconciliation_rate = 100 AND proof_upload_rate = 100 THEN
        RETURN 15;
    -- Minor issues
    ELSIF bank_mispostings_count <= 2 AND reconciliation_rate >= 90 AND proof_upload_rate >= 90 THEN
        RETURN 10;
    -- Major issues
    ELSE
        RETURN 5;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate Expense Discipline Score (10 points)
CREATE OR REPLACE FUNCTION calculate_af_expense_discipline_score(
    expense_report_submitted_ontime BOOLEAN,
    expense_bills_complete BOOLEAN
) RETURNS DECIMAL AS $$
BEGIN
    IF expense_report_submitted_ontime AND expense_bills_complete THEN
        RETURN 10;
    ELSIF expense_report_submitted_ontime OR expense_bills_complete THEN
        RETURN 6;
    ELSE
        RETURN 3;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate penalties
CREATE OR REPLACE FUNCTION calculate_af_penalties(
    statutory_missed_count INTEGER,
    missing_payment_data_percentage DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    total_penalty DECIMAL := 0;
BEGIN
    -- Statutory missed penalty (-5 per instance)
    total_penalty := total_penalty + (statutory_missed_count * 5);
    
    -- Missing payment data penalty (-3 if >5%)
    IF missing_payment_data_percentage > 5 THEN
        total_penalty := total_penalty + 3;
    END IF;
    
    RETURN total_penalty;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate overall month score
CREATE OR REPLACE FUNCTION calculate_af_month_score(
    user_id UUID,
    entry_month DATE
) RETURNS DECIMAL AS $$
DECLARE
    entry_record af_monthly_entries%ROWTYPE;
    collections_score DECIMAL;
    compliance_score DECIMAL;
    accuracy_score DECIMAL;
    expense_score DECIMAL;
    total_penalties DECIMAL;
    raw_score DECIMAL;
    final_score DECIMAL;
BEGIN
    -- Get the monthly entry record
    SELECT * INTO entry_record 
    FROM af_monthly_entries 
    WHERE af_monthly_entries.user_id = calculate_af_month_score.user_id 
    AND af_monthly_entries.entry_month = calculate_af_month_score.entry_month;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Calculate individual scores
    collections_score := calculate_af_collections_timeliness_score(entry_record.ontime_recovery_percentage);
    compliance_score := calculate_af_compliance_score(
        entry_record.monthly_completion_percentage,
        entry_record.quarterly_advance_tax_ontime,
        entry_record.itr_filed_ontime
    );
    accuracy_score := calculate_af_accuracy_hygiene_score(
        entry_record.bank_mispostings_count,
        entry_record.invoices_reconciled_count,
        entry_record.proofs_uploaded_count,
        entry_record.total_receipts_count
    );
    expense_score := calculate_af_expense_discipline_score(
        entry_record.expense_report_submitted_ontime,
        entry_record.expense_bills_complete
    );
    
    -- Calculate penalties
    total_penalties := calculate_af_penalties(
        CASE WHEN entry_record.monthly_completion_percentage < 100 THEN 1 ELSE 0 END,
        CASE WHEN entry_record.total_receipts_count > 0 THEN 
            ((entry_record.total_receipts_count - entry_record.invoices_reconciled_count)::DECIMAL / entry_record.total_receipts_count) * 100
        ELSE 0 END
    );
    
    -- Calculate raw and final scores
    raw_score := collections_score + compliance_score + accuracy_score + expense_score;
    final_score := GREATEST(0, raw_score - total_penalties);
    
    -- Update the monthly entry with calculated scores
    UPDATE af_monthly_entries SET
        collections_timeliness_score = collections_score,
        compliance_score = compliance_score,
        accuracy_hygiene_score = accuracy_score,
        expense_discipline_score = expense_score,
        month_score = final_score,
        statutory_missed_penalty = CASE WHEN entry_record.monthly_completion_percentage < 100 THEN 5 ELSE 0 END,
        missing_payment_data_penalty = CASE WHEN entry_record.total_receipts_count > 0 AND 
            ((entry_record.total_receipts_count - entry_record.invoices_reconciled_count)::DECIMAL / entry_record.total_receipts_count) * 100 > 5 
            THEN 3 ELSE 0 END,
        updated_at = NOW()
    WHERE af_monthly_entries.user_id = calculate_af_month_score.user_id 
    AND af_monthly_entries.entry_month = calculate_af_month_score.entry_month;
    
    RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to update scores when monthly entries are modified
CREATE OR REPLACE FUNCTION trigger_update_af_scores()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate and update the month score
    PERFORM calculate_af_month_score(NEW.user_id, NEW.entry_month);
    
    -- Update or insert appraisal record
    INSERT INTO af_appraisal (
        user_id, appraisal_month, collections_timeliness_score, compliance_score,
        accuracy_hygiene_score, expense_discipline_score, total_penalties,
        raw_score, final_score, performance_band
    )
    SELECT 
        NEW.user_id,
        NEW.entry_month,
        NEW.collections_timeliness_score,
        NEW.compliance_score,
        NEW.accuracy_hygiene_score,
        NEW.expense_discipline_score,
        (NEW.statutory_missed_penalty + NEW.missing_payment_data_penalty),
        (NEW.collections_timeliness_score + NEW.compliance_score + NEW.accuracy_hygiene_score + NEW.expense_discipline_score),
        NEW.month_score,
        CASE 
            WHEN NEW.month_score >= 90 THEN 'Excellent'
            WHEN NEW.month_score >= 80 THEN 'Good'
            WHEN NEW.month_score >= 70 THEN 'Satisfactory'
            WHEN NEW.month_score >= 60 THEN 'Needs Improvement'
            ELSE 'Poor'
        END
    ON CONFLICT (user_id, appraisal_month) 
    DO UPDATE SET
        collections_timeliness_score = EXCLUDED.collections_timeliness_score,
        compliance_score = EXCLUDED.compliance_score,
        accuracy_hygiene_score = EXCLUDED.accuracy_hygiene_score,
        expense_discipline_score = EXCLUDED.expense_discipline_score,
        total_penalties = EXCLUDED.total_penalties,
        raw_score = EXCLUDED.raw_score,
        final_score = EXCLUDED.final_score,
        performance_band = EXCLUDED.performance_band,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_af_scores_trigger
    AFTER INSERT OR UPDATE ON af_monthly_entries
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_af_scores();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE af_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE af_monthly_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE af_appraisal ENABLE ROW LEVEL SECURITY;

-- RLS Policies for af_users
CREATE POLICY "af_users_select_policy" ON af_users FOR SELECT USING (true);
CREATE POLICY "af_users_insert_policy" ON af_users FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'finance_manager')
);
CREATE POLICY "af_users_update_policy" ON af_users FOR UPDATE USING (
    auth.jwt() ->> 'role' IN ('admin', 'finance_manager') OR 
    auth.jwt() ->> 'employee_id' = employee_id
);

-- RLS Policies for financial data (accessible by accounts team)
CREATE POLICY "af_financial_data_policy" ON recurring_clients FOR ALL USING (
    EXISTS (
        SELECT 1 FROM af_users 
        WHERE employee_id = auth.jwt() ->> 'employee_id' 
        AND is_active = true
    )
);

CREATE POLICY "af_recurring_payments_policy" ON recurring_payments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM af_users 
        WHERE employee_id = auth.jwt() ->> 'employee_id' 
        AND is_active = true
    )
);

CREATE POLICY "af_web_projects_policy" ON web_projects FOR ALL USING (
    EXISTS (
        SELECT 1 FROM af_users 
        WHERE employee_id = auth.jwt() ->> 'employee_id' 
        AND is_active = true
    )
);

CREATE POLICY "af_annual_fees_policy" ON annual_fees FOR ALL USING (
    EXISTS (
        SELECT 1 FROM af_users 
        WHERE employee_id = auth.jwt() ->> 'employee_id' 
        AND is_active = true
    )
);

CREATE POLICY "af_compliance_tracker_policy" ON compliance_tracker FOR ALL USING (
    EXISTS (
        SELECT 1 FROM af_users 
        WHERE employee_id = auth.jwt() ->> 'employee_id' 
        AND is_active = true
    )
);

CREATE POLICY "af_expenses_ledger_policy" ON expenses_ledger FOR ALL USING (
    EXISTS (
        SELECT 1 FROM af_users 
        WHERE employee_id = auth.jwt() ->> 'employee_id' 
        AND is_active = true
    )
);

-- RLS Policies for monthly entries (users can see their own + leads/admins see all)
CREATE POLICY "af_monthly_entries_select_policy" ON af_monthly_entries FOR SELECT USING (
    user_id = (
        SELECT id FROM af_users 
        WHERE employee_id = auth.jwt() ->> 'employee_id'
    ) OR
    EXISTS (
        SELECT 1 FROM af_users 
        WHERE employee_id = auth.jwt() ->> 'employee_id' 
        AND role IN ('accounts_lead', 'finance_manager', 'admin')
    )
);

CREATE POLICY "af_monthly_entries_insert_policy" ON af_monthly_entries FOR INSERT WITH CHECK (
    user_id = (
        SELECT id FROM af_users 
        WHERE employee_id = auth.jwt() ->> 'employee_id'
    )
);

CREATE POLICY "af_monthly_entries_update_policy" ON af_monthly_entries FOR UPDATE USING (
    user_id = (
        SELECT id FROM af_users 
        WHERE employee_id = auth.jwt() ->> 'employee_id'
    ) OR
    EXISTS (
        SELECT 1 FROM af_users 
        WHERE employee_id = auth.jwt() ->> 'employee_id' 
        AND role IN ('accounts_lead', 'finance_manager', 'admin')
    )
);

-- RLS Policies for appraisal (similar to monthly entries)
CREATE POLICY "af_appraisal_select_policy" ON af_appraisal FOR SELECT USING (
    user_id = (
        SELECT id FROM af_users 
        WHERE employee_id = auth.jwt() ->> 'employee_id'
    ) OR
    EXISTS (
        SELECT 1 FROM af_users 
        WHERE employee_id = auth.jwt() ->> 'employee_id' 
        AND role IN ('accounts_lead', 'finance_manager', 'admin')
    )
);

CREATE POLICY "af_appraisal_update_policy" ON af_appraisal FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM af_users 
        WHERE employee_id = auth.jwt() ->> 'employee_id' 
        AND role IN ('accounts_lead', 'finance_manager', 'admin')
    )
);

-- =============================================
-- DASHBOARD VIEW
-- =============================================

-- Create a comprehensive dashboard view for accounts executives
CREATE OR REPLACE VIEW af_employee_dashboard AS
SELECT 
    u.id as user_id,
    u.employee_id,
    u.name,
    u.role,
    
    -- Current Month Performance
    COALESCE(me.month_score, 0) as current_month_score,
    COALESCE(me.collections_timeliness_score, 0) as collections_score,
    COALESCE(me.compliance_score, 0) as compliance_score,
    COALESCE(me.accuracy_hygiene_score, 0) as accuracy_score,
    COALESCE(me.expense_discipline_score, 0) as expense_score,
    
    -- Financial Metrics
    COALESCE(me.invoices_due_amount, 0) as invoices_due,
    COALESCE(me.invoices_received_amount, 0) as invoices_received,
    COALESCE(me.ontime_recovery_percentage, 0) as ontime_recovery_rate,
    COALESCE(me.total_expenses, 0) as total_expenses,
    COALESCE(me.net_collections, 0) as net_collections,
    
    -- Compliance Status
    COALESCE(me.monthly_completion_percentage, 0) as compliance_rate,
    
    -- Performance Band
    COALESCE(ap.performance_band, 'Not Evaluated') as performance_band,
    
    -- Last 3 Months Average
    (
        SELECT AVG(month_score) 
        FROM af_monthly_entries me3 
        WHERE me3.user_id = u.id 
        AND me3.entry_month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')
    ) as last_3_months_avg,
    
    -- Penalties
    COALESCE(me.statutory_missed_penalty + me.missing_payment_data_penalty, 0) as total_penalties,
    
    me.entry_month as last_entry_month,
    u.is_active
    
FROM af_users u
LEFT JOIN af_monthly_entries me ON u.id = me.user_id 
    AND me.entry_month = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
LEFT JOIN af_appraisal ap ON u.id = ap.user_id 
    AND ap.appraisal_month = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
WHERE u.is_active = true
ORDER BY u.name;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_af_users_employee_id ON af_users(employee_id);
CREATE INDEX IF NOT EXISTS idx_af_users_role ON af_users(role);
CREATE INDEX IF NOT EXISTS idx_recurring_payments_client_month ON recurring_payments(client_id, payment_month);
CREATE INDEX IF NOT EXISTS idx_recurring_payments_status ON recurring_payments(status);
CREATE INDEX IF NOT EXISTS idx_web_projects_status ON web_projects(status);
CREATE INDEX IF NOT EXISTS idx_web_projects_due_date ON web_projects(due_date);
CREATE INDEX IF NOT EXISTS idx_annual_fees_billing_month ON annual_fees(billing_month);
CREATE INDEX IF NOT EXISTS idx_compliance_tracker_month ON compliance_tracker(tracking_month);
CREATE INDEX IF NOT EXISTS idx_expenses_ledger_date ON expenses_ledger(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_ledger_category ON expenses_ledger(category);
CREATE INDEX IF NOT EXISTS idx_af_monthly_entries_user_month ON af_monthly_entries(user_id, entry_month);
CREATE INDEX IF NOT EXISTS idx_af_appraisal_user_month ON af_appraisal(user_id, appraisal_month);

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- Insert sample users
INSERT INTO af_users (employee_id, name, email, role, joining_date) VALUES
('AF001', 'Priya Sharma', 'priya.sharma@company.com', 'accounts_executive', '2023-01-15'),
('AF002', 'Rajesh Kumar', 'rajesh.kumar@company.com', 'accounts_executive', '2023-03-01'),
('AF003', 'Anita Patel', 'anita.patel@company.com', 'accounts_lead', '2022-06-01'),
('AF004', 'Suresh Gupta', 'suresh.gupta@company.com', 'finance_manager', '2021-01-01')
ON CONFLICT (employee_id) DO NOTHING;

-- Insert sample recurring clients
INSERT INTO recurring_clients (client_name, billing_cycle, plan_amount, due_day, po_contract_number, am_owner) VALUES
('TechCorp Solutions', 'Monthly', 50000.00, 5, 'PO-2024-001', 'Amit Singh'),
('Digital Marketing Pro', 'Monthly', 75000.00, 10, 'PO-2024-002', 'Neha Verma'),
('E-commerce Giant', 'Quarterly', 200000.00, 15, 'PO-2024-003', 'Rohit Jain')
ON CONFLICT DO NOTHING;

COMMIT;