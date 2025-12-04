# 🧪 Test - Synchronisation Temps Réel des Abonnements

## 🎯 Objectif du Test

Vérifier que la validation d'un abonnement par l'admin se synchronise **automatiquement** dans l'application du vendeur **sans rafraîchir**.

---

## 📋 Prérequis

### 1. Base de données configurée
- ✅ Table `user_subscriptions` existe
- ✅ Realtime activé sur la table
- ✅ RLS policies en place

### 2. Application en cours d'exécution
```bash
npx expo start
```

### 3. Compte vendeur de test
- Email/téléphone pour se connecter
- Abonnement en statut `pending`

---

## 🧪 Test 1 : Validation Automatique

### Étape 1 : Préparer l'abonnement en attente

**Dans l'application :**
1. Se connecter en tant que vendeur
2. Aller dans "Plans d'abonnement"
3. Choisir un plan (ex: Premium)
4. Soumettre avec une preuve de paiement (image quelconque)
5. **Résultat attendu :**
   - ✅ Message "Demande envoyée"
   - ✅ Redirection vers Ma Boutique
   - ✅ Badge orange "⏳ Abonnement en Attente" visible

### Étape 2 : Garder l'app ouverte

**IMPORTANT :** Ne pas fermer l'application, la laisser sur la page "Ma Boutique"

### Étape 3 : Valider en base de données

**Ouvrir Supabase Dashboard :**
1. Aller sur https://supabase.com
2. Sélectionner votre projet SenePanda
3. SQL Editor → New Query

**Exécuter ce SQL :**

```sql
-- Trouver l'abonnement en attente
SELECT id, user_id, status, is_approved, plan_id
FROM user_subscriptions
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 1;

-- Noter l'ID de l'abonnement
```

**Puis valider l'abonnement :**

```sql
-- Remplacer 'ABONNEMENT_ID' par l'ID trouvé ci-dessus
UPDATE user_subscriptions
SET
  is_approved = true,
  status = 'active',
  starts_at = NOW(),
  ends_at = NOW() + INTERVAL '30 days'
WHERE id = 'ABONNEMENT_ID';
```

### Étape 4 : Observer l'application

**Résultat attendu (< 2 secondes) :**

1. ✅ **Alert s'affiche automatiquement :**
   ```
   🎉 Abonnement Validé !

   Votre abonnement "Premium" a été validé par l'administrateur.
   Vous pouvez maintenant profiter de tous les avantages !

   [Super !]
   ```

2. ✅ **Badge devient vert :**
   - Texte : "✅ Abonnement Actif"
   - Couleur : Gradient vert
   - Icône : Award (trophée)
   - Nom du plan affiché

3. ✅ **AUCUN refresh manuel nécessaire**

---

## 🧪 Test 2 : Refus Automatique

### Étape 1 : Trouver un abonnement en attente

```sql
SELECT id FROM user_subscriptions
WHERE status = 'pending' LIMIT 1;
```

### Étape 2 : Refuser l'abonnement

```sql
UPDATE user_subscriptions
SET is_approved = false
WHERE id = 'ABONNEMENT_ID';
```

### Étape 3 : Vérifier

**Résultat attendu :**
- ✅ Badge devient rouge
- ✅ Texte : "❌ Abonnement Refusé"
- ✅ Alert s'affiche

---

## 🧪 Test 3 : Changement de Statut

### Étape 1 : Passer un abonnement en expired

```sql
UPDATE user_subscriptions
SET status = 'expired'
WHERE id = 'ABONNEMENT_ID';
```

### Étape 2 : Vérifier

**Résultat attendu :**
- ✅ Badge disparaît ou change de couleur
- ✅ Interface se met à jour automatiquement

---

## 🧪 Test 4 : Multiple Utilisateurs

### Scénario

Tester que la synchronisation ne "fuit" pas vers d'autres utilisateurs.

### Étape 1 : Deux appareils/émulateurs

1. **Appareil A :** Connecté en tant que Vendeur A
2. **Appareil B :** Connecté en tant que Vendeur B

### Étape 2 : Valider abonnement Vendeur A

```sql
UPDATE user_subscriptions
SET is_approved = true
WHERE user_id = 'VENDEUR_A_USER_ID';
```

### Étape 3 : Vérifier

**Résultat attendu :**
- ✅ **Appareil A :** Alert et badge mis à jour
- ✅ **Appareil B :** AUCUN changement (ne doit pas recevoir la notification)

---

## 🧪 Test 5 : Reconnexion

### Scénario

Vérifier que le statut correct s'affiche après reconnexion.

### Étapes

1. Déconnecter l'utilisateur
2. Valider son abonnement en base de données
3. Reconnecter l'utilisateur

**Résultat attendu :**
- ✅ Badge vert "✅ Abonnement Actif" s'affiche immédiatement
- ✅ Pas besoin d'attendre une synchronisation

---

## 📊 Checklist de Test

### Fonctionnalité de Base
- [ ] Badge s'affiche quand un abonnement existe
- [ ] Couleur orange pour abonnement en attente
- [ ] Couleur verte pour abonnement actif
- [ ] Couleur rouge pour abonnement refusé
- [ ] Nom du plan affiché correctement

### Synchronisation Temps Réel
- [ ] Alert s'affiche automatiquement lors de la validation
- [ ] Badge change de couleur automatiquement
- [ ] Aucun refresh manuel nécessaire
- [ ] Délai < 2 secondes
- [ ] Fonctionne même si l'app est en arrière-plan (revenir au premier plan)

### Sécurité
- [ ] Un utilisateur ne reçoit QUE ses propres notifications
- [ ] Pas de "fuite" de données entre utilisateurs
- [ ] RLS fonctionne correctement

### Fiabilité
- [ ] Fonctionne après reconnexion
- [ ] Fonctionne après redémarrage de l'app
- [ ] Pas de crashes ou d'erreurs console

---

## 🔍 Logs de Débogage

### Dans la console React Native

Vous devriez voir ces logs :

```
Realtime subscription status: connected
Subscription change detected: { eventType: 'UPDATE', new: {...}, old: {...} }
```

### En cas de problème

**Vérifier que Realtime est activé :**
```sql
-- Dans Supabase SQL Editor
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- user_subscriptions devrait apparaître dans les résultats
```

**Si absent, activer Realtime :**
1. Database → Replication
2. Cocher `user_subscriptions`
3. Save

---

## 🐛 Problèmes Courants

### Problème 1 : Alert ne s'affiche pas

**Causes possibles :**
- App pas au premier plan
- Realtime désactivé
- Channel pas souscrit

**Solution :**
```bash
# Dans la console, chercher
"Realtime subscription status: connected"

# Si absent, vérifier la config Supabase
```

### Problème 2 : Badge ne change pas de couleur

**Cause :** État local non mis à jour

**Solution :**
Vérifier que `setSubscription()` est appelé dans le hook :
```typescript
console.log('Subscription updated:', newSubscription);
setSubscription(newSubscription);
```

### Problème 3 : Délai trop long (> 5 secondes)

**Causes :**
- Connexion internet lente
- Trop de listeners Realtime
- Problème serveur Supabase

**Solution :**
- Vérifier la connexion
- Limiter le nombre de channels actifs
- Contacter support Supabase si persistant

---

## 📸 Captures d'Écran Attendues

### État 1 : En Attente
```
┌──────────────────────────────────────────┐
│  ⏳ Abonnement en Attente               │
│  Plan Premium - En cours de validation   │
│                                   ●●●    │
└──────────────────────────────────────────┘
    ↑ Orange gradient + spinner
```

### État 2 : Actif (après validation)
```
┌──────────────────────────────────────────┐
│  ✅ Abonnement Actif                    │
│  Plan Premium                            │
│  🏆                                       │
└──────────────────────────────────────────┘
    ↑ Vert gradient + icône Award
```

### État 3 : Refusé
```
┌──────────────────────────────────────────┐
│  ❌ Abonnement Refusé                   │
│  Plan Premium                            │
│  ✖                                       │
└──────────────────────────────────────────┘
    ↑ Rouge gradient + icône X
```

---

## ✅ Critères de Réussite

Pour considérer le test **RÉUSSI**, tous ces critères doivent être validés :

- ✅ Badge s'affiche correctement pour tous les statuts
- ✅ Alert automatique lors de validation (< 2 sec)
- ✅ Changement de couleur automatique (< 2 sec)
- ✅ Aucun refresh manuel nécessaire
- ✅ Sécurité : isolation entre utilisateurs
- ✅ Aucune erreur dans la console
- ✅ Fonctionne après reconnexion

---

## 🚀 Étapes Suivantes

Après validation de ces tests :

1. ✅ Tester avec de vrais utilisateurs en production
2. ✅ Implémenter les push notifications (quand app fermée)
3. ✅ Ajouter analytics pour tracker les validations
4. ✅ Logger l'historique des changements de statut

---

## 📝 Rapport de Test

**Date du test :** _______________

**Testeur :** _______________

**Résultats :**

| Test | Status | Notes |
|------|--------|-------|
| Test 1 : Validation automatique | ☐ Pass ☐ Fail | |
| Test 2 : Refus automatique | ☐ Pass ☐ Fail | |
| Test 3 : Changement de statut | ☐ Pass ☐ Fail | |
| Test 4 : Multiple utilisateurs | ☐ Pass ☐ Fail | |
| Test 5 : Reconnexion | ☐ Pass ☐ Fail | |

**Commentaires :**
```
________________________________________________
________________________________________________
________________________________________________
```

**Verdict :** ☐ VALIDÉ ☐ À CORRIGER

---

**Version :** 1.0.0
**Date :** Novembre 2025

🐼 **SenePanda - Tests de Synchronisation**
