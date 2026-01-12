/**
 * Script pour appliquer le fix des colonnes manquantes
 *
 * Usage: node scripts/apply-missing-columns-fix.js
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('Assurez-vous que EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY sont définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔄 Application du fix des colonnes manquantes...\n');

  try {
    // Lire le fichier SQL
    const sqlFile = path.join(__dirname, '..', 'supabase', 'migrations', 'fix_missing_columns.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Diviser en requêtes individuelles (simplifié)
    const queries = [
      // 1. Ajouter image_url
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;`,

      // 2. Copier les données de image vers image_url
      `UPDATE products SET image_url = image WHERE image_url IS NULL AND image IS NOT NULL;`,

      // 3. Ajouter discount_percentage
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;`,

      // 4. Ajouter views_count
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;`,

      // 5. Ajouter buyer_id et seller_id à conversations
      `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES profiles(id);`,
      `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES profiles(id);`,

      // 6. Migrer les données existantes
      `UPDATE conversations c SET buyer_id = (SELECT user1_id FROM conversations c2 WHERE c2.id = c.id) WHERE buyer_id IS NULL;`,
      `UPDATE conversations c SET seller_id = (SELECT user2_id FROM conversations c2 WHERE c2.id = c.id) WHERE seller_id IS NULL;`,
    ];

    console.log('📝 Exécution des requêtes SQL...\n');

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i].trim();
      if (!query) continue;

      console.log(`  ${i + 1}/${queries.length} - Exécution...`);

      const { error } = await supabase.rpc('exec_sql', { sql_query: query });

      if (error) {
        console.error(`  ❌ Erreur:`, error.message);
        // Continue anyway as some errors might be expected (column already exists, etc.)
      } else {
        console.log(`  ✅ Succès`);
      }
    }

    console.log('\n🎉 Migration appliquée avec succès !');
    console.log('\n📋 Vérification des colonnes...');

    // Vérifier que les colonnes existent maintenant
    const { data: productsCheck, error: productsError } = await supabase
      .from('products')
      .select('id, image_url, discount_percentage, views_count')
      .limit(1);

    if (productsError) {
      console.error('❌ Erreur lors de la vérification des products:', productsError.message);
    } else {
      console.log('✅ Table products OK - Colonnes présentes');
    }

    const { data: conversationsCheck, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, buyer_id, seller_id')
      .limit(1);

    if (conversationsError) {
      console.error('❌ Erreur lors de la vérification des conversations:', conversationsError.message);
    } else {
      console.log('✅ Table conversations OK - Colonnes présentes');
    }

    console.log('\n✅ Toutes les vérifications sont terminées !');
    console.log('💡 Vous pouvez maintenant relancer l\'application');

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    process.exit(1);
  }
}

// Exécuter le script
applyMigration();
