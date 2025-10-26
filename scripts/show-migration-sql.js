const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('📋 SUPABASE MIGRATION SQL');
console.log('='.repeat(80));
console.log('\n🔗 Go to: https://supabase.com/dashboard/project/inhzfdufjhuihtuykwmw/editor\n');
console.log('📝 Copy the SQL below and paste it into the SQL Editor, then click "Run"\n');
console.log('='.repeat(80));
console.log('\n');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort();

migrationFiles.forEach(file => {
  const filePath = path.join(migrationsDir, file);
  const sql = fs.readFileSync(filePath, 'utf8');

  console.log(`-- Migration: ${file}`);
  console.log(sql);
  console.log('\n');
});

console.log('='.repeat(80));
console.log('✅ After running the SQL, restart your app to verify the fix');
console.log('='.repeat(80));
