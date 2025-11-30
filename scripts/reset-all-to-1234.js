/**
 * 🔧 Script de Réinitialisation Automatique
 *
 * Réinitialise tous les comptes utilisateurs avec le code PIN: 1234 (4 chiffres)
 * SANS padding, SANS conversion - Simple et direct
 *
 * Usage:
 *   node scripts/reset-all-to-1234.js
 *
 * Prérequis:
 *   - Fichier .env.local configuré avec SUPABASE_SERVICE_ROLE_KEY
 *   - Package @supabase/supabase-js installé
 */

import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'
import * as dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' })

// Configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Nouveau mot de passe - 4 CHIFFRES EXACTEMENT
const NEW_PASSWORD = '1234'

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
  step: (num, msg) => console.log(`${colors.magenta}[${num}]${colors.reset} ${msg}`),
}

// Vérifier la configuration
function checkConfig() {
  log.header('🔍 VÉRIFICATION DE LA CONFIGURATION')

  if (!SUPABASE_URL) {
    log.error('EXPO_PUBLIC_SUPABASE_URL manquant dans .env.local')
    process.exit(1)
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    log.error('SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local')
    log.warning('Cette clé est nécessaire pour modifier les mots de passe')
    log.info('Trouvez-la dans: Supabase Dashboard > Settings > API > service_role key')
    process.exit(1)
  }

  log.success(`URL Supabase: ${SUPABASE_URL}`)
  log.success(`Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`)
  log.success(`Nouveau mot de passe: ${NEW_PASSWORD} (4 chiffres)`)
  console.log('')
}

// Créer le client admin Supabase
function createAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Demander confirmation à l'utilisateur
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'o')
    })
  })
}

// Récupérer tous les utilisateurs
async function getAllUsers(supabase) {
  log.step(1, 'Récupération de tous les utilisateurs...')

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, phone, full_name, email')
    .order('created_at', { ascending: false })

  if (error) {
    log.error(`Erreur lors de la récupération: ${error.message}`)
    throw error
  }

  if (!profiles || profiles.length === 0) {
    log.warning('Aucun utilisateur trouvé')
    return []
  }

  log.success(`${profiles.length} utilisateur(s) trouvé(s)`)
  return profiles
}

// Afficher la liste des utilisateurs
function displayUsers(users) {
  log.header('👥 LISTE DES UTILISATEURS')

  console.table(
    users.map((user, index) => ({
      '#': index + 1,
      Téléphone: user.phone || 'N/A',
      Nom: user.full_name || 'N/A',
      Email: user.email || 'N/A',
    }))
  )
}

// Réinitialiser le mot de passe d'un utilisateur
async function resetUserPassword(supabase, user) {
  try {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: NEW_PASSWORD,
    })

    if (error) {
      return {
        success: false,
        user,
        error: error.message,
      }
    }

    return {
      success: true,
      user,
    }
  } catch (err) {
    return {
      success: false,
      user,
      error: err.message,
    }
  }
}

// Réinitialiser tous les mots de passe
async function resetAllPasswords(supabase, users) {
  log.header('🔄 RÉINITIALISATION DES MOTS DE PASSE')

  const results = {
    success: [],
    failed: [],
  }

  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    const num = i + 1
    const total = users.length

    log.info(`[${num}/${total}] ${user.phone || user.email}...`)

    const result = await resetUserPassword(supabase, user)

    if (result.success) {
      log.success(`  ✓ Réinitialisé avec succès`)
      results.success.push(user)
    } else {
      log.error(`  ✗ Échec: ${result.error}`)
      results.failed.push({ user, error: result.error })
    }

    // Petite pause pour éviter le rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return results
}

// Afficher le rapport final
function displayReport(results, users) {
  log.header('📊 RAPPORT FINAL')

  const successCount = results.success.length
  const failedCount = results.failed.length
  const totalCount = users.length

  console.log(`${colors.green}✓ Succès:${colors.reset} ${successCount}/${totalCount}`)
  console.log(`${colors.red}✗ Échecs:${colors.reset} ${failedCount}/${totalCount}`)
  console.log('')

  if (failedCount > 0) {
    log.warning('Utilisateurs en échec:')
    results.failed.forEach((item) => {
      console.log(`  - ${item.user.phone || item.user.email}: ${item.error}`)
    })
    console.log('')
  }

  if (successCount > 0) {
    log.header('✅ RÉINITIALISATION TERMINÉE')
    log.success('Tous les utilisateurs peuvent maintenant se connecter avec:')
    console.log(`  ${colors.bright}Code PIN: 1234${colors.reset} (4 chiffres)`)
    console.log('')
    log.info('Recommandations:')
    console.log('  1. Tester la connexion avec au moins un compte')
    console.log('  2. Informer les utilisateurs du nouveau PIN')
    console.log('  3. Encourager à changer le PIN après connexion')
    console.log('')
  }
}

// Fonction principale
async function main() {
  try {
    console.log('')
    log.header('🔧 RÉINITIALISATION AUTOMATIQUE DES MOTS DE PASSE')

    // Vérifier la configuration
    checkConfig()

    // Créer le client admin
    const supabase = createAdminClient()
    log.success('Client Admin créé')
    console.log('')

    // Récupérer tous les utilisateurs
    const users = await getAllUsers(supabase)

    if (users.length === 0) {
      log.warning('Aucun utilisateur à traiter. Arrêt du script.')
      process.exit(0)
    }

    // Afficher la liste
    displayUsers(users)

    // Demander confirmation
    log.warning('⚠️  ATTENTION: Cette opération va réinitialiser TOUS les mots de passe!')
    log.info(`Nouveau mot de passe: ${NEW_PASSWORD} (4 chiffres)`)
    console.log('')

    const confirmed = await askConfirmation(
      `${colors.yellow}Confirmer la réinitialisation de ${users.length} compte(s)? (oui/non): ${colors.reset}`
    )

    if (!confirmed) {
      log.info('Opération annulée par l\'utilisateur')
      process.exit(0)
    }

    console.log('')

    // Réinitialiser tous les mots de passe
    const results = await resetAllPasswords(supabase, users)

    // Afficher le rapport
    displayReport(results, users)

    // Code de sortie
    process.exit(results.failed.length > 0 ? 1 : 0)
  } catch (error) {
    console.error('')
    log.error(`Erreur fatale: ${error.message}`)
    console.error(error)
    process.exit(1)
  }
}

// Exécuter le script
main()
