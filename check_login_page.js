// Script to check if the login page is being rendered correctly

console.log('\n🔍 Checking login page rendering...');
console.log('\nPlease follow these steps to debug the login issue:');
console.log('\n1. Open the browser console (F12 or right-click > Inspect > Console)');
console.log('2. Try to log in with "John" and "9876543210"');
console.log('3. Check the console for debug logs');
console.log('4. Look for any errors in the network tab');
console.log('\nIf you see "User with first name John not found" error:');
console.log('- Check if the database connection is working');
console.log('- Verify that the users exist in the database');
console.log('- Make sure the Supabase URL and API key are correct');
console.log('\nPossible issues:');
console.log('1. Database connection issues');
console.log('2. Case sensitivity in the name comparison');
console.log('3. Supabase configuration problems');
console.log('4. Network connectivity issues');
console.log('\nTo check the Supabase configuration:');
console.log('- Verify the .env file has the correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
console.log('- Make sure the Supabase service is running');
console.log('- Check if the database tables exist and have the correct data');

console.log('\n🔧 Possible fixes:');
console.log('1. Restart the development server');
console.log('2. Clear browser cache and local storage');
console.log('3. Verify database connection in the browser console:');
console.log('   - Run this in browser console: "localStorage.getItem(\'VITE_SUPABASE_URL\')"');
console.log('   - It should return the Supabase URL');
console.log('4. Try a different browser');
console.log('5. Check if the Supabase service is accessible from your network');

console.log('\n📝 Test credentials:');
console.log('- John SEO: 9876543210');
console.log('- Sarah Ads: 9876543211');
console.log('- Mike Social: 9876543212');
console.log('- Lisa YouTube: 9876543213');
console.log('- David Developer: 9876543214');
console.log('- Emma Designer: 9876543215');
console.log('- Admin Super: 9876543225');