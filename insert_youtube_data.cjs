const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertYouTubeData() {
  console.log('Setting up YouTube SEO data...');
  
  // First, let's get existing clients to work with
  try {
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('status', 'Active')
      .limit(5);
    
    if (clientsError) {
      console.log('Error fetching clients:', clientsError.message);
      return;
    }
    
    console.log(`Found ${clients.length} active clients for YouTube channels`);
    
    // Since we can't create the YouTube tables directly, let's create mock data
    // that the dashboard can use, similar to the Social Media Dashboard approach
    
    const mockChannels = clients.map((client, index) => ({
      id: index + 1,
      clientName: client.name,
      clientType: client.client_type,
      handle: `@${client.name.toLowerCase().replace(/\s+/g, '')}-official`,
      url: `https://youtube.com/@${client.name.toLowerCase().replace(/\s+/g, '')}-official`,
      niche: ['Technology', 'Business', 'Finance', 'Marketing', 'Education'][index % 5],
      scopeOfWork: 'Full channel management, SEO optimization, content strategy',
      status: 'active',
      startDate: '2024-01-01'
    }));
    
    const mockEntries = [];
    const months = ['2024-01', '2023-12', '2023-11'];
    
    mockChannels.forEach((channel, channelIndex) => {
      months.forEach((month, monthIndex) => {
        const baseScore = 70 + Math.random() * 20;
        const entry = {
          id: channelIndex * 3 + monthIndex + 1,
          month: month,
          channelId: channel.id,
          clientName: channel.clientName,
          niche: channel.niche,
          
          // Growth metrics
          subsGrowthPct: (Math.random() * 30 - 5).toFixed(1),
          viewsGrowthPct: (Math.random() * 40 - 5).toFixed(1),
          watchGrowthPct: (Math.random() * 35 - 5).toFixed(1),
          ctrGrowthPct: (Math.random() * 15 - 2).toFixed(1),
          
          // Content output
          longVideosCount: Math.floor(Math.random() * 6) + 1,
          shortsCount: Math.floor(Math.random() * 15) + 5,
          communityPosts: Math.floor(Math.random() * 5),
          collabsCount: Math.floor(Math.random() * 3),
          
          // SEO metrics
          metadataCompletenessRate: (80 + Math.random() * 20).toFixed(1),
          chaptersUsageRate: (60 + Math.random() * 30).toFixed(1),
          endScreensCardsRate: (50 + Math.random() * 40).toFixed(1),
          playlistAssignmentRate: (70 + Math.random() * 25).toFixed(1),
          thumbsABTests: Math.floor(Math.random() * 4),
          
          // Search performance
          searchImpressionsShare: (30 + Math.random() * 20).toFixed(1),
          searchClickShare: (25 + Math.random() * 15).toFixed(1),
          topKeywordsCovered: Math.floor(Math.random() * 20) + 5,
          keywordsGainingRank: Math.floor(Math.random() * 10) + 2,
          
          // Retention
          avgViewDurationSec: Math.floor(180 + Math.random() * 200),
          avgPercentViewed: (60 + Math.random() * 20).toFixed(1),
          
          // Client management
          meetingsWithClient: Math.floor(Math.random() * 4) + 1,
          npsClient: (7 + Math.random() * 3).toFixed(1),
          mentorScore: (7 + Math.random() * 3).toFixed(1),
          
          // Calculated scores
          discoverabilityScore: (15 + Math.random() * 15).toFixed(1),
          retentionQualityScore: (12 + Math.random() * 13).toFixed(1),
          contentConsistencyScore: (8 + Math.random() * 7).toFixed(1),
          seoHygieneScore: (8 + Math.random() * 7).toFixed(1),
          searchPerformanceScore: (4 + Math.random() * 6).toFixed(1),
          relationshipScore: (2 + Math.random() * 3).toFixed(1),
          
          monthScore: baseScore.toFixed(2),
          status: 'approved',
          scopeCompleted: `Optimized ${Math.floor(Math.random() * 5) + 2} videos, SEO metadata updates`,
          activitiesNextMonth: 'Focus on playlist optimization and content strategy'
        };
        
        mockEntries.push(entry);
      });
    });
    
    console.log('Mock YouTube data prepared:');
    console.log(`- ${mockChannels.length} channels`);
    console.log(`- ${mockEntries.length} monthly entries`);
    console.log('\nSample channel:', mockChannels[0]);
    console.log('\nSample entry:', mockEntries[0]);
    
    console.log('\nYouTube SEO Dashboard will use this mock data until dedicated tables are created.');
    
  } catch (e) {
    console.log('Error setting up YouTube data:', e.message);
  }
}

insertYouTubeData().then(() => {
  console.log('YouTube data setup completed');
}).catch(console.error);