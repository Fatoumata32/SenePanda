# ⚡ INSTALLATION FINALE V3 - AVEC plan_type

## 🎯 Script Global Corrigé (Inclut plan_type)

J'ai créé **UN SEUL SCRIPT V3** qui corrige l'erreur `plan_type` et fait TOUT automatiquement :
- ✅ Ajoute la colonne plan_type si manquante
- ✅ Supprime la contrainte NOT NULL sur max_products
- ✅ Ajoute toutes les colonnes manquantes
- ✅ Met à jour les plans existants (Starter, Premium, Business) AVEC plan_type
- ✅ Crée user_subscriptions avec toutes les colonnes
- ✅ Configure les policies RLS
- ✅ Active Realtime
- ✅ Crée tous les index

---

## 🚀 Installation (2 minutes)

### Étape 1 : Exécuter le Script Global V3

1. **Ouvrir Supabase Dashboard**
   - https://supabase.com
   - Votre projet SenePanda
   - **SQL Editor**
   - **New Query**

2. **Copier/Coller le Script**
   - Ouvrir le fichier : `supabase/SETUP_GLOBAL_FINAL_V3.sql`
   - Sélectionner TOUT (Ctrl+A)
   - Copier (Ctrl+C)
   - Coller dans Supabase (Ctrl+V)

3. **Cliquer RUN**

### Résultat Attendu

```
========================================
🚀 SETUP GLOBAL V3 - SYNC AUTO
========================================

✅ Contrainte NOT NULL sur max_products supprimée
⚠️  Colonne price existe déjà
⚠️  Colonne currency existe déjà
✅ Colonne plan_type ajoutée (ou existe déjà)
✅ Plan Starter mis à jour
✅ Plan Premium mis à jour (produits illimités)
✅ Plan Business mis à jour (produits illimités)
✅ Table user_subscriptions prête
✅ Index créés
✅ Policies RLS configurées
✅ user_subscriptions ajouté à Realtime

========================================
✅ SETUP TERMINÉ AVEC SUCCÈS !
========================================

Configuration complète :
  ✓ subscription_plans : 3 plan(s)
  ✓ user_subscriptions : 0 abonnement(s)
  ✓ Realtime : Activé
  ✓ RLS : Configuré
  ✓ Index : Créés
  ✓ plan_type : Inclus

Prochaine étape :
  → Redémarrer l'app : npx expo start --clear
  → Tester la synchronisation

========================================

Tableau des plans :
Starter  | basic    | 5000 FCFA  | 30 jours | 10       | 1  | true
Premium  | premium  | 15000 FCFA | 30 jours | Illimité | 3  | true
Business | business | 50000 FCFA | 30 jours | Illimité | 10 | true
```

---

### Étape 2 : Redémarrer l'App

```bash
npx expo start --clear
```

---

## ✅ C'est Terminé !

**Un seul script V3, 2 minutes, synchronisation automatique activée !**

---

## 🧪 Test de Validation

### Test 1 : Vérifier les Plans avec plan_type

```sql
SELECT name, plan_type, price, max_products FROM subscription_plans;
```

**Résultat attendu :**
```
Starter  | basic    | 5000  | 10
Premium  | premium  | 15000 | NULL  (NULL = illimité)
Business | business | 50000 | NULL
```

### Test 2 : Vérifier Realtime

```sql
SELECT tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'user_subscriptions';
```

**Résultat attendu :**
```
user_subscriptions
```

✅ **Si vous voyez ça, Realtime est activé !**

---

## 🎯 Test Final : Synchronisation

### Dans l'App

1. Se connecter
2. Plans d'abonnement → Choisir Premium
3. Upload preuve de paiement
4. Soumettre
5. Aller dans "Ma Boutique"
6. **Badge orange "⏳ En attente" visible**

### Dans Supabase

```sql
-- Trouver l'abonnement
SELECT id, user_id, status FROM user_subscriptions
ORDER BY created_at DESC LIMIT 1;

-- Valider (remplacer ID)
UPDATE user_subscriptions
SET is_approved = true, status = 'active', starts_at = NOW()
WHERE id = 'VOTRE_ID';
```

### Observer l'App (< 2 sec)

✅ Alert : "🎉 Abonnement Validé !"
✅ Badge devient vert : "✅ Abonnement Actif"
✅ **SANS rafraîchir !**

---

## 🚨 En Cas d'Erreur

### Erreur : "permission denied"

**Solution :** Vérifiez que vous êtes propriétaire du projet Supabase

### Erreur : "relation already exists"

**Solution :** Normal, le script gère ça automatiquement, continuez

### Erreur : "syntax error"

**Solution :** Vous n'avez pas copié TOUT le script
- Ouvrir le fichier .sql
- Ctrl+A (tout sélectionner)
- Ctrl+C, Ctrl+V dans Supabase

### Erreur : "column plan_type already exists"

**Solution :** Parfait ! Le script détectera la colonne et continuera normalement

---

## 🔧 Qu'est-ce qui a été corrigé dans V3 ?

### Nouveautés V3 vs V2

| V2 (Ancien) | V3 (Nouveau) |
|-------------|--------------|
| ❌ Pas de plan_type | ✅ plan_type inclus avec valeurs par défaut |
| ❌ Erreur "null value in plan_type" | ✅ Utilise COALESCE pour valeurs par défaut |
| ❌ Script échouait | ✅ Script gère tous les cas |

### Valeurs plan_type par défaut

- **Starter** → `basic`
- **Premium** → `premium`
- **Business** → `business`

---

## ✅ Checklist Finale

- [ ] Script `SETUP_GLOBAL_FINAL_V3.sql` exécuté
- [ ] Message "✅ SETUP TERMINÉ AVEC SUCCÈS" affiché
- [ ] Message "✓ plan_type : Inclus" visible
- [ ] 3 plans visibles dans le tableau final avec leurs plan_type
- [ ] App redémarrée avec `--clear`
- [ ] Badge visible dans "Ma Boutique"
- [ ] Test de synchronisation effectué

**Si toutes les cases sont cochées, BRAVO ! 🎉**

---

## 📋 Différence avec les versions précédentes

### SETUP_COMPLET_FINAL.sql (V1)
❌ Ne gérait pas `plan_type`
❌ Échouait avec erreur "null value in plan_type"

### SETUP_GLOBAL_FINAL_V3.sql (V3) ✅
✅ Ajoute `plan_type` si manquant
✅ Utilise COALESCE pour valeurs par défaut
✅ Met à jour les plans existants avec plan_type correct
✅ Gère tous les cas (colonne existe / n'existe pas)

---

**Fichier :** `supabase/SETUP_GLOBAL_FINAL_V3.sql`
**Temps :** 2 minutes
**Résultat :** Sync auto en < 1 sec avec plan_type inclus

🐼 **SenePanda - Script Global Final V3**

*"Un script pour les gouverner tous... avec plan_type !"*
