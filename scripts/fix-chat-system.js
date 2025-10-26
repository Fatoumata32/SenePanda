const fs = require('fs');
const path = require('path');

async function fixChatSystem() {
  console.log('🔧 Preparing to fix chat system...\n');

  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'fix_chat_system.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    return;
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 Fix Chat System SQL:\n');
  console.log('═'.repeat(80));
  console.log(sql);
  console.log('═'.repeat(80));
  console.log('\n⚠️  IMPORTANT: Apply this SQL in the Supabase SQL Editor\n');

  console.log('📋 Steps to apply:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/inhzfdufjhuihtuykwmw/editor');
  console.log('   2. Copy the SQL above');
  console.log('   3. Paste it in the SQL Editor');
  console.log('   4. Click "Run" to execute');
  console.log('\n✅ This will:');
  console.log('   - Drop and recreate get_conversations_with_details() function');
  console.log('   - Drop and recreate all other chat functions');
  console.log('   - Fix any inconsistencies');
  console.log('   - Grant proper permissions\n');
  console.log('💡 This script is safe to run multiple times.');
}

fixChatSystem().catch(console.error);
