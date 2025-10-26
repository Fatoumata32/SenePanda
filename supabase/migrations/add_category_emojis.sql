-- Ajouter des emojis aux catégories pour améliorer l'accessibilité
-- Cela aide les utilisateurs illettrés à reconnaître les catégories visuellement

-- Mettre à jour les catégories existantes avec des emojis
UPDATE categories SET icon = '🎨' WHERE name = 'Artisanat';
UPDATE categories SET icon = '👗' WHERE name = 'Mode';
UPDATE categories SET icon = '💎' WHERE name = 'Bijoux';
UPDATE categories SET icon = '🏠' WHERE name = 'Décoration';
UPDATE categories SET icon = '🎭' WHERE name = 'Art';
UPDATE categories SET icon = '🧵' WHERE name = 'Textile';

-- Ajouter d'autres catégories populaires avec emojis
INSERT INTO categories (name, description, icon) VALUES
  ('Électronique', 'Téléphones, ordinateurs et appareils électroniques', '📱'),
  ('Alimentation', 'Nourriture et boissons', '🍎'),
  ('Beauté', 'Produits de beauté et cosmétiques', '💄'),
  ('Santé', 'Produits de santé et bien-être', '💊'),
  ('Sport', 'Équipements et vêtements de sport', '⚽'),
  ('Enfants', 'Jouets et articles pour enfants', '🧸'),
  ('Maison', 'Articles ménagers et cuisine', '🍳'),
  ('Livres', 'Livres et magazines', '📚'),
  ('Animaux', 'Produits pour animaux de compagnie', '🐾'),
  ('Automobile', 'Pièces et accessoires auto', '🚗'),
  ('Jardin', 'Plantes et outils de jardinage', '🌱'),
  ('Musique', 'Instruments et accessoires musicaux', '🎸'),
  ('Bureautique', 'Fournitures de bureau', '📎'),
  ('Chaussures', 'Chaussures pour tous', '👟')
ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon, description = EXCLUDED.description;
