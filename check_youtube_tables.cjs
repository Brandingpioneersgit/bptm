const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkYouTubeTables() {
  console.log('Checking YouTube SEO tables...');
  
  // Check yt_channels table
  try {
    const { data: channels, error: channelsError } = await supabase
      .from('yt_channels')
      .select('*')
      .limit(5);
    
    if (channelsError) {
      console.log('yt_channels table does not exist:', channelsError.message);
    } else {
      console.log('yt_channels table exists with', channels.length, 'records');
      if (channels.length > 0) {
        console.log('Sample channel:', channels[0]);
      }
    }
  } catch (e) {
    console.log('Error checking yt_channels:', e.message);
  }
  
  // Check yt_monthly_entries table
  try {
    const { data: entries, error: entriesError } = await supabase
      .from('yt_monthly_entries')
      .select('*')
      .limit(5);
    
    if (entriesError) {
      console.log('yt_monthly_entries table does not exist:', entriesError.message);
    } else {
      console.log('yt_monthly_entries table exists with', entries.length, 'records');
      if (entries.length > 0) {
        console.log('Sample entry:', entries[0]);
      }
    }
  } catch (e) {
    console.log('Error checking yt_monthly_entries:', e.message);
  }
  
  // Check yt_users table
  try {
    const { data: users, error: usersError } = await supabase
      .from('yt_users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.log('yt_users table does not exist:', usersError.message);
    } else {
      console.log('yt_users table exists with', users.length, 'records');
      if (users.length > 0) {
        console.log('Sample user:', users[0]);
      }
    }
  } catch (e) {
    console.log('Error checking yt_users:', e.message);
  }
}

checkYouTubeTables().then(() => {
  console.log('YouTube tables check completed');
}).catch(console.error);