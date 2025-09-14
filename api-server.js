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
    const { email, password, username, firstName, phone, type } = req.body;
    
    console.log('Request body:', JSON.stringify(req.body));
    
    // Handle phone authentication
    if (type === 'phone_auth' && firstName && phone) {
      console.log('Phone authentication attempt for:', firstName, phone);
      
      // Normalize phone number
      const normalizedPhone = phone.replace(/^\+91-?/, '').replace(/[\s\-\(\)]/g, '').replace(/^0/, '');
      
      // Search for users by first name and phone
      const { data: users, error: searchError } = await serviceSupabase
        .from('unified_users')
        .select('*')
        .ilike('name', `%${firstName}%`)
        .eq('status', 'active');
        
      if (searchError || !users || users.length === 0) {
        console.log('No users found matching name:', firstName);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Find matching user by first name and phone
      const matchingUser = users.find(user => {
        const userFirstName = user.name.split(' ')[0].toLowerCase();
        const inputFirstName = firstName.toLowerCase();
        const userPhone = user.phone?.replace(/^\+91-?/, '').replace(/[\s\-\(\)]/g, '').replace(/^0/, '');
        
        console.log('Comparing:', {
          userFirstName,
          inputFirstName,
          userPhone,
          normalizedPhone,
          nameMatch: userFirstName === inputFirstName,
          phoneMatch: userPhone === normalizedPhone
        });
        
        return userFirstName === inputFirstName && userPhone === normalizedPhone;
      });
      
      if (!matchingUser) {
        console.log('No matching user found for phone auth');
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      console.log('Phone auth successful for:', matchingUser.name);
      
      return res.json({
        token: `bearer_${matchingUser.id}`,
        user: {
          id: matchingUser.id,
          name: matchingUser.name,
          firstName: matchingUser.name.split(' ')[0],
          email: matchingUser.email,
          phone: matchingUser.phone,
          role: matchingUser.role,
          user_category: matchingUser.user_category,
          department: matchingUser.department,
          permissions: matchingUser.permissions || {},
          dashboard_access: matchingUser.dashboard_access || []
        }
      });
    }
    
    // Handle email/username authentication (existing code)
    const loginIdentifier = email || username;
    console.log('Login attempt for:', loginIdentifier);
    
    // Use global service role client to bypass RLS for authentication
    
    // Query unified_users table for authentication - support both email and username
    let user, error;
    
    if (email) {
      const result = await serviceSupabase
        .from('unified_users')
        .select('*')
        .eq('email', email)
        .single();
      user = result.data;
      error = result.error;
    } else if (username) {
      // Try to match username against email, name, or user_id fields
      const result = await serviceSupabase
        .from('unified_users')
        .select('*')
        .or(`email.eq.${username},name.eq.${username},user_id.eq.${username}`)
        .single();
      user = result.data;
      error = result.error;
    } else {
      return res.status(400).json({ error: 'Email or username required' });
    }
    
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

// Logout endpoint
app.post('/api/auth/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (token) {
      // In a real implementation, you would invalidate the token in the database
      // For now, we'll just return success since the frontend handles token removal
      console.log('Logout request for token:', token.substring(0, 10) + '...');
    }
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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
    console.log('[DEBUG] Client creation request:', clientData);
    
    // Use service role client to bypass RLS for client creation
    const { data: client, error } = await serviceSupabase
      .from('clients')
      .insert([clientData])
      .select()
      .single();
    
    if (error) {
      console.log('[DEBUG] Client creation error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    console.log('[DEBUG] Client created successfully:', client);
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
      .select('role, email, name, phone, password_hash')
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
    console.log('Seed users endpoint called');
    // Create service role client to bypass RLS
    const serviceSupabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_ADMIN_ACCESS_TOKEN
    );
    console.log('Service client created');

    // TestSprite-expected users with correct credentials and all required fields
    const testUsers = [
      {
        user_id: 'USR001',
        name: 'Marketing Manager',
        email: 'marketing.manager@example.com',
        phone: '9876543210',
        password_hash: 'password123',
        role: 'Operations Head',
        user_category: 'management',
        department: 'Marketing',
        employee_id: 'EMP001',
        hire_date: '2024-01-01',
        employment_type: 'full_time',
        skills: ['Marketing Strategy', 'Team Management'],
        status: 'active',
        dashboard_access: ['operations_dashboard', 'management_dashboard'],
        permissions: {"read": true, "write": true},
        account_locked: false,
        login_attempts: 0
      },
      {
        user_id: 'USR002',
        name: 'Super Admin',
        email: 'super.admin@example.com',
        phone: '9876543211',
        password_hash: 'password123',
        role: 'Super Admin',
        user_category: 'super_admin',
        department: 'Administration',
        employee_id: 'ADM001',
        hire_date: '2024-01-01',
        employment_type: 'full_time',
        skills: ['System Administration', 'Full Stack Development'],
        status: 'active',
        dashboard_access: ['all_dashboards', 'admin_dashboard'],
        permissions: {"full_access": true},
        account_locked: false,
        login_attempts: 0
      },
      {
        user_id: 'USR003',
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '9876543212',
        password_hash: 'password123',
        role: 'HR',
        user_category: 'admin',
        department: 'Administration',
        employee_id: 'ADM002',
        hire_date: '2024-01-01',
        employment_type: 'full_time',
        skills: ['Administration', 'User Management'],
        status: 'active',
        dashboard_access: ['hr_dashboard', 'admin_dashboard'],
        permissions: {"admin_access": true},
        account_locked: false,
        login_attempts: 0
      },
      {
        user_id: 'USR004',
        name: 'Employee User',
        email: 'employee@example.com',
        phone: '9876543213',
        password_hash: 'password123',
        role: 'SEO',
        user_category: 'employee',
        department: 'Marketing',
        employee_id: 'EMP002',
        hire_date: '2024-01-01',
        employment_type: 'full_time',
        skills: ['SEO', 'Content Marketing'],
        status: 'active',
        dashboard_access: ['employee_dashboard'],
        permissions: {"read": true, "write": true},
        account_locked: false,
        login_attempts: 0
      },
      {
        user_id: 'USR005',
        name: 'Freelancer User',
        email: 'freelancer@example.com',
        phone: '9876543214',
        password_hash: 'password123',
        role: 'Freelancer',
        user_category: 'freelancer',
        department: 'Marketing',
        employee_id: 'FRL001',
        hire_date: '2024-01-01',
        employment_type: 'contract',
        skills: ['Graphic Design', 'Social Media'],
        status: 'active',
        dashboard_access: ['freelancer_dashboard'],
        permissions: {"read": true, "write": false},
        account_locked: false,
        login_attempts: 0
      },
      {
        user_id: 'USR006',
        name: 'Intern User',
        email: 'intern@example.com',
        phone: '9876543215',
        password_hash: 'password123',
        role: 'Intern',
        user_category: 'intern',
        department: 'Marketing',
        employee_id: 'INT001',
        hire_date: '2024-01-01',
        employment_type: 'intern',
        skills: ['Learning', 'Basic Marketing'],
        status: 'active',
        dashboard_access: ['intern_dashboard'],
        permissions: {"read": true, "write": false},
        account_locked: false,
        login_attempts: 0
      },
      {
        user_id: 'USR007',
        name: 'Senior Developer',
        email: 'senior.developer@example.com',
        phone: '9876543216',
        password_hash: 'password123',
        role: 'Web Developer',
        user_category: 'employee',
        department: 'Technology',
        employee_id: 'EMP003',
        hire_date: '2024-01-01',
        employment_type: 'full_time',
        skills: ['JavaScript', 'React', 'Node.js', 'Database Design'],
        status: 'active',
        dashboard_access: ['employee_dashboard', 'dev_dashboard'],
        permissions: {"read": true, "write": true},
        account_locked: false,
        login_attempts: 0
      }
    ];

    console.log('Test users array created with', testUsers.length, 'users');

    // Clear existing users first using service role
    console.log('Clearing existing users...');
    const deleteResult = await serviceSupabase.from('unified_users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Delete result:', deleteResult);

    // Insert test users using service role
    console.log('Inserting test users...');
    const { data, error } = await serviceSupabase
      .from('unified_users')
      .insert(testUsers)
      .select();

    if (error) {
      console.error('Insert error:', error);
      return res.status(500).json({ error: error.message, details: error });
    }

    console.log('Users inserted successfully:', data?.length || 0);
    res.json({ message: 'Test users created successfully', users: data });
  } catch (error) {
    console.error('Seed users error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Employee Onboarding API endpoints
app.post('/api/employee/onboarding', async (req, res) => {
  try {
    const onboardingData = req.body;
    console.log('[DEBUG] Employee onboarding request:', onboardingData);
    
    // Mock onboarding process
    const result = {
      id: `onboard_${Date.now()}`,
      employee_id: onboardingData.employee_id,
      status: 'completed',
      steps_completed: ['profile_setup', 'training_materials', 'system_access'],
      created_at: new Date().toISOString()
    };
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Employee onboarding error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Client Onboarding API endpoints
app.post('/api/client/onboarding', async (req, res) => {
  try {
    const onboardingData = req.body;
    console.log('[DEBUG] Client onboarding request:', onboardingData);
    
    // Mock client onboarding process
    const result = {
      id: `client_onboard_${Date.now()}`,
      client_id: onboardingData.client_id,
      status: 'in_progress',
      steps_completed: ['initial_contact', 'requirements_gathering'],
      next_steps: ['contract_signing', 'project_kickoff'],
      created_at: new Date().toISOString()
    };
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Client onboarding error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sales Leads API endpoints
app.get('/api/sales/leads', async (req, res) => {
  try {
    // Mock sales leads data
    const leads = [
      {
        id: 'lead_001',
        company: 'Tech Startup Inc',
        contact_person: 'John Smith',
        email: 'john@techstartup.com',
        status: 'qualified',
        value: 50000,
        created_at: new Date().toISOString()
      },
      {
        id: 'lead_002',
        company: 'Marketing Agency LLC',
        contact_person: 'Sarah Johnson',
        email: 'sarah@marketingagency.com',
        status: 'contacted',
        value: 25000,
        created_at: new Date().toISOString()
      }
    ];
    
    res.json(leads);
  } catch (error) {
    console.error('Sales leads fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/sales/leads', async (req, res) => {
  try {
    const leadData = req.body;
    console.log('[DEBUG] New lead creation:', leadData);
    
    const newLead = {
      id: `lead_${Date.now()}`,
      ...leadData,
      status: 'new',
      created_at: new Date().toISOString()
    };
    
    res.status(201).json(newLead);
  } catch (error) {
    console.error('Lead creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accounts Payments API endpoints
app.get('/api/accounts/payments', async (req, res) => {
  try {
    // Mock payments data
    const payments = [
      {
        id: 'payment_001',
        client_id: 'client_001',
        amount: 5000,
        status: 'completed',
        payment_date: new Date().toISOString(),
        invoice_id: 'inv_001'
      },
      {
        id: 'payment_002',
        client_id: 'client_002',
        amount: 3500,
        status: 'pending',
        payment_date: null,
        invoice_id: 'inv_002'
      }
    ];
    
    res.json(payments);
  } catch (error) {
    console.error('Accounts payments fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Notifications API endpoints
app.get('/api/notifications', async (req, res) => {
  try {
    // Mock notifications data
    const notifications = [
      {
        id: 'notif_001',
        title: 'New Client Onboarded',
        message: 'Tech Startup Inc has been successfully onboarded',
        type: 'success',
        read: false,
        created_at: new Date().toISOString()
      },
      {
        id: 'notif_002',
        title: 'Payment Received',
        message: 'Payment of $5,000 received from Marketing Agency LLC',
        type: 'info',
        read: true,
        created_at: new Date().toISOString()
      }
    ];
    
    res.json(notifications);
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock marking notification as read
    const result = {
      id: id,
      read: true,
      updated_at: new Date().toISOString()
    };
    
    res.json(result);
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Audit Logs API endpoints
app.get('/api/audit/logs', async (req, res) => {
  try {
    // Mock audit logs data
    const logs = [
      {
        id: 'audit_001',
        user_id: 'USR001',
        action: 'LOGIN',
        resource: 'authentication',
        details: 'User logged in successfully',
        ip_address: '192.168.1.100',
        timestamp: new Date().toISOString()
      },
      {
        id: 'audit_002',
        user_id: 'USR001',
        action: 'CREATE_CLIENT',
        resource: 'clients',
        details: 'Created new client: Tech Startup Inc',
        ip_address: '192.168.1.100',
        timestamp: new Date().toISOString()
      }
    ];
    
    res.json(logs);
  } catch (error) {
    console.error('Audit logs fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Payment API endpoints
app.get('/api/payments/:payment_id', async (req, res) => {
  try {
    const { payment_id } = req.params;
    
    // payment_id is actually a submission_id since payments are stored in submissions table
    const { data: submission, error } = await serviceSupabase
      .from('submissions')
      .select('*')
      .eq('id', payment_id)
      .single();
    
    if (error || !submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.json(submission);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/payments/:payment_id', async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { paymentStatus, paymentProofUrl } = req.body;
    
    // Get current submission data
    const { data: currentSubmission, error: fetchError } = await serviceSupabase
      .from('submissions')
      .select('*')
      .eq('id', payment_id)
      .single();
    
    if (fetchError || !currentSubmission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Parse clients data
    let clients = currentSubmission.clients;
    if (typeof clients === 'string') {
      clients = JSON.parse(clients);
    }
    if (!Array.isArray(clients)) {
      clients = [];
    }
    
    // Validate payment proof URLs for completed/partial status
    if (paymentStatus) {
      const paymentValidationErrors = [];
      
      Object.keys(paymentStatus).forEach(clientId => {
        const status = paymentStatus[clientId];
        const proofUrl = (paymentProofUrl && paymentProofUrl[clientId]) || '';
        
        if (status === 'completed' || status === 'partial') {
          if (!proofUrl || proofUrl.trim() === '') {
            paymentValidationErrors.push(`Client ${clientId}: Payment proof URL is required for ${status} status`);
          } else {
            // Validate Google Drive URL format
            const isDriveUrl = /https?:\/\/(drive|docs)\.google\.com\//i.test(proofUrl);
            if (!isDriveUrl) {
              paymentValidationErrors.push(`Client ${clientId}: Payment proof must be a valid Google Drive URL`);
            }
          }
        }
      });
      
      if (paymentValidationErrors.length > 0) {
        return res.status(400).json({ 
          error: `Payment validation failed: ${paymentValidationErrors.join(', ')}` 
        });
      }
    }
    
    // Update clients with payment data
    if (paymentStatus || paymentProofUrl) {
      clients.forEach(client => {
        if (paymentStatus && paymentStatus[client.id]) {
          client.paymentStatus = paymentStatus[client.id];
        }
        if (paymentProofUrl && paymentProofUrl[client.id]) {
          client.paymentProofUrl = paymentProofUrl[client.id];
        }
      });
    }
    
    // Prepare update data
    const updateData = { 
      updated_at: new Date().toISOString(),
      clients: JSON.stringify(clients)
    };
    
    const { data: updatedSubmission, error: updateError } = await serviceSupabase
      .from('submissions')
      .update(updateData)
      .eq('id', payment_id)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('Update payment error:', updateError);
      return res.status(400).json({ error: updateError.message });
    }
    
    res.json(updatedSubmission);
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Root endpoint - API documentation
app.get('/', (req, res) => {
  res.json({
    message: 'BPTM API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: {
        'POST /api/auth/login': 'User authentication',
        'POST /api/auth/logout': 'User logout'
      },
      employees: {
        'GET /api/employees': 'Get all employees',
        'POST /api/employees': 'Create new employee',
        'POST /api/employee/onboarding': 'Employee onboarding'
      },
      clients: {
        'GET /api/clients': 'Get all clients',
        'POST /api/clients': 'Create new client',
        'POST /api/client/onboarding': 'Client onboarding'
      },
      reports: {
        'GET /api/reports/monthly-tactical': 'Monthly tactical reports',
        'GET /api/reports/quarterly-strategic': 'Quarterly strategic reports'
      },
      sales: {
        'GET /api/sales/leads': 'Get sales leads',
        'POST /api/sales/leads': 'Create sales lead'
      },
      payments: {
        'GET /api/accounts/payments': 'Get payment accounts',
        'GET /api/payments/:payment_id': 'Get specific payment',
        'PUT /api/payments/:payment_id': 'Update payment'
      },
      system: {
        'GET /health': 'Health check',
        'GET /api/check-users': 'Check users',
        'POST /api/seed-users': 'Seed test users',
        'GET /api/workspaces': 'Get workspaces',
        'GET /api/live-data': 'Get live data',
        'GET /api/notifications': 'Get notifications',
        'PUT /api/notifications/:id/read': 'Mark notification as read',
        'GET /api/audit/logs': 'Get audit logs'
      }
    }
  });
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