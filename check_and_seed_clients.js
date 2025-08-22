import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Check if we're using placeholder credentials
const isPlaceholderConfig = 
  !SUPABASE_URL || 
  !SUPABASE_ANON_KEY || 
  SUPABASE_URL.includes('placeholder') || 
  SUPABASE_ANON_KEY.includes('placeholder');

if (isPlaceholderConfig) {
  console.log('🔧 Running in LOCAL MODE - Supabase credentials not configured');
  console.log('Cannot check or seed clients without database connection');
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sample clients to seed the database
const sampleClients = [
  {
    name: 'TechCorp Solutions',
    client_type: 'Premium',
    team: 'Web',
    scope_of_work: 'Full-stack web development and SEO optimization',
    services: ['SEO', 'Website Maintenance', 'Google Ads'],
    service_scopes: {
      'SEO': { deliverables: 15, description: 'Monthly SEO optimization', frequency: 'monthly' },
      'Website Maintenance': { deliverables: 8, description: 'Regular updates and fixes', frequency: 'weekly' },
      'Google Ads': { deliverables: 5, description: 'Ad campaign management', frequency: 'daily' }
    },
    status: 'Active',
    contact_email: 'contact@techcorp.com',
    contact_phone: '+1-555-0123'
  },
  {
    name: 'Digital Marketing Pro',
    client_type: 'Standard',
    team: 'Marketing',
    scope_of_work: 'Social media management and content creation',
    services: ['Social Media', 'Meta Ads'],
    service_scopes: {
      'Social Media': { deliverables: 20, description: 'Daily social media posts', frequency: 'daily' },
      'Meta Ads': { deliverables: 10, description: 'Facebook and Instagram ads', frequency: 'weekly' }
    },
    status: 'Active',
    contact_email: 'hello@digitalmarketingpro.com',
    contact_phone: '+1-555-0456'
  },
  {
    name: 'E-commerce Experts',
    client_type: 'Enterprise',
    team: 'Web',
    scope_of_work: 'E-commerce platform development and optimization',
    services: ['SEO', 'Website Maintenance', 'Google Ads', 'AI'],
    service_scopes: {
      'SEO': { deliverables: 25, description: 'Advanced e-commerce SEO', frequency: 'monthly' },
      'Website Maintenance': { deliverables: 12, description: 'Platform maintenance', frequency: 'weekly' },
      'Google Ads': { deliverables: 8, description: 'Shopping ads management', frequency: 'daily' },
      'AI': { deliverables: 5, description: 'AI-powered recommendations', frequency: 'monthly' }
    },
    status: 'Active',
    contact_email: 'support@ecommerceexperts.com',
    contact_phone: '+1-555-0789'
  },
  {
    name: 'Local Business Hub',
    client_type: 'Standard',
    team: 'Marketing',
    scope_of_work: 'Local SEO and Google Business Profile optimization',
    services: ['GBP SEO', 'Social Media'],
    service_scopes: {
      'GBP SEO': { deliverables: 10, description: 'Google Business Profile optimization', frequency: 'monthly' },
      'Social Media': { deliverables: 15, description: 'Local business social media', frequency: 'weekly' }
    },
    status: 'Active',
    contact_email: 'info@localbusinesshub.com',
    contact_phone: '+1-555-0321'
  },
  {
    name: 'Startup Accelerator',
    client_type: 'Premium',
    team: 'Web',
    scope_of_work: 'Startup website development and growth marketing',
    services: ['SEO', 'Website Maintenance', 'Social Media', 'Google Ads'],
    service_scopes: {
      'SEO': { deliverables: 18, description: 'Startup SEO strategy', frequency: 'monthly' },
      'Website Maintenance': { deliverables: 10, description: 'Rapid iteration support', frequency: 'weekly' },
      'Social Media': { deliverables: 12, description: 'Growth-focused social media', frequency: 'weekly' },
      'Google Ads': { deliverables: 6, description: 'Performance marketing', frequency: 'daily' }
    },
    status: 'Active',
    contact_email: 'growth@startupaccelerator.com',
    contact_phone: '+1-555-0654'
  }
];

async function checkAndSeedClients() {
  try {
    console.log('🔍 Checking clients table...');
    
    // Check if clients table exists and get current data
    const { data: existingClients, error: fetchError } = await supabase
      .from('clients')
      .select('*');
    
    if (fetchError) {
      if (fetchError.code === 'PGRST205') {
        console.log('❌ Clients table does not exist!');
        console.log('📋 Please create the clients table first using:');
        console.log('   /sql/create_clients_table.sql');
        return;
      }
      throw fetchError;
    }
    
    console.log(`📊 Found ${existingClients?.length || 0} existing clients`);
    
    if (existingClients && existingClients.length > 0) {
      console.log('✅ Clients already exist:');
      existingClients.forEach(client => {
        console.log(`   - ${client.name} (${client.team} team, ${client.client_type})`);
      });
      console.log('\n🎯 No seeding needed - clients table is populated');
      return;
    }
    
    console.log('🌱 Seeding database with sample clients...');
    
    // Insert sample clients
    const { data: insertedClients, error: insertError } = await supabase
      .from('clients')
      .insert(sampleClients)
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting clients:', insertError);
      throw insertError;
    }
    
    console.log(`✅ Successfully seeded ${insertedClients.length} clients:`);
    insertedClients.forEach(client => {
      console.log(`   - ${client.name} (${client.team} team, ${client.client_type})`);
    });
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('💡 You can now use the client dropdowns in the application');
    
  } catch (error) {
    console.error('💥 Error during client check/seed:', error);
    process.exit(1);
  }
}

// Run the check and seed function
checkAndSeedClients();