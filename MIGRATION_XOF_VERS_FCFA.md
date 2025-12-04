# 🔄 Migration XOF → FCFA

## ✅ Changements effectués

Tous les fichiers de l'application ont été mis à jour pour utiliser **FCFA** au lieu de **XOF**.

---

## 📋 Fichiers modifiés

### **Application (.tsx/.ts)**
1. ✅ `app/settings/terms.tsx` - Conditions d'utilisation
2. ✅ `app/chat/[conversationId].tsx` - Messages avec offres de prix
3. ✅ `app/seller/benefits.tsx` - Tableau de bord vendeur
4. ✅ `app/rewards/redeem/[id].tsx` - Récompenses
5. ✅ `components/SimpleProductGrid.tsx` - Affichage des produits
6. ✅ `components/seller/SalesChart.tsx` - Graphiques de ventes

### **Base de données (.sql)**
7. ✅ `supabase/migrations/insert_default_subscription_plans.sql` - Plans d'abonnement
8. ✅ `supabase/migrations/update_currency_to_fcfa.sql` - **Migration créée**

---

## 🚀 Déploiement

### **Étape 1 : Mettre à jour la base de données**

**Option A - Migration Simple (Recommandée) :**

Exécutez dans le **SQL Editor** de Supabase Dashboard :

```sql
-- Copier-coller le contenu de ce fichier:
supabase/migrations/simple_update_fcfa.sql
```

Cette migration met à jour uniquement la table `subscription_history`.

---

**Option B - Migration Complète :**

Si vous avez déjà exécuté `insert_default_subscription_plans.sql` :

```sql
-- Copier-coller le contenu de ce fichier:
supabase/migrations/update_currency_to_fcfa.sql
```

Cette migration vérifie et met à jour toutes les tables (subscription_plans, subscription_history, products).

---

**Option C - CLI Supabase :**

```bash
npx supabase db push
```

---

### **Étape 2 : Vérifier la mise à jour**

Exécutez cette requête pour vérifier :

```sql
-- Vérifier les plans d'abonnement
SELECT plan_type, name, currency, price_monthly, price_yearly
FROM subscription_plans;

-- Vérifier l'historique
SELECT COUNT(*) as total, currency
FROM subscription_history
GROUP BY currency;
```

**Résultat attendu :** Toutes les devises doivent être `FCFA`.

---

### **Étape 3 : Redémarrer l'application**

```bash
# Arrêter l'app (Ctrl+C)
# Relancer
npx expo start
```

---

## 📱 Résultat

### **Avant :**
```
Prix: 25,000 XOF
Plan: 5,000 XOF/mois
Revenus: 120,000 XOF
```

### **Après :**
```
Prix: 25,000 FCFA
Plan: 5,000 FCFA/mois
Revenus: 120,000 FCFA
```

---

## 🔍 Vérifications manuelles

### **1. Page des abonnements**
- Allez sur `/seller/subscription-plans`
- Vérifiez que les prix s'affichent en **FCFA**

### **2. Chat avec offre de prix**
- Ouvrez une conversation
- Envoyez une offre de prix
- Vérifiez l'affichage : `💰 Offre: 10,000 FCFA`

### **3. Tableau de bord vendeur**
- Allez sur `/seller/benefits`
- Vérifiez tous les montants en **FCFA**

### **4. Récompenses**
- Allez sur `/rewards`
- Ouvrez une récompense
- Vérifiez la valeur en **FCFA**

---

## 📊 Impact

### **Tables affectées :**
- ✅ `subscription_plans` - Plans d'abonnement
- ✅ `subscription_history` - Historique des paiements
- ✅ `products` - Produits (si colonne `currency` existe)

### **Fichiers affectés :**
- ✅ **6 fichiers TypeScript** modifiés
- ✅ **2 fichiers SQL** créés/modifiés

---

## ⚠️ Important

### **Compatibilité**
La fonction `formatPrice` dans `SimpleProductGrid.tsx` accepte **les deux formats** :

```typescript
if (currency === 'FCFA' || currency === 'XOF') {
  return `${price.toLocaleString()} FCFA`;
}
```

Cela assure une **rétrocompatibilité** si des anciennes données contiennent encore "XOF".

---

## ⚠️ Dépannage

### **Erreur : "column currency does not exist"**

**Cause :** La table `subscription_plans` n'a pas encore la colonne `currency`.

**Solution :**
1. Utilisez **Option A** (Migration Simple) au lieu d'Option B
2. Ou exécutez d'abord : `supabase/migrations/insert_default_subscription_plans.sql`
3. Puis exécutez : `supabase/migrations/update_currency_to_fcfa.sql`

---

### **Erreur : "relation subscription_history does not exist"**

**Cause :** La table n'a pas encore été créée.

**Solution :**
1. Exécutez d'abord : `supabase/COMPLETE_DATABASE_SETUP.sql`
2. Puis : `supabase/migrations/insert_default_subscription_plans.sql`
3. Enfin : `supabase/migrations/simple_update_fcfa.sql`

---

## ✅ Checklist de déploiement

- [ ] Exécuter la migration SQL dans Supabase (Option A recommandée)
- [ ] Vérifier les tables avec les requêtes de vérification
- [ ] Redémarrer l'application
- [ ] Tester la page des abonnements
- [ ] Tester le chat avec offres
- [ ] Tester le tableau de bord vendeur
- [ ] Tester les récompenses
- [ ] Commit et push des changements

---

## 🎉 Migration terminée !

Tous les montants s'affichent maintenant en **FCFA** (Franc CFA) au lieu de **XOF**.
