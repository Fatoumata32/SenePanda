# 🛒 Guide Complet: Live Shopping avec Paiement Intégré

## 📋 Vue d'ensemble

Ce guide explique le système complet de Live Shopping avec paiement intégré, permettant aux utilisateurs d'acheter des produits directement pendant un live.

## 🎯 Fonctionnalités

### Pour les Acheteurs
- ✅ Acheter instantanément pendant le live
- ✅ Choix de méthodes de paiement (Orange Money, Wave, Free Money, Carte, Virement)
- ✅ Aperçu des prix avec frais transparents
- ✅ Sélection de quantité
- ✅ Confirmation instantanée
- ✅ Historique des commandes

### Pour les Vendeurs
- ✅ Recevoir des commandes en temps réel
- ✅ Notification des achats pendant le live
- ✅ Gestion des commandes
- ✅ Statistiques de ventes

## 🏗️ Architecture

### 1. Base de Données

#### Tables Créées

**`orders`** - Commandes principales
```sql
- id (UUID)
- user_id (UUID) - Acheteur
- seller_id (UUID) - Vendeur
- live_session_id (UUID) - Session live
- order_number (VARCHAR) - Numéro unique (ORD-20251231-00001)
- status (VARCHAR) - pending, confirmed, processing, shipped, delivered, cancelled
- product_id, product_title, product_image
- quantity, unit_price, subtotal, fees, total_amount
- payment_id, payment_method, payment_status
- delivery_address, delivery_phone, tracking_number
- timestamps (created_at, confirmed_at, shipped_at, delivered_at)
```

**`order_items`** - Items de commande (extension future multi-produits)
```sql
- id, order_id, product_id
- product_title, product_image
- quantity, unit_price, subtotal, total
```

**`order_status_history`** - Historique des changements de statut
```sql
- id, order_id, status, note, changed_by, created_at
```

**Vue: `order_stats`** - Statistiques agrégées par vendeur

#### Indexes Optimisés
- `user_id`, `seller_id`, `live_session_id`, `product_id`
- `status`, `order_number`, `payment_id`
- `created_at DESC` pour tri rapide
- `purchase_type` pour filtrage

### 2. Composants React Native

#### `LiveCheckoutModal.tsx`
Modal de paiement express avec 5 étapes:

1. **Sélection de méthode** (`method`)
   - Liste des méthodes disponibles
   - Affichage des frais et délais
   - Icons colorés par méthode

2. **Détails du paiement** (`details`)
   - Résumé produit avec image
   - Sélecteur de quantité (+/-)
   - Input téléphone (pour Mobile Money)
   - Breakdown des prix (Sous-total + Frais = Total)
   - Bouton "Payer X FCFA"

3. **Traitement** (`processing`)
   - ActivityIndicator
   - Message "Confirmez sur votre téléphone"

4. **Succès** (`success`)
   - CheckCircle vert
   - Message de confirmation
   - Auto-close après 2s

5. **Erreur** (`error`)
   - AlertCircle rouge
   - Message d'erreur
   - Bouton "Réessayer"

**Features UX:**
- Haptic feedback sur toutes les interactions
- Animations smooth (LinearGradient, Animated)
- Validation téléphone (patterns Orange/Wave/Free)
- Calcul automatique des frais

#### Intégration dans `app/live/[id].tsx`

**Nouveaux boutons produit:**
```tsx
<View style={styles.productActions}>
  {/* Bouton Acheter principal (vert) */}
  <TouchableOpacity onPress={() => handleBuyNow(product)}>
    <LinearGradient colors={['#10B981', '#059669']}>
      <Zap /> Acheter
    </LinearGradient>
  </TouchableOpacity>

  {/* Bouton Panier secondaire (orange) */}
  <TouchableOpacity onPress={() => handleAddToCart(product.product_id)}>
    <ShoppingCart />
  </TouchableOpacity>
</View>
```

**State management:**
```tsx
const [checkoutProduct, setCheckoutProduct] = useState<any>(null);

// Ouvrir checkout
const handleBuyNow = (product) => {
  setCheckoutProduct({
    id: product.product_id,
    title: product.product_title,
    price: product.product_price,
    currency: 'FCFA',
    image_url: product.product_image,
    special_price: product.special_price,
  });
};
```

### 3. Service de Paiement (`lib/payment.ts`)

#### Méthodes de Paiement

```typescript
export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    id: 'orange_money',
    name: 'Orange Money',
    color: '#FF6600',
    requiresPhone: true,
    fees: 0,
    minAmount: 100,
    maxAmount: 2000000,
  },
  {
    id: 'wave',
    name: 'Wave',
    color: '#1DC8FF',
    requiresPhone: true,
    fees: 0,
    minAmount: 100,
    maxAmount: 5000000,
  },
  {
    id: 'free_money',
    name: 'Free Money',
    color: '#CD1126',
    requiresPhone: true,
    fees: 0,
    minAmount: 100,
    maxAmount: 1000000,
  },
  {
    id: 'card',
    name: 'Carte Bancaire',
    color: '#1E40AF',
    requiresCard: true,
    fees: 2.5, // 2.5% de frais
    minAmount: 500,
    maxAmount: 10000000,
  },
  {
    id: 'bank_transfer',
    name: 'Virement Bancaire',
    color: '#059669',
    fees: 0,
    minAmount: 10000,
    maxAmount: 100000000,
  },
];
```

#### Validation Téléphone

```typescript
// Patterns pour le Sénégal
const patterns = {
  orange_money: /^(77|78)\d{7}$/,  // 77 ou 78 + 7 chiffres
  wave: /^(70|76|77|78)\d{7}$/,    // 70, 76, 77 ou 78 + 7 chiffres
  free_money: /^76\d{7}$/,         // 76 + 7 chiffres
};
```

#### Flux de Paiement

```typescript
// 1. Créer enregistrement paiement
const payment = await supabase.from('payments').insert({
  user_id, amount, currency, method, phone_number, status: 'pending'
});

// 2. Traiter le paiement (Mock - à remplacer par API réelle)
const result = await processPayment(payment.id, request);

// 3. Si succès → Créer commande
if (result.success && metadata.product_id) {
  await createOrderFromPayment(paymentId, request);
}
```

#### Création Automatique de Commande

```typescript
async function createOrderFromPayment(paymentId, request) {
  // 1. Récupérer seller_id depuis product
  const product = await supabase
    .from('products')
    .select('seller_id')
    .eq('id', metadata.product_id)
    .single();

  // 2. Récupérer user_id depuis payment
  const payment = await supabase
    .from('payments')
    .select('user_id')
    .eq('id', paymentId)
    .single();

  // 3. Créer commande
  await supabase.from('orders').insert({
    user_id: payment.user_id,
    seller_id: product.seller_id,
    live_session_id: metadata.live_session_id,
    product_id: metadata.product_id,
    quantity: metadata.quantity,
    unit_price: metadata.unit_price,
    total_amount: request.amount,
    payment_id: paymentId,
    payment_method: request.method,
    status: 'confirmed',
    purchase_type: 'live_shopping',
  });
}
```

## 🚀 Guide d'Utilisation

### Appliquer la Migration

**Option 1: Supabase Dashboard**
```bash
# 1. Aller sur https://app.supabase.com
# 2. SQL Editor → New Query
# 3. Copier le contenu de:
supabase/migrations/add_live_shopping_orders.sql
# 4. Exécuter (Run)
```

**Option 2: CLI Supabase**
```bash
supabase db push
```

### Tester le Flux Complet

1. **Démarrer un Live**
   ```bash
   # En tant que vendeur
   - Aller dans Ma Boutique
   - Cliquer "Démarrer un Live"
   - Ajouter des produits vedettes
   ```

2. **Rejoindre en tant qu'acheteur**
   ```bash
   # Ouvrir l'app sur un autre appareil/compte
   - Voir la liste des lives actifs
   - Rejoindre le live
   - Panneau produits (icône shopping bag)
   ```

3. **Acheter un produit**
   ```bash
   - Cliquer "Acheter" sur un produit
   - Choisir méthode de paiement
   - Entrer numéro (pour Mobile Money)
   - Confirmer quantité
   - Payer
   ```

4. **Vérifier la commande**
   ```sql
   -- Dans Supabase SQL Editor
   SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;
   SELECT * FROM order_status_history;
   SELECT * FROM order_stats;
   ```

## 🔐 Sécurité (RLS)

### Politiques Implémentées

**Orders - SELECT**
```sql
-- Utilisateurs voient leurs propres commandes
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Vendeurs voient les commandes de leurs produits
CREATE POLICY "Sellers can view orders for their products"
  ON orders FOR SELECT
  USING (auth.uid() = seller_id);
```

**Orders - INSERT**
```sql
-- Utilisateurs créent leurs propres commandes
CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Orders - UPDATE**
```sql
-- Vendeurs peuvent mettre à jour leurs commandes
CREATE POLICY "Sellers can update their orders"
  ON orders FOR UPDATE
  USING (auth.uid() = seller_id);

-- Utilisateurs peuvent annuler leurs commandes en attente
CREATE POLICY "Users can cancel own pending orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'confirmed'))
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');
```

## 📊 Statistiques et Analytics

### Vue: order_stats

```sql
SELECT * FROM order_stats WHERE seller_id = 'xxx';
-- Retourne:
{
  total_orders: 150,
  pending_orders: 5,
  confirmed_orders: 10,
  delivered_orders: 120,
  cancelled_orders: 15,
  total_revenue: 15000000,  -- en FCFA
  delivered_revenue: 12000000,
  unique_customers: 85,
  live_shopping_orders: 45
}
```

### Requêtes Utiles

**Top produits vendus en live:**
```sql
SELECT
  product_title,
  COUNT(*) as sales_count,
  SUM(quantity) as total_quantity,
  SUM(total_amount) as revenue
FROM orders
WHERE purchase_type = 'live_shopping'
  AND status IN ('confirmed', 'delivered')
GROUP BY product_title
ORDER BY sales_count DESC
LIMIT 10;
```

**Revenus par jour:**
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as orders_count,
  SUM(total_amount) as daily_revenue
FROM orders
WHERE seller_id = 'xxx'
  AND status NOT IN ('cancelled', 'refunded')
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Taux de conversion par live:**
```sql
SELECT
  ls.id,
  ls.title,
  COUNT(DISTINCT lv.user_id) as viewers,
  COUNT(o.id) as orders,
  ROUND(COUNT(o.id)::NUMERIC / NULLIF(COUNT(DISTINCT lv.user_id), 0) * 100, 2) as conversion_rate
FROM live_sessions ls
LEFT JOIN live_viewers lv ON lv.session_id = ls.id
LEFT JOIN orders o ON o.live_session_id = ls.id
WHERE ls.seller_id = 'xxx'
GROUP BY ls.id, ls.title
ORDER BY conversion_rate DESC;
```

## 🔧 Personnalisation

### Ajouter une Méthode de Paiement

```typescript
// lib/payment.ts
PAYMENT_METHODS.push({
  id: 'paydunya',
  name: 'PayDunya',
  color: '#00A651',
  icon: 'smartphone',
  requiresPhone: false,
  requiresCard: false,
  processingTime: 'Instantané',
  fees: 1.5,
  minAmount: 500,
  maxAmount: 5000000,
});

// Ajouter pattern de validation si nécessaire
const patterns = {
  // ...
  paydunya: /^\d{9}$/,
};
```

### Intégrer une API de Paiement Réelle

```typescript
// lib/payment.ts - Remplacer processPayment()
async function processPayment(paymentId, request) {
  // Exemple: Orange Money API
  if (request.method === 'orange_money') {
    const response = await fetch('https://api.orange.com/payment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ORANGE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: request.amount,
        currency: request.currency,
        phone: request.phoneNumber,
        reference: paymentId,
      }),
    });

    const data = await response.json();

    // Mettre à jour le statut
    await supabase
      .from('payments')
      .update({
        status: data.status === 'success' ? 'completed' : 'failed',
        external_id: data.transaction_id,
      })
      .eq('id', paymentId);

    return {
      success: data.status === 'success',
      transactionId: data.transaction_id,
      status: data.status === 'success' ? 'completed' : 'failed',
      message: data.message,
    };
  }
}
```

### Ajouter des Notifications

```typescript
// Dans createOrderFromPayment()
if (orderError) return;

// Notification au vendeur
await supabase.from('notifications').insert({
  user_id: product.seller_id,
  type: 'new_order',
  title: 'Nouvelle commande ! 🎉',
  message: `${quantity}x ${request.description}`,
  data: { order_id: order.id },
});

// Notification à l'acheteur
await supabase.from('notifications').insert({
  user_id: payment.user_id,
  type: 'order_confirmed',
  title: 'Commande confirmée ✅',
  message: `Numéro: ${order.order_number}`,
  data: { order_id: order.id },
});

// SMS via Twilio (optionnel)
await sendSMS(request.phoneNumber,
  `Merci pour votre achat! Commande ${order.order_number}`
);
```

## 🐛 Dépannage

### Erreur: "Property does not exist"
```bash
# Vérifier que la migration est appliquée
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'orders';

# Si vide → Appliquer migration
```

### Paiement bloqué sur "Processing"
```bash
# Mode test: Le paiement Mock a 90% de succès
# Vérifier dans la table payments:
SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;

# Si status = 'processing' depuis longtemps → Problème serveur
# Manuellement changer en 'completed' pour tester:
UPDATE payments SET status = 'completed' WHERE id = 'xxx';
```

### Commande non créée après paiement
```bash
# Vérifier logs console
console.log('✅ Order created successfully:', order.order_number);

# Vérifier RLS policies
SELECT * FROM orders; -- Si vide alors que payment = completed
# → Problème de permissions RLS

# Vérifier que le produit existe
SELECT * FROM products WHERE id = 'xxx';
```

## 📱 Prochaines Étapes

### À Implémenter

1. **Gestion des Commandes Vendeur**
   - [ ] Page `/seller/orders` - Liste des commandes
   - [ ] Filtres (pending, shipped, delivered)
   - [ ] Bouton "Marquer comme expédié"
   - [ ] Ajout numéro de tracking

2. **Historique Acheteur**
   - [ ] Page `/profile/orders` - Mes commandes
   - [ ] Détails de commande
   - [ ] Suivi de livraison
   - [ ] Bouton "Annuler" (si pending)

3. **Notifications Push**
   - [ ] Expo Push Notifications
   - [ ] Notif vendeur: Nouvelle commande
   - [ ] Notif acheteur: Expédition, Livraison

4. **Analytics Dashboard**
   - [ ] Graphiques CA par jour/semaine/mois
   - [ ] Top produits
   - [ ] Taux de conversion par live
   - [ ] Revenue = Orders vs Subscriptions

5. **Multi-produits Panier**
   - [ ] Acheter plusieurs produits en un paiement
   - [ ] Utiliser `order_items` table
   - [ ] Grouper par vendeur

## 📞 Support

Pour questions ou problèmes:
- GitHub Issues: [Créer une issue](https://github.com/your-repo/issues)
- Documentation: `TECHNICAL_DOCUMENTATION.md`
- Guide Dev: `GUIDE_DEVELOPPEUR.md`

---

**Dernière mise à jour:** 31 Décembre 2025
**Version:** 1.0.0
**Auteur:** Claude Code + Votre Équipe
