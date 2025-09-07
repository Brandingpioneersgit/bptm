import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 8000;

// Supabase clients
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Service role client for bypassing RLS
const serviceSupabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_ADMIN_ACCESS_TOKEN
);

// Middleware
app.use(cors());
app.use(express.json());

// Auth API endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);
    
    // Use global service role client to bypass RLS for authentication
    
    // Query unified_users table for authentication
    const { data: user, error } = await serviceSupabase
      .from('unified_users')
      .select('*')
      .eq('email', email)
      .single();
    
    console.log('User found:', !!user);
    console.log('User password_hash:', user?.password_hash);
    console.log('Provided password:', password);
    console.log('Password match:', user?.password_hash === password);
    
    if (error || !user) {
      console.log('User not found or error:', error);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Simple password check (in production, use proper hashing)
    if (user.password_hash !== password) {
      console.log('Password mismatch');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Return user data with token
    res.json({
      token: `bearer_${user.id}`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Employees API endpoints
app.get('/api/employees', async (req, res) => {
  try {
    // Use service role client to bypass RLS for employee queries
    const serviceSupabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_ADMIN_ACCESS_TOKEN
    );
    
    const { data: employees, error } = await serviceSupabase
      .from('unified_users')
      .select('*')
      .neq('role', 'Client');
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json(employees || []);
  } catch (error) {
    console.error('Employees fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const employeeData = req.body;
    console.log('[DEBUG] Employee creation request:', employeeData);
    
    // Use global service role client to bypass RLS for employee creation
    
    const { data: employee, error } = await serviceSupabase
      .from('unified_users')
      .insert([employeeData])
      .select()
      .single();
    
    if (error) {
      console.log('[DEBUG] Employee creation error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    console.log('[DEBUG] Employee created successfully:', employee);
    res.status(201).json(employee);
  } catch (error) {
    console.error('Employee creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Workspaces API endpoints
app.get('/api/workspaces', async (req, res) => {
  try {
    // Mock workspace data since this table might not exist
    const workspaces = [
      {
        id: '1',
        name: 'Main Workspace',
        description: 'Primary workspace for all operations',
        created_at: new Date().toISOString()
      },
      {
        id: '2', 
        name: 'Development Workspace',
        description: 'Development and testing environment',
        created_at: new Date().toISOString()
      }
    ];
    
    res.json(workspaces);
  } catch (error) {
    console.error('Workspaces fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Live Data API endpoints
app.get('/api/live-data', async (req, res) => {
  try {
    const liveData = {
      status: 'active',
      updates: [
        {
          id: '1',
          type: 'system',
          message: 'System running normally',
          timestamp: new Date().toISOString()
        }
      ],
      timestamp: new Date().toISOString()
    };
    
    res.json(liveData);
  } catch (error) {
    console.error('Live data fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Client API endpoints
app.get('/api/clients', async (req, res) => {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*');
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json(clients || []);
  } catch (error) {
    console.error('Clients fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const clientData = req.body;
    
    // Use service role client to bypass RLS for client creation
    const { data: client, error } = await serviceSupabase
      .from('clients')
      .insert([clientData])
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(201).json(client);
  } catch (error) {
    console.error('Client creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reports API endpoints
app.get('/api/reports/monthly-tactical', async (req, res) => {
  try {
    // Mock report data
    const report = {
      id: '1',
      title: 'Monthly Tactical Report',
      period: new Date().toISOString().slice(0, 7), // YYYY-MM format
      data: {
        metrics: {
          totalProjects: 15,
          completedTasks: 87,
          activeClients: 12
        },
        performance: {
          efficiency: 92,
          quality: 88,
          satisfaction: 95
        }
      },
      generated_at: new Date().toISOString()
    };
    
    res.json(report);
  } catch (error) {
    console.error('Monthly tactical report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/reports/quarterly-strategic', async (req, res) => {
  try {
    // Mock strategic report data
    const report = {
      id: '1',
      title: 'Quarterly Strategic Report',
      quarter: Math.ceil((new Date().getMonth() + 1) / 3),
      year: new Date().getFullYear(),
      data: {
        growth: {
          revenue: 15.2,
          clients: 8.7,
          projects: 12.3
        },
        strategic_goals: {
          market_expansion: 'On Track',
          team_growth: 'Ahead of Schedule',
          technology_adoption: 'In Progress'
        }
      },
      generated_at: new Date().toISOString()
    };
    
    res.json(report);
  } catch (error) {
    console.error('Quarterly strategic report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Check existing users' roles and password hashes in the database
app.get('/api/check-users', async (req, res) => {
  try {
    const serviceSupabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_ADMIN_ACCESS_TOKEN
    );

    // Query existing users and their roles
    const { data: users, error } = await serviceSupabase
      .from('unified_users')
      .select('role, email, name, password_hash')
      .limit(10);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ users: users || [], count: users?.length || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// Seed test users endpoint (for development only)
app.post('/api/seed-users', async (req, res) => {
  try {
    // Create service role client to bypass RLS
    const serviceSupabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_ADMIN_ACCESS_TOKEN
    );

    // Simple test user with minimal required fields
    const testUsers = [
      {
        user_id: 'USR001',
        name: 'Test User',
        email: 'marketing.manager@example.com',
        password_hash: 'password123',
        role: 'SEO'
      }
    ];

    // Clear existing users first using service role
    await serviceSupabase.from('unified_users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert test users using service role
    const { data, error } = await serviceSupabase
      .from('unified_users')
      .insert(testUsers)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Test users created successfully', users: data });
  } catch (error) {
    console.error('Seed users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;