# 📚 Guide des Fonctions d'Abonnement

## ✅ Nouvelles Fonctions Ajoutées

Deux fonctions SQL ont été ajoutées à `COMPLETE_DATABASE_SETUP.sql` pour gérer les abonnements :

1. **`change_subscription()`** - Effectue le changement d'abonnement
2. **`can_change_to_plan()`** - Vérifie si un changement est possible

---

## 🔧 1. change_subscription()

### **Description**
Effectue un changement d'abonnement (upgrade, downgrade ou renouvellement) et enregistre tout dans l'historique.

### **Paramètres**
```sql
change_subscription(
    p_user_id UUID,          -- ID de l'utilisateur
    p_new_plan_type TEXT,    -- 'free', 'starter', 'pro', 'premium'
    p_payment_method TEXT,   -- 'orange_money', 'wave', 'free_money', 'card', 'bank'
    p_billing_period TEXT,   -- 'monthly' ou 'yearly'
    p_amount DECIMAL(10,2)   -- Montant payé
)
```

### **Retour**
```json
{
  "success": true,
  "action": "upgrade",
  "old_plan": "free",
  "new_plan": "pro",
  "old_expires_at": "2024-11-15T10:00:00Z",
  "new_expires_at": "2024-12-15T10:00:00Z",
  "message": "Félicitations ! Vous êtes passé au plan pro !"
}
```

### **Exemple d'utilisation**

**Depuis l'application TypeScript :**

```typescript
const { data, error } = await supabase.rpc('change_subscription', {
  p_user_id: user.id,
  p_new_plan_type: 'pro',
  p_payment_method: 'orange_money',
  p_billing_period: 'monthly',
  p_amount: 5000
});

if (data?.success) {
  console.log(data.message);
  console.log('Action:', data.action); // 'upgrade', 'downgrade', ou 'renewal'
} else {
  console.error('Erreur:', data?.error);
}
```

**Depuis SQL Editor :**

```sql
SELECT change_subscription(
    'user-uuid-here'::UUID,
    'pro',
    'orange_money',
    'monthly',
    5000
);
```

---

## 🔍 2. can_change_to_plan()

### **Description**
Vérifie si un utilisateur peut changer vers un plan spécifique et fournit des informations sur le changement.

### **Paramètres**
```sql
can_change_to_plan(
    p_user_id UUID,        -- ID de l'utilisateur
    p_target_plan TEXT     -- Plan cible: 'free', 'starter', 'pro', 'premium'
)
```

### **Retour**
```json
{
  "can_change": true,
  "current_plan": "starter",
  "target_plan": "pro",
  "days_remaining": 15,
  "is_upgrade": true,
  "is_downgrade": false,
  "is_renewal": false,
  "message": "Upgrade disponible vers pro"
}
```

### **Exemple d'utilisation**

**Depuis l'application TypeScript :**

```typescript
const { data, error } = await supabase.rpc('can_change_to_plan', {
  p_user_id: user.id,
  p_target_plan: 'pro'
});

if (data?.can_change) {
  console.log(data.message);

  if (data.is_upgrade) {
    console.log('🚀 Upgrade disponible!');
  } else if (data.is_downgrade) {
    console.log('⚠️ Attention: Downgrade (perte d\'avantages)');
  } else if (data.is_renewal) {
    console.log('🔄 Renouvellement:', data.days_remaining, 'jours restants');
  }
}
```

**Depuis SQL Editor :**

```sql
SELECT can_change_to_plan(
    'user-uuid-here'::UUID,
    'pro'
);
```

---

## 🔄 Intégration dans l'Application

### **Mettre à jour processPayment() dans subscription-plans.tsx**

Remplacez la logique actuelle par l'utilisation de la fonction SQL :

```typescript
const processPayment = async () => {
  if (!selectedPlan || !selectedPaymentMethod || !user) {
    Alert.alert('Erreur', 'Données de paiement incomplètes');
    return;
  }

  // Validation du numéro de téléphone pour mobile money
  if (['orange_money', 'wave', 'free_money'].includes(selectedPaymentMethod)) {
    if (!phoneNumber || phoneNumber.length < 9) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide');
      return;
    }
  }

  setPaymentStep('processing');

  try {
    // Simuler le traitement du paiement
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Calculer le montant
    const amount = billingPeriod === 'monthly'
      ? selectedPlan.price_monthly
      : (selectedPlan.price_yearly || selectedPlan.price_monthly * 10);

    // ✅ UTILISER LA FONCTION SQL
    const { data, error } = await supabase.rpc('change_subscription', {
      p_user_id: user.id,
      p_new_plan_type: selectedPlan.plan_type,
      p_payment_method: selectedPaymentMethod,
      p_billing_period: billingPeriod,
      p_amount: amount
    });

    if (error) throw error;

    if (!data?.success) {
      throw new Error(data?.error || 'Erreur lors du changement d\'abonnement');
    }

    console.log('✅ Succès:', data.message);
    console.log('Action:', data.action);

    setPaymentStep('success');

    // Recharger les données
    setTimeout(async () => {
      await loadData();
    }, 2000);

  } catch (error: any) {
    console.error('❌ Erreur:', error);
    Alert.alert('Erreur de paiement', error.message);
    setPaymentStep('error');
  }
};
```

---

## 🎯 Avantages de ces fonctions

### **1. Validation automatique**
- ✅ Vérifie que l'utilisateur existe
- ✅ Gère les plans NULL (définit 'free' par défaut)
- ✅ Calcule automatiquement l'action (upgrade/downgrade/renewal)

### **2. Cohérence des données**
- ✅ Met à jour `profiles` et `subscription_history` en une seule transaction
- ✅ Calcule automatiquement la date d'expiration
- ✅ Définit is_premium automatiquement

### **3. Historique complet**
- ✅ Enregistre toutes les informations dans `subscription_history`
- ✅ Action correcte (upgrade/downgrade/renewal)
- ✅ Montant et méthode de paiement
- ✅ Date d'expiration

### **4. Messages personnalisés**
- ✅ Messages adaptés selon l'action
- ✅ Feedback immédiat pour l'utilisateur

---

## 📊 Exemples de Scénarios

### **Scénario 1 : Upgrade (Free → Pro)**

```typescript
// Vérifier d'abord
const check = await supabase.rpc('can_change_to_plan', {
  p_user_id: user.id,
  p_target_plan: 'pro'
});

console.log(check.data);
// {
//   "can_change": true,
//   "is_upgrade": true,
//   "message": "Upgrade disponible vers pro"
// }

// Effectuer le changement
const result = await supabase.rpc('change_subscription', {
  p_user_id: user.id,
  p_new_plan_type: 'pro',
  p_payment_method: 'orange_money',
  p_billing_period: 'monthly',
  p_amount: 5000
});

console.log(result.data);
// {
//   "success": true,
//   "action": "upgrade",
//   "message": "Félicitations ! Vous êtes passé au plan pro !"
// }
```

---

### **Scénario 2 : Renouvellement (Pro → Pro)**

```typescript
const result = await supabase.rpc('change_subscription', {
  p_user_id: user.id,
  p_new_plan_type: 'pro',
  p_payment_method: 'wave',
  p_billing_period: 'yearly',
  p_amount: 50000
});

console.log(result.data);
// {
//   "success": true,
//   "action": "renewal",
//   "message": "Votre abonnement pro a été renouvelé avec succès !"
// }
```

---

### **Scénario 3 : Downgrade (Premium → Starter)**

```typescript
const check = await supabase.rpc('can_change_to_plan', {
  p_user_id: user.id,
  p_target_plan: 'starter'
});

if (check.data?.is_downgrade) {
  // Afficher un avertissement
  Alert.alert(
    'Attention',
    check.data.message,
    [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Continuer', onPress: () => {
        // Effectuer le downgrade
        supabase.rpc('change_subscription', {
          p_user_id: user.id,
          p_new_plan_type: 'starter',
          p_payment_method: 'card',
          p_billing_period: 'monthly',
          p_amount: 2500
        });
      }}
    ]
  );
}
```

---

## ✅ Checklist d'Intégration

- [ ] Exécuter `COMPLETE_DATABASE_SETUP.sql` dans Supabase
- [ ] Vérifier que les fonctions existent :
  ```sql
  SELECT proname FROM pg_proc WHERE proname LIKE '%subscription%';
  ```
- [ ] Mettre à jour `app/seller/subscription-plans.tsx`
- [ ] Utiliser `change_subscription()` dans `processPayment()`
- [ ] Utiliser `can_change_to_plan()` dans `handleSubscribe()`
- [ ] Tester tous les scénarios (upgrade, downgrade, renewal)
- [ ] Vérifier l'historique dans `subscription_history`

---

## 🎉 Migration Terminée !

Les fonctions de validation et de changement d'abonnement sont maintenant disponibles côté serveur avec toute la logique métier intégrée.
