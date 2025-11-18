/**
 * Script de test de connexion Supabase
 * Pour exécuter: node scripts/test-supabase-connection.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log('\n' + colors.cyan + '🔍 Test de Connexion Supabase' + colors.reset);
console.log('===============================\n');

// Vérifier les variables d'environnement
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log(colors.blue + '1. Vérification des variables d\'environnement...' + colors.reset);

if (!supabaseUrl) {
  console.log(colors.red + '❌ EXPO_PUBLIC_SUPABASE_URL est manquant' + colors.reset);
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.log(colors.red + '❌ EXPO_PUBLIC_SUPABASE_ANON_KEY est manquant' + colors.reset);
  process.exit(1);
}

console.log(colors.green + '✅ Variables d\'environnement trouvées' + colors.reset);
console.log(colors.yellow + `   URL: ${supabaseUrl}` + colors.reset);
console.log(colors.yellow + `   Key: ${supabaseAnonKey.substring(0, 20)}...` + colors.reset);
console.log('');

// Créer le client Supabase
console.log(colors.blue + '2. Création du client Supabase...' + colors.reset);
const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log(colors.green + '✅ Client créé avec succès' + colors.reset);
console.log('');

// Fonction de test principale
async function testConnection() {
  try {
    console.log(colors.blue + '3. Test de connexion à la base de données...' + colors.reset);

    // Test 1: Vérifier la connexion
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (healthError) {
      throw healthError;
    }

    console.log(colors.green + '✅ Connexion à la base de données réussie' + colors.reset);
    console.log('');

    // Test 2: Compter les profils
    console.log(colors.blue + '4. Vérification de la table profiles...' + colors.reset);
    const { count: profilesCount, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    console.log(colors.green + `✅ Table profiles existe (${profilesCount || 0} profils)` + colors.reset);
    console.log('');

    // Test 3: Vérifier les autres tables critiques
    console.log(colors.blue + '5. Vérification des tables critiques...' + colors.reset);

    const tables = [
      'products',
      'categories',
      'orders',
      'order_items',
      'cart_items',
      'favorites',
      'reviews',
      'conversations',
      'messages'
    ];

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(colors.red + `   ❌ ${table}: ${error.message}` + colors.reset);
        } else {
          console.log(colors.green + `   ✅ ${table}: ${count || 0} entrées` + colors.reset);
        }
      } catch (err) {
        console.log(colors.red + `   ❌ ${table}: ${err.message}` + colors.reset);
      }
    }
    console.log('');

    // Test 4: Vérifier la colonne seller_id dans products
    console.log(colors.blue + '6. Vérification de la colonne seller_id...' + colors.reset);
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('seller_id')
      .limit(1);

    if (productError) {
      console.log(colors.red + '   ❌ Erreur: ' + productError.message + colors.reset);
      console.log(colors.yellow + '   ⚠️  La colonne seller_id n\'existe peut-être pas' + colors.reset);
      console.log(colors.yellow + '   ℹ️  Exécutez la migration: 20251117000000_add_seller_id_to_products.sql' + colors.reset);
    } else {
      console.log(colors.green + '   ✅ Colonne seller_id existe' + colors.reset);
    }
    console.log('');

    // Test 5: Vérifier les buckets de stockage
    console.log(colors.blue + '7. Vérification des buckets de stockage...' + colors.reset);
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.log(colors.red + '   ❌ Erreur: ' + bucketsError.message + colors.reset);
    } else {
      if (buckets && buckets.length > 0) {
        buckets.forEach(bucket => {
          console.log(colors.green + `   ✅ Bucket: ${bucket.name} (${bucket.public ? 'public' : 'privé'})` + colors.reset);
        });
      } else {
        console.log(colors.yellow + '   ⚠️  Aucun bucket trouvé' + colors.reset);
        console.log(colors.yellow + '   ℹ️  Exécutez la migration: create_storage_buckets.sql' + colors.reset);
      }
    }
    console.log('');

    // Test 6: Test d'authentification
    console.log(colors.blue + '8. Test de l\'authentification (session)...' + colors.reset);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.log(colors.yellow + '   ⚠️  Aucune session active (normal si non connecté)' + colors.reset);
    } else if (session) {
      console.log(colors.green + `   ✅ Session active pour: ${session.user?.email}` + colors.reset);
    } else {
      console.log(colors.yellow + '   ℹ️  Aucune session active (utilisateur non connecté)' + colors.reset);
    }
    console.log('');

    // Résumé final
    console.log(colors.cyan + '═══════════════════════════════' + colors.reset);
    console.log(colors.green + '🎉 RÉSUMÉ DU TEST' + colors.reset);
    console.log(colors.cyan + '═══════════════════════════════' + colors.reset);
    console.log(colors.green + '✅ Connexion Supabase: OK' + colors.reset);
    console.log(colors.green + '✅ Base de données: Accessible' + colors.reset);
    console.log(colors.green + '✅ Configuration: Correcte' + colors.reset);
    console.log('');
    console.log(colors.yellow + '📋 Prochaines étapes:' + colors.reset);
    console.log('   1. Si des tables manquent, exécutez les migrations');
    console.log('   2. Consultez supabase/README_MIGRATIONS.md');
    console.log('   3. Lancez votre application: npm start');
    console.log('');

  } catch (error) {
    console.log('');
    console.log(colors.red + '❌ ERREUR DE CONNEXION' + colors.reset);
    console.log(colors.red + 'Message: ' + error.message + colors.reset);
    console.log('');
    console.log(colors.yellow + '🔧 Solutions possibles:' + colors.reset);
    console.log('   1. Vérifiez votre fichier .env');
    console.log('   2. Vérifiez que votre projet Supabase est actif');
    console.log('   3. Vérifiez les credentials dans Supabase Dashboard');
    console.log('   4. Assurez-vous que les migrations sont appliquées');
    console.log('');
    process.exit(1);
  }
}

// Exécuter le test
testConnection();
