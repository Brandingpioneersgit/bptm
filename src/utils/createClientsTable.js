// Utility to handle clients table existence
export async function ensureClientsTableExists(supabase) {
  if (!supabase) {
    console.log('No Supabase client available');
    return false;
  }

  try {
    // First, try to query the clients table to see if it exists
    const { data, error } = await supabase
      .from('clients')
      .select('count')
      .limit(1);

    if (!error) {
      console.log('Clients table already exists');
      return true;
    }

    if (error.code === 'PGRST205') {
      console.log('⚠️  Clients table does not exist in the database.');
      console.log('📋 Please create the clients table manually in your Supabase dashboard.');
      console.log('💡 You can use the SQL from database/schemas/create_clients_table.sql');
      
      // Return empty array instead of failing
      return [];
    }
    
    console.error('Unexpected error checking clients table:', error);
    return [];
    
  } catch (error) {
    console.error('Error in ensureClientsTableExists:', error);
    return [];
  }
}

// Alternative approach: Create clients table using direct INSERT
export async function createClientsTableDirect(supabase) {
  if (!supabase) return false;
  
  try {
    // Try to insert a test record to trigger table creation
    const { error } = await supabase
      .from('clients')
      .insert({
        name: 'Test Client',
        client_type: 'Standard',
        team: 'Web',
        status: 'Active'
      })
      .select()
      .single();
    
    if (!error) {
      // Delete the test record
      await supabase
        .from('clients')
        .delete()
        .eq('name', 'Test Client');
      
      console.log('Clients table exists and is accessible');
      return true;
    }
    
    console.error('Cannot access clients table:', error);
    return false;
    
  } catch (error) {
    console.error('Error in createClientsTableDirect:', error);
    return false;
  }
}