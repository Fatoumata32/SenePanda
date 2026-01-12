# 💳 Intégration Wave Payment - Guide Complet

## 🎯 Vue d'ensemble

SenePanda intègre maintenant **Wave Mobile Money** comme méthode de paiement, permettant aux utilisateurs de payer directement via leur compte Wave.

### Avantages de Wave
- ✅ **Populaire en Afrique de l'Ouest** (Sénégal, Côte d'Ivoire, Burkina Faso, Mali)
- ✅ **Paiement mobile money** sécurisé
- ✅ **Sans frais** pour les transferts entre utilisateurs Wave
- ✅ **Confirmation instantanée** des paiements
- ✅ **Support webhook** pour les notifications temps réel

---

## 📁 Fichiers créés

### 1. Service d'intégration
📄 **lib/wavePayment.ts**
- Fonctions d'API Wave
- Initialisation de paiement
- Vérification de statut
- Gestion des webhooks

### 2. Composant UI
📄 **components/payment/WavePaymentButton.tsx**
- Bouton de paiement Wave
- 2 variants (default, premium)
- Gestion des erreurs

### 3. Webhook Supabase
📄 **supabase/functions/wave-webhook/index.ts**
- Edge Function pour recevoir les webhooks Wave
- Mise à jour automatique des commandes
- Notifications aux utilisateurs

### 4. Migration SQL
📄 **supabase/migrations/add_wave_payment_system.sql**
- Table `wave_transactions`
- Triggers automatiques
- Policies RLS

---

## 🚀 Configuration requise

### 1. Obtenir les credentials Wave

1. Créez un compte marchand sur [Wave Dashboard](https://dashboard.wave.com)
2. Récupérez vos clés API:
   - `WAVE_API_KEY` (clé publique)
   - `WAVE_SECRET_KEY` (clé secrète)

### 2. Variables d'environnement

Créez un fichier `.env` à la racine du projet:

```bash
# Wave API Configuration
EXPO_PUBLIC_WAVE_API_URL=https://api.wave.com/v1
EXPO_PUBLIC_WAVE_API_KEY=votre_cle_api_publique
EXPO_PUBLIC_WAVE_SECRET_KEY=votre_cle_secrete

# URL de l'app pour les redirections
EXPO_PUBLIC_APP_URL=https://votre-app.com
```

### 3. Appliquer la migration SQL

Ouvrez le **Dashboard Supabase** → **SQL Editor** et exécutez:

```sql
-- Contenu du fichier
supabase/migrations/add_wave_payment_system.sql
```

### 4. Déployer le webhook

```bash
# Se connecter à Supabase
npx supabase login

# Déployer la fonction
npx supabase functions deploy wave-webhook

# Configurer les secrets
npx supabase secrets set WAVE_SECRET_KEY=votre_cle_secrete
```

### 5. Configurer le webhook sur Wave

Dans le **Wave Dashboard** → **Webhooks**:

1. URL du webhook: `https://votre-projet.supabase.co/functions/v1/wave-webhook`
2. Événements à écouter:
   - `payment.succeeded`
   - `payment.failed`
   - `payment.cancelled`

---

## 💻 Utilisation

### Dans le checkout

Le checkout intègre automatiquement Wave:

```typescript
// app/checkout.tsx
import WavePaymentButton from '@/components/payment/WavePaymentButton';

// L'utilisateur peut choisir entre:
// - Wave Mobile Money (par défaut)
// - Paiement à la livraison

<TouchableOpacity onPress={() => setPaymentMethod('wave')}>
  {/* Option Wave avec icône et description */}
</TouchableOpacity>
```

### Programmation manuelle

```typescript
import { initiateWavePayment } from '@/lib/wavePayment';

const handlePayment = async () => {
  const response = await initiateWavePayment({
    amount: 10000, // Montant en FCFA
    currency: 'XOF',
    customerName: 'Jean Dupont',
    customerPhone: '+221771234567',
    customerEmail: 'jean@example.com',
    orderId: 'order_123',
    description: 'Commande #123',
    metadata: {
      product_id: 'prod_456',
      // Autres données personnalisées
    },
  });

  if (response.success) {
    // Rediriger vers response.checkoutUrl
    await Linking.openURL(response.checkoutUrl);
  } else {
    // Gérer l'erreur
    Alert.alert('Erreur', response.error);
  }
};
```

---

## 🔄 Flux de paiement

### 1. Initialisation

```mermaid
User → App: Choisit Wave
App → Wave API: Créer session de paiement
Wave API → App: URL de checkout
App → User: Ouvre Wave App
```

### 2. Paiement

```
User: Entre PIN Wave
Wave: Valide le paiement
Wave: Envoie webhook à Supabase
```

### 3. Confirmation

```
Webhook → Supabase: payment.succeeded
Supabase → DB: Met à jour commande
Supabase → User: Notification paiement confirmé
Supabase → Seller: Notification vente
```

---

## 📊 Base de données

### Table `wave_transactions`

```sql
CREATE TABLE wave_transactions (
  id UUID PRIMARY KEY,
  wave_transaction_id TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id),

  -- Montant
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'XOF',

  -- Statut
  status TEXT CHECK (status IN (
    'pending', 'processing', 'complete',
    'succeeded', 'failed', 'cancelled', 'expired'
  )),

  -- Client
  customer_name TEXT,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,

  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  webhook_type TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);
```

### Fonction `create_order_with_wave_payment`

Crée une commande directement avec Wave:

```sql
SELECT * FROM create_order_with_wave_payment(
  p_user_id := 'uuid_utilisateur',
  p_shipping_name := 'Jean Dupont',
  p_shipping_phone := '+221771234567',
  p_shipping_address := 'Rue 10, Dakar',
  p_shipping_city := 'Dakar',
  p_shipping_country := 'Sénégal',
  p_wave_transaction_id := 'wave_tx_123'
);
```

---

## 🔔 Webhooks

### Événements supportés

| Événement | Description | Action |
|-----------|-------------|--------|
| `payment.succeeded` | Paiement réussi | Marquer commande comme payée |
| `payment.failed` | Paiement échoué | Marquer commande comme échouée |
| `payment.cancelled` | Paiement annulé | Annuler la commande |

### Format du payload

```json
{
  "id": "evt_abc123",
  "type": "payment.succeeded",
  "data": {
    "id": "wave_tx_xyz789",
    "amount": 10000,
    "currency": "XOF",
    "status": "complete",
    "reference": "wave_tx_xyz789",
    "customer": {
      "name": "Jean Dupont",
      "phone": "+221771234567",
      "email": "jean@example.com"
    },
    "metadata": {
      "order_id": "order_123"
    },
    "created_at": "2025-12-04T10:00:00Z",
    "updated_at": "2025-12-04T10:01:00Z"
  }
}
```

### Sécurité

Les webhooks sont vérifiés avec la signature HMAC-SHA256:

```typescript
const signature = request.headers.get('x-wave-signature');
const isValid = verifyWaveWebhook(signature, payload);
```

---

## ✅ Tests

### 1. Test en développement

Wave fournit des numéros de test:

```
Numéro de test: +221 70 000 0001
PIN: 1234
```

### 2. Test du webhook localement

```bash
# Installer ngrok
npm install -g ngrok

# Exposer le webhook local
ngrok http 54321

# Configurer l'URL dans Wave Dashboard
https://votre-url.ngrok.io/functions/v1/wave-webhook
```

### 3. Tester les différents scénarios

```typescript
// ✅ Paiement réussi
await initiateWavePayment({ ... });

// ❌ Paiement échoué (montant invalide)
await initiateWavePayment({ amount: -100, ... });

// 🚫 Paiement annulé (fermer Wave App)
// L'utilisateur annule le paiement
```

---

## 🐛 Débogage

### Logs Wave

```typescript
// Activer les logs détaillés
console.log('📥 Wave webhook reçu:', payload);
console.log('✅ Paiement confirmé:', transactionId);
console.log('❌ Paiement échoué:', error);
```

### Vérifier l'état d'une transaction

```typescript
import { checkWavePaymentStatus } from '@/lib/wavePayment';

const status = await checkWavePaymentStatus('wave_tx_123');
console.log('Statut:', status);
```

### Requêtes SQL de débogage

```sql
-- Voir toutes les transactions Wave
SELECT * FROM wave_transactions
ORDER BY created_at DESC;

-- Transactions en attente
SELECT * FROM wave_transactions
WHERE status = 'pending';

-- Commandes payées via Wave
SELECT o.*, wt.wave_transaction_id
FROM orders o
JOIN wave_transactions wt ON o.id = wt.order_id
WHERE wt.status = 'succeeded';
```

---

## 📈 Métriques

### Requêtes utiles

```sql
-- Revenus Wave du mois
SELECT
  SUM(amount) as total_revenue,
  COUNT(*) as transaction_count
FROM wave_transactions
WHERE status = 'succeeded'
  AND created_at >= DATE_TRUNC('month', NOW());

-- Taux de réussite
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM wave_transactions
GROUP BY status;

-- Temps moyen de paiement
SELECT
  AVG(EXTRACT(EPOCH FROM (paid_at - created_at))) as avg_seconds
FROM wave_transactions
WHERE status = 'succeeded';
```

---

## 🔒 Sécurité

### Bonnes pratiques

1. ✅ **Ne jamais exposer** `WAVE_SECRET_KEY` côté client
2. ✅ **Toujours vérifier** la signature des webhooks
3. ✅ **Valider** les montants côté serveur
4. ✅ **Logger** toutes les transactions
5. ✅ **Implémenter** une limite de tentatives

### Exemple de validation

```typescript
// Vérifier que le montant n'a pas été modifié
const order = await getOrder(orderId);
if (webhookPayload.data.amount !== order.total_amount) {
  throw new Error('Montant invalide');
}
```

---

## 🚨 Gestion des erreurs

### Erreurs courantes

| Code | Message | Solution |
|------|---------|----------|
| `invalid_phone` | Numéro invalide | Vérifier format +221... |
| `insufficient_funds` | Fonds insuffisants | Demander à l'utilisateur de recharger |
| `transaction_expired` | Session expirée | Réinitialiser le paiement |
| `invalid_signature` | Signature invalide | Vérifier WAVE_SECRET_KEY |

---

## 📞 Support

### Documentation officielle
- Wave API Docs: https://developer.wave.com/docs
- Wave Dashboard: https://dashboard.wave.com

### Contact
- Email: support@wave.com
- Discord: [Wave Developers](https://discord.gg/wave)

---

## 🎉 Prochaines étapes

1. ✅ **Tester** en sandbox
2. ✅ **Obtenir** les credentials production
3. ✅ **Configurer** le webhook
4. ✅ **Déployer** en production
5. ✅ **Monitorer** les transactions

---

**Date de création**: 4 décembre 2025
**Version**: 1.0.0
**Auteur**: SenePanda Team
