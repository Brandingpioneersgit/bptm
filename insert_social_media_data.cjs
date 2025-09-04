const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://igwgryykglsetfvomhdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnd2dyeXlrZ2xzZXRmdm9taGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTcxMDgsImV4cCI6MjA3MDMzMzEwOH0.yL1hK263qf9msp7K4vUtF4Lvb7x7yxPcyvgkPiLokqA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertSocialMediaData() {
  try {
    console.log('Starting Social Media test data insertion...');

    // Insert Social Media users
    const socialMediaUsers = [
      {
        email: 'mike.chen@company.com',
        name: 'Mike Chen',
        role: 'employee',
        department: 'Marketing',
        is_active: true
      },
      {
        email: 'lisa.wang@company.com',
        name: 'Lisa Wang',
        role: 'employee',
        department: 'Marketing',
        is_active: true
      }
    ];

    console.log('Inserting Social Media users...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .insert(socialMediaUsers)
      .select();

    if (usersError) {
      console.error('Error inserting users:', usersError);
    } else {
      console.log('Successfully inserted Social Media users:', usersData?.length || 0);
    }

    // Insert additional Social Media clients
    const socialMediaClients = [
      {
        name: 'Fashion Forward Boutique',
        client_type: 'Standard',
        team: 'Marketing',
        scope_of_work: 'Social Media Management',
        services: ['Social Media Marketing', 'Content Creation'],
        service_scopes: {
          'Social Media Marketing': {
            platforms: ['Instagram', 'Facebook', 'TikTok'],
            content_types: ['Posts', 'Stories', 'Reels'],
            posting_frequency: 'Daily'
          },
          'Content Creation': {
            types: ['Photography', 'Video', 'Graphics'],
            monthly_deliverables: 30
          }
        },
        status: 'Active',
        contact_person: 'Emma Rodriguez',
        contact_email: 'emma@fashionforward.com',
        contact_phone: '+1-555-0199'
      },
      {
        name: 'Fitness Revolution Gym',
        client_type: 'Premium',
        team: 'Marketing',
        scope_of_work: 'Social Media & Influencer Marketing',
        services: ['Social Media Marketing', 'Influencer Partnerships'],
        service_scopes: {
          'Social Media Marketing': {
            platforms: ['Instagram', 'YouTube', 'Facebook'],
            content_types: ['Workout Videos', 'Transformation Posts', 'Live Sessions'],
            posting_frequency: '2x Daily'
          },
          'Influencer Partnerships': {
            tier: 'Micro-influencers',
            monthly_collaborations: 8
          }
        },
        status: 'Active',
        contact_person: 'Marcus Johnson',
        contact_email: 'marcus@fitnessrev.com',
        contact_phone: '+1-555-0188'
      }
    ];

    console.log('Inserting additional Social Media clients...');
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .insert(socialMediaClients)
      .select();

    if (clientsError) {
      console.error('Error inserting clients:', clientsError);
    } else {
      console.log('Successfully inserted Social Media clients:', clientsData?.length || 0);
    }

    console.log('\n✅ Social Media test data insertion completed!');
    console.log('📊 The Social Media Dashboard now has test users and clients.');
    console.log('🎯 Mock performance data will be used until dedicated social media tables are created.');

  } catch (error) {
    console.error('Failed to insert Social Media test data:', error);
  }
}

insertSocialMediaData();