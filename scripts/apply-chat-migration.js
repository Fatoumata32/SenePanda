const fs = require('fs');
const path = require('path');

async function applyChatMigration() {
  console.log('🚀 Preparing to apply chat system migration...\n');

  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'create_chat_system.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    return;
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 Chat System Migration SQL:\n');
  console.log('═'.repeat(80));
  console.log(sql);
  console.log('═'.repeat(80));
  console.log('\n⚠️  IMPORTANT: Apply this SQL in the Supabase SQL Editor\n');

  console.log('📋 Steps to apply:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/inhzfdufjhuihtuykwmw/editor');
  console.log('   2. Copy the SQL above');
  console.log('   3. Paste it in the SQL Editor');
  console.log('   4. Click "Run" to execute');
  console.log('\n✅ This will create:');
  console.log('   - conversations table');
  console.log('   - messages table');
  console.log('   - user_presence table');
  console.log('   - quick_replies table');
  console.log('   - get_conversations_with_details() function');
  console.log('   - send_message() function');
  console.log('   - mark_messages_as_read() function');
  console.log('   - All necessary RLS policies\n');
}

applyChatMigration().catch(console.error);
