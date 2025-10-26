const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Mapping des emails vers les profils
const profilesData = {
  'marie.kouassi@example.com': {
    username: 'marie_kouassi',
    full_name: 'Marie Kouassi',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marie',
    is_seller: false,
    phone: '+225 07 12 34 56 78',
    country: 'Côte d\'Ivoire'
  },
  'jean.diop@example.com': {
    username: 'jean_diop',
    full_name: 'Jean Diop',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jean',
    is_seller: false,
    phone: '+221 77 234 56 78',
    country: 'Sénégal'
  },
  'fatima.toure@example.com': {
    username: 'fatima_toure',
    full_name: 'Fatima Touré',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fatima',
    is_seller: false,
    phone: '+223 76 12 34 56',
    country: 'Mali'
  },
  'amadou.diallo@example.com': {
    username: 'amadou_diallo',
    full_name: 'Amadou Diallo',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amadou',
    is_seller: true,
    shop_name: 'Artisanat Diallo',
    shop_description: 'Spécialiste de l\'artisanat traditionnel africain. Sculptures sur bois, masques et objets décoratifs authentiques.',
    phone: '+225 05 11 22 33 44',
    country: 'Côte d\'Ivoire'
  },
  'aicha.ndiaye@example.com': {
    username: 'aicha_ndiaye',
    full_name: 'Aïcha Ndiaye',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aicha',
    is_seller: true,
    shop_name: 'Boutique Aïcha Mode',
    shop_description: 'Créations de mode africaine contemporaine. Robes, boubous et accessoires en wax et bazin.',
    phone: '+221 77 55 66 77 88',
    country: 'Sénégal'
  },
  'kofi.mensah@example.com': {
    username: 'kofi_mensah',
    full_name: 'Kofi Mensah',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kofi',
    is_seller: true,
    shop_name: 'Bijoux Kofi',
    shop_description: 'Bijoux artisanaux en or, argent et pierres précieuses. Chaque pièce raconte une histoire.',
    phone: '+233 24 123 45 67',
    country: 'Ghana'
  },
  'mariam.traore@example.com': {
    username: 'mariam_traore',
    full_name: 'Mariam Traoré',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mariam',
    is_seller: true,
    shop_name: 'Tissus Mariam',
    shop_description: 'Tissus traditionnels africains: bogolan, kente, pagne. Qualité exceptionnelle pour vos créations.',
    phone: '+223 76 88 99 00',
    country: 'Mali'
  },
  'youssef.benali@example.com': {
    username: 'youssef_benali',
    full_name: 'Youssef Ben Ali',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=youssef',
    is_seller: true,
    shop_name: 'Déco Africaine',
    shop_description: 'Décoration d\'intérieur inspirée de l\'Afrique. Tapis berbères, poufs, coussins et luminaires.',
    phone: '+212 6 12 34 56 78',
    country: 'Maroc'
  }
};

async function linkProfilesToUsers() {
  console.log('\n🔗 Liaison des profils aux utilisateurs existants...\n');
  console.log('='.repeat(80));

  let successCount = 0;
  let errorCount = 0;

  // Récupérer tous les utilisateurs
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError);
    return;
  }

  console.log(`\n📊 ${users.length} utilisateurs trouvés dans auth.users\n`);

  for (const user of users) {
    const email = user.email;
    const profileData = profilesData[email];

    if (!profileData) {
      console.log(`⏭️  Email ${email} ignoré (pas dans les profils de test)`);
      continue;
    }

    try {
      console.log(`\n👤 Création du profil pour: ${email}`);

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        throw profileError;
      }

      console.log(`   ✅ Profil créé: ${profileData.full_name} (@${profileData.username})`);
      if (profileData.is_seller) {
        console.log(`   🏪 Boutique: ${profileData.shop_name}`);
      }
      successCount++;

    } catch (error) {
      console.error(`   ❌ Erreur: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Résumé:');
  console.log(`   ✅ Succès: ${successCount} profils créés/mis à jour`);
  console.log(`   ❌ Erreurs: ${errorCount} profils non créés`);
  console.log('\n💡 Identifiants de connexion:');
  console.log('   Mot de passe: Test123!');
  console.log('\n🔐 Exemples de connexion:');
  console.log('   - Username: marie_kouassi');
  console.log('   - Username: amadou_diallo');
  console.log('   - Email: aicha.ndiaye@example.com\n');
}

linkProfilesToUsers().catch(console.error);
