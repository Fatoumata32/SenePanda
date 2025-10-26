/**
 * Script to confirm all existing users
 * Run this script if users cannot login after logout
 *
 * Usage: node scripts/confirm-users.js
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function confirmAllUsers() {
  try {
    console.log('🔍 Fetching unconfirmed users...');

    // Use service role to access auth schema
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();

    if (fetchError) {
      throw fetchError;
    }

    const unconfirmedUsers = users.users.filter(
      user => !user.email_confirmed_at || !user.confirmed_at
    );

    console.log(`📊 Found ${unconfirmedUsers.length} unconfirmed users out of ${users.users.length} total users`);

    if (unconfirmedUsers.length === 0) {
      console.log('✅ All users are already confirmed!');
      return;
    }

    console.log('\n📧 Confirming users...');

    for (const user of unconfirmedUsers) {
      try {
        const { error } = await supabase.auth.admin.updateUserById(
          user.id,
          {
            email_confirm: true
          }
        );

        if (error) {
          console.error(`❌ Error confirming user ${user.email}:`, error.message);
        } else {
          console.log(`✅ Confirmed: ${user.email}`);
        }
      } catch (err) {
        console.error(`❌ Error confirming user ${user.email}:`, err.message);
      }
    }

    console.log('\n✅ Done! All users have been confirmed.');
    console.log('\n📝 Next steps:');
    console.log('1. Go to Supabase Dashboard > Authentication > Providers');
    console.log('2. Click on Email provider');
    console.log('3. Disable "Confirm email" option');
    console.log('4. Save changes');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
confirmAllUsers();
