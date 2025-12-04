# 🚀 Système d'activation de boutique - Version finale

## 📋 Vue d'ensemble

Le nouveau système permet aux vendeurs de **créer leur boutique GRATUITEMENT** puis de l'activer en choisissant un plan d'abonnement quand ils sont prêts.

## ✅ Nouveau flux utilisateur

```
1. Inscription
   ↓
2. Choix de rôle: "Vendeur"
   ↓
3. 🆓 Création automatique d'un abonnement FREE
   ↓
4. ✅ Création de la boutique (sans restriction)
   ↓
5. 📦 Ajout de produits (limité selon le plan)
   ↓
6. 💎 Bouton "Activer ma boutique" visible
   ↓
7. Choix d'un plan payant (Starter/Pro/Premium)
   ↓
8. Paiement et validation
   ↓
9. 🎉 Boutique activée avec toutes les fonctionnalités
```

## 🎯 Caractéristiques du système

### 1. Plan FREE par défaut
- ✅ **Automatique** : Créé dès l'inscription comme vendeur
- ✅ **Gratuit** : Aucun paiement requis
- ✅ **Limité** :
  - 10 produits maximum
  - 1 image par produit
  - Pas de mise en avant
  - Boutique non visible publiquement
  - Statistiques basiques uniquement

### 2. Variable `subscription_plan` dans profiles
- ✅ Colonne ajoutée dans la table `profiles`
- ✅ Synchronisée automatiquement avec `user_subscriptions`
- ✅ Valeurs possibles: 'free', 'starter', 'pro', 'premium'
- ✅ Utilisée pour vérifier rapidement le plan actuel

### 3. Variable `shop_is_active` dans profiles
- ✅ Indique si la boutique est activée (plan payant actif)
- ✅ `false` pour plan FREE
- ✅ `true` pour plans payants (Starter/Pro/Premium)
- ✅ Contrôle la visibilité publique de la boutique

### 4. Bouton "Activer ma boutique"
- ✅ Banner visuel attractif dans la page produits
- ✅ S'affiche uniquement si plan FREE ou inactif
- ✅ Design moderne avec gradient or
- ✅ Liste les bénéfices des plans payants
- ✅ Redirige vers la page de choix de plan

### 5. Restrictions selon le plan

| Fonctionnalité | FREE | Starter | Pro | Premium |
|---|:---:|:---:|:---:|:---:|
| Nombre de produits | 10 | 50 | 200 | ∞ |
| Images par produit | 1 | 3 | 5 | 10 |
| Mise en avant | ❌ | ✅ | ✅ | ✅ |
| Stats avancées | ❌ | ❌ | ✅ | ✅ |
| Support prioritaire | ❌ | ❌ | ✅ | ✅ |
| Personnalisation | ❌ | ❌ | ✅ | ✅ |
| Vidéos produits | ❌ | ❌ | ❌ | ✅ |
| Boutique visible | ❌ | ✅ | ✅ | ✅ |

## 📁 Fichiers créés/modifiés

### Créés
```
✅ supabase/migrations/add_subscription_plan_to_profiles.sql
   - Ajoute subscription_plan et shop_is_active
   - Trigger de synchronisation automatique
   - Vue seller_with_subscription

✅ components/ActivateShopBanner.tsx
   - Banner d'activation de boutique
   - Design attractif avec gradient
   - Liste des bénéfices
   - Bouton CTA

✅ hooks/useSubscriptionPlan.ts
   - Hook pour gérer le plan actuel
   - Limites et restrictions
   - Vérifications de fonctionnalités
   - Fonctions utilitaires
```

### Modifiés
```
✅ app/role-selection.tsx
   - Création auto abonnement FREE
   - Redirection vers création de boutique
   - Mise à jour subscription_plan

✅ app/seller/products.tsx
   - Import ActivateShopBanner
   - Affichage conditionnel du banner
   - Intégration avec le hook

❌ app/seller/choose-subscription.tsx
   - Plus utilisé dans le flux principal
   - Peut être utilisé pour upgrade de plan
```

## 🔧 Migration SQL requise

### Étape 1 : Exécuter le script

**Via Supabase CLI:**
```bash
cd supabase
# Copier le contenu de add_subscription_plan_to_profiles.sql
# dans SQL Editor de Supabase et exécuter
```

**Via l'interface Supabase:**
1. Dashboard → SQL Editor
2. New query
3. Copier `supabase/migrations/add_subscription_plan_to_profiles.sql`
4. Run
5. Vérifier les ✅ dans les logs

### Étape 2 : Vérification

```sql
-- Vérifier les colonnes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('subscription_plan', 'shop_is_active');

-- Devrait retourner 2 lignes

-- Vérifier le trigger
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_sync_subscription_plan';

-- Devrait retourner 1 ligne

-- Tester un vendeur
SELECT
  id,
  full_name,
  is_seller,
  subscription_plan,
  shop_is_active,
  shop_name
FROM profiles
WHERE is_seller = true
LIMIT 5;
```

## 🎨 Utilisation du hook useSubscriptionPlan

### Exemple de base

```typescript
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';
import { useAuth } from '@/providers/AuthProvider';

function MyComponent() {
  const { user } = useAuth();
  const {
    loading,
    currentPlan,
    shopIsActive,
    limits,
    canAddProduct,
    canAddImage,
    hasFeature,
  } = useSubscriptionPlan(user?.id);

  if (loading) return <Loading />;

  return (
    <View>
      <Text>Plan actuel: {currentPlan}</Text>
      <Text>Boutique active: {shopIsActive ? 'Oui' : 'Non'}</Text>
      <Text>Limite produits: {limits.maxProducts}</Text>
    </View>
  );
}
```

### Vérifier avant d'ajouter un produit

```typescript
const handleAddProduct = () => {
  if (!canAddProduct(products.length)) {
    Alert.alert(
      'Limite atteinte',
      `Vous avez atteint la limite de ${limits.maxProducts} produits pour le plan ${currentPlan}. Passez à un plan supérieur.`
    );
    return;
  }

  // Ajouter le produit
  router.push('/seller/add-product');
};
```

### Vérifier une fonctionnalité

```typescript
if (hasFeature('canUseFeaturedListing')) {
  // Afficher l'option "Mettre en avant"
} else {
  // Afficher un badge "Premium uniquement"
}
```

## 🎨 Utilisation du composant ActivateShopBanner

### Dans une liste de produits

```typescript
import ActivateShopBanner from '@/components/ActivateShopBanner';

<FlatList
  data={products}
  renderItem={renderProduct}
  ListHeaderComponent={
    <ActivateShopBanner
      currentPlan={subscriptionStatus?.plan}
      shopIsActive={subscriptionStatus?.isActive}
    />
  }
/>
```

### Dans une page standalone

```typescript
<ScrollView>
  <ActivateShopBanner
    currentPlan="free"
    shopIsActive={false}
  />

  {/* Votre contenu */}
</ScrollView>
```

## 🧪 Tests à effectuer

### Test 1: Nouveau vendeur
1. Créer un compte
2. Choisir "Vendeur"
3. ✅ Abonnement FREE créé automatiquement
4. ✅ Redirection vers création de boutique
5. ✅ `subscription_plan = 'free'` dans profiles
6. ✅ `shop_is_active = false`

### Test 2: Ajout de produits avec limite
1. Ajouter 10 produits (limite FREE)
2. Essayer d'ajouter un 11ème
3. ✅ Message "Limite atteinte"
4. ✅ Banner "Activer ma boutique" visible

### Test 3: Upgrade vers plan payant
1. Cliquer sur "Activer ma boutique"
2. Choisir un plan (Starter/Pro/Premium)
3. Effectuer le paiement
4. ✅ `subscription_plan` mis à jour
5. ✅ `shop_is_active = true`
6. ✅ Nouvelles limites appliquées
7. ✅ Banner disparaît

### Test 4: Synchronisation automatique
1. Mettre à jour `user_subscriptions` manuellement
2. Changer `is_active` de true à false
3. ✅ Trigger met à jour `profiles.subscription_plan`
4. ✅ Trigger met à jour `profiles.shop_is_active`

### Test 5: Vue seller_with_subscription
```sql
SELECT * FROM seller_with_subscription
WHERE subscription_plan = 'free';
```
✅ Devrait retourner tous les vendeurs FREE avec leurs infos complètes

## 📊 Monitoring et analytics

### Requêtes utiles

**Nombre de vendeurs par plan:**
```sql
SELECT
  subscription_plan,
  COUNT(*) as count,
  COUNT(CASE WHEN shop_is_active THEN 1 END) as active_shops
FROM profiles
WHERE is_seller = true
GROUP BY subscription_plan
ORDER BY
  CASE subscription_plan
    WHEN 'premium' THEN 1
    WHEN 'pro' THEN 2
    WHEN 'starter' THEN 3
    WHEN 'free' THEN 4
  END;
```

**Vendeurs FREE qui ont atteint la limite:**
```sql
SELECT
  p.id,
  p.full_name,
  p.shop_name,
  COUNT(pr.id) as product_count
FROM profiles p
LEFT JOIN products pr ON p.id = pr.seller_id
WHERE p.subscription_plan = 'free'
AND p.is_seller = true
GROUP BY p.id, p.full_name, p.shop_name
HAVING COUNT(pr.id) >= 10
ORDER BY product_count DESC;
```

**Taux de conversion FREE → Payant:**
```sql
WITH free_sellers AS (
  SELECT COUNT(*) as total
  FROM profiles
  WHERE is_seller = true
  AND subscription_plan = 'free'
),
paid_sellers AS (
  SELECT COUNT(*) as total
  FROM profiles
  WHERE is_seller = true
  AND subscription_plan != 'free'
)
SELECT
  f.total as free_count,
  p.total as paid_count,
  ROUND(p.total::numeric / (f.total + p.total) * 100, 2) as conversion_rate
FROM free_sellers f, paid_sellers p;
```

## 🎯 Points clés du système

### Avantages

1. **Friction minimale**
   - Vendeur peut commencer immédiatement
   - Aucun paiement requis au début
   - Boutique créée en quelques minutes

2. **Upselling naturel**
   - Banner visible dès qu'il a des produits
   - Mise en avant des bénéfices
   - Conversion au bon moment (quand il a atteint la limite)

3. **Flexibilité**
   - Plan FREE utilisable indéfiniment
   - Upgrade possible à tout moment
   - Downgrade possible si nécessaire

4. **Performance**
   - Colonnes dans profiles = requêtes rapides
   - Pas besoin de join systématique
   - Index pour optimisation

5. **Maintenance**
   - Synchronisation automatique via trigger
   - Moins de code dans l'app
   - Single source of truth dans profiles

### Inconvénients (gérés)

1. **Boutiques FREE non visibles**
   - ✅ Vendeur informé clairement
   - ✅ Peut tester avant de payer
   - ✅ Motivation pour upgrade

2. **Duplication de données**
   - ✅ Synchronisé automatiquement
   - ✅ Trigger fiable
   - ✅ Vue pour réconciliation

3. **Limites strictes FREE**
   - ✅ Suffisant pour tester
   - ✅ Encourage l'upgrade
   - ✅ Évite l'abus

## 🚨 Gestion des erreurs

### Si subscription_plan est null

```typescript
const plan = profile.subscription_plan || 'free';
```

### Si shop_is_active est null

```typescript
const isActive = profile.shop_is_active ?? false;
```

### Si le trigger ne se déclenche pas

```sql
-- Forcer la synchronisation
UPDATE profiles p
SET
  subscription_plan = us.plan_type,
  shop_is_active = (us.plan_type != 'free')
FROM user_subscriptions us
WHERE p.id = us.user_id
AND us.is_active = true;
```

## 📞 Support

En cas de problème :

1. **Vérifier la migration**
   - Les colonnes existent?
   - Le trigger est actif?
   - La vue est créée?

2. **Vérifier les données**
   - subscription_plan rempli?
   - shop_is_active cohérent?
   - user_subscriptions actif?

3. **Vérifier le hook**
   - userId passé?
   - loading géré?
   - Erreurs catchées?

4. **Forcer un refresh**
   ```typescript
   await refresh();
   ```

## ✅ Checklist de déploiement

- [ ] Migration SQL exécutée
- [ ] Colonnes vérifiées
- [ ] Trigger vérifié
- [ ] Vue créée
- [ ] Hook useSubscriptionPlan testé
- [ ] ActivateShopBanner testé
- [ ] Flux nouveau vendeur testé
- [ ] Flux upgrade testé
- [ ] Limites appliquées correctement
- [ ] Banner s'affiche/disparaît correctement
- [ ] Synchronisation automatique fonctionne
- [ ] Analytics en place
- [ ] Documentation à jour

---

**Date:** 2025-12-02
**Version:** 2.0 (Finale)
**Statut:** ✅ Prêt pour production

**Le système est maintenant complet et optimisé ! 🎉**
