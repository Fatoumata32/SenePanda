-- ========================================
-- DONNÉES DE TEST POUR SENEPANDA
-- À APPLIQUER APRÈS LES MIGRATIONS
-- ========================================

-- ÉTAPE 1: Catégories
INSERT INTO categories (name, description, emoji, is_active) VALUES
  ('Mode & Vêtements', 'Vêtements, chaussures et accessoires', '👗', true),
  ('Électronique', 'Téléphones, ordinateurs et gadgets', '📱', true),
  ('Maison & Jardin', 'Meubles, décoration et électroménager', '🏠', true),
  ('Sport & Loisirs', 'Articles de sport et loisirs', '⚽', true),
  ('Beauté & Santé', 'Cosmétiques, parfums et soins', '💄', true),
  ('Alimentation', 'Produits alimentaires et boissons', '🍔', true),
  ('Enfants & Bébés', 'Jouets, vêtements et accessoires enfants', '👶', true),
  ('Livres & Culture', 'Livres, musique et films', '📚', true),
  ('Auto & Moto', 'Pièces et accessoires automobiles', '🚗', true),
  ('Services', 'Services professionnels', '🛠️', true)
ON CONFLICT DO NOTHING;

-- ÉTAPE 2: Récompenses du catalogue
INSERT INTO rewards (title, description, reward_type, reward_value, points_cost, min_level, stock, is_active) VALUES
  -- Réductions
  ('Réduction 5%', 'Bon de réduction de 5% sur votre prochaine commande', 'discount', 5, 50, 'bronze', NULL, true),
  ('Réduction 10%', 'Bon de réduction de 10% sur votre prochaine commande', 'discount', 10, 100, 'bronze', NULL, true),
  ('Réduction 15%', 'Bon de réduction de 15% sur votre prochaine commande', 'discount', 15, 150, 'silver', NULL, true),
  ('Réduction 20%', 'Bon de réduction de 20% sur votre prochaine commande', 'discount', 20, 200, 'gold', NULL, true),

  -- Bons fixes
  ('Bon 500 XOF', 'Bon de 500 XOF à utiliser sur votre prochaine commande', 'voucher', 500, 50, 'bronze', NULL, true),
  ('Bon 1000 XOF', 'Bon de 1000 XOF à utiliser sur votre prochaine commande', 'voucher', 1000, 100, 'bronze', NULL, true),
  ('Bon 2500 XOF', 'Bon de 2500 XOF à utiliser sur votre prochaine commande', 'voucher', 2500, 200, 'silver', NULL, true),
  ('Bon 5000 XOF', 'Bon de 5000 XOF à utiliser sur votre prochaine commande', 'voucher', 5000, 400, 'gold', NULL, true),

  -- Livraison gratuite
  ('Livraison Gratuite', 'Une livraison gratuite sur votre prochaine commande', 'free_shipping', NULL, 75, 'bronze', NULL, true),
  ('3x Livraison Gratuite', 'Trois livraisons gratuites', 'free_shipping', NULL, 200, 'silver', NULL, true)
ON CONFLICT DO NOTHING;

-- ÉTAPE 3: Profils de test (utilisateurs fictifs)
-- NOTE: Ces profils nécessitent que les utilisateurs existent dans auth.users
-- Vous devrez les créer via l'interface Supabase ou via l'app

-- Exemple de structure pour référence:
COMMENT ON TABLE profiles IS 'Profils utilisateurs - Créez des comptes via l''app pour tester';

-- ÉTAPE 4: Produits de test
-- NOTE: Utilisez les IDs de vos vrais vendeurs

DO $$
DECLARE
  v_category_mode UUID;
  v_category_electronique UUID;
  v_category_maison UUID;
  v_category_sport UUID;
  v_category_beaute UUID;
BEGIN
  -- Récupérer les IDs des catégories
  SELECT id INTO v_category_mode FROM categories WHERE name = 'Mode & Vêtements' LIMIT 1;
  SELECT id INTO v_category_electronique FROM categories WHERE name = 'Électronique' LIMIT 1;
  SELECT id INTO v_category_maison FROM categories WHERE name = 'Maison & Jardin' LIMIT 1;
  SELECT id INTO v_category_sport FROM categories WHERE name = 'Sport & Loisirs' LIMIT 1;
  SELECT id INTO v_category_beaute FROM categories WHERE name = 'Beauté & Santé' LIMIT 1;

  -- Note: Remplacez 'VOTRE_SELLER_ID' par un vrai UUID de vendeur
  RAISE NOTICE 'Catégories créées. Ajoutez des produits via l''interface vendeur de l''app.';
END $$;

-- ÉTAPE 5: Flash Deals (exemples)
-- NOTE: Ces deals nécessitent des produits existants

COMMENT ON TABLE flash_deals IS 'Flash deals - Créez-les via l''interface vendeur avec des produits réels';

-- ÉTAPE 6: Notifications de bienvenue
-- NOTE: Nécessite des user_id réels

CREATE OR REPLACE FUNCTION create_welcome_notification(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    p_user_id,
    'welcome',
    'Bienvenue sur SenePanda! 🎉',
    'Merci de nous rejoindre! Profitez de votre bonus de bienvenue de 50 points.',
    '{"points": 50}'::jsonb
  );
END;
$$ LANGUAGE plpgsql;

-- ÉTAPE 7: Données de configuration

-- Ajouter des tags populaires (pour référence)
COMMENT ON COLUMN products.tags IS 'Tags suggérés: nouveau, promo, bestseller, eco, premium, local, artisanal';

-- ÉTAPE 8: Statistiques initiales
CREATE OR REPLACE VIEW stats_overview AS
SELECT
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE is_seller = true) as total_sellers,
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM products WHERE is_active = true) as active_products,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM reviews) as total_reviews,
  (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'delivered') as total_revenue;

-- ========================================
-- INSTRUCTIONS POUR CRÉER DES DONNÉES DE TEST COMPLÈTES
-- ========================================

/*
ÉTAPES À SUIVRE:

1. Créez 5-10 comptes utilisateurs via l'app:
   - 3-5 acheteurs normaux
   - 2-3 vendeurs
   - Utilisez des emails temporaires (temp-mail.org)

2. Pour chaque vendeur:
   - Activez le mode vendeur dans l'app
   - Créez 5-10 produits avec:
     * Titres accrocheurs
     * Descriptions détaillées
     * Prix réalistes (1000-50000 XOF)
     * Stock disponible (10-100)
     * Images (utilisez des URLs d'images gratuites: unsplash.com)

3. Testez les fonctionnalités:
   - Ajoutez des produits aux favoris
   - Passez 2-3 commandes
   - Laissez des avis (après commandes livrées)
   - Testez le chat vendeur-acheteur
   - Créez un code de parrainage
   - Échangez des points contre des récompenses

4. Créez des flash deals:
   - Via l'interface vendeur
   - Réductions de 20-50%
   - Durée: 24-48h

5. Testez les points de fidélité:
   - Commande = points gagnés
   - Parrainage = 200 points
   - Avis = 50 points
   - Échange points contre récompenses

DONNÉES RÉALISTES:

Exemples de produits:
- "iPhone 13 Pro - Comme neuf" - 350000 XOF
- "Robe Africaine Wax Premium" - 25000 XOF
- "Chaussures Nike Air Max" - 45000 XOF
- "Sac à dos Laptop" - 15000 XOF
- "Casque Bluetooth JBL" - 18000 XOF
- "Parfum Chanel N°5" - 75000 XOF
- "Meuble TV Moderne" - 120000 XOF
- "Tapis de Yoga" - 8000 XOF

Prix moyens par catégorie:
- Mode: 15000-50000 XOF
- Électronique: 25000-500000 XOF
- Maison: 20000-200000 XOF
- Sport: 5000-30000 XOF
- Beauté: 3000-80000 XOF

*/

-- Vérification finale
SELECT 'Données de test créées! 🎉' as status,
       'Créez maintenant des utilisateurs et produits via l''app' as next_step;

-- Voir les stats
SELECT * FROM stats_overview;
