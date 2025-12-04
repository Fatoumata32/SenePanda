# 🎯 ÉTAPES EXACTES - Ne Ratez Rien !

## ⚠️ SUIVEZ CET ORDRE PRÉCIS

---

## Étape 1️⃣ : Diagnostic (30 secondes)

### Ouvrir Supabase

1. Aller sur https://supabase.com
2. Se connecter
3. Sélectionner votre projet **SenePanda**
4. Cliquer sur **SQL Editor** dans le menu de gauche
5. Cliquer sur **"New Query"**

### Copier/Coller ce Script

Ouvrir le fichier sur votre ordinateur :
```
supabase/DIAGNOSTIC_RAPIDE.sql
```

Copier **TOUT** le contenu et le coller dans l'éditeur SQL.

### Cliquer RUN

**Vous allez voir un de ces résultats :**

**Cas A :** Tables manquantes ❌
```
❌ user_subscriptions MANQUANTE
❌ subscription_plans MANQUANTE
```
→ **Passer à l'Étape 2**

**Cas B :** Tables existent ✅
```
✅ user_subscriptions existe
✅ subscription_plans existe
```
→ **Passer directement à l'Étape 3**

---

## Étape 2️⃣ : Créer les Tables (2 minutes)

**⚠️ NE FAIRE QUE SI Étape 1 a montré que les tables manquent**

### Dans Supabase SQL Editor

1. Cliquer sur **"New Query"** (nouvelle requête, PAS la même)
2. Ouvrir le fichier :
   ```
   supabase/SETUP_SUBSCRIPTIONS_SMART.sql
   ```
3. Copier **TOUT** le contenu (Ctrl+A, Ctrl+C)
4. Coller dans l'éditeur SQL (Ctrl+V)
5. Cliquer sur **RUN** (ou Ctrl+Enter)

### Attendre le Résultat

**Vous DEVEZ voir ce message :**
```
========================================
✅ SETUP TERMINÉ AVEC SUCCÈS
========================================

Plans d'abonnement: 3
Abonnements utilisateurs: 0
Policies de sécurité: 4
```

**Puis un tableau avec 3 plans :**
```
Starter  | 5000 FCFA   | 30 jours
Premium  | 15000 FCFA  | 30 jours
Business | 50000 FCFA  | 30 jours
```

### ✅ Vérification

**Si vous voyez ça, parfait ! Passez à l'Étape 3.**

**Si vous voyez une ERREUR :**
- Copiez le message d'erreur complet
- Envoyez-le moi
- N'essayez PAS l'Étape 3 avant de résoudre

---

## Étape 3️⃣ : Activer Realtime (1 minute)

**⚠️ NE FAIRE QUE SI l'Étape 2 s'est terminée avec succès**

### Dans Supabase SQL Editor

1. Cliquer sur **"New Query"** (NOUVELLE requête)
2. Ouvrir le fichier :
   ```
   supabase/ENABLE_REALTIME_SUBSCRIPTIONS.sql
   ```
3. Copier **TOUT** le contenu
4. Coller dans l'éditeur SQL
5. Cliquer **RUN**

### Résultat Attendu

```
========================================
✅ REALTIME CONFIGURÉ AVEC SUCCÈS
========================================

Configuration terminée :
  ✓ Publication Realtime : Activée
  ✓ Table user_subscriptions : Ajoutée
  ✓ Index de performance : Créé
```

### ✅ Si Vous Voyez Ça

**FÉLICITATIONS ! C'est terminé !**

Passez à l'Étape 4.

---

## Étape 4️⃣ : Redémarrer l'App (30 secondes)

### Dans Votre Terminal

```bash
# Arrêter l'app (si elle tourne)
Ctrl+C

# Relancer avec cache nettoyé
npx expo start --clear
```

### Attendre

Le serveur va démarrer et afficher :
```
Waiting on http://localhost:8081
```

### Scanner le QR Code

Avec l'app **Expo Go** sur votre téléphone.

---

## Étape 5️⃣ : Tester (1 minute)

### Dans l'Application

1. Se connecter
2. Aller dans "Ma Boutique"
3. Vous devriez voir un des badges :
   - 🟠 Orange si vous avez un abonnement en attente
   - 🟢 Vert si vous avez un abonnement actif
   - Rien si pas d'abonnement

### Test de Synchronisation (Optionnel)

**Dans Supabase SQL Editor :**
```sql
-- 1. Trouver votre user_id
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- 2. Créer un abonnement de test (remplacer YOUR_USER_ID et PLAN_ID)
INSERT INTO user_subscriptions (user_id, plan_id, status)
SELECT 'YOUR_USER_ID', id, 'pending'
FROM subscription_plans
WHERE name = 'Premium'
LIMIT 1;

-- 3. Dans l'app, aller dans "Ma Boutique"
-- Vous devriez voir le badge orange

-- 4. Valider l'abonnement
UPDATE user_subscriptions
SET is_approved = true, status = 'active', starts_at = NOW()
WHERE user_id = 'YOUR_USER_ID'
AND status = 'pending';

-- 5. Observer l'app (< 2 secondes)
-- Alert devrait s'afficher + badge devient vert
-- SANS rafraîchir l'app !
```

---

## 🚨 Erreurs Fréquentes

### Erreur : "relation user_subscriptions does not exist"

**Cause :** Vous avez sauté l'Étape 2 ou elle a échoué

**Solution :**
1. Retourner à l'Étape 1 (Diagnostic)
2. Vérifier que les tables existent
3. Si elles manquent, exécuter l'Étape 2

---

### Erreur : "policy already exists"

**Cause :** Normal, vous avez déjà exécuté ce script avant

**Est-ce grave ?** NON

**Action :** Continuez normalement, le script gère ça automatiquement

---

### Erreur : "permission denied"

**Cause :** Vous n'êtes pas propriétaire du projet Supabase

**Solution :**
1. Vérifier que vous êtes sur le bon projet
2. Vérifier que c'est VOTRE projet (pas celui de quelqu'un d'autre)

---

## ✅ Checklist Finale

- [ ] Étape 1 : Diagnostic exécuté
- [ ] Étape 2 : Tables créées (message "SETUP TERMINÉ")
- [ ] Étape 3 : Realtime activé (message "REALTIME CONFIGURÉ")
- [ ] Étape 4 : App redémarrée
- [ ] Étape 5 : Badge visible dans "Ma Boutique"

**Si toutes les cases sont cochées, c'est PARFAIT ! 🎉**

---

## 🆘 Besoin d'Aide ?

**Si vous êtes bloqué à une étape :**

1. Notez le NUMÉRO de l'étape (1, 2, 3, 4 ou 5)
2. Copiez le message d'erreur COMPLET
3. Envoyez-moi :
   - Numéro de l'étape
   - Message d'erreur
   - Ce que vous avez fait exactement

**Je vous aiderai à résoudre !**

---

**Version :** 1.0.0
**Temps total :** 5 minutes
**Difficulté :** ⭐ Facile (avec ce guide)

🐼 **SenePanda - Étapes Exactes**
