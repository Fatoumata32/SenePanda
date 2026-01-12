# 🔒 Fix Sécurité - Page Mes Ventes

## ⚠️ Problème Détecté

La page `/seller/orders` (Mes Ventes) **ne vérifie pas** si l'utilisateur est bien un vendeur autorisé.

### Vulnérabilités Actuelles:

1. ❌ **Pas de vérification `is_seller`**
   - N'importe qui peut accéder à `/seller/orders` en tapant l'URL
   - Ligne 77: Filtre uniquement sur `product.seller_id === user.id`

2. ❌ **Pas de vérification d'abonnement**
   - Ne vérifie pas si le vendeur a un plan actif
   - Un vendeur dont l'abonnement a expiré peut toujours voir ses ventes

3. ❌ **Pas de vérification de boutique**
   - Ne vérifie pas si le vendeur a configuré sa boutique

---

## ✅ Solution Recommandée

### Modifications à Apporter dans `app/seller/orders.tsx`

#### 1. Ajouter les Vérifications au Chargement

```typescript
const loadOrders = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/');
      return;
    }

    // ✅ NOUVEAU: Vérifier que l'utilisateur est bien un vendeur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_seller, subscription_plan, shop_name')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // ✅ Rediriger si pas vendeur
    if (!profile?.is_seller) {
      Alert.alert(
        'Accès refusé',
        'Vous devez être vendeur pour accéder à cette page.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/profile') }]
      );
      return;
    }

    // ⚠️ OPTIONNEL: Vérifier l'abonnement (selon votre logique métier)
    if (!profile.subscription_plan || profile.subscription_plan === 'free') {
      Alert.alert(
        'Abonnement requis',
        'Vous devez souscrire à un plan pour gérer vos ventes.',
        [
          { text: 'Plus tard', style: 'cancel', onPress: () => router.back() },
          { text: 'S\'abonner', onPress: () => router.push('/seller/subscription-plans') }
        ]
      );
      return;
    }

    // ⚠️ OPTIONNEL: Vérifier que la boutique est configurée
    if (!profile.shop_name) {
      Alert.alert(
        'Boutique non configurée',
        'Configurez votre boutique avant de gérer vos ventes.',
        [
          { text: 'Annuler', style: 'cancel', onPress: () => router.back() },
          { text: 'Configurer', onPress: () => router.push('/seller/my-shop') }
        ]
      );
      return;
    }

    // Continuer avec le chargement des commandes...
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        product:products!inner(
          title,
          image_url,
          seller_id
        ),
        order:orders!inner(
          id,
          created_at,
          total_amount,
          status,
          shipping_address,
          user_id
        )
      `)
      .eq('product.seller_id', user.id);

    // ... reste du code inchangé
  } catch (error: any) {
    console.error('Error loading orders:', error);
    Alert.alert('Erreur', error.message || 'Impossible de charger les commandes');
  } finally {
    setLoading(false);
  }
};
```

---

## 📋 Niveaux de Sécurité

Vous pouvez choisir le niveau de sécurité selon vos besoins:

### Niveau 1: **Minimal (Recommandé minimum)**
✅ Vérifier uniquement `is_seller = true`

```typescript
if (!profile?.is_seller) {
  Alert.alert('Accès refusé', 'Vous devez être vendeur.');
  router.replace('/(tabs)/profile');
  return;
}
```

### Niveau 2: **Standard (Recommandé)**
✅ Vérifier `is_seller = true`
✅ Vérifier abonnement actif (sauf gratuit)

```typescript
if (!profile?.is_seller) {
  // Rediriger
}

if (!profile.subscription_plan || profile.subscription_plan === 'free') {
  // Demander abonnement
}
```

### Niveau 3: **Strict**
✅ Vérifier `is_seller = true`
✅ Vérifier abonnement payant
✅ Vérifier boutique configurée (`shop_name` non null)

```typescript
if (!profile?.is_seller || !profile.shop_name || profile.subscription_plan === 'free') {
  // Rediriger selon le cas
}
```

---

## 🔐 Protection Côté Base de Données (RLS)

Pour une sécurité maximale, ajoutez aussi une **Row Level Security (RLS)** policy:

```sql
-- Policy pour order_items: seul le vendeur du produit peut voir les items
CREATE POLICY "Vendors can view their order items"
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = order_items.product_id
    AND products.seller_id = auth.uid()
  )
);

-- Policy pour orders: seul l'acheteur ou le vendeur peuvent voir la commande
CREATE POLICY "Sellers can view orders with their products"
ON orders FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM order_items
    JOIN products ON products.id = order_items.product_id
    WHERE order_items.order_id = orders.id
    AND products.seller_id = auth.uid()
  )
);
```

**Avantage:** Même si quelqu'un contourne l'interface, Supabase bloquera les requêtes.

---

## 🎯 Logique Métier Recommandée

Selon votre modèle d'affaires, décidez:

### Option A: **Tous les vendeurs peuvent voir leurs ventes**
- Vérifier uniquement `is_seller = true`
- Pas de restriction sur l'abonnement
- Même les vendeurs gratuits peuvent voir leurs ventes passées

### Option B: **Seuls les vendeurs abonnés**
- Vérifier `is_seller = true` ET `subscription_plan != 'free'`
- Les vendeurs non abonnés ne peuvent pas voir leurs ventes
- Incite à payer pour gérer l'activité

### Option C: **Vendeurs avec boutique configurée**
- Vérifier `is_seller = true` ET `shop_name IS NOT NULL`
- Garantit que seuls les vendeurs sérieux accèdent aux ventes

---

## ✅ Checklist de Vérification

Après implémentation, vérifiez:

- [ ] Un utilisateur normal ne peut PAS accéder à `/seller/orders`
- [ ] Un vendeur (`is_seller = true`) PEUT accéder
- [ ] Un vendeur sans abonnement voit une alerte (si Option B)
- [ ] Un vendeur sans boutique voit une alerte (si Option C)
- [ ] Les RLS policies bloquent les requêtes non autorisées

---

## 🚀 Code Complet Sécurisé

Voici le code complet à mettre dans `loadOrders()`:

```typescript
const loadOrders = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/');
      return;
    }

    // Vérifier le profil vendeur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_seller, subscription_plan, shop_name')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // NIVEAU 1: Vérification vendeur (MINIMUM)
    if (!profile?.is_seller) {
      Alert.alert(
        'Accès refusé',
        'Cette page est réservée aux vendeurs.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/profile') }]
      );
      return;
    }

    // NIVEAU 2: Vérification abonnement (OPTIONNEL)
    // Décommentez si vous voulez forcer un abonnement payant
    /*
    if (!profile.subscription_plan || profile.subscription_plan === 'free') {
      Alert.alert(
        'Abonnement requis',
        'Souscrivez à un plan pour gérer vos ventes.',
        [
          { text: 'Plus tard', style: 'cancel', onPress: () => router.back() },
          { text: 'S\'abonner', onPress: () => router.push('/seller/subscription-plans') }
        ]
      );
      return;
    }
    */

    // NIVEAU 3: Vérification boutique (OPTIONNEL)
    // Décommentez si vous voulez forcer la configuration boutique
    /*
    if (!profile.shop_name) {
      Alert.alert(
        'Boutique non configurée',
        'Configurez votre boutique pour continuer.',
        [
          { text: 'Annuler', style: 'cancel', onPress: () => router.back() },
          { text: 'Configurer', onPress: () => router.push('/seller/my-shop') }
        ]
      );
      return;
    }
    */

    // Charger les commandes (code existant)
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        product:products!inner(
          title,
          image_url,
          seller_id
        ),
        order:orders!inner(
          id,
          created_at,
          total_amount,
          status,
          shipping_address,
          user_id
        )
      `)
      .eq('product.seller_id', user.id);

    if (itemsError) throw itemsError;

    // Grouper les items par commande
    const ordersMap = new Map<string, any>();

    for (const item of orderItems || []) {
      const orderId = item.order.id;

      if (!ordersMap.has(orderId)) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', item.order.user_id)
          .single();

        ordersMap.set(orderId, {
          ...item.order,
          order_items: [],
          profile: profileData || { full_name: null, phone: null },
        });
      }

      ordersMap.get(orderId).order_items.push(item);
    }

    const ordersArray = Array.from(ordersMap.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setOrders(ordersArray);
  } catch (error: any) {
    console.error('Error loading orders:', error);
    Alert.alert('Erreur', error.message || 'Impossible de charger les commandes');
  } finally {
    setLoading(false);
  }
};
```

---

**Recommandation:** Implémentez au minimum le **Niveau 1** (vérification `is_seller`).

**Date:** 2026-01-12
**Priorité:** 🔴 Haute (Sécurité)
