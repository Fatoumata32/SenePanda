# ⚡ CORRECTION RAPIDE DES ABONNEMENTS

**🎯 Action immédiate - 2 minutes**

---

## 🚨 Problème Identifié

```
❌ Erreur: column "subscription_starts_at" does not exist
❌ Fonction request_subscription incomplète
❌ Colonnes manquantes dans la table profiles
```

---

## ✅ Solution en 3 Étapes

### Étape 1: Ouvrir Supabase Dashboard
1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche

### Étape 2: Copier-Coller le Script
1. Cliquez sur **New Query**
2. Ouvrez le fichier `supabase/FIX_SUBSCRIPTION_ERRORS.sql`
3. Copiez TOUT le contenu
4. Collez dans l'éditeur SQL de Supabase

### Étape 3: Exécuter
1. Cliquez sur **Run** (ou Ctrl+Enter)
2. Attendez 5-10 secondes
3. Vérifiez les messages de succès

---

## ✅ Vérification Rapide

Après l'exécution, vous devez voir :

```
✅ Colonne subscription_starts_at ajoutée
✅ Colonne subscription_status ajoutée
✅ Colonne subscription_requested_plan ajoutée
✅ Colonne subscription_requested_at ajoutée
✅ Colonne subscription_billing_period ajoutée

════════════════════════════════════════════
✅ CORRECTION DES ABONNEMENTS TERMINÉE
════════════════════════════════════════════
```

---

## 🧪 Test Immédiat

### Dans l'App Mobile:
1. Ouvrir l'app
2. Aller dans **Plans d'Abonnement**
3. Choisir un plan (Pro par exemple)
4. Cliquer sur **Envoyer la demande**
5. ✅ Devrait afficher "Demande envoyée !"

### Dans Supabase:
Exécutez cette requête pour voir la demande :
```sql
SELECT * FROM pending_subscription_requests;
```

---

## 🎉 C'est Tout !

Une fois le script exécuté, le système d'abonnement est **100% fonctionnel**.

---

## 📋 Problèmes Corrigés

✅ Colonnes manquantes dans `profiles`
✅ Fonction `request_subscription` créée
✅ Fonction `approve_subscription_request` créée
✅ Fonction `reject_subscription_request` créée
✅ Table `subscription_requests` créée
✅ Policies RLS configurées
✅ Indices de performance ajoutés
✅ Vue admin créée
✅ Données initialisées

---

## 📞 En Cas de Problème

Si vous voyez des erreurs :
1. Vérifiez que vous êtes connecté à Supabase
2. Vérifiez que vous avez les droits admin
3. Relancez le script (il est idempotent, peut être exécuté plusieurs fois)

---

**Pour plus de détails, consultez `GUIDE_FIX_ABONNEMENTS.md`**
