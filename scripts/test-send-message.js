const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://inhzfdufjhuihtuykwmw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluaHpmZHVmamh1aWh0dXlrd213Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDIwMjEzOSwiZXhwIjoyMDc1Nzc4MTM5fQ.qHRaXHo9Ezu40G4uqgO0o3dTsLGdCa4z-fEvqrcBDrs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSendMessage() {
  console.log('🧪 Testing send_message function...\n');

  // Get two users
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .limit(2);

  if (userError || !users || users.length < 2) {
    console.error('❌ Need at least 2 users in the database');
    return;
  }

  const buyerId = users[0].id;
  const sellerId = users[1].id;

  console.log('1. Creating a test conversation...');

  // Create a conversation
  const { data: conversationId, error: convError } = await supabase.rpc('get_or_create_conversation', {
    p_buyer_id: buyerId,
    p_seller_id: sellerId,
    p_product_id: null,
  });

  if (convError) {
    console.error('   ❌ Error creating conversation:', convError.message);
    return;
  }

  console.log('   ✅ Conversation created:', conversationId);

  console.log('\n2. Testing send_message function...');

  // Test sending a message
  const { data: messageId, error: msgError } = await supabase.rpc('send_message', {
    p_conversation_id: conversationId,
    p_sender_id: buyerId,
    p_content: 'Test message from script',
    p_message_type: 'text',
    p_image_url: null,
  });

  if (msgError) {
    console.error('   ❌ Error sending message:', msgError);
    console.error('   Details:', JSON.stringify(msgError, null, 2));
    return;
  }

  console.log('   ✅ Message sent successfully!');
  console.log('   Message ID:', messageId);

  console.log('\n3. Verifying message was saved...');

  // Check if message exists
  const { data: messages, error: checkError } = await supabase
    .from('messages')
    .select('*')
    .eq('id', messageId);

  if (checkError) {
    console.error('   ❌ Error checking message:', checkError.message);
  } else if (messages && messages.length > 0) {
    console.log('   ✅ Message verified in database:');
    console.log('   Content:', messages[0].content);
    console.log('   Sender ID:', messages[0].sender_id);
  } else {
    console.log('   ⚠️  Message not found in database');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Test Complete!');
  console.log('='.repeat(60));
}

testSendMessage().catch(console.error);
