# 🚨 ACTION IMMÉDIATE - Corriger les Erreurs

## 📍 Vous êtes ici car vous avez ces erreurs :

```
❌ Error: infinite recursion detected in policy for relation "profiles"
❌ Error: column d.deal_type does not exist
```

---

## ✅ Solution en 3 Étapes (2 minutes)

### 1️⃣ Ouvrir Supabase (30 secondes)
```
1. Aller sur https://supabase.com
2. Se connecter
3. Sélectionner votre projet SenePanda
4. Cliquer sur "SQL Editor" dans le menu de gauche
```

### 2️⃣ Exécuter le Script (1 minute)
```
1. Dans SQL Editor, cliquer "+ New query"
2. Ouvrir le fichier : supabase/FIX_CRITICAL_ERRORS.sql
3. Copier TOUT le contenu (Ctrl+A, Ctrl+C)
4. Coller dans l'éditeur SQL de Supabase (Ctrl+V)
5. Cliquer sur "RUN" (ou appuyer sur Ctrl+Enter)
6. Attendre les messages de confirmation (5-10 secondes)
```

### 3️⃣ Redémarrer l'App (30 secondes)
```bash
# Dans votre terminal où l'app tourne :

# 1. Arrêter l'app
Ctrl+C

# 2. Nettoyer le cache
npx expo start --clear

# 3. Scanner le QR code et relancer
```

---

## ✅ Vérification Rapide

**L'app devrait maintenant afficher :**
- ✅ Profils chargés sans erreur
- ✅ Plus d'erreur "infinite recursion"
- ✅ Plus d'erreur "deal_type does not exist"

---

## 🎯 Messages de Succès Attendus

Dans l'éditeur SQL, vous devriez voir :
```
NOTICE: ✅ Policies profiles corrigées (plus de récursion)
NOTICE: ✅ Colonne deal_type ajoutée/vérifiée
NOTICE: ✅ Fonction is_seller_subscription_active optimisée
NOTICE: ✅ Policies products simplifiées
NOTICE: 🔄 Redémarrer l'application pour appliquer les changements
```

---

## ❓ Si Ça Ne Fonctionne Pas

### Erreur Persiste Après le Script ?

**Vérifier que le script s'est bien exécuté :**
```sql
-- Dans SQL Editor, exécuter :
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'profiles';

-- Vous devriez voir seulement 3 policies :
-- 1. Allow public read access to profiles
-- 2. Allow users to insert their own profile
-- 3. Allow users to update their own profile
```

**Si vous voyez d'autres policies :**
```sql
-- Les supprimer manuellement
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
-- etc.

-- Puis réexécuter FIX_CRITICAL_ERRORS.sql
```

---

## 📞 Besoin d'Aide ?

**Avant de demander de l'aide :**
1. Vérifier que vous avez bien exécuté `FIX_CRITICAL_ERRORS.sql`
2. Vérifier que l'app a bien été redémarrée avec `--clear`
3. Regarder les logs dans Supabase Dashboard > Database > Logs

**Informations à fournir :**
- Screenshot des erreurs dans la console
- Screenshot des messages dans SQL Editor
- Version de Supabase utilisée

---

## 📚 Documentation Complète

Pour plus de détails, voir :
- **[CORRECTIF_URGENT.md](CORRECTIF_URGENT.md)** - Guide détaillé
- **[QUICK_START.md](QUICK_START.md)** - Démarrage après correctif

---

## ⏱️ Temps Total Estimé

- Connexion Supabase : 30 sec
- Exécution script : 1 min
- Redémarrage app : 30 sec
- **TOTAL : ~2 minutes**

---

## 🎉 Après le Correctif

Une fois les erreurs corrigées, vous pouvez :
1. Continuer à utiliser l'application normalement
2. Déployer les nouvelles fonctionnalités (voir QUICK_START.md)
3. Tester le système d'abonnement et de points

---

**C'EST PARTI ! 🚀**

**Étape suivante :** Ouvrir Supabase → SQL Editor → Exécuter FIX_CRITICAL_ERRORS.sql
