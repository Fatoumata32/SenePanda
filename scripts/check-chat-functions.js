const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://inhzfdufjhuihtuykwmw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluaHpmZHVmamh1aWh0dXlrd213Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDIwMjEzOSwiZXhwIjoyMDc1Nzc4MTM5fQ.qHRaXHo9Ezu40G4uqgO0o3dTsLGdCa4z-fEvqrcBDrs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFunctions() {
  console.log('🔍 Checking chat functions availability...\n');

  const functions = [
    'send_message',
    'get_or_create_conversation',
    'mark_messages_as_read',
    'update_user_presence',
    'get_conversations_with_details',
  ];

  for (const funcName of functions) {
    console.log(`Testing ${funcName}...`);

    // Try to call with dummy parameters to see if function exists
    const { error } = await supabase.rpc(funcName, {});

    if (error) {
      if (error.code === 'PGRST202') {
        console.log(`   ❌ Function does not exist: ${funcName}`);
      } else if (error.code === '42883') {
        console.log(`   ⚠️  Function exists but parameter mismatch (expected): ${funcName}`);
      } else {
        console.log(`   ✅ Function exists: ${funcName}`);
      }
    } else {
      console.log(`   ✅ Function exists and executed: ${funcName}`);
    }
  }

  console.log('\n' + '='.repeat(60));
}

checkFunctions().catch(console.error);
