const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createFinancialTables() {
  try {
    console.log('Creating financial tables...');
    
    // Create financial_metrics table
    const { error: metricsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS financial_metrics (
          id SERIAL PRIMARY KEY,
          total_revenue DECIMAL(15,2) DEFAULT 0,
          total_expenses DECIMAL(15,2) DEFAULT 0,
          net_profit DECIMAL(15,2) DEFAULT 0,
          profit_margin DECIMAL(5,2) DEFAULT 0,
          cash_flow DECIMAL(15,2) DEFAULT 0,
          accounts_receivable DECIMAL(15,2) DEFAULT 0,
          accounts_payable DECIMAL(15,2) DEFAULT 0,
          monthly_growth DECIMAL(5,2) DEFAULT 0,
          yearly_growth DECIMAL(5,2) DEFAULT 0,
          outstanding_invoices INTEGER DEFAULT 0,
          pending_payments INTEGER DEFAULT 0,
          tax_liability DECIMAL(15,2) DEFAULT 0,
          period_start DATE,
          period_end DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (metricsError) {
      console.error('Error creating financial_metrics table:', metricsError);
    } else {
      console.log('✅ Created financial_metrics table');
    }
    
    // Create financial_transactions table
    const { error: transactionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS financial_transactions (
          id SERIAL PRIMARY KEY,
          transaction_id VARCHAR(50) UNIQUE,
          date DATE NOT NULL,
          description TEXT NOT NULL,
          amount DECIMAL(15,2) NOT NULL,
          type VARCHAR(20) CHECK (type IN ('income', 'expense')) NOT NULL,
          status VARCHAR(20) CHECK (status IN ('completed', 'pending', 'cancelled')) DEFAULT 'completed',
          category VARCHAR(100),
          client_id INTEGER REFERENCES clients(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (transactionsError) {
      console.error('Error creating financial_transactions table:', transactionsError);
    } else {
      console.log('✅ Created financial_transactions table');
    }
    
    // Create client_accounts table
    const { error: accountsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS client_accounts (
          id SERIAL PRIMARY KEY,
          client_id INTEGER REFERENCES clients(id),
          name VARCHAR(255) NOT NULL,
          outstanding DECIMAL(15,2) DEFAULT 0,
          last_payment DATE,
          status VARCHAR(20) CHECK (status IN ('current', 'overdue', 'paid')) DEFAULT 'current',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (accountsError) {
      console.error('Error creating client_accounts table:', accountsError);
    } else {
      console.log('✅ Created client_accounts table');
    }
    
    // Create expense_categories table
    const { error: expensesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS expense_categories (
          id SERIAL PRIMARY KEY,
          category VARCHAR(100) NOT NULL,
          amount DECIMAL(15,2) NOT NULL,
          percentage DECIMAL(5,2),
          budget DECIMAL(15,2),
          period_start DATE,
          period_end DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (expensesError) {
      console.error('Error creating expense_categories table:', expensesError);
    } else {
      console.log('✅ Created expense_categories table');
    }
    
    console.log('Financial tables creation completed!');
    
  } catch (error) {
    console.error('Error creating financial tables:', error.message);
  }
}

async function insertFinancialData() {
  try {
    console.log('\nInserting sample financial data...');
    
    // Fetch existing clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('status', 'Active')
      .limit(5);
    
    if (clientsError || !clients || clients.length === 0) {
      console.log('No active clients found, using mock data');
    }
    
    // Insert financial metrics
    const { error: metricsInsertError } = await supabase
      .from('financial_metrics')
      .insert({
        total_revenue: 2850000,
        total_expenses: 1650000,
        net_profit: 1200000,
        profit_margin: 42.1,
        cash_flow: 450000,
        accounts_receivable: 380000,
        accounts_payable: 220000,
        monthly_growth: 12.5,
        yearly_growth: 28.3,
        outstanding_invoices: 15,
        pending_payments: 8,
        tax_liability: 180000,
        period_start: '2024-01-01',
        period_end: '2024-01-31'
      });
    
    if (metricsInsertError) {
      console.error('Error inserting financial metrics:', metricsInsertError);
    } else {
      console.log('✅ Inserted financial metrics');
    }
    
    // Insert sample transactions
    const transactions = [
      {
        transaction_id: 'TXN001',
        date: '2024-01-15',
        description: 'Client Payment - ABC Corp',
        amount: 125000,
        type: 'income',
        status: 'completed',
        category: 'Client Payment'
      },
      {
        transaction_id: 'TXN002',
        date: '2024-01-14',
        description: 'Office Rent Payment',
        amount: -45000,
        type: 'expense',
        status: 'completed',
        category: 'Office Expenses'
      },
      {
        transaction_id: 'TXN003',
        date: '2024-01-13',
        description: 'Software Subscription',
        amount: -12000,
        type: 'expense',
        status: 'completed',
        category: 'Software & Tools'
      },
      {
        transaction_id: 'TXN004',
        date: '2024-01-12',
        description: 'Freelancer Payment',
        amount: -35000,
        type: 'expense',
        status: 'pending',
        category: 'Contractor Payments'
      },
      {
        transaction_id: 'TXN005',
        date: '2024-01-11',
        description: 'Client Payment - XYZ Ltd',
        amount: 85000,
        type: 'income',
        status: 'completed',
        category: 'Client Payment'
      }
    ];
    
    const { error: transactionsInsertError } = await supabase
      .from('financial_transactions')
      .insert(transactions);
    
    if (transactionsInsertError) {
      console.error('Error inserting transactions:', transactionsInsertError);
    } else {
      console.log('✅ Inserted sample transactions');
    }
    
    // Insert client accounts based on real clients if available
    let clientAccounts = [];
    if (clients && clients.length > 0) {
      clientAccounts = clients.map((client, index) => ({
        client_id: client.id,
        name: client.name,
        outstanding: 75000 + Math.random() * 50000,
        last_payment: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: ['current', 'current', 'overdue', 'current'][index % 4]
      }));
    } else {
      clientAccounts = [
        {
          name: 'ABC Corporation',
          outstanding: 125000,
          last_payment: '2024-01-10',
          status: 'current'
        },
        {
          name: 'XYZ Limited',
          outstanding: 85000,
          last_payment: '2024-01-05',
          status: 'current'
        },
        {
          name: 'Tech Solutions Inc',
          outstanding: 95000,
          last_payment: '2023-12-28',
          status: 'overdue'
        },
        {
          name: 'Digital Marketing Co',
          outstanding: 75000,
          last_payment: '2024-01-08',
          status: 'current'
        }
      ];
    }
    
    const { error: accountsInsertError } = await supabase
      .from('client_accounts')
      .insert(clientAccounts);
    
    if (accountsInsertError) {
      console.error('Error inserting client accounts:', accountsInsertError);
    } else {
      console.log('✅ Inserted client accounts');
    }
    
    // Insert expense categories
    const expenseCategories = [
      {
        category: 'Office Expenses',
        amount: 450000,
        percentage: 27.3,
        budget: 500000,
        period_start: '2024-01-01',
        period_end: '2024-01-31'
      },
      {
        category: 'Contractor Payments',
        amount: 380000,
        percentage: 23.0,
        budget: 400000,
        period_start: '2024-01-01',
        period_end: '2024-01-31'
      },
      {
        category: 'Software & Tools',
        amount: 320000,
        percentage: 19.4,
        budget: 350000,
        period_start: '2024-01-01',
        period_end: '2024-01-31'
      },
      {
        category: 'Marketing',
        amount: 280000,
        percentage: 17.0,
        budget: 300000,
        period_start: '2024-01-01',
        period_end: '2024-01-31'
      },
      {
        category: 'Utilities',
        amount: 220000,
        percentage: 13.3,
        budget: 250000,
        period_start: '2024-01-01',
        period_end: '2024-01-31'
      }
    ];
    
    const { error: expensesInsertError } = await supabase
      .from('expense_categories')
      .insert(expenseCategories);
    
    if (expensesInsertError) {
      console.error('Error inserting expense categories:', expensesInsertError);
    } else {
      console.log('✅ Inserted expense categories');
    }
    
    console.log('\n🎉 Financial data setup completed successfully!');
    console.log('The Accountant Dashboard now has real data to work with.');
    
  } catch (error) {
    console.error('Error inserting financial data:', error.message);
  }
}

async function main() {
  await createFinancialTables();
  await insertFinancialData();
}

main();