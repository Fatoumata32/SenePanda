const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://inhzfdufjhuihtuykwmw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluaHpmZHVmamh1aWh0dXlrd213Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDIwMjEzOSwiZXhwIjoyMDc1Nzc4MTM5fQ.qHRaXHo9Ezu40G4uqgO0o3dTsLGdCa4z-fEvqrcBDrs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyFavoritesMigration() {
  console.log('🚀 Applying favorites table migration...\n');

  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'create_favorites_table.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    return;
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 Reading migration SQL...\n');
  console.log(sql);
  console.log('\n---\n');

  console.log('⚠️  Please apply this SQL manually in the Supabase SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/inhzfdufjhuihtuykwmw/editor\n');

  console.log('Steps:');
  console.log('1. Copy the SQL above');
  console.log('2. Go to the Supabase SQL Editor');
  console.log('3. Paste the SQL and click "Run"');
  console.log('4. Verify the favorites table was created successfully');
}

applyFavoritesMigration().catch(console.error);
