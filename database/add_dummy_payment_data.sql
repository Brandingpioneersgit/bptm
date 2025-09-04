-- Add dummy payment data for existing clients

-- Get the current month in YYYY-MM-01 format
DO $$
DECLARE
    current_month DATE := date_trunc('month', CURRENT_DATE);
    previous_month DATE := date_trunc('month', CURRENT_DATE - INTERVAL '1 month');
    client_record RECORD;
    payment_status TEXT;
    payment_date DATE;
    bank_name TEXT;
BEGIN
    -- Loop through all active recurring clients
    FOR client_record IN 
        SELECT id, client_name, plan_amount, due_day 
        FROM recurring_clients 
        WHERE is_active = true
    LOOP
        -- Determine random payment status for current month
        CASE floor(random() * 4)
            WHEN 0 THEN payment_status := 'Paid';
            WHEN 1 THEN payment_status := 'Partial';
            WHEN 2 THEN payment_status := 'Pending';
            WHEN 3 THEN payment_status := 'Overdue';
        END CASE;
        
        -- Set payment date based on status
        IF payment_status = 'Paid' OR payment_status = 'Partial' THEN
            -- Payment date between 1st and 28th of current month
            payment_date := current_month + (floor(random() * 28) || ' days')::INTERVAL;
        ELSE
            payment_date := NULL;
        END IF;
        
        -- Set random bank
        CASE floor(random() * 4)
            WHEN 0 THEN bank_name := 'HDFC - Medappz';
            WHEN 1 THEN bank_name := 'HDFC BP';
            WHEN 2 THEN bank_name := 'AXIS BP';
            WHEN 3 THEN bank_name := 'Kotak BP';
        END CASE;
        
        -- Insert payment record for current month if it doesn't exist
        INSERT INTO recurring_payments (
            client_id, 
            payment_month, 
            amount, 
            payment_date, 
            bank, 
            status, 
            remarks
        ) VALUES (
            client_record.id,
            current_month,
            CASE 
                WHEN payment_status = 'Partial' THEN client_record.plan_amount * (0.5 + random() * 0.3)
                ELSE client_record.plan_amount
            END,
            payment_date,
            CASE WHEN payment_date IS NOT NULL THEN bank_name ELSE NULL END,
            payment_status,
            CASE 
                WHEN payment_status = 'Overdue' THEN 'Payment delayed'
                WHEN payment_status = 'Partial' THEN 'Partial payment received'
                WHEN payment_status = 'Paid' THEN 'Full payment received'
                ELSE ''
            END
        ) ON CONFLICT (client_id, payment_month) DO UPDATE SET
            amount = EXCLUDED.amount,
            payment_date = EXCLUDED.payment_date,
            bank = EXCLUDED.bank,
            status = EXCLUDED.status,
            remarks = EXCLUDED.remarks;
            
        -- Also add data for previous month (mostly paid)
        CASE floor(random() * 10)
            WHEN 0 THEN payment_status := 'Partial';
            WHEN 1 THEN payment_status := 'Overdue';
            ELSE payment_status := 'Paid';
        END CASE;
        
        -- Set payment date for previous month
        IF payment_status = 'Paid' OR payment_status = 'Partial' THEN
            payment_date := previous_month + (floor(random() * 28) || ' days')::INTERVAL;
        ELSE
            payment_date := NULL;
        END IF;
        
        -- Set random bank for previous month
        CASE floor(random() * 4)
            WHEN 0 THEN bank_name := 'HDFC - Medappz';
            WHEN 1 THEN bank_name := 'HDFC BP';
            WHEN 2 THEN bank_name := 'AXIS BP';
            WHEN 3 THEN bank_name := 'Kotak BP';
        END CASE;
        
        -- Insert payment record for previous month
        INSERT INTO recurring_payments (
            client_id, 
            payment_month, 
            amount, 
            payment_date, 
            bank, 
            status, 
            remarks
        ) VALUES (
            client_record.id,
            previous_month,
            CASE 
                WHEN payment_status = 'Partial' THEN client_record.plan_amount * (0.5 + random() * 0.3)
                ELSE client_record.plan_amount
            END,
            payment_date,
            CASE WHEN payment_date IS NOT NULL THEN bank_name ELSE NULL END,
            payment_status,
            CASE 
                WHEN payment_status = 'Overdue' THEN 'Payment delayed'
                WHEN payment_status = 'Partial' THEN 'Partial payment received'
                WHEN payment_status = 'Paid' THEN 'Full payment received'
                ELSE ''
            END
        ) ON CONFLICT (client_id, payment_month) DO UPDATE SET
            amount = EXCLUDED.amount,
            payment_date = EXCLUDED.payment_date,
            bank = EXCLUDED.bank,
            status = EXCLUDED.status,
            remarks = EXCLUDED.remarks;
    END LOOP;
    
    -- If no clients exist, create some sample clients with payment data
    IF NOT EXISTS (SELECT 1 FROM recurring_clients LIMIT 1) THEN
        -- Insert sample clients
        INSERT INTO recurring_clients (client_name, billing_cycle, plan_amount, due_day, am_owner) VALUES
        ('TechCorp Solutions', 'Monthly', 50000.00, 5, 'Amit Singh'),
        ('Digital Marketing Pro', 'Monthly', 75000.00, 10, 'Neha Verma'),
        ('E-commerce Giant', 'Quarterly', 200000.00, 15, 'Rohit Jain'),
        ('Healthcare Innovations', 'Monthly', 60000.00, 7, 'Priya Sharma'),
        ('Retail Solutions', 'Monthly', 45000.00, 12, 'Vikram Patel'),
        ('Education Tech', 'Monthly', 55000.00, 8, 'Ananya Gupta'),
        ('Travel Portal', 'Monthly', 65000.00, 20, 'Rahul Mehta'),
        ('Food Delivery App', 'Monthly', 80000.00, 25, 'Deepak Verma')
        ON CONFLICT DO NOTHING;
        
        -- Then run the same loop for these clients
        FOR client_record IN 
            SELECT id, client_name, plan_amount, due_day 
            FROM recurring_clients
        LOOP
            -- Current month data
            CASE floor(random() * 4)
                WHEN 0 THEN payment_status := 'Paid';
                WHEN 1 THEN payment_status := 'Partial';
                WHEN 2 THEN payment_status := 'Pending';
                WHEN 3 THEN payment_status := 'Overdue';
            END CASE;
            
            IF payment_status = 'Paid' OR payment_status = 'Partial' THEN
                payment_date := current_month + (floor(random() * 28) || ' days')::INTERVAL;
            ELSE
                payment_date := NULL;
            END IF;
            
            CASE floor(random() * 4)
                WHEN 0 THEN bank_name := 'HDFC - Medappz';
                WHEN 1 THEN bank_name := 'HDFC BP';
                WHEN 2 THEN bank_name := 'AXIS BP';
                WHEN 3 THEN bank_name := 'Kotak BP';
            END CASE;
            
            INSERT INTO recurring_payments (
                client_id, 
                payment_month, 
                amount, 
                payment_date, 
                bank, 
                status, 
                remarks
            ) VALUES (
                client_record.id,
                current_month,
                CASE 
                    WHEN payment_status = 'Partial' THEN client_record.plan_amount * (0.5 + random() * 0.3)
                    ELSE client_record.plan_amount
                END,
                payment_date,
                CASE WHEN payment_date IS NOT NULL THEN bank_name ELSE NULL END,
                payment_status,
                CASE 
                    WHEN payment_status = 'Overdue' THEN 'Payment delayed'
                    WHEN payment_status = 'Partial' THEN 'Partial payment received'
                    WHEN payment_status = 'Paid' THEN 'Full payment received'
                    ELSE ''
                END
            ) ON CONFLICT (client_id, payment_month) DO NOTHING;
            
            -- Previous month data
            CASE floor(random() * 10)
                WHEN 0 THEN payment_status := 'Partial';
                WHEN 1 THEN payment_status := 'Overdue';
                ELSE payment_status := 'Paid';
            END CASE;
            
            IF payment_status = 'Paid' OR payment_status = 'Partial' THEN
                payment_date := previous_month + (floor(random() * 28) || ' days')::INTERVAL;
            ELSE
                payment_date := NULL;
            END IF;
            
            CASE floor(random() * 4)
                WHEN 0 THEN bank_name := 'HDFC - Medappz';
                WHEN 1 THEN bank_name := 'HDFC BP';
                WHEN 2 THEN bank_name := 'AXIS BP';
                WHEN 3 THEN bank_name := 'Kotak BP';
            END CASE;
            
            INSERT INTO recurring_payments (
                client_id, 
                payment_month, 
                amount, 
                payment_date, 
                bank, 
                status, 
                remarks
            ) VALUES (
                client_record.id,
                previous_month,
                CASE 
                    WHEN payment_status = 'Partial' THEN client_record.plan_amount * (0.5 + random() * 0.3)
                    ELSE client_record.plan_amount
                END,
                payment_date,
                CASE WHEN payment_date IS NOT NULL THEN bank_name ELSE NULL END,
                payment_status,
                CASE 
                    WHEN payment_status = 'Overdue' THEN 'Payment delayed'
                    WHEN payment_status = 'Partial' THEN 'Partial payment received'
                    WHEN payment_status = 'Paid' THEN 'Full payment received'
                    ELSE ''
                END
            ) ON CONFLICT (client_id, payment_month) DO NOTHING;
        END LOOP;
    END IF;
    
    RAISE NOTICE 'Dummy payment data has been added successfully!';
END;
$$;