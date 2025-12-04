# ⚡ Guide Rapide - Correction XOF → FCFA

## 🎯 Vous avez eu cette erreur ?

```
Error: Failed to run sql query:
ERROR: 42703: column "currency" does not exist
```

**Pas de panique !** Voici la solution simple.

---

## ✅ Solution Express (2 minutes)

### **Étape 1 : Ouvrez Supabase Dashboard**

1. Allez sur https://supabase.com
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche

---

### **Étape 2 : Exécutez cette requête**

Copiez-collez exactement ce code dans le SQL Editor :

```sql
-- Mettre à jour la valeur par défaut
ALTER TABLE subscription_history
ALTER COLUMN currency SET DEFAULT 'FCFA';

-- Mettre à jour tous les enregistrements existants
UPDATE subscription_history
SET currency = 'FCFA'
WHERE currency = 'XOF' OR currency IS NULL;

-- Afficher le résultat
SELECT COUNT(*) as total_fcfa
FROM subscription_history
WHERE currency = 'FCFA';
```

Cliquez sur **Run** (ou Ctrl+Entrée).

---

### **Étape 3 : Vérifiez le résultat**

Vous devriez voir :

```
NOTICE: Valeur par défaut mise à jour vers FCFA
```

Et un résultat du type :
```
total_fcfa
----------
0
```

(0 est normal si vous n'avez pas encore d'abonnements)

---

### **Étape 4 : Redémarrez l'app**

```bash
# Dans votre terminal
# Arrêtez l'app (Ctrl+C si elle tourne)
npx expo start
```

---

## 🎉 C'est fait !

Maintenant tous les nouveaux paiements utiliseront **FCFA** au lieu de **XOF**.

---

## 📱 Pour vérifier

1. Allez sur `/seller/subscription-plans`
2. Essayez de souscrire à un plan
3. Les prix doivent s'afficher en **FCFA**

**Exemple attendu :**
```
Plan Pro
5,000 FCFA/mois
```

---

## ❓ Besoin d'aide ?

Si vous avez encore des erreurs :

1. Vérifiez que la table `subscription_history` existe :
   ```sql
   SELECT * FROM subscription_history LIMIT 1;
   ```

2. Si erreur "relation does not exist" :
   - Exécutez d'abord : `supabase/COMPLETE_DATABASE_SETUP.sql`
   - Puis réessayez la migration

3. Consultez : `MIGRATION_XOF_VERS_FCFA.md` pour le guide complet

---

**Fichier utilisé :** `supabase/migrations/simple_update_fcfa.sql`
