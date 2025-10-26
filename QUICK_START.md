# 🚀 Démarrage Rapide - Système d'Abonnement

## En 5 Minutes Chrono ⏱️

### Étape 1 : Exécuter la Migration (2 min)

```bash
# Option A : Via Supabase Dashboard (RECOMMANDÉ)
# 1. Ouvrez https://supabase.com/dashboard
# 2. Sélectionnez votre projet SenePanda
# 3. Allez dans "SQL Editor"
# 4. Collez le contenu de :
#    supabase/migrations/create_seller_subscription_plans.sql
# 5. Cliquez sur "Run"

# Option B : Via psql (si vous avez un accès direct)
psql -h [VOTRE_SUPABASE_HOST] -U postgres -d postgres \
  -f supabase/migrations/create_seller_subscription_plans.sql
```

**✅ Vérification** :
```sql
SELECT plan_type, name, price_monthly FROM subscription_plans;
```

Vous devez voir : Free (0), Starter (5000), Pro (15000), Premium (30000)

---

### Étape 2 : Tester l'Application (1 min)

```bash
# Démarrer l'app
npm run dev
```

**Testez** :
1. Scannez le QR code avec Expo Go
2. Allez dans "Profil"
3. Si vous êtes vendeur → Cliquez sur "Plans d'Abonnement"
4. Vous devriez voir les 4 plans avec leurs avantages

---

### Étape 3 : Tester la Mise en Valeur (1 min)

1. Retournez à la **page d'accueil**
2. Vous devriez voir une section **"Produits Mis en Avant"**
3. Les produits sont triés selon l'algorithme de scoring

Si aucun produit n'apparaît :
- Ajoutez quelques produits via votre interface vendeur
- Actualisez la page

---

### Étape 4 : Tester un Upgrade (1 min)

**Via l'interface** :
1. Profil → Plans d'Abonnement
2. Choisissez "Starter"
3. Confirmez
4. ✅ Votre plan est upgradé !

**Via SQL (pour tester rapidement)** :
```sql
-- Remplacez 'SELLER_UUID' par l'ID d'un vrai vendeur
SELECT upgrade_seller_plan(
  'SELLER_UUID'::uuid,
  'starter'::subscription_plan_type,
  5000,
  'TEST_TXN_123'
);
```

**Vérification** :
```sql
SELECT
  p.shop_name,
  p.subscription_plan,
  ss.status
FROM profiles p
JOIN seller_subscriptions ss ON ss.seller_id = p.id
WHERE p.is_seller = true AND ss.status = 'active';
```

---

### Étape 5 : Vérifier les Avantages (Optionnel)

```sql
-- Voir les avantages d'un vendeur spécifique
SELECT * FROM get_seller_plan_benefits('SELLER_UUID');
```

Résultat :
```
plan_type | commission_rate | max_products | current_products | visibility_boost | can_add_more_products
----------|-----------------|--------------|------------------|------------------|-----------------------
starter   | 15              | 25           | 3                | 20               | true
```

---

## 🎯 Points de Contrôle

### ✅ Installation Réussie Si :

- [ ] Les 4 plans s'affichent dans l'écran "Plans d'Abonnement"
- [ ] La section "Produits Mis en Avant" apparaît sur la homepage
- [ ] Un upgrade de plan fonctionne (via UI ou SQL)
- [ ] Les avantages du plan sont visibles dans l'écran "Mes Avantages"
- [ ] Pas d'erreurs TypeScript (`npm run typecheck`)

---

## 🔧 Dépannage Rapide

### Problème : "Les plans ne s'affichent pas"

**Solution** :
```sql
-- Vérifier que les plans existent
SELECT COUNT(*) FROM subscription_plans;
-- Doit retourner 4

-- Vérifier que is_active = true
SELECT plan_type, is_active FROM subscription_plans;
-- Tous doivent être true

-- Réactiver si nécessaire
UPDATE subscription_plans SET is_active = true;
```

---

### Problème : "Impossible d'upgrader un plan"

**Solution** :
```sql
-- Vérifier que l'utilisateur est bien vendeur
SELECT id, shop_name, is_seller FROM profiles WHERE id = 'SELLER_UUID';
-- is_seller doit être true

-- Vérifier que le plan existe
SELECT id, plan_type FROM subscription_plans WHERE plan_type = 'starter';
-- Doit retourner un résultat
```

---

### Problème : "Pas de produits mis en avant"

**Causes possibles** :
1. Pas de produits dans la base → Ajoutez des produits
2. Tous les produits sont `is_active = false` → Activez-les
3. Pas de vendeurs → Créez une boutique vendeur

**Solution rapide** :
```sql
-- Vérifier les produits actifs
SELECT COUNT(*) FROM products WHERE is_active = true;
-- Doit être > 0

-- Activer tous les produits (temporaire pour test)
UPDATE products SET is_active = true WHERE stock > 0;
```

---

### Problème : "Erreurs TypeScript"

**Solution** :
```bash
# Recompiler les types
npm run typecheck

# Si erreur persiste, supprimer node_modules et réinstaller
rm -rf node_modules
npm install
```

---

## 📱 Utilisation Normale

### Pour un Vendeur

1. **S'inscrire/Se connecter**
2. **Créer une boutique** (via Profil → Devenir vendeur)
3. **Ajouter des produits** (jusqu'à 5 sur plan gratuit)
4. **Consulter les plans** (Profil → Plans d'Abonnement)
5. **Upgrader si besoin** (quand la limite est atteinte ou pour plus de visibilité)

### Pour un Acheteur

1. **Ouvrir l'app**
2. **Voir les "Produits Mis en Avant"** sur la homepage
3. **Reconnaître les badges** :
   - 🔵 Bleu = Starter (Vérifié)
   - 🟣 Violet = Pro
   - 🟡 Or = Premium (Elite)
4. **Acheter en confiance**

---

## 💡 Conseils Pro

### Optimiser la Visibilité des Produits

```sql
-- Trouver les produits sans avis (qui ont besoin de boost)
SELECT
  p.id,
  p.title,
  prof.subscription_plan,
  p.average_rating,
  p.total_reviews
FROM products p
JOIN profiles prof ON prof.id = p.seller_id
WHERE p.is_active = true
  AND p.total_reviews = 0
ORDER BY prof.subscription_plan DESC, p.created_at DESC;
```

**Action** : Encouragez ces vendeurs à :
- Demander des avis à leurs clients
- Améliorer leurs photos
- Upgrader leur plan

---

### Générer un Rapport de Revenus

```bash
# Exécuter le script de test complet
psql -f scripts/test-subscription-system.sql > rapport.txt

# Lire les statistiques
cat rapport.txt | grep -A 5 "Statistiques globales"
```

---

### Configurer un Rappel d'Expiration

```sql
-- Trouver les abonnements qui expirent bientôt
SELECT
  p.shop_name,
  p.id as seller_id,
  ss.plan_type,
  ss.expires_at,
  EXTRACT(DAY FROM ss.expires_at - now()) as days_remaining
FROM seller_subscriptions ss
JOIN profiles p ON p.id = ss.seller_id
WHERE ss.status = 'active'
  AND ss.expires_at <= now() + interval '7 days'
ORDER BY ss.expires_at;
```

**Action** : Envoyez un email de rappel à ces vendeurs

---

## 🎓 Prochaines Étapes

Maintenant que le système est opérationnel :

1. **Personnalisez les prix** selon votre marché
2. **Configurez les paiements** (Wave, Orange Money, Stripe)
3. **Communiquez aux vendeurs** via email/notification
4. **Surveillez les métriques** (MRR, taux de conversion)
5. **Itérez** selon les retours utilisateurs

---

## 📚 Documentation Complète

- **RESUME_SYSTEME_ABONNEMENT.md** - Vue d'ensemble complète
- **SUBSCRIPTION_SYSTEM.md** - Documentation technique
- **PRICING_LOGIC.md** - Logique de tarification
- **INSTALLATION_GUIDE.md** - Guide détaillé

---

## 🎉 Félicitations !

Votre système d'abonnement est maintenant **100% fonctionnel** !

**Temps d'installation** : ⏱️ ~5 minutes
**Complexité** : 🟢 Simple
**Puissance** : 🔥🔥🔥 Maximale
**Équité** : ⚖️ Parfaite

**Go build something amazing! 🚀**

---

**Besoin d'aide ?** Consultez les fichiers de documentation ou les scripts de test.
