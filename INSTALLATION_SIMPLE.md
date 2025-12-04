# 🚀 Installation Simple - Synchronisation Automatique

## ⚡ 2 Scripts à Exécuter (5 minutes)

---

## Script 1️⃣ : Setup Abonnements (OBLIGATOIRE)

### Dans Supabase Dashboard → SQL Editor

1. **Créer une nouvelle requête**
2. **Copier/coller** le contenu de :
   ```
   supabase/SETUP_SUBSCRIPTIONS_SMART.sql
   ```
3. **Cliquer RUN**

### ✅ Résultat Attendu

```
========================================
✅ SETUP TERMINÉ AVEC SUCCÈS
========================================

Plans d'abonnement: 3
Abonnements utilisateurs: 0
Policies de sécurité: 4

Tables créées:
  ✓ subscription_plans
  ✓ user_subscriptions

Fonctions créées:
  ✓ update_updated_at_column()
  ✓ has_active_subscription(user_id)
  ✓ get_current_subscription(user_id)

Prochaine étape:
  → Exécuter ENABLE_REALTIME_SUBSCRIPTIONS.sql
========================================
```

**Puis vous verrez les 3 plans :**

| name     | prix        | duree    | max_products | boutiques | actif |
|----------|-------------|----------|--------------|-----------|-------|
| Starter  | 5000 FCFA   | 30 jours | 10           | 1         | true  |
| Premium  | 15000 FCFA  | 30 jours | NULL         | 3         | true  |
| Business | 50000 FCFA  | 30 jours | NULL         | 10        | true  |

---

## Script 2️⃣ : Activer Realtime (OBLIGATOIRE)

### Dans Supabase Dashboard → SQL Editor

1. **Créer une NOUVELLE requête** (pas la même que Script 1)
2. **Copier/coller** le contenu de :
   ```
   supabase/ENABLE_REALTIME_SUBSCRIPTIONS.sql
   ```
3. **Cliquer RUN**

### ✅ Résultat Attendu

```
========================================
✅ REALTIME CONFIGURÉ AVEC SUCCÈS
========================================

Configuration terminée :
  ✓ Publication Realtime : Activée
  ✓ Table user_subscriptions : Ajoutée
  ✓ Index de performance : Créé
  ✓ RLS : Activé
  ✓ Policies : Configurées

Prochaines étapes :
  1. Redémarrer l'application React Native
  2. Tester la synchronisation
  3. Vérifier les logs de connexion Realtime
========================================
```

---

## 🎯 Vérification (Optionnel)

Si vous voulez vérifier que tout est bien en place avant de commencer :

### Dans Supabase SQL Editor

```sql
-- Vérifier que les tables existent
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('subscription_plans', 'user_subscriptions');

-- Devrait retourner :
-- subscription_plans
-- user_subscriptions
```

---

## 🚨 En Cas d'Erreur

### Erreur : "policy already exists"

**Cause :** Vous avez déjà exécuté ce script avant

**Solution :** C'est normal ! Le script détecte ce qui existe et dit juste :
```
⚠️  Policy déjà existe: [nom de la policy]
```

**Action :** Continuez normalement, ce n'est PAS une erreur bloquante.

---

### Erreur : "relation already exists"

**Cause :** La table existe déjà

**Solution :** Parfait ! Le script utilise `CREATE TABLE IF NOT EXISTS`, donc il passe simplement à l'étape suivante.

**Action :** Continuez normalement.

---

### Erreur : "permission denied"

**Cause :** Vous n'avez pas les droits admin sur Supabase

**Solution :**
1. Vérifiez que vous êtes bien sur VOTRE projet Supabase
2. Vérifiez que vous êtes bien le propriétaire du projet
3. Si le problème persiste, contactez le support Supabase

---

## 📱 Étape 3 : Redémarrer l'App

Une fois les 2 scripts exécutés sans erreur :

```bash
# Dans le terminal
npx expo start --clear
```

---

## 🧪 Tester la Synchronisation

### Test Rapide (30 secondes)

1. **Dans l'app :**
   - Se connecter
   - Aller dans "Plans d'abonnement"
   - Choisir un plan
   - Upload une image comme preuve
   - Soumettre

2. **Vérifier le badge :**
   - Aller dans "Ma Boutique"
   - Vous devriez voir : `⏳ Abonnement en Attente`

3. **Dans Supabase SQL Editor :**
   ```sql
   -- Trouver votre abonnement
   SELECT id, user_id, status, is_approved
   FROM user_subscriptions
   ORDER BY created_at DESC
   LIMIT 1;

   -- Valider (remplacer ID_DE_L_ABONNEMENT)
   UPDATE user_subscriptions
   SET is_approved = true, status = 'active', starts_at = NOW()
   WHERE id = 'ID_DE_L_ABONNEMENT';
   ```

4. **Observer l'app (< 2 sec) :**
   - ✅ Alert : "🎉 Abonnement Validé !"
   - ✅ Badge devient vert : "✅ Abonnement Actif"
   - ✅ **SANS rafraîchir !**

---

## ✅ Checklist Finale

- [ ] Script 1 exécuté (SETUP_SUBSCRIPTIONS_SMART.sql)
- [ ] Résultat : "✅ SETUP TERMINÉ AVEC SUCCÈS"
- [ ] 3 plans affichés (Starter, Premium, Business)
- [ ] Script 2 exécuté (ENABLE_REALTIME_SUBSCRIPTIONS.sql)
- [ ] Résultat : "✅ REALTIME CONFIGURÉ AVEC SUCCÈS"
- [ ] App redémarrée avec `--clear`
- [ ] Test de synchronisation effectué
- [ ] Badge vert s'affiche automatiquement

---

## 🎉 C'est Prêt !

Si toutes les cases sont cochées, la synchronisation automatique fonctionne ! 🚀

**Temps total :** 5 minutes
**Résultat :** Notifications automatiques en < 1 seconde

---

## 📚 Documentation Complète

Pour aller plus loin :
- `FAIT_AUJOURDHUI.md` - Résumé de ce qui a été fait
- `SYNC_ABONNEMENT_TLDR.md` - Version ultra-rapide
- `GUIDE_SYNCHRONISATION_TEMPS_REEL.md` - Documentation technique
- `TEST_SYNC_ABONNEMENT.md` - Tous les scénarios de test

---

**Version :** 1.0.0
**Date :** Novembre 2025
**Status :** ✅ PRODUCTION READY

🐼 **SenePanda - Installation Simplifiée**
