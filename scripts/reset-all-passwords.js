/**
 * Script de réinitialisation des mots de passe
 * Réinitialise tous les comptes existants au code PIN 1234 (001234 avec padding)
 *
 * UTILISATION:
 * 1. Créer un fichier .env.local avec:
 *    SUPABASE_URL=https://your-project.supabase.co
 *    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 *
 * 2. Installer les dépendances:
 *    npm install @supabase/supabase-js dotenv
 *
 * 3. Exécuter:
 *    node scripts/reset-all-passwords.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const NEW_PASSWORD = '001234'; // Correspond au PIN 1234 avec padding

// Couleurs console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}\n`),
};

// Validation de la configuration
function validateConfig() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    log.error('Configuration manquante!');
    log.info('Créez un fichier .env.local avec:');
    console.log('  SUPABASE_URL=https://your-project.supabase.co');
    console.log('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    process.exit(1);
  }

  if (!SERVICE_ROLE_KEY.startsWith('eyJ')) {
    log.error('La SERVICE_ROLE_KEY semble invalide');
    log.warning('Vérifiez que vous utilisez bien la service_role key (pas l\'anon key)');
    process.exit(1);
  }

  log.success('Configuration validée');
}

// Créer le client Supabase Admin
function createAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Récupérer tous les utilisateurs
async function getAllUsers(supabase) {
  log.info('Récupération des utilisateurs...');

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(`
      id,
      phone,
      full_name,
      email,
      username
    `)
    .order('created_at', { ascending: false });

  if (error) {
    log.error(`Erreur lors de la récupération: ${error.message}`);
    throw error;
  }

  if (!profiles || profiles.length === 0) {
    log.warning('Aucun utilisateur trouvé dans la base de données');
    return [];
  }

  log.success(`${profiles.length} utilisateur(s) trouvé(s)`);
  return profiles;
}

// Afficher la liste des utilisateurs
function displayUsers(profiles) {
  log.header('LISTE DES UTILISATEURS');

  console.log('┌────┬────────────────────┬─────────────────────────┬──────────────────┐');
  console.log('│ #  │ Téléphone          │ Nom                     │ Email            │');
  console.log('├────┼────────────────────┼─────────────────────────┼──────────────────┤');

  profiles.forEach((profile, index) => {
    const num = String(index + 1).padStart(2, ' ');
    const phone = (profile.phone || 'N/A').padEnd(18, ' ');
    const name = (profile.full_name || profile.username || 'N/A').substring(0, 23).padEnd(23, ' ');
    const email = (profile.email || 'N/A').substring(0, 16).padEnd(16, ' ');

    console.log(`│ ${num} │ ${phone} │ ${name} │ ${email} │`);
  });

  console.log('└────┴────────────────────┴─────────────────────────┴──────────────────┘');
  console.log('');
}

// Demander confirmation
async function askConfirmation() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    readline.question(
      `${colors.yellow}⚠ Voulez-vous vraiment réinitialiser TOUS ces comptes au PIN 1234? (oui/non): ${colors.reset}`,
      (answer) => {
        readline.close();
        resolve(answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'yes');
      }
    );
  });
}

// Réinitialiser un utilisateur
async function resetUserPassword(supabase, userId, phone, name) {
  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: NEW_PASSWORD,
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Réinitialiser tous les mots de passe
async function resetAllPasswords(supabase, profiles) {
  log.header('RÉINITIALISATION EN COURS');

  let success = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];
    const progress = `[${i + 1}/${profiles.length}]`;
    const displayName = profile.full_name || profile.username || profile.phone;

    process.stdout.write(`${progress} ${displayName}...`);

    const result = await resetUserPassword(
      supabase,
      profile.id,
      profile.phone,
      displayName
    );

    if (result.success) {
      log.success(` Réinitialisé`);
      success++;
    } else {
      log.error(` Échec: ${result.error}`);
      failed++;
      errors.push({ profile, error: result.error });
    }

    // Petite pause pour ne pas surcharger l'API
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  log.header('RÉSUMÉ');
  console.log(`Total      : ${profiles.length}`);
  console.log(`${colors.green}Succès     : ${success}${colors.reset}`);
  console.log(`${colors.red}Échecs     : ${failed}${colors.reset}`);

  if (errors.length > 0) {
    log.header('ERREURS DÉTAILLÉES');
    errors.forEach((err, index) => {
      console.log(`${index + 1}. ${err.profile.phone} - ${err.error}`);
    });
  }

  return { success, failed, errors };
}

// Fonction principale
async function main() {
  console.log('\n');
  log.header('🔄 RÉINITIALISATION DES MOTS DE PASSE SENEPANDA');

  try {
    // Validation
    validateConfig();

    // Créer le client admin
    const supabase = createAdminClient();
    log.success('Client Supabase Admin créé');

    // Récupérer les utilisateurs
    const profiles = await getAllUsers(supabase);

    if (profiles.length === 0) {
      log.warning('Rien à faire');
      process.exit(0);
    }

    // Afficher les utilisateurs
    displayUsers(profiles);

    // Demander confirmation
    const confirmed = await askConfirmation();

    if (!confirmed) {
      log.warning('Opération annulée par l\'utilisateur');
      process.exit(0);
    }

    console.log('');

    // Réinitialiser
    const results = await resetAllPasswords(supabase, profiles);

    // Afficher les instructions
    if (results.success > 0) {
      log.header('📱 INSTRUCTIONS POUR LES UTILISATEURS');
      console.log('Les utilisateurs peuvent maintenant se connecter avec:');
      console.log(`  ${colors.bright}Code PIN: 1234${colors.reset}`);
      console.log('');
      console.log('Message à envoyer:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🐼 SenePanda - Votre code PIN a été réinitialisé');
      console.log('');
      console.log('Nouveau code PIN: 1234');
      console.log('');
      console.log('Pour vous connecter:');
      console.log('1. Ouvrir l\'application');
      console.log('2. Entrer votre numéro de téléphone');
      console.log('3. Entrer le code PIN: 1234');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    }

    log.success('Script terminé avec succès!');
    process.exit(0);
  } catch (error) {
    log.error(`Erreur fatale: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Exécution
if (require.main === module) {
  main();
}

module.exports = { resetAllPasswords };
