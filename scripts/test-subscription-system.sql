-- Script de test pour le système d'abonnement

-- 1. Vérifier que les plans ont été créés
SELECT
  plan_type,
  name,
  price_monthly,
  commission_rate,
  max_products,
  visibility_boost
FROM subscription_plans
ORDER BY display_order;

-- 2. Simuler l'upgrade d'un vendeur au plan Starter
-- Remplacez 'SELLER_UUID' par l'ID réel d'un vendeur
DO $$
DECLARE
  test_seller_id uuid;
BEGIN
  -- Récupérer un vendeur de test (le premier vendeur trouvé)
  SELECT id INTO test_seller_id
  FROM profiles
  WHERE is_seller = true
  LIMIT 1;

  IF test_seller_id IS NOT NULL THEN
    -- Upgrade vers Starter
    PERFORM upgrade_seller_plan(
      test_seller_id,
      'starter'::subscription_plan_type,
      5000,
      'TEST_TXN_' || gen_random_uuid()::text
    );

    RAISE NOTICE 'Vendeur % upgradé vers Starter', test_seller_id;
  ELSE
    RAISE NOTICE 'Aucun vendeur trouvé pour le test';
  END IF;
END $$;

-- 3. Vérifier l'abonnement créé
SELECT
  ss.seller_id,
  p.shop_name,
  ss.plan_type,
  ss.status,
  ss.started_at,
  ss.expires_at,
  ss.amount_paid
FROM seller_subscriptions ss
JOIN profiles p ON p.id = ss.seller_id
WHERE ss.status = 'active'
ORDER BY ss.started_at DESC;

-- 4. Tester la fonction can_add_product
DO $$
DECLARE
  test_seller_id uuid;
  can_add boolean;
BEGIN
  SELECT id INTO test_seller_id
  FROM profiles
  WHERE is_seller = true
  LIMIT 1;

  IF test_seller_id IS NOT NULL THEN
    SELECT can_add_product(test_seller_id) INTO can_add;
    RAISE NOTICE 'Le vendeur % peut ajouter un produit : %', test_seller_id, can_add;
  END IF;
END $$;

-- 5. Obtenir les bénéfices d'un vendeur
DO $$
DECLARE
  test_seller_id uuid;
BEGIN
  SELECT id INTO test_seller_id
  FROM profiles
  WHERE is_seller = true
  LIMIT 1;

  IF test_seller_id IS NOT NULL THEN
    RAISE NOTICE 'Bénéfices du vendeur %:', test_seller_id;

    -- Cette requête montre les avantages du plan
    SELECT
      plan_type,
      commission_rate,
      max_products,
      current_products,
      visibility_boost,
      can_add_more_products
    FROM get_seller_plan_benefits(test_seller_id);
  END IF;
END $$;

-- 6. Vérifier l'historique des abonnements
SELECT
  sh.seller_id,
  p.shop_name,
  sh.action,
  sh.old_plan_type,
  sh.new_plan_type,
  sh.amount_paid,
  sh.created_at
FROM subscription_history sh
JOIN profiles p ON p.id = sh.seller_id
ORDER BY sh.created_at DESC
LIMIT 10;

-- 7. Statistiques globales des abonnements
SELECT
  plan_type,
  COUNT(*) as total_subscriptions,
  SUM(amount_paid) as total_revenue
FROM seller_subscriptions
WHERE status = 'active'
GROUP BY plan_type
ORDER BY
  CASE plan_type
    WHEN 'free' THEN 1
    WHEN 'starter' THEN 2
    WHEN 'pro' THEN 3
    WHEN 'premium' THEN 4
  END;

-- 8. Calculer les revenus mensuels récurrents (MRR)
SELECT
  SUM(sp.price_monthly) as mrr_xof,
  COUNT(*) as active_paid_subscriptions
FROM seller_subscriptions ss
JOIN subscription_plans sp ON sp.id = ss.plan_id
WHERE ss.status = 'active' AND sp.price_monthly > 0;

-- 9. Vérifier les limites de produits par plan
SELECT
  sp.plan_type,
  sp.max_products,
  COUNT(DISTINCT p.seller_id) as sellers_count,
  AVG(seller_products.product_count)::int as avg_products_per_seller
FROM subscription_plans sp
LEFT JOIN profiles prof ON prof.subscription_plan = sp.plan_type
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int as product_count
  FROM products
  WHERE seller_id = prof.id AND is_active = true
) seller_products ON true
WHERE prof.is_seller = true
GROUP BY sp.plan_type, sp.max_products
ORDER BY sp.display_order;

-- 10. Simuler plusieurs upgrades pour tester le système
DO $$
DECLARE
  seller_record RECORD;
  plans subscription_plan_type[] := ARRAY['starter', 'pro', 'premium']::subscription_plan_type[];
  random_plan subscription_plan_type;
BEGIN
  -- Upgrader les 3 premiers vendeurs vers des plans aléatoires
  FOR seller_record IN
    SELECT id, shop_name
    FROM profiles
    WHERE is_seller = true
    LIMIT 3
  LOOP
    random_plan := plans[1 + floor(random() * 3)::int];

    PERFORM upgrade_seller_plan(
      seller_record.id,
      random_plan,
      CASE random_plan
        WHEN 'starter' THEN 5000
        WHEN 'pro' THEN 15000
        WHEN 'premium' THEN 30000
      END,
      'TEST_BATCH_' || gen_random_uuid()::text
    );

    RAISE NOTICE 'Vendeur % (%) upgradé vers %',
      seller_record.shop_name,
      seller_record.id,
      random_plan;
  END LOOP;
END $$;

-- 11. Afficher un résumé final
SELECT
  'Total des plans actifs' as metric,
  COUNT(*)::text as value
FROM seller_subscriptions
WHERE status = 'active'
UNION ALL
SELECT
  'MRR Total (XOF)',
  SUM(sp.price_monthly)::text
FROM seller_subscriptions ss
JOIN subscription_plans sp ON sp.id = ss.plan_id
WHERE ss.status = 'active'
UNION ALL
SELECT
  'Taux de conversion payant',
  ROUND(
    COUNT(CASE WHEN ss.plan_type != 'free' THEN 1 END)::numeric /
    COUNT(*)::numeric * 100,
    2
  )::text || '%'
FROM seller_subscriptions ss
WHERE ss.status = 'active';
