# 🔍 Guide de Débogage - Paiement Abonnement

## ✅ Corrections Apportées

### 1. **Logs de débogage complets**
Des logs détaillés ont été ajoutés à chaque étape du processus :

```
🔓 Ouverture du modal de paiement
💳 Début du traitement du paiement
⏳ Simulation du paiement...
📅 Date d'expiration calculée
💾 Mise à jour du profil...
✅ Profil mis à jour
💰 Montant calculé
📊 Action déterminée (upgrade/downgrade/renewal)
📝 Enregistrement dans l'historique
🎉 Paiement réussi !
🔄 Rechargement des données
```

### 2. **Validation améliorée**
- ✅ Validation du numéro de téléphone (min 9 chiffres) pour Mobile Money
- ✅ Bouton désactivé tant que les données requises ne sont pas saisies
- ✅ Messages d'erreur explicites

### 3. **Gestion d'erreurs renforcée**
- ✅ Affichage des erreurs avec Alert
- ✅ Détails d'erreur complets dans la console
- ✅ Retour à l'étape 'error' en cas d'échec

### 4. **Historique des actions**
L'action est maintenant correctement déterminée :
- `upgrade` : Passer à un plan supérieur
- `downgrade` : Passer à un plan inférieur
- `renewal` : Renouveler le même plan

---

## 🧪 Comment Tester

### Étape 1 : Accéder aux abonnements
1. Lancez l'app : `npx expo start`
2. Allez sur `/seller/subscription-plans`

### Étape 2 : Choisir un plan
1. Cliquez sur n'importe quel bouton "Choisir ce plan"
2. **Vérifiez dans la console :** `🔓 Ouverture du modal de paiement`

### Étape 3 : Sélectionner un mode de paiement
1. Choisissez un mode de paiement (ex: Orange Money)
2. Cliquez sur "Continuer"

### Étape 4 : Entrer les détails
**Pour Mobile Money (Orange Money, Wave, Free Money) :**
- Entrez un numéro avec au moins 9 chiffres (ex: 771234567)
- Le bouton "Continuer" sera grisé tant que < 9 chiffres
- Cliquez sur "Continuer" quand le bouton est actif

**Pour Carte Bancaire :**
- Cliquez directement sur "Continuer" (aucune saisie requise)

**Pour Virement Bancaire :**
- Notez les informations bancaires
- Cliquez sur "Continuer"

### Étape 5 : Confirmer
1. Vérifiez les détails affichés
2. Cliquez sur "Confirmer et Payer"
3. **Vérifiez dans la console :** `💳 Début du traitement du paiement`

### Étape 6 : Attendre le traitement
1. L'écran "Traitement en cours" s'affiche (2,5 secondes)
2. **Vérifiez dans la console :** Tous les logs de traitement

### Étape 7 : Succès
1. L'écran "Paiement réussi !" s'affiche
2. Les données se rechargent automatiquement
3. Le modal se ferme après 2 secondes
4. Votre plan est mis à jour !

---

## 🐛 Problèmes Possibles et Solutions

### ❌ "Rien ne se passe" après avoir cliqué sur un plan

**Cause possible :** Utilisateur non connecté

**Solution :**
- Vérifiez la console : `❌ Utilisateur non connecté`
- Connectez-vous d'abord avec simple-auth

---

### ❌ Bouton "Continuer" désactivé à l'étape "details"

**Cause :** Mobile Money sélectionné mais numéro < 9 chiffres

**Solution :**
- Entrez un numéro valide (ex: 771234567)
- Le bouton s'activera automatiquement

---

### ❌ Erreur "Données de paiement incomplètes"

**Cause possible :** selectedPlan ou selectedPaymentMethod est null

**Solution :**
- Vérifiez la console : `❌ Données manquantes`
- Fermez et rouvrez le modal
- Recommencez le processus

---

### ❌ Erreur lors de la mise à jour du profil

**Cause possible :** Problème de base de données

**Vérifications :**
1. Vérifiez que la table `profiles` existe
2. Vérifiez les colonnes : `subscription_plan`, `is_premium`, `subscription_expires_at`
3. Vérifiez les RLS policies

**Console :**
```
❌ Erreur mise à jour profil: {details...}
```

---

### ❌ Erreur lors de l'enregistrement de l'historique

**Note :** Cette erreur n'est pas bloquante

**Vérifications :**
1. Vérifiez que la table `subscription_history` existe
2. Vérifiez les colonnes selon `supabase/COMPLETE_DATABASE_SETUP.sql`

**Console :**
```
⚠️ Erreur historique (non bloquant): {details...}
```

---

## 📊 Logs Console Attendus (Flux Complet)

```
📋 Tentative d'abonnement: { planChoisi: "Pro", planActuel: "free" }
🔓 Ouverture du modal de paiement pour: Pro
✅ Passage à l'étape de confirmation
💳 Début du traitement du paiement: { plan: "Pro", method: "orange_money", period: "monthly" }
✅ Numéro validé: 771234567
⏳ Simulation du paiement...
📅 Date d'expiration calculée: 2025-12-30T...
💾 Mise à jour du profil...
✅ Profil mis à jour: [{ id: "...", subscription_plan: "pro", ... }]
💰 Montant: 25000 XOF
📊 Action: upgrade (free -> pro)
📝 Enregistrement dans l'historique...
✅ Historique enregistré: [{ id: "...", action: "upgrade", ... }]
🎉 Paiement réussi !
🔄 Rechargement des données...
```

---

## 🔧 Vérification de la Base de Données

### Tables requises :
1. ✅ `profiles` - avec colonnes `subscription_plan`, `is_premium`, `subscription_expires_at`
2. ✅ `subscription_plans` - avec les plans disponibles
3. ✅ `subscription_history` - pour l'historique des paiements

### Vérifier dans Supabase Dashboard :

```sql
-- Vérifier votre profil
SELECT id, subscription_plan, is_premium, subscription_expires_at
FROM profiles
WHERE id = auth.uid();

-- Vérifier les plans disponibles
SELECT * FROM subscription_plans WHERE is_active = true;

-- Vérifier l'historique (après test)
SELECT * FROM subscription_history
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

---

## ✅ Test Réussi Si :

1. ✅ Le modal s'ouvre correctement
2. ✅ Les modes de paiement s'affichent
3. ✅ La validation du numéro fonctionne (Mobile Money)
4. ✅ L'écran de confirmation affiche les bonnes infos
5. ✅ L'écran "Traitement en cours" apparaît
6. ✅ L'écran "Paiement réussi !" s'affiche
7. ✅ Le plan est mis à jour dans votre profil
8. ✅ L'historique est enregistré
9. ✅ La page se rafraîchit avec le nouveau plan

---

## 📞 Si le problème persiste

Partagez les logs de la console (tout ce qui commence par 💳 📋 🔓 etc.) pour identifier le problème exact.
