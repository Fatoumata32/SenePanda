# 🚀 INSTALLER MAINTENANT - 3 Scripts

## ⚡ Scripts Corrigés (Version Finale)

J'ai corrigé l'erreur `ON CONFLICT`. Utilisez ces scripts dans l'ordre :

---

## Script A : Corriger subscription_plans

### Fichier à Utiliser
```
supabase/FIX_SUBSCRIPTION_PLANS_V2.sql
```

### Actions
1. Supabase Dashboard → SQL Editor → New Query
2. Copier TOUT le contenu de `FIX_SUBSCRIPTION_PLANS_V2.sql`
3. Coller
4. Cliquer **RUN**

### Résultat Attendu
```
✅ Colonne price ajoutée (ou déjà existe)
✅ Colonne currency ajoutée (ou déjà existe)
✅ Plan Starter créé/mis à jour
✅ Plan Premium créé/mis à jour
✅ Plan Business créé/mis à jour

Tableau des plans :
Starter  | 5000 FCFA  | 30 jours | 10 | 1  | true
Premium  | 15000 FCFA | 30 jours | ∞  | 3  | true
Business | 50000 FCFA | 30 jours | ∞  | 10 | true

✅ SUBSCRIPTION_PLANS CORRIGÉ
```

✅ **Si vous voyez ça, passez au Script B**

---

## Script B : Créer user_subscriptions

### Fichier à Utiliser
```
supabase/FIX_USER_SUBSCRIPTIONS.sql
```

### Actions
1. Supabase → SQL Editor → **New Query** (nouvelle requête)
2. Copier TOUT le contenu de `FIX_USER_SUBSCRIPTIONS.sql`
3. Coller
4. Cliquer **RUN**

### Résultat Attendu
```
✅ Colonne is_approved ajoutée
✅ Colonne approved_by ajoutée
✅ Policy SELECT créée
✅ Policy INSERT créée
✅ Policy UPDATE créée

✅ USER_SUBSCRIPTIONS PRÊT
```

✅ **Si vous voyez ça, passez au Script C**

---

## Script C : Activer Realtime

### Fichier à Utiliser
```
supabase/ENABLE_REALTIME_SUBSCRIPTIONS.sql
```

### Actions
1. Supabase → SQL Editor → **New Query** (nouvelle requête)
2. Copier TOUT le contenu de `ENABLE_REALTIME_SUBSCRIPTIONS.sql`
3. Coller
4. Cliquer **RUN**

### Résultat Attendu
```
✅ Publication supabase_realtime créée
✅ Realtime activé sur user_subscriptions

✅ REALTIME CONFIGURÉ AVEC SUCCÈS
```

✅ **Si vous voyez ça, c'est terminé !**

---

## Dernière Étape : Redémarrer l'App

```bash
npx expo start --clear
```

---

## ✅ Vérification Finale

### Test Rapide

**Dans Supabase SQL Editor :**
```sql
-- Vérifier les plans
SELECT name, price FROM subscription_plans;

-- Devrait afficher :
-- Starter  | 5000
-- Premium  | 15000
-- Business | 50000
```

**Si vous voyez ces 3 plans avec ces prix, PARFAIT ! 🎉**

---

## 🎯 Résumé

| Script | Fichier | Status |
|--------|---------|--------|
| A | FIX_SUBSCRIPTION_PLANS_V2.sql | ⬜ À faire |
| B | FIX_USER_SUBSCRIPTIONS.sql | ⬜ À faire |
| C | ENABLE_REALTIME_SUBSCRIPTIONS.sql | ⬜ À faire |

**Cochez les cases au fur et à mesure !**

---

## 🆘 Erreur ?

**Envoyez-moi :**
- Lettre du script (A, B ou C)
- Message d'erreur complet

**Je corrige immédiatement !**

---

**Temps :** 5 minutes
**Résultat :** Sync auto en < 1 sec

🐼 **SenePanda - Installation Finale**
