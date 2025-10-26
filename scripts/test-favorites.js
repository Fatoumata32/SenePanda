const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://inhzfdufjhuihtuykwmw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluaHpmZHVmamh1aWh0dXlrd213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDIxMzksImV4cCI6MjA3NTc3ODEzOX0.UexWMIDnDYXcqHqzWY0NywMWHgt1_fZahWXqsD352_U';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFavorites() {
  console.log('🧪 Testing favorites functionality...\n');

  // Test 1: Check if favorites table exists
  console.log('1. Checking favorites table structure...');
  const { data: favorites, error: favError } = await supabase
    .from('favorites')
    .select('*')
    .limit(1);

  if (favError) {
    console.error('❌ Error accessing favorites table:', favError.message);
    return;
  } else {
    console.log('✅ Favorites table exists\n');
  }

  // Test 2: Try to fetch with relationship
  console.log('2. Testing relationship query...');
  const { data: withProducts, error: relError } = await supabase
    .from('favorites')
    .select(`
      id,
      product_id,
      created_at,
      products (
        *
      )
    `)
    .limit(5);

  if (relError) {
    console.error('❌ Error with relationship query:', relError.message);
    console.log('\nThis might mean the foreign key relationship is not properly configured.');
    console.log('You may need to add a foreign key constraint in Supabase.\n');
  } else {
    console.log('✅ Relationship query works!');
    console.log('Data sample:', JSON.stringify(withProducts, null, 2));
    console.log();
  }

  // Test 3: Check products table
  console.log('3. Checking products table...');
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, title')
    .limit(3);

  if (prodError) {
    console.error('❌ Error accessing products:', prodError.message);
  } else {
    console.log('✅ Products table accessible');
    console.log('Sample products:', JSON.stringify(products, null, 2));
  }
}

testFavorites().catch(console.error);
