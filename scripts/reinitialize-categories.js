/**
 * Script pour réinitialiser les catégories dans Supabase
 *
 * Usage: node scripts/reinitialize-categories.js
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('Assurez-vous que EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY sont définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const categories = [
  // Mode & Accessoires
  { name: 'Vêtements Homme', description: 'Chemises, pantalons, costumes, vestes', icon: 'shirt-outline' },
  { name: 'Vêtements Femme', description: 'Robes, jupes, chemisiers, pantalons', icon: 'woman-outline' },
  { name: 'Chaussures', description: 'Sneakers, sandales, bottes, escarpins', icon: 'footsteps-outline' },
  { name: 'Sacs & Accessoires', description: 'Sacs à main, portefeuilles, ceintures', icon: 'bag-handle-outline' },
  { name: 'Bijoux & Montres', description: 'Colliers, bracelets, boucles d\'oreilles, montres', icon: 'watch-outline' },

  // Électronique & High-Tech
  { name: 'Téléphones & Tablettes', description: 'Smartphones, tablettes, accessoires', icon: 'phone-portrait-outline' },
  { name: 'Ordinateurs & Laptops', description: 'PC portables, ordinateurs de bureau, composants', icon: 'laptop-outline' },
  { name: 'TV & Audio', description: 'Téléviseurs, home cinéma, enceintes', icon: 'tv-outline' },
  { name: 'Électroménager', description: 'Réfrigérateurs, cuisinières, micro-ondes', icon: 'home-outline' },
  { name: 'Appareils Photo', description: 'Caméras, objectifs, accessoires photo', icon: 'camera-outline' },

  // Maison & Jardin
  { name: 'Meubles', description: 'Canapés, tables, chaises, lits', icon: 'bed-outline' },
  { name: 'Décoration', description: 'Tableaux, vases, coussins, rideaux', icon: 'color-palette-outline' },
  { name: 'Cuisine & Vaisselle', description: 'Ustensiles, casseroles, assiettes, verres', icon: 'restaurant-outline' },
  { name: 'Jardin & Extérieur', description: 'Plantes, outils de jardinage, mobilier de jardin', icon: 'leaf-outline' },
  { name: 'Bricolage & Outils', description: 'Perceuses, tournevis, échelles, peinture', icon: 'hammer-outline' },

  // Beauté & Santé
  { name: 'Produits de Beauté', description: 'Maquillage, soins du visage, parfums', icon: 'sparkles-outline' },
  { name: 'Soins Cheveux', description: 'Shampooings, après-shampooings, colorations', icon: 'cut-outline' },
  { name: 'Santé & Bien-être', description: 'Compléments alimentaires, vitamines, huiles', icon: 'heart-outline' },
  { name: 'Sport & Fitness', description: 'Équipements de sport, vêtements de sport', icon: 'fitness-outline' },

  // Enfants & Bébés
  { name: 'Vêtements Enfants', description: 'Vêtements pour garçons et filles', icon: 'happy-outline' },
  { name: 'Jouets & Jeux', description: 'Poupées, voitures, jeux de société', icon: 'game-controller-outline' },
  { name: 'Bébé & Puériculture', description: 'Poussettes, biberons, couches, lits bébé', icon: 'logo-baby' },
  { name: 'Fournitures Scolaires', description: 'Cahiers, stylos, sacs d\'école', icon: 'school-outline' },

  // Alimentation & Boissons
  { name: 'Alimentation', description: 'Produits frais, conserves, épices', icon: 'nutrition-outline' },
  { name: 'Boissons', description: 'Jus, sodas, eau, café, thé', icon: 'cafe-outline' },
  { name: 'Pâtisserie', description: 'Gâteaux, biscuits, bonbons', icon: 'ice-cream-outline' },

  // Livres, Musique & Films
  { name: 'Livres', description: 'Romans, BD, magazines, manuels', icon: 'book-outline' },
  { name: 'Musique & Instruments', description: 'Instruments, CDs, vinyles', icon: 'musical-notes-outline' },
  { name: 'Films & DVD', description: 'DVDs, Blu-ray, coffrets', icon: 'film-outline' },

  // Auto & Moto
  { name: 'Pièces Auto', description: 'Batteries, pneus, filtres, pièces détachées', icon: 'car-outline' },
  { name: 'Accessoires Auto', description: 'GPS, chargeurs, housses de siège', icon: 'speedometer-outline' },
  { name: 'Motos & Scooters', description: 'Motos, scooters, casques', icon: 'bicycle-outline' },

  // Services
  { name: 'Services Professionnels', description: 'Plomberie, électricité, peinture', icon: 'construct-outline' },
  { name: 'Événements', description: 'Organisation de mariages, anniversaires', icon: 'calendar-outline' },

  // Animaux
  { name: 'Animaux de Compagnie', description: 'Nourriture, accessoires, jouets pour animaux', icon: 'paw-outline' },

  // Autres
  { name: 'Autres', description: 'Produits divers non classés', icon: 'ellipsis-horizontal-outline' },
];

async function reinitializeCategories() {
  console.log('🔄 Réinitialisation des catégories...\n');

  try {
    // 1. Supprimer toutes les catégories existantes
    console.log('🗑️  Suppression des anciennes catégories...');
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (UUID can't be 0)

    if (deleteError) {
      console.error('❌ Erreur lors de la suppression:', deleteError);
      process.exit(1);
    }
    console.log('✅ Anciennes catégories supprimées\n');

    // 2. Insérer les nouvelles catégories
    console.log('➕ Insertion des nouvelles catégories...');
    const { data, error: insertError } = await supabase
      .from('categories')
      .insert(categories)
      .select();

    if (insertError) {
      console.error('❌ Erreur lors de l\'insertion:', insertError);
      process.exit(1);
    }

    console.log(`✅ ${data.length} catégories insérées avec succès\n`);

    // 3. Afficher la liste des catégories
    console.log('📋 Liste des catégories :');
    console.log('─'.repeat(80));
    data
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((cat, index) => {
        const paddedIndex = String(index + 1).padStart(2, ' ');
        const paddedName = cat.name.padEnd(30, ' ');
        const paddedIcon = cat.icon.padEnd(30, ' ');
        console.log(`  ${paddedIndex}. ${paddedName} | ${paddedIcon}`);
      });
    console.log('─'.repeat(80));
    console.log(`\n🎉 Total : ${data.length} catégories\n`);
    console.log('✅ Réinitialisation terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    process.exit(1);
  }
}

// Exécuter le script
reinitializeCategories();
