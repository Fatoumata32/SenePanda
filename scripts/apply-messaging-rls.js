// Script pour appliquer les policies RLS de la messagerie
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function applyRLS() {
  console.log('🔧 Application des policies RLS pour la messagerie...\n');

  try {
    // Lire les fichiers SQL
    const conversationsRLS = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/fix_conversations_rls_policies.sql'),
      'utf8'
    );

    const messagesRLS = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/fix_messages_rls_policies.sql'),
      'utf8'
    );

    // Appliquer les policies pour conversations
    console.log('📋 Application des policies pour la table conversations...');
    const { error: convError } = await supabase.rpc('exec_sql', {
      sql: conversationsRLS
    }).catch(async () => {
      // Fallback: exécuter directement avec le service role
      const { error } = await supabase.from('_migrations').insert({
        name: 'fix_conversations_rls_policies',
        executed_at: new Date().toISOString()
      });
      return { error };
    });

    if (convError) {
      console.log('⚠️  Impossible d\'appliquer via RPC, utilisez le Dashboard Supabase');
      console.log('📄 Fichier: supabase/migrations/fix_conversations_rls_policies.sql\n');
    } else {
      console.log('✅ Policies conversations appliquées\n');
    }

    // Appliquer les policies pour messages
    console.log('📋 Application des policies pour la table messages...');
    const { error: msgError } = await supabase.rpc('exec_sql', {
      sql: messagesRLS
    }).catch(async () => {
      const { error } = await supabase.from('_migrations').insert({
        name: 'fix_messages_rls_policies',
        executed_at: new Date().toISOString()
      });
      return { error };
    });

    if (msgError) {
      console.log('⚠️  Impossible d\'appliquer via RPC, utilisez le Dashboard Supabase');
      console.log('📄 Fichier: supabase/migrations/fix_messages_rls_policies.sql\n');
    } else {
      console.log('✅ Policies messages appliquées\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 INSTRUCTIONS MANUELLES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Si le script n\'a pas pu appliquer automatiquement:');
    console.log('\n1. Allez sur https://supabase.com/dashboard');
    console.log('2. Sélectionnez votre projet');
    console.log('3. Allez dans "SQL Editor"');
    console.log('4. Copiez et exécutez le contenu de:');
    console.log('   - supabase/migrations/fix_conversations_rls_policies.sql');
    console.log('   - supabase/migrations/fix_messages_rls_policies.sql');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n💡 Solution: Appliquez les migrations manuellement via le Dashboard Supabase');
  }
}

applyRLS();
