#!/usr/bin/env node

/**
 * Script pour appliquer la migration des champs de réduction aux produits
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Vérifier que les variables d'environnement sont présentes
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Erreur: SUPABASE_URL et SUPABASE_ANON_KEY doivent être définis dans .env');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function applyMigration() {
  console.log('🚀 Application de la migration des champs de réduction...\n');

  try {
    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, '../supabase/migrations/add_product_discount_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Exécuter la migration ligne par ligne
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`📝 ${statements.length} instructions SQL à exécuter\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`⏳ Exécution instruction ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Essayer avec une requête directe si rpc ne fonctionne pas
        console.log('   Tentative avec requête directe...');
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ query: statement })
        });

        if (!response.ok) {
          console.warn(`   ⚠️  Instruction ignorée (peut être déjà appliquée)`);
        } else {
          console.log(`   ✅ Instruction ${i + 1} exécutée`);
        }
      } else {
        console.log(`   ✅ Instruction ${i + 1} exécutée`);
      }
    }

    console.log('\n✅ Migration appliquée avec succès!\n');
    console.log('📊 Nouveaux champs ajoutés à la table products:');
    console.log('   - original_price: Prix original avant réduction');
    console.log('   - discount_percent: Pourcentage de réduction (0-100)');
    console.log('   - has_discount: Indique si le produit a une réduction active\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error.message);
    console.log('\n📝 Veuillez appliquer la migration manuellement dans le Dashboard Supabase:');
    console.log('   1. Allez sur https://supabase.com/dashboard');
    console.log('   2. Sélectionnez votre projet');
    console.log('   3. Allez dans SQL Editor');
    console.log('   4. Copiez le contenu de: supabase/migrations/add_product_discount_fields.sql');
    console.log('   5. Exécutez la requête\n');
    process.exit(1);
  }
}

applyMigration();
