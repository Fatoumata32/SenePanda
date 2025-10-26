const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://inhzfdufjhuihtuykwmw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluaHpmZHVmamh1aWh0dXlrd213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDIxMzksImV4cCI6MjA3NTc3ODEzOX0.UexWMIDnDYXcqHqzWY0NywMWHgt1_fZahWXqsD352_U';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testChatSystem() {
  console.log('🧪 Testing Chat System...\n');

  // Test 1: Check if tables exist
  console.log('1. Testing conversations table...');
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .limit(1);

  if (convError) {
    console.error('   ❌ Conversations table error:', convError.message);
  } else {
    console.log('   ✅ Conversations table exists');
  }

  // Test 2: Check messages table
  console.log('\n2. Testing messages table...');
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .limit(1);

  if (msgError) {
    console.error('   ❌ Messages table error:', msgError.message);
  } else {
    console.log('   ✅ Messages table exists');
  }

  // Test 3: Check user_presence table
  console.log('\n3. Testing user_presence table...');
  const { data: presence, error: presError } = await supabase
    .from('user_presence')
    .select('*')
    .limit(1);

  if (presError) {
    console.error('   ❌ User presence table error:', presError.message);
  } else {
    console.log('   ✅ User presence table exists');
  }

  // Test 4: Check quick_replies table
  console.log('\n4. Testing quick_replies table...');
  const { data: replies, error: repliesError } = await supabase
    .from('quick_replies')
    .select('*')
    .limit(1);

  if (repliesError) {
    console.error('   ❌ Quick replies table error:', repliesError.message);
  } else {
    console.log('   ✅ Quick replies table exists');
  }

  // Test 5: Test get_conversations_with_details function
  console.log('\n5. Testing get_conversations_with_details function...');

  // Get a user ID from profiles
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.log('   ⚠️  No users found to test with');
  } else {
    const testUserId = users[0].id;
    const { data: convDetails, error: funcError } = await supabase
      .rpc('get_conversations_with_details', {
        p_user_id: testUserId,
      });

    if (funcError) {
      console.error('   ❌ Function error:', funcError.message);
    } else {
      console.log('   ✅ get_conversations_with_details function works!');
      console.log('   📊 Found', convDetails?.length || 0, 'conversations');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Chat System Test Complete!');
  console.log('='.repeat(60));
}

testChatSystem().catch(console.error);
