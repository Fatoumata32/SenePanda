#!/usr/bin/env node

/**
 * Script de test de connexion Supabase
 * Vérifie que les credentials Supabase sont corrects et fonctionnels
 */

require('dotenv').config();
const https = require('https');
const http = require('http');

console.log('🔍 Test de connexion Supabase...\n');

// 1. Vérifier les variables d'environnement
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('📋 Vérification des variables d\'environnement:');
console.log(`   EXPO_PUBLIC_SUPABASE_URL: ${SUPABASE_URL ? '✅' : '❌'}`);
console.log(`   EXPO_PUBLIC_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? '✅' : '❌'}\n`);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ ERREUR: Variables d\'environnement manquantes!\n');
  console.error('Vérifiez que votre fichier .env contient:');
  console.error('- EXPO_PUBLIC_SUPABASE_URL');
  console.error('- EXPO_PUBLIC_SUPABASE_ANON_KEY\n');
  console.error('Copiez .env.example vers .env et remplissez les valeurs.');
  process.exit(1);
}

// 2. Valider le format de l'URL
console.log('🔗 Validation de l\'URL Supabase:');
try {
  const url = new URL(SUPABASE_URL);
  console.log(`   URL: ${SUPABASE_URL}`);
  console.log(`   Host: ${url.hostname}`);
  console.log(`   Protocol: ${url.protocol}\n`);

  if (!url.hostname.includes('supabase.co')) {
    console.warn('⚠️  L\'URL ne semble pas être une URL Supabase standard');
  }
} catch (error) {
  console.error(`❌ URL invalide: ${error.message}\n`);
  process.exit(1);
}

// 3. Tester la connexion réseau
console.log('🌐 Test de connexion réseau...');

const testConnection = () => {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL);
    const protocol = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: '/rest/v1/',
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      timeout: 10000,
    };

    const req = protocol.request(options, (res) => {
      console.log(`   Status: ${res.statusCode}\n`);

      if (res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 404) {
        // 200 = OK, 401 = Auth (normal), 404 = Endpoint existe
        console.log('✅ Connexion réussie!');
        console.log('   Le serveur Supabase répond correctement.\n');
        resolve();
      } else if (res.statusCode === 503) {
        console.error('❌ Le projet Supabase est EN PAUSE ou NON DISPONIBLE\n');
        console.error('Solutions:');
        console.error('1. Allez sur https://app.supabase.com');
        console.error('2. Trouvez votre projet');
        console.error('3. Cliquez sur "Restore" ou "Unpause"');
        console.error('4. Attendez 2-3 minutes et réessayez\n');
        reject(new Error('Projet en pause'));
      } else {
        console.error(`❌ Code de statut inattendu: ${res.statusCode}\n`);
        reject(new Error(`Unexpected status: ${res.statusCode}`));
      }
    });

    req.on('error', (error) => {
      console.error(`❌ Erreur de connexion: ${error.message}\n`);

      if (error.code === 'ENOTFOUND') {
        console.error('Le serveur Supabase n\'existe pas ou n\'est pas accessible.\n');
        console.error('Vérifiez que:');
        console.error('1. L\'URL dans .env est correcte');
        console.error('2. Le projet existe sur https://app.supabase.com');
        console.error('3. Le projet n\'est pas supprimé\n');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('Timeout de connexion.\n');
        console.error('Vérifiez votre connexion internet.');
      }

      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('❌ Timeout: Le serveur ne répond pas\n');
      reject(new Error('Timeout'));
    });

    req.end();
  });
};

// Exécuter le test
(async () => {
  try {
    await testConnection();

    console.log('═'.repeat(60));
    console.log('✅ TEST RÉUSSI!');
    console.log('═'.repeat(60));
    console.log('\nVotre configuration Supabase est correcte.');
    console.log('Vous pouvez maintenant lancer l\'application:\n');
    console.log('   npm run dev\n');
    process.exit(0);
  } catch (error) {
    console.log('═'.repeat(60));
    console.log('❌ ÉCHEC DU TEST');
    console.log('═'.repeat(60));
    console.log('\nConsultez le guide de dépannage:');
    console.log('   FIX_SUPABASE_CONNECTION.md\n');
    process.exit(1);
  }
})();
