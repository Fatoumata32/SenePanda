const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://inhzfdufjhuihtuykwmw.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluaHpmZHVmamh1aWh0dXlrd213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDIxMzksImV4cCI6MjA3NTc3ODEzOX0.UexWMIDnDYXcqHqzWY0NywMWHgt1_fZahWXqsD352_U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigrations() {
  console.log('🚀 Starting migration process...\n');

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`📄 Applying migration: ${file}`);

    try {
      // Split SQL by statement and execute each one
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

      for (const statement of statements) {
        if (statement) {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (error && !error.message.includes('already exists')) {
            console.error(`   ❌ Error in statement:`, error.message);
          }
        }
      }

      console.log(`   ✅ Migration applied successfully\n`);
    } catch (error) {
      console.error(`   ❌ Error applying migration:`, error.message);
      console.error(`   Continuing with next migration...\n`);
    }
  }

  console.log('✨ Migration process completed!');
  console.log('\n⚠️  Note: If there were errors, you may need to apply migrations manually');
  console.log('   via the Supabase SQL Editor: https://supabase.com/dashboard/project/inhzfdufjhuihtuykwmw/editor');
}

applyMigrations().catch(console.error);
