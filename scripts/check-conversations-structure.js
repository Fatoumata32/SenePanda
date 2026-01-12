// Script pour vérifier la structure de la table conversations
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkStructure() {
  console.log('🔍 Vérification de la structure de la table conversations...\n');

  try {
    // Essayer d'insérer un enregistrement vide pour voir les colonnes requises
    const { error } = await supabase
      .from('conversations')
      .insert({})
      .select();

    if (error) {
      console.log('❌ Erreur (attendue):', error.message);
      console.log('📋 Détails:', error.details);
      console.log('💡 Hint:', error.hint);

      // Extraire les noms de colonnes de l'erreur
      const match = error.message.match(/column "(\w+)"/);
      if (match) {
        console.log(`\n🔑 Colonne manquante détectée: "${match[1]}"`);
      }
    }

    // Essayer de lire la structure
    const { data, error: readError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);

    if (!readError && data) {
      if (data.length > 0) {
        console.log('\n✅ Colonnes existantes:', Object.keys(data[0]).join(', '));
      } else {
        console.log('\n⚠️  Aucune conversation existante pour voir la structure');
        console.log('💡 Essayons de déduire depuis le type TypeScript...');
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 SOLUTION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nLa table semble utiliser:');
  console.log('  - participant1_id au lieu de buyer_id');
  console.log('  - participant2_id au lieu de seller_id');
  console.log('\nIl faut mettre à jour le code pour utiliser ces colonnes.');
}

checkStructure();
