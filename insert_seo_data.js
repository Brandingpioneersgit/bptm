import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://igwgryykglsetfvomhdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnd2dyeXlrZ2xzZXRmdm9taGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTcxMDgsImV4cCI6MjA3MDMzMzEwOH0.yL1hK263qf9msp7K4vUtF4Lvb7x7yxPcyvgkPiLokqA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertSEOTestData() {
  console.log('🚀 Starting SEO test data insertion...');
  
  try {
    // 1. Insert test SEO user
    console.log('📝 Inserting test SEO user...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        name: 'SEO Test User',
        email: 'seo@test.com',
        phone: '+91-9876540001',
        role: 'SEO Specialist',
        department: 'Marketing',
        is_active: true
      }, { onConflict: 'email' });
    
    if (userError) {
      console.error('❌ User insertion error:', userError);
    } else {
      console.log('✅ SEO user inserted successfully');
    }

    // 2. Insert test SEO clients
    console.log('📝 Inserting test SEO clients...');
    const seoClients = [
      {
        name: 'Digital Marketing Pro',
        client_type: 'Premium',
        team: 'Marketing',
        scope_of_work: 'Complete SEO and digital marketing services',
        services: ['SEO', 'Content Marketing', 'Technical SEO'],
        service_scopes: {
          'SEO': {
            deliverables: 25,
            description: 'Search engine optimization',
            frequency: 'monthly'
          },
          'Content Marketing': {
            deliverables: 12,
            description: 'Blog posts and articles',
            frequency: 'weekly'
          },
          'Technical SEO': {
            deliverables: 8,
            description: 'Technical SEO improvements',
            frequency: 'monthly'
          }
        },
        status: 'Active',
        contact_email: 'contact@digitalmarketing.com',
        contact_phone: '+1-555-0201',
        contact_person: 'Marketing Manager',
        monthly_retainer: 15000.00,
        industry: 'Marketing Agency',
        priority_level: 'High'
      },
      {
        name: 'Local Restaurant Chain',
        client_type: 'Standard',
        team: 'Marketing',
        scope_of_work: 'Local SEO and Google Business Profile optimization',
        services: ['SEO', 'Local SEO', 'GBP Management'],
        service_scopes: {
          'SEO': {
            deliverables: 15,
            description: 'Local restaurant SEO',
            frequency: 'monthly'
          },
          'Local SEO': {
            deliverables: 10,
            description: 'Local search optimization',
            frequency: 'monthly'
          },
          'GBP Management': {
            deliverables: 8,
            description: 'Google Business Profile management',
            frequency: 'weekly'
          }
        },
        status: 'Active',
        contact_email: 'manager@restaurant.com',
        contact_phone: '+1-555-0202',
        contact_person: 'Restaurant Manager',
        monthly_retainer: 8500.00,
        industry: 'Food & Beverage',
        priority_level: 'Medium'
      },
      {
        name: 'Fitness Studio Network',
        client_type: 'Standard',
        team: 'Marketing',
        scope_of_work: 'SEO for fitness and wellness industry',
        services: ['SEO', 'Content Marketing'],
        service_scopes: {
          'SEO': {
            deliverables: 12,
            description: 'Fitness industry SEO',
            frequency: 'monthly'
          },
          'Content Marketing': {
            deliverables: 8,
            description: 'Fitness content creation',
            frequency: 'weekly'
          }
        },
        status: 'Active',
        contact_email: 'info@fitnessstudio.com',
        contact_phone: '+1-555-0203',
        contact_person: 'Studio Owner',
        monthly_retainer: 6000.00,
        industry: 'Health & Fitness',
        priority_level: 'Medium'
      }
    ];

    for (const client of seoClients) {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .upsert(client, { onConflict: 'name' });
      
      if (clientError) {
        console.error(`❌ Client insertion error for ${client.name}:`, clientError);
      } else {
        console.log(`✅ Client ${client.name} inserted successfully`);
      }
    }

    console.log('🎉 SEO test data insertion completed successfully!');
    console.log('📊 SEO dashboard now has test users and clients to work with.');
    console.log('💡 Note: The dashboard will use mock performance data until SEO tables are created.');
    
  } catch (error) {
    console.error('💥 Failed to insert SEO test data:', error);
  }
}

// Run the script
insertSEOTestData();