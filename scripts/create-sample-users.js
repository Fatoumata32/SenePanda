const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://inhzfdufjhuihtuykwmw.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// IMPORTANT: Pour créer des utilisateurs, vous avez besoin de la clé service_role
// Récupérez-la depuis: https://supabase.com/dashboard/project/inhzfdufjhuihtuykwmw/settings/api
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('\n❌ ERREUR: SUPABASE_SERVICE_ROLE_KEY manquante');
  console.error('\n📝 Instructions:');
  console.error('1. Allez sur: https://supabase.com/dashboard/project/inhzfdufjhuihtuykwmw/settings/api');
  console.error('2. Copiez la clé "service_role"');
  console.error('3. Ajoutez-la dans votre fichier .env:');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=votre_cle_ici');
  console.error('\n⚠️  ATTENTION: Cette clé est confidentielle, ne la partagez jamais!\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Données des utilisateurs à créer
const sampleUsers = [
  // Clients
  {
    email: 'marie.kouassi@example.com',
    password: 'Test123!',
    profile: {
      username: 'marie_kouassi',
      full_name: 'Marie Kouassi',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marie',
      is_seller: false,
      phone: '+225 07 12 34 56 78',
      country: 'Côte d\'Ivoire'
    }
  },
  {
    email: 'jean.diop@example.com',
    password: 'Test123!',
    profile: {
      username: 'jean_diop',
      full_name: 'Jean Diop',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jean',
      is_seller: false,
      phone: '+221 77 234 56 78',
      country: 'Sénégal'
    }
  },
  {
    email: 'fatima.toure@example.com',
    password: 'Test123!',
    profile: {
      username: 'fatima_toure',
      full_name: 'Fatima Touré',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fatima',
      is_seller: false,
      phone: '+223 76 12 34 56',
      country: 'Mali'
    }
  },
  // Vendeurs
  {
    email: 'amadou.diallo@example.com',
    password: 'Test123!',
    profile: {
      username: 'amadou_diallo',
      full_name: 'Amadou Diallo',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amadou',
      is_seller: true,
      shop_name: 'Artisanat Diallo',
      shop_description: 'Spécialiste de l\'artisanat traditionnel africain. Sculptures sur bois, masques et objets décoratifs authentiques.',
      phone: '+225 05 11 22 33 44',
      country: 'Côte d\'Ivoire'
    }
  },
  {
    email: 'aicha.ndiaye@example.com',
    password: 'Test123!',
    profile: {
      username: 'aicha_ndiaye',
      full_name: 'Aïcha Ndiaye',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aicha',
      is_seller: true,
      shop_name: 'Boutique Aïcha Mode',
      shop_description: 'Créations de mode africaine contemporaine. Robes, boubous et accessoires en wax et bazin.',
      phone: '+221 77 55 66 77 88',
      country: 'Sénégal'
    }
  },
  {
    email: 'kofi.mensah@example.com',
    password: 'Test123!',
    profile: {
      username: 'kofi_mensah',
      full_name: 'Kofi Mensah',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kofi',
      is_seller: true,
      shop_name: 'Bijoux Kofi',
      shop_description: 'Bijoux artisanaux en or, argent et pierres précieuses. Chaque pièce raconte une histoire.',
      phone: '+233 24 123 45 67',
      country: 'Ghana'
    }
  },
  {
    email: 'mariam.traore@example.com',
    password: 'Test123!',
    profile: {
      username: 'mariam_traore',
      full_name: 'Mariam Traoré',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mariam',
      is_seller: true,
      shop_name: 'Tissus Mariam',
      shop_description: 'Tissus traditionnels africains: bogolan, kente, pagne. Qualité exceptionnelle pour vos créations.',
      phone: '+223 76 88 99 00',
      country: 'Mali'
    }
  },
  {
    email: 'youssef.benali@example.com',
    password: 'Test123!',
    profile: {
      username: 'youssef_benali',
      full_name: 'Youssef Ben Ali',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=youssef',
      is_seller: true,
      shop_name: 'Déco Africaine',
      shop_description: 'Décoration d\'intérieur inspirée de l\'Afrique. Tapis berbères, poufs, coussins et luminaires.',
      phone: '+212 6 12 34 56 78',
      country: 'Maroc'
    }
  }
];

async function createUsers() {
  console.log('\n🚀 Création des utilisateurs de test...\n');
  console.log('='.repeat(80));

  let successCount = 0;
  let errorCount = 0;

  for (const userData of sampleUsers) {
    try {
      console.log(`\n📧 Création de l'utilisateur: ${userData.email}`);

      // Créer l'utilisateur dans auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirmer l'email
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`   ⚠️  L'utilisateur existe déjà`);
        } else {
          throw authError;
        }
        errorCount++;
        continue;
      }

      const userId = authData.user.id;
      console.log(`   ✅ Utilisateur créé: ${userId}`);

      // Créer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          ...userData.profile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        if (profileError.code === '23505') { // Unique violation
          console.log(`   ⚠️  Le profil existe déjà`);
        } else {
          throw profileError;
        }
      } else {
        console.log(`   ✅ Profil créé: ${userData.profile.full_name} (@${userData.profile.username})`);
        if (userData.profile.is_seller) {
          console.log(`   🏪 Boutique: ${userData.profile.shop_name}`);
        }
        successCount++;
      }

    } catch (error) {
      console.error(`   ❌ Erreur: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Résumé:');
  console.log(`   ✅ Succès: ${successCount} utilisateurs créés`);
  console.log(`   ❌ Erreurs: ${errorCount} utilisateurs non créés`);
  console.log('\n💡 Identifiants de connexion:');
  console.log('   Email: [voir liste ci-dessus]');
  console.log('   Mot de passe: Test123!\n');
  console.log('🔐 Vous pouvez vous connecter avec l\'email ou le username\n');
}

createUsers().catch(console.error);
