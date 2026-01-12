-- Réinitialiser les catégories de produits
-- Supprimer toutes les catégories existantes
DELETE FROM categories;

-- Insérer les catégories principales (36 au total)
-- Note: Les IDs UUID sont générés automatiquement
-- Structure: (name, description, icon)
INSERT INTO categories (name, description, icon) VALUES
  -- Mode & Accessoires
  ('Vêtements Homme', 'Chemises, pantalons, costumes, vestes', 'shirt-outline'),
  ('Vêtements Femme', 'Robes, jupes, chemisiers, pantalons', 'woman-outline'),
  ('Chaussures', 'Sneakers, sandales, bottes, escarpins', 'footsteps-outline'),
  ('Sacs & Accessoires', 'Sacs à main, portefeuilles, ceintures', 'bag-handle-outline'),
  ('Bijoux & Montres', 'Colliers, bracelets, boucles d''oreilles, montres', 'watch-outline'),

  -- Électronique & High-Tech
  ('Téléphones & Tablettes', 'Smartphones, tablettes, accessoires', 'phone-portrait-outline'),
  ('Ordinateurs & Laptops', 'PC portables, ordinateurs de bureau, composants', 'laptop-outline'),
  ('TV & Audio', 'Téléviseurs, home cinéma, enceintes', 'tv-outline'),
  ('Électroménager', 'Réfrigérateurs, cuisinières, micro-ondes', 'home-outline'),
  ('Appareils Photo', 'Caméras, objectifs, accessoires photo', 'camera-outline'),

  -- Maison & Jardin
  ('Meubles', 'Canapés, tables, chaises, lits', 'bed-outline'),
  ('Décoration', 'Tableaux, vases, coussins, rideaux', 'color-palette-outline'),
  ('Cuisine & Vaisselle', 'Ustensiles, casseroles, assiettes, verres', 'restaurant-outline'),
  ('Jardin & Extérieur', 'Plantes, outils de jardinage, mobilier de jardin', 'leaf-outline'),
  ('Bricolage & Outils', 'Perceuses, tournevis, échelles, peinture', 'hammer-outline'),

  -- Beauté & Santé
  ('Produits de Beauté', 'Maquillage, soins du visage, parfums', 'sparkles-outline'),
  ('Soins Cheveux', 'Shampooings, après-shampooings, colorations', 'cut-outline'),
  ('Santé & Bien-être', 'Compléments alimentaires, vitamines, huiles', 'heart-outline'),
  ('Sport & Fitness', 'Équipements de sport, vêtements de sport', 'fitness-outline'),

  -- Enfants & Bébés
  ('Vêtements Enfants', 'Vêtements pour garçons et filles', 'happy-outline'),
  ('Jouets & Jeux', 'Poupées, voitures, jeux de société', 'game-controller-outline'),
  ('Bébé & Puériculture', 'Poussettes, biberons, couches, lits bébé', 'logo-baby'),
  ('Fournitures Scolaires', 'Cahiers, stylos, sacs d''école', 'school-outline'),

  -- Alimentation & Boissons
  ('Alimentation', 'Produits frais, conserves, épices', 'nutrition-outline'),
  ('Boissons', 'Jus, sodas, eau, café, thé', 'cafe-outline'),
  ('Pâtisserie', 'Gâteaux, biscuits, bonbons', 'ice-cream-outline'),

  -- Livres, Musique & Films
  ('Livres', 'Romans, BD, magazines, manuels', 'book-outline'),
  ('Musique & Instruments', 'Instruments, CDs, vinyles', 'musical-notes-outline'),
  ('Films & DVD', 'DVDs, Blu-ray, coffrets', 'film-outline'),

  -- Auto & Moto
  ('Pièces Auto', 'Batteries, pneus, filtres, pièces détachées', 'car-outline'),
  ('Accessoires Auto', 'GPS, chargeurs, housses de siège', 'speedometer-outline'),
  ('Motos & Scooters', 'Motos, scooters, casques', 'bicycle-outline'),

  -- Services
  ('Services Professionnels', 'Plomberie, électricité, peinture', 'construct-outline'),
  ('Événements', 'Organisation de mariages, anniversaires', 'calendar-outline'),

  -- Animaux
  ('Animaux de Compagnie', 'Nourriture, accessoires, jouets pour animaux', 'paw-outline'),

  -- Autres
  ('Autres', 'Produits divers non classés', 'ellipsis-horizontal-outline');

-- Afficher le résultat
SELECT
  id,
  name,
  description,
  icon,
  created_at
FROM categories
ORDER BY name;
