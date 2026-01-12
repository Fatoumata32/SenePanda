// Script de diagnostic pour la messagerie
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testMessaging() {
  console.log('🔍 Test de la messagerie...\n');

  try {
    // Test 1: Vérifier la table conversations
    console.log('📋 Test 1: Vérification de la table conversations');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(5);

    if (convError) {
      console.error('❌ Erreur conversations:', convError.message);
    } else {
      console.log(`✅ Table conversations OK (${conversations.length} conversations)`);
      if (conversations.length > 0) {
        console.log('   Exemple:', JSON.stringify(conversations[0], null, 2));
      }
    }

    // Test 2: Vérifier la table messages
    console.log('\n📋 Test 2: Vérification de la table messages');
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .limit(5);

    if (msgError) {
      console.error('❌ Erreur messages:', msgError.message);
    } else {
      console.log(`✅ Table messages OK (${messages.length} messages)`);
      if (messages.length > 0) {
        console.log('   Exemple:', JSON.stringify(messages[0], null, 2));
      }
    }

    // Test 3: Vérifier les colonnes de la table conversations
    console.log('\n📋 Test 3: Structure de la table conversations');
    const { data: convStructure, error: structError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);

    if (!structError && convStructure && convStructure.length > 0) {
      console.log('✅ Colonnes disponibles:', Object.keys(convStructure[0]).join(', '));
    }

    // Test 4: Test de lecture avec relation product
    console.log('\n📋 Test 4: Test de lecture avec relation product');
    const { data: convWithProduct, error: relError } = await supabase
      .from('conversations')
      .select(`
        id,
        buyer_id,
        seller_id,
        product_id,
        last_message_at,
        buyer_unread_count,
        seller_unread_count,
        products (
          title,
          image_url
        )
      `)
      .limit(1);

    if (relError) {
      console.error('❌ Erreur relation product:', relError.message);
    } else {
      console.log('✅ Relation product OK');
      if (convWithProduct && convWithProduct.length > 0) {
        console.log('   Exemple:', JSON.stringify(convWithProduct[0], null, 2));
      }
    }

    // Test 5: Vérifier si les colonnes unread_count existent
    console.log('\n📋 Test 5: Vérification des colonnes unread_count');
    const { data: testConv, error: testError } = await supabase
      .from('conversations')
      .select('buyer_unread_count, seller_unread_count')
      .limit(1);

    if (testError) {
      console.error('❌ Erreur colonnes unread_count:', testError.message);
      console.log('💡 Solution: Les colonnes buyer_unread_count et seller_unread_count sont manquantes');
    } else {
      console.log('✅ Colonnes unread_count OK');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }

  console.log('\n✅ Diagnostic terminé');
}

testMessaging();
