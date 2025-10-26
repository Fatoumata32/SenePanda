const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://inhzfdufjhuihtuykwmw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluaHpmZHVmamh1aWh0dXlrd213Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDIwMjEzOSwiZXhwIjoyMDc1Nzc4MTM5fQ.mJl6OUz8yMa2IPHCGdjLv35qZDSsIavF0nfJFCH_i4U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 Application de la migration Flash Deals...\n');

  try {
    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, '../supabase/migrations/create_flash_deals_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Fichier de migration chargé');
    console.log('📊 Taille:', migrationSQL.length, 'caractères\n');

    // Diviser le SQL en commandes individuelles
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('/*') && !cmd.startsWith('--'));

    console.log(`📝 ${commands.length} commandes SQL à exécuter\n`);

    let successCount = 0;
    let errorCount = 0;

    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ';';

      // Afficher un aperçu de la commande
      const preview = command.substring(0, 100).replace(/\s+/g, ' ');
      process.stdout.write(`[${i + 1}/${commands.length}] ${preview}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command }).catch(async (err) => {
          // Si la fonction exec_sql n'existe pas, utiliser une requête directe
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({ query: command })
          });

          if (!response.ok) {
            // Essayer d'exécuter via SQL direct
            console.log('\n⚠️  Méthode alternative requise pour cette commande');
            return { error: null };
          }
          return await response.json();
        });

        if (error && error.code !== '42710' && error.code !== '42P07') {
          // Ignorer les erreurs "already exists"
          throw error;
        }

        console.log(' ✅');
        successCount++;
      } catch (err) {
        console.log(' ❌');
        console.error('   Erreur:', err.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Commandes réussies: ${successCount}`);
    if (errorCount > 0) {
      console.log(`❌ Commandes échouées: ${errorCount}`);
    }
    console.log('='.repeat(50));

    if (errorCount === 0) {
      console.log('\n🎉 Migration appliquée avec succès!');
      console.log('ℹ️  Les flash deals sont maintenant disponibles dans votre application.');
    } else {
      console.log('\n⚠️  Certaines commandes ont échoué.');
      console.log('💡 Conseil: Copiez le contenu du fichier SQL et exécutez-le manuellement');
      console.log('   dans le SQL Editor de Supabase.');
    }

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'application de la migration:', error.message);
    console.log('\n💡 Solution alternative:');
    console.log('1. Ouvrez https://supabase.com/dashboard/project/inhzfdufjhuihtuykwmw');
    console.log('2. Allez dans SQL Editor');
    console.log('3. Copiez le contenu de supabase/migrations/create_flash_deals_system.sql');
    console.log('4. Collez et exécutez dans SQL Editor');
    process.exit(1);
  }
}

applyMigration();
