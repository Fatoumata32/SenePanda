# Configuration du système d'abonnement Wave

## 📋 Résumé des modifications

Ce document décrit le nouveau système d'abonnement avec paiement Wave simulé et activation immédiate.

## ✅ Modifications effectuées

### 1. Page de connexion (simple-auth.tsx)
- ❌ **Supprimé** : Icône Settings pour l'accès admin
- ✅ L'accès admin devra être géré par une route dédiée (ex: `/admin/login`)

### 2. Système de paiement Wave
- ✅ **Créé** : `WavePaymentSimulator.tsx` - Composant de simulation de paiement Wave
- ✅ Simule un paiement Wave réaliste avec animations
- ✅ Validation automatique après 2 secondes
- ✅ Interface utilisateur Wave authentique

### 3. Flux d'abonnement (subscription-plans.tsx)
- ✅ **Modifié** : Activation immédiate sans validation admin
- ✅ Intégration du simulateur Wave
- ✅ Mise à jour automatique du profil utilisateur
- ✅ Messages de succès améliorés
- ✅ Calcul automatique de la date d'expiration (mensuel ou annuel)

## 🔄 Nouveau flux d'abonnement

### Avant (ancien système)
1. Utilisateur sélectionne un plan
2. Choisit une méthode de paiement
3. Envoie une demande d'abonnement
4. ⏳ **Attend la validation admin**
5. Admin valide ou refuse
6. Abonnement activé

### Maintenant (nouveau système)
1. Utilisateur sélectionne un plan
2. Voit directement l'écran de confirmation
3. Clique sur "Procéder au paiement"
4. 💳 **Simulateur Wave s'ouvre**
5. Confirme le paiement
6. ⚡ **Activation immédiate automatique**
7. 🎉 Accès instantané aux avantages

## 🎯 Fonctionnalités

### Simulateur Wave
```typescript
// Utilisation
<WavePaymentSimulator
  visible={showWaveSimulator}
  amount={5000} // Montant en FCFA
  phoneNumber="+221 77 123 45 67"
  onSuccess={handleWavePaymentSuccess}
  onCancel={handleCancel}
/>
```

### Activation automatique
Le système met automatiquement à jour :
- `subscription_plan` : Type de plan (starter, pro, premium)
- `subscription_expires_at` : Date d'expiration calculée
- `updated_at` : Timestamp de mise à jour

```sql
-- Exemple de mise à jour automatique
UPDATE profiles
SET
  subscription_plan = 'pro',
  subscription_expires_at = NOW() + INTERVAL '1 month',
  updated_at = NOW()
WHERE id = 'user_id';
```

## 🗄️ Base de données

### Colonnes requises dans `profiles`
```sql
-- Vérifier que ces colonnes existent
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN (
  'subscription_plan',
  'subscription_expires_at',
  'updated_at'
);
```

### Si les colonnes n'existent pas
```sql
-- Ajouter les colonnes manquantes
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profiles_subscription
ON profiles(subscription_plan, subscription_expires_at);
```

## 📱 Test du système

### 1. Tester un abonnement
```
1. Connectez-vous comme vendeur
2. Allez dans "Plans d'abonnement"
3. Sélectionnez un plan (Starter, Pro ou Premium)
4. Cliquez sur "Choisir ce plan"
5. L'écran de confirmation s'affiche
6. Cliquez sur "Procéder au paiement"
7. Le simulateur Wave s'ouvre
8. Vérifiez les détails et cliquez "Confirmer le paiement"
9. Attendez 2 secondes (simulation)
10. ✅ L'abonnement est activé !
```

### 2. Vérifier l'activation
```sql
-- Vérifier dans la base de données
SELECT
  id,
  email,
  subscription_plan,
  subscription_expires_at,
  updated_at
FROM profiles
WHERE subscription_plan != 'free'
ORDER BY updated_at DESC
LIMIT 10;
```

### 3. Vérifier dans l'app
- Le badge "PLAN ACTUEL" apparaît sur le plan actif
- Les jours restants sont affichés
- Le bouton change en "Renouveler" pour le plan actuel

## 🔧 Configuration supplémentaire (optionnel)

### Fonction RPC pour historique (optionnel)
Si vous voulez garder un historique des abonnements :

```sql
-- Table d'historique (optionnel)
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  billing_period TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'wave',
  status TEXT DEFAULT 'active',
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_subscription_history_user
ON subscription_history(user_id, created_at DESC);

-- Fonction pour enregistrer l'historique
CREATE OR REPLACE FUNCTION record_subscription_activation()
RETURNS TRIGGER AS $$
BEGIN
  -- Enregistrer uniquement si le plan a changé
  IF NEW.subscription_plan != OLD.subscription_plan OR
     OLD.subscription_plan IS NULL THEN

    INSERT INTO subscription_history (
      user_id,
      plan_type,
      billing_period,
      amount,
      status,
      activated_at,
      expires_at
    ) VALUES (
      NEW.id,
      NEW.subscription_plan,
      'monthly', -- Peut être déterminé par la logique
      0, -- Montant peut être ajouté depuis l'app
      'active',
      NOW(),
      NEW.subscription_expires_at
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour l'historique
DROP TRIGGER IF EXISTS on_subscription_change ON profiles;
CREATE TRIGGER on_subscription_change
  AFTER UPDATE OF subscription_plan ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION record_subscription_activation();
```

## 🚨 Points importants

### Sécurité
- ✅ Le paiement Wave est **simulé** pour les tests
- ⚠️ En production, intégrez la vraie API Wave
- ✅ Les mises à jour utilisent les RLS de Supabase
- ✅ Seul l'utilisateur peut modifier son propre abonnement

### Performance
- ✅ Utilisation de `useSubscriptionSync` pour la synchronisation temps réel
- ✅ Rechargement automatique après activation
- ✅ Animations fluides avec Animated API

### UX
- ✅ Feedback immédiat après paiement
- ✅ Animations engageantes
- ✅ Messages clairs et rassurants
- ✅ Pas d'attente inutile

## 🎨 Personnalisation

### Modifier les durées d'abonnement
```typescript
// Dans subscription-plans.tsx, fonction handleWavePaymentSuccess
const expiresAt = new Date();
if (billingPeriod === 'monthly') {
  expiresAt.setMonth(expiresAt.getMonth() + 1); // ← Modifier ici
} else {
  expiresAt.setFullYear(expiresAt.getFullYear() + 1); // ← Ou ici
}
```

### Personnaliser le simulateur Wave
```typescript
// Dans WavePaymentSimulator.tsx
// Modifier les couleurs
colors={['#1DC8FF', '#0EA5E9']} // ← Couleurs Wave

// Modifier le délai de simulation
setTimeout(() => {
  setStep('success');
}, 2000); // ← 2 secondes par défaut
```

## 📞 Support

Pour toute question :
- Documentation Wave: https://developer.wave.com/docs
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- React Native Animated: https://reactnative.dev/docs/animated

## ✨ Prochaines étapes

1. **Tester le système** avec différents plans
2. **Vérifier** que les dates d'expiration sont correctes
3. **Intégrer** la vraie API Wave pour la production
4. **Ajouter** des notifications push pour l'expiration
5. **Créer** une page d'historique des abonnements

---

**Status**: ✅ Système opérationnel et prêt à tester
**Date**: 2025-12-04
**Version**: 1.0.0
