# 📁 Scripts SQL Supabase - Guide d'Utilisation

## 🎯 Quel Script Utiliser ?

### ⭐ RECOMMANDÉ : Script Unique (Méthode Rapide)

**Fichier :** `COMPLETE_FIX_ALL.sql`

**Utiliser si :**
- ✅ Vous voulez tout corriger en une fois
- ✅ Vous avez des erreurs de fonctions en doublon
- ✅ C'est votre première fois
- ✅ Vous voulez la méthode la plus simple

**Temps :** 2 minutes

**Avantages :**
- Un seul fichier à exécuter
- Nettoie automatiquement les doublons
- Corrige toutes les erreurs
- Déploie toutes les fonctionnalités

**Comment l'utiliser :**
```
1. Ouvrir Supabase SQL Editor
2. Copier TOUT le contenu de COMPLETE_FIX_ALL.sql
3. Coller et cliquer RUN
4. Attendre les messages de succès
5. Redémarrer l'app : npx expo start --clear
```

---

### 📚 Alternative : Scripts Séparés (Méthode Contrôlée)

**Utiliser si :**
- ✅ Vous voulez comprendre chaque étape
- ✅ Vous avez besoin de déboguer précisément
- ✅ Vous voulez exécuter partiellement

**Fichiers à exécuter dans l'ordre :**

#### 1. `FIX_MISSING_COLUMNS.sql`
**Objectif :** Ajouter toutes les colonnes manquantes

**Temps :** 1 minute

**Ce qui est ajouté :**
- total_points, loyalty_points, redeemed_points
- referral_code, referred_by, total_referrals
- shop_name, logo_url, banner_url, gradient_colors
- location, date_of_birth, bio, avatar_url

**⚠️ ATTENTION :** Peut échouer si la fonction `add_column_if_not_exists` existe déjà en plusieurs versions. Dans ce cas, utilisez `COMPLETE_FIX_ALL.sql` à la place.

#### 2. `FIX_CRITICAL_ERRORS.sql`
**Objectif :** Corriger les erreurs de RLS et ajouter deal_type

**Temps :** 1 minute

**Ce qui est corrigé :**
- Policies RLS récursives sur profiles
- Colonne deal_type manquante dans flash_deals
- Fonction is_seller_subscription_active optimisée

#### 3. `DEPLOY_ALL_FEATURES.sql`
**Objectif :** Déployer toutes les nouvelles fonctionnalités

**Temps :** 1 minute

**Ce qui est créé :**
- 6 fonctions SQL (points bonus)
- 1 trigger (limite produits)
- 1 vue (produits actifs)
- Policies RLS sécurisées

**Temps total :** 3 minutes (+ risque d'erreurs si doublons)

---

## 📂 Liste Complète des Scripts

### Scripts Principaux

| Fichier | Usage | Statut |
|---------|-------|--------|
| **COMPLETE_FIX_ALL.sql** | ⭐ Script unique tout-en-un | **RECOMMANDÉ** |
| FIX_MISSING_COLUMNS.sql | Ajouter colonnes manquantes | Alternative |
| FIX_CRITICAL_ERRORS.sql | Corriger RLS et deal_type | Alternative |
| DEPLOY_ALL_FEATURES.sql | Déployer fonctionnalités | Alternative |

### Scripts Spécialisés

| Fichier | Description |
|---------|-------------|
| BONUS_POINTS_SYSTEM.sql | Système de points uniquement |
| COMPLETE_DATABASE_SETUP.sql | Setup complet initial (ancien) |
| migrations/*.sql | Migrations individuelles |

---

## 🚨 En Cas d'Erreur

### Erreur : `function is not unique`

**Solution :** Utiliser `COMPLETE_FIX_ALL.sql` qui nettoie les doublons automatiquement.

### Erreur : `infinite recursion`

**Solution :** Exécuter `FIX_CRITICAL_ERRORS.sql` ou `COMPLETE_FIX_ALL.sql`

### Erreur : `column does not exist`

**Solution :** Exécuter `FIX_MISSING_COLUMNS.sql` ou `COMPLETE_FIX_ALL.sql`

---

## 📊 Comparaison des Méthodes

| Critère | Script Unique | Scripts Séparés |
|---------|---------------|-----------------|
| **Simplicité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Temps** | 2 min | 3-5 min |
| **Risque d'erreur** | Très faible | Moyen |
| **Contrôle** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Débogage** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Nettoyage auto** | ✅ Oui | ❌ Non |
| **Recommandé pour** | Débutants, Production | Développeurs, Debug |

---

## ✅ Workflow Recommandé

### 🏁 Première Installation

```
1. Exécuter : COMPLETE_FIX_ALL.sql
2. Redémarrer l'app
3. Tester les fonctionnalités
4. ✅ Terminé !
```

### 🔧 Mise à Jour Partielle

```
1. Identifier le problème
2. Choisir le script approprié :
   - Colonnes manquantes → FIX_MISSING_COLUMNS.sql
   - RLS récursive → FIX_CRITICAL_ERRORS.sql
   - Fonctionnalités → DEPLOY_ALL_FEATURES.sql
3. Exécuter le script
4. Vérifier
```

### 🔄 Réinitialisation Complète

```
1. Faire un backup de la base
2. Exécuter : COMPLETE_FIX_ALL.sql
3. Redémarrer l'app
4. Vérifier toutes les fonctionnalités
```

---

## 🧪 Tests Après Exécution

### Test 1 : Vérifier les colonnes
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('total_points', 'loyalty_points', 'referral_code')
ORDER BY column_name;
```
**Attendu :** 3 lignes

### Test 2 : Vérifier les fonctions
```sql
SELECT proname, pronargs
FROM pg_proc
WHERE proname IN ('record_daily_login', 'award_purchase_points')
ORDER BY proname;
```
**Attendu :** Chaque fonction apparaît UNE SEULE fois

### Test 3 : Tester une fonction
```sql
-- Remplacer YOUR-USER-ID
SELECT record_daily_login('YOUR-USER-ID');
```
**Attendu :** JSON avec `"success": true`

---

## 📚 Documentation Associée

- **[SOLUTION_RAPIDE.md](../SOLUTION_RAPIDE.md)** - Guide d'utilisation rapide
- **[GUIDE_DEMARRAGE_IMMEDIAT.md](../GUIDE_DEMARRAGE_IMMEDIAT.md)** - Guide pas à pas
- **[RESOLUTION_FINALE.md](../RESOLUTION_FINALE.md)** - Explication détaillée
- **[FIX_TOUTES_ERREURS.md](../FIX_TOUTES_ERREURS.md)** - Guide des 3 scripts

---

## 🎯 Récapitulatif

### Pour 99% des cas :
```
1. Exécuter COMPLETE_FIX_ALL.sql
2. Redémarrer l'app
3. ✅ Terminé !
```

### Si vous voulez plus de contrôle :
```
1. FIX_MISSING_COLUMNS.sql
2. FIX_CRITICAL_ERRORS.sql
3. DEPLOY_ALL_FEATURES.sql
4. Redémarrer l'app
```

---

## 📞 Support

**Problèmes avec les scripts ?**
1. Vérifier que vous êtes sur le bon projet Supabase
2. Vérifier que vous avez les droits admin
3. Lire [RESOLUTION_FINALE.md](../RESOLUTION_FINALE.md)
4. Consulter la section "Vérification Post-Exécution"

**Besoin d'aide ?**
- Voir la documentation complète dans le dossier racine
- Consulter [INDEX_DOCUMENTATION.md](../INDEX_DOCUMENTATION.md)

---

**Recommandation : Commencer par [COMPLETE_FIX_ALL.sql](COMPLETE_FIX_ALL.sql) 🚀**
