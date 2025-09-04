import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkRoles() {
  try {
    const { data, error } = await supabase
      .from('unified_users')
      .select('role, user_category, name')
      .order('role');

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('=== ROLES IN DATABASE ===');
    
    const roleGroups = {};
    data.forEach(user => {
      if (!roleGroups[user.role]) {
        roleGroups[user.role] = [];
      }
      roleGroups[user.role].push({
        name: user.name,
        category: user.user_category
      });
    });

    Object.keys(roleGroups).sort().forEach(role => {
      console.log(`\n${role} (${roleGroups[role][0].category}):`);
      roleGroups[role].forEach(user => {
        console.log(`  - ${user.name}`);
      });
    });

    console.log('\n=== SUMMARY ===');
    console.log(`Total roles: ${Object.keys(roleGroups).length}`);
    console.log(`Total users: ${data.length}`);
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

checkRoles();