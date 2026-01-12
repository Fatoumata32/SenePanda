# 🧪 Test de Validation d'Abonnement

## ✅ Ce Qui A Été Modifié

Le fichier `app/seller/subscription-plans.tsx` utilise maintenant la fonction SQL `change_subscription()` pour valider et traiter les paiements.

---

## 🚀 Étapes de Test

### **Étape 1 : Vérifier que la fonction SQL existe**

1. Ouvrez **Supabase Dashboard**
2. Allez dans **SQL Editor**
3. Exécutez cette requête :

```sql
SELECT proname, proargnames
FROM pg_proc
WHERE proname = 'change_subscription';
```

**Résultat attendu :**
```
proname              | proargnames
---------------------|----------------------------------
change_subscription  | {p_user_id, p_new_plan_type, ...}
```

**Si la fonction n'existe PAS :**
- Exécutez `supabase/COMPLETE_DATABASE_SETUP.sql` dans le SQL Editor
- Attendez que l'exécution se termine
- Réessayez la requête ci-dessus

---

### **Étape 2 : Tester manuellement la fonction SQL**

Remplacez `'VOTRE-USER-ID'` par votre vrai UUID d'utilisateur :

```sql
-- Test: Upgrade vers Pro
SELECT change_subscription(
    'VOTRE-USER-ID'::UUID,
    'pro',
    'orange_money',
    'monthly',
    5000
);
```

**Résultat attendu :**
```json
{
  "success": true,
  "action": "upgrade",
  "old_plan": "free",
  "new_plan": "pro",
  "message": "Félicitations ! Vous êtes passé au plan pro !"
}
```

---

### **Étape 3 : Tester dans l'application**

1. **Redémarrez l'application :**
   ```bash
   npx expo start
   ```

2. **Allez sur la page des abonnements :**
   - Naviguez vers `/seller/subscription-plans`

3. **Choisissez un plan :**
   - Cliquez sur un bouton "Choisir ce plan"

4. **Sélectionnez un mode de paiement :**
   - Choisissez "Orange Money" (ou autre)
   - Cliquez sur "Continuer"

5. **Entrez les détails :**
   - Pour Mobile Money : Entrez un numéro (au moins 9 chiffres)
   - Cliquez sur "Continuer"

6. **Confirmez le paiement :**
   - Vérifiez les détails
   - Cliquez sur "Confirmer et Payer"

---

### **Étape 4 : Vérifier les logs**

**Dans la console, vous devriez voir :**

```
💳 Début du traitement du paiement: { plan: "Pro", method: "orange_money", period: "monthly" }
✅ Numéro validé: 771234567
⏳ Simulation du paiement...
💰 Montant: 5000 FCFA
🔄 Appel de la fonction change_subscription...
📊 Résultat SQL: { success: true, action: "upgrade", ... }
✅ Action: upgrade
✅ Message: Félicitations ! Vous êtes passé au plan pro !
🎉 Paiement réussi !
🔄 Rechargement des données...
```

---

### **Étape 5 : Vérifier la base de données**

```sql
-- Vérifier le profil mis à jour
SELECT id, subscription_plan, subscription_expires_at, is_premium
FROM profiles
WHERE id = 'VOTRE-USER-ID'::UUID;

-- Vérifier l'historique
SELECT plan_type, action, amount, currency, payment_method, created_at
FROM subscription_history
WHERE user_id = 'VOTRE-USER-ID'::UUID
ORDER BY created_at DESC
LIMIT 5;
```

**Résultat attendu :**
- `subscription_plan` = 'pro'
- `is_premium` = true
- `subscription_expires_at` = date dans ~30 jours
- Historique contient une ligne avec `action` = 'upgrade'

---

## ⚠️ Erreurs Possibles

### **Erreur 1 : "function change_subscription does not exist"**

**Message :**
```
La fonction de validation n'est pas encore installée.
Veuillez exécuter COMPLETE_DATABASE_SETUP.sql dans Supabase.
```

**Solution :**
1. Ouvrez Supabase Dashboard → SQL Editor
2. Copiez-collez le contenu de `supabase/COMPLETE_DATABASE_SETUP.sql`
3. Cliquez sur "Run"
4. Attendez la fin de l'exécution
5. Réessayez

---

### **Erreur 2 : "Utilisateur non trouvé"**

**Message dans les logs :**
```json
{
  "success": false,
  "error": "Utilisateur non trouvé"
}
```

**Causes possibles :**
- L'utilisateur n'existe pas dans la table `profiles`
- L'ID utilisateur est incorrect

**Solution :**
```sql
-- Vérifier que le profil existe
SELECT * FROM profiles WHERE id = auth.uid();

-- Si pas de résultat, créer le profil
INSERT INTO profiles (id, username, full_name)
VALUES (auth.uid(), 'test_user', 'Test User');
```

---

### **Erreur 3 : "Période de facturation invalide"**

**Message :**
```json
{
  "success": false,
  "error": "Période de facturation invalide (monthly ou yearly)"
}
```

**Cause :** Le paramètre `billingPeriod` n'est pas 'monthly' ou 'yearly'

**Solution :** Vérifiez la valeur dans le code

---

## ✅ Tests à Effectuer

- [ ] Fonction SQL existe dans Supabase
- [ ] Test manuel SQL réussit
- [ ] Upgrade (free → starter)
- [ ] Upgrade (starter → pro)
- [ ] Upgrade (pro → premium)
- [ ] Renouvellement (pro → pro)
- [ ] Downgrade (premium → pro)
- [ ] Downgrade (pro → starter)
- [ ] Période mensuelle fonctionne
- [ ] Période annuelle fonctionne
- [ ] Historique enregistré correctement
- [ ] Profile mis à jour correctement

---

## 🔄 Scénarios de Test Complets

### **Scénario 1 : Nouvel utilisateur (Free → Starter)**

1. Créez un nouveau compte
2. Allez sur `/seller/subscription-plans`
3. Choisissez "Starter"
4. Payez avec Orange Money
5. **Vérifiez :**
   - Action = "upgrade"
   - Message = "Félicitations ! Vous êtes passé au plan starter !"
   - Badge username = [👑 STARTER] (bleu)

---

### **Scénario 2 : Upgrade (Starter → Pro)**

1. Avec un compte Starter
2. Allez sur `/seller/subscription-plans`
3. Choisissez "Pro"
4. Payez avec Wave
5. **Vérifiez :**
   - Action = "upgrade"
   - Message = "Félicitations ! Vous êtes passé au plan pro !"
   - Badge username = [👑 PRO] (violet)

---

### **Scénario 3 : Renouvellement**

1. Avec un compte Pro actif
2. Allez sur `/seller/subscription-plans`
3. Choisissez "Pro" (même plan)
4. Payez
5. **Vérifiez :**
   - Action = "renewal"
   - Message = "Votre abonnement pro a été renouvelé avec succès !"
   - Date d'expiration prolongée de 30 jours

---

### **Scénario 4 : Downgrade (Premium → Starter)**

1. Avec un compte Premium
2. Allez sur `/seller/subscription-plans`
3. Choisissez "Starter"
4. **Alert attendue :** "Attention : Vous allez passer de PREMIUM à Starter..."
5. Confirmez
6. **Vérifiez :**
   - Action = "downgrade"
   - Message = "Votre plan a été changé pour starter"
   - Badge username = [👑 STARTER] (bleu)

---

## 📊 Vérification Finale

**Toutes les données doivent être cohérentes :**

```sql
-- Vue complète
SELECT
    p.id,
    p.username,
    p.subscription_plan,
    p.is_premium,
    p.subscription_expires_at,
    sh.action,
    sh.amount,
    sh.currency,
    sh.created_at
FROM profiles p
LEFT JOIN subscription_history sh ON sh.user_id = p.id
WHERE p.id = 'VOTRE-USER-ID'::UUID
ORDER BY sh.created_at DESC;
```

---

## 🎉 Validation Complète

Si tous les tests passent :
- ✅ La fonction SQL fonctionne
- ✅ L'application utilise la fonction SQL
- ✅ La validation est active
- ✅ L'historique est enregistré
- ✅ Les badges s'affichent correctement
- ✅ Les prix sont en FCFA

**Le système de validation d'abonnement est OPÉRATIONNEL !** 🚀
