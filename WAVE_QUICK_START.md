# 🚀 Wave Payment - Démarrage Rapide

## ⚡ Installation en 5 étapes

### 1️⃣ Appliquer la migration SQL

**Dashboard Supabase** → **SQL Editor** → Exécuter:

```sql
-- Copier le contenu de:
supabase/migrations/add_wave_payment_system.sql
```

✅ Crée la table `wave_transactions` et toutes les fonctions nécessaires

---

### 2️⃣ Configurer les variables d'environnement

Créer/modifier `.env`:

```bash
EXPO_PUBLIC_WAVE_API_URL=https://api.wave.com/v1
EXPO_PUBLIC_WAVE_API_KEY=votre_cle_publique
EXPO_PUBLIC_WAVE_SECRET_KEY=votre_cle_secrete
EXPO_PUBLIC_APP_URL=https://votre-app.com
```

📌 **Obtenir les clés**: https://dashboard.wave.com/settings/api

---

### 3️⃣ Déployer le webhook Supabase

```bash
# Se connecter
npx supabase login

# Déployer la fonction
npx supabase functions deploy wave-webhook

# Ajouter le secret
npx supabase secrets set WAVE_SECRET_KEY=votre_cle_secrete
```

---

### 4️⃣ Configurer le webhook sur Wave

**Wave Dashboard** → **Webhooks** → **Add Endpoint**

- **URL**: `https://VOTRE_PROJET.supabase.co/functions/v1/wave-webhook`
- **Événements**:
  - ✅ payment.succeeded
  - ✅ payment.failed
  - ✅ payment.cancelled

---

### 5️⃣ Tester !

L'intégration est déjà active dans l'app:

1. Aller sur **Panier**
2. Cliquer **Commander**
3. Sélectionner **Wave Mobile Money**
4. Remplir les informations
5. Confirmer la commande

Le paiement Wave s'ouvrira automatiquement ! 🎉

---

## 🧪 Mode Test

Wave fournit des credentials de test:

```
Numéro: +221 70 000 0001
PIN: 1234
```

Tous les paiements en mode test ne sont PAS facturés.

---

## ✅ Vérification

### Test 1: Créer une transaction

```sql
-- Voir si la table existe
SELECT COUNT(*) FROM wave_transactions;
-- Résultat attendu: 0 (table vide au début)
```

### Test 2: Vérifier les credentials

```typescript
import { validateWaveCredentials } from '@/lib/wavePayment';

console.log(validateWaveCredentials());
// true si configuré correctement
```

### Test 3: Webhook opérationnel

Dans **Supabase** → **Functions** → **wave-webhook** → **Logs**

Vous devriez voir:
```
✅ Webhook Wave traité avec succès
```

---

## 🐛 Problèmes courants

### ❌ "Missing signature"

➡️ Vérifier que le webhook est bien configuré sur Wave Dashboard

### ❌ "Invalid credentials"

➡️ Vérifier les variables d'environnement (.env)

### ❌ "Table wave_transactions does not exist"

➡️ Exécuter la migration SQL

---

## 📊 Monitorer les paiements

```sql
-- Tous les paiements Wave
SELECT
  wave_transaction_id,
  amount,
  status,
  customer_name,
  created_at
FROM wave_transactions
ORDER BY created_at DESC
LIMIT 10;

-- Revenus du jour
SELECT SUM(amount) as total_today
FROM wave_transactions
WHERE status = 'succeeded'
  AND DATE(created_at) = CURRENT_DATE;
```

---

## 📚 Documentation complète

Pour plus de détails, consultez:
- **INTEGRATION_WAVE_PAYMENT.md** - Guide complet
- **lib/wavePayment.ts** - Code source commenté
- **supabase/functions/wave-webhook/index.ts** - Webhook handler

---

## 🎯 Prochaines étapes

1. ✅ Tester avec les credentials de test
2. ✅ Obtenir les credentials production de Wave
3. ✅ Passer en mode production
4. ✅ Monitorer les transactions

**Bonne vente ! 💰**
