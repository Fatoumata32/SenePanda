# 🚀 Guide d'installation - Système d'abonnement Wave

## ✅ Ce qui a été fait

1. ❌ **Supprimé** : Icône Settings de la page de connexion
2. ✅ **Créé** : Simulateur de paiement Wave réaliste
3. ✅ **Modifié** : Flux d'abonnement avec activation immédiate
4. ✅ **Créé** : Migration SQL complète pour la base de données

## 📋 Installation en 3 étapes

### Étape 1 : Exécuter la migration SQL

1. Ouvrez votre dashboard Supabase
2. Allez dans **SQL Editor**
3. Créez une nouvelle query
4. Copiez le contenu du fichier : `supabase/migrations/setup_subscription_immediate_activation.sql`
5. Cliquez sur **Run** ▶️

✅ La migration va créer :
- Les colonnes nécessaires dans `profiles`
- Les tables `subscription_history` et `subscription_activation_logs`
- Les fonctions RPC pour gérer les abonnements
- Les triggers pour l'automatisation
- Les index pour les performances

### Étape 2 : Vérifier l'installation

Exécutez cette requête pour vérifier :

```sql
-- Vérifier que tout est bien installé
SELECT
  'Colonnes profiles' AS verification,
  COUNT(*) AS count
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('subscription_plan', 'subscription_expires_at', 'updated_at')

UNION ALL

SELECT
  'Table subscription_history' AS verification,
  COUNT(*) AS count
FROM information_schema.tables
WHERE table_name = 'subscription_history'

UNION ALL

SELECT
  'Fonctions RPC' AS verification,
  COUNT(*) AS count
FROM information_schema.routines
WHERE routine_name IN ('is_subscription_active', 'expire_old_subscriptions', 'get_subscription_status');
```

Résultats attendus :
- Colonnes profiles : 3
- Table subscription_history : 1
- Fonctions RPC : 3

### Étape 3 : Tester l'application

1. Lancez votre application :
   ```bash
   npm start
   ```

2. Connectez-vous avec un compte vendeur

3. Allez dans **Plans d'abonnement**

4. Testez le flux complet :
   - Sélectionnez un plan (Starter, Pro, Premium)
   - Cliquez sur "Choisir ce plan"
   - Vérifiez l'écran de confirmation
   - Cliquez sur "Procéder au paiement"
   - Le simulateur Wave s'ouvre
   - Confirmez le paiement
   - Attendez l'activation (2 secondes)
   - ✅ Vérifiez que l'abonnement est actif !

## 🎯 Fonctionnement du système

### Flux simplifié

```
[Utilisateur] → Sélectionne un plan
              ↓
[App] → Affiche la confirmation
              ↓
[Utilisateur] → Clique "Procéder au paiement"
              ↓
[Simulateur Wave] → S'ouvre avec les détails
              ↓
[Utilisateur] → Confirme le paiement
              ↓
[Simulation] → 2 secondes d'attente
              ↓
[Base de données] → Mise à jour automatique
              ↓
[App] → Affiche le succès
              ↓
✅ [Abonnement actif !]
```

### Données modifiées

Quand un utilisateur s'abonne, le système met à jour :

```typescript
{
  subscription_plan: 'pro',           // Type de plan
  subscription_expires_at: '2026-01-04T...', // Date d'expiration
  updated_at: '2025-12-04T...'       // Date de mise à jour
}
```

### Calcul de la date d'expiration

```typescript
// Mensuel : +1 mois
if (billingPeriod === 'monthly') {
  expiresAt.setMonth(expiresAt.getMonth() + 1);
}

// Annuel : +1 an
else {
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
}
```

## 🔧 Configuration avancée

### Modifier les prix des plans

Les prix sont définis dans la table `subscription_plans` de Supabase :

```sql
-- Voir les plans actuels
SELECT id, name, plan_type, price_monthly, price_yearly
FROM subscription_plans
ORDER BY display_order;

-- Modifier un prix
UPDATE subscription_plans
SET price_monthly = 7500  -- Nouveau prix
WHERE plan_type = 'starter';
```

### Ajouter une notification d'expiration

Créez un cron job Supabase pour envoyer des notifications :

```sql
-- Fonction pour notifier les utilisateurs avant expiration
CREATE OR REPLACE FUNCTION notify_expiring_subscriptions()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Trouver les abonnements qui expirent dans 7 jours
  FOR user_record IN
    SELECT
      p.id,
      p.email,
      p.subscription_plan,
      p.subscription_expires_at
    FROM profiles p
    WHERE
      p.subscription_plan != 'free'
      AND p.subscription_expires_at IS NOT NULL
      AND p.subscription_expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  LOOP
    -- Insérer une notification (à adapter selon votre système)
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      user_record.id,
      'Votre abonnement expire bientôt',
      'Votre abonnement ' || user_record.subscription_plan || ' expire le ' ||
      to_char(user_record.subscription_expires_at, 'DD/MM/YYYY'),
      'subscription_expiring'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Configurer le cron job (à faire dans le dashboard Supabase)
-- Fréquence : Tous les jours à 9h
-- Fonction : notify_expiring_subscriptions()
```

### Activer les logs détaillés

Pour suivre toutes les activations :

```sql
-- Voir les 20 dernières activations
SELECT
  l.created_at,
  p.email,
  l.action,
  l.previous_plan,
  l.new_plan,
  l.amount,
  l.payment_method
FROM subscription_activation_logs l
JOIN profiles p ON p.id = l.user_id
ORDER BY l.created_at DESC
LIMIT 20;
```

## 📊 Monitoring

### Tableau de bord des abonnements

```sql
-- Statistiques globales
SELECT
  subscription_plan,
  COUNT(*) AS total_users,
  COUNT(CASE WHEN subscription_expires_at > NOW() THEN 1 END) AS active_users,
  COUNT(CASE WHEN subscription_expires_at <= NOW() THEN 1 END) AS expired_users
FROM profiles
GROUP BY subscription_plan
ORDER BY
  CASE subscription_plan
    WHEN 'premium' THEN 1
    WHEN 'pro' THEN 2
    WHEN 'starter' THEN 3
    WHEN 'free' THEN 4
  END;
```

### Revenus estimés

```sql
-- Revenus mensuels estimés
SELECT
  SUM(
    CASE subscription_plan
      WHEN 'starter' THEN 5000
      WHEN 'pro' THEN 15000
      WHEN 'premium' THEN 30000
      ELSE 0
    END
  ) AS monthly_revenue,
  COUNT(*) FILTER (WHERE subscription_plan != 'free') AS paying_users
FROM profiles
WHERE subscription_expires_at > NOW();
```

### Taux de conversion

```sql
-- Taux de conversion gratuit → payant
SELECT
  COUNT(*) FILTER (WHERE subscription_plan = 'free') AS free_users,
  COUNT(*) FILTER (WHERE subscription_plan != 'free') AS paid_users,
  ROUND(
    COUNT(*) FILTER (WHERE subscription_plan != 'free')::NUMERIC /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) || '%' AS conversion_rate
FROM profiles;
```

## 🐛 Dépannage

### Problème : L'abonnement ne s'active pas

**Solution 1** : Vérifier les colonnes
```sql
SELECT subscription_plan, subscription_expires_at, updated_at
FROM profiles
WHERE id = 'USER_ID';
```

**Solution 2** : Vérifier les permissions RLS
```sql
-- Vérifier les policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';
```

**Solution 3** : Logs de l'application
```typescript
// Dans subscription-plans.tsx
console.log('✅ Abonnement activé:', {
  plan: selectedPlan.plan_type,
  expires: expiresAt.toISOString()
});
```

### Problème : Le simulateur Wave ne s'ouvre pas

**Vérifier** :
1. Le composant est bien importé : `import WavePaymentSimulator from '@/components/payment/WavePaymentSimulator';`
2. L'état `showWaveSimulator` est initialisé : `const [showWaveSimulator, setShowWaveSimulator] = useState(false);`
3. La méthode de paiement est bien 'wave' : `selectedPaymentMethod === 'wave'`

### Problème : Erreur lors de la mise à jour

**Vérifier les RLS** :
```sql
-- Policy pour permettre aux utilisateurs de mettre à jour leur profil
CREATE POLICY "Users can update own profile subscription"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

## 🚀 Optimisations

### Performance

1. **Index** : Déjà créés par la migration
2. **Cache** : Utiliser `useSubscriptionSync` pour le temps réel
3. **Queries** : Minimiser les appels à la base de données

### Sécurité

1. **RLS** : Activé sur toutes les tables
2. **Validation** : Vérifier les données côté serveur
3. **Logs** : Enregistrer toutes les transactions

### UX

1. **Feedback** : Animations et messages clairs
2. **Erreurs** : Messages d'erreur explicites
3. **Loading** : Indicateurs de chargement

## 📞 Support

**Documentation** :
- `ABONNEMENT_WAVE_SETUP.md` : Documentation complète
- `setup_subscription_immediate_activation.sql` : Migration SQL

**Ressources** :
- [Supabase Docs](https://supabase.com/docs)
- [React Native Animated](https://reactnative.dev/docs/animated)
- [Wave API](https://developer.wave.com/docs)

## ✨ Prochaines étapes recommandées

1. ✅ **Tester** tous les plans (Starter, Pro, Premium)
2. ✅ **Vérifier** les dates d'expiration
3. 🔄 **Intégrer** la vraie API Wave (en production)
4. 📧 **Ajouter** des emails de confirmation
5. 📱 **Ajouter** des notifications push
6. 📊 **Créer** un dashboard vendeur pour voir son abonnement
7. 🔄 **Ajouter** le renouvellement automatique

---

**Version** : 1.0.0
**Date** : 2025-12-04
**Statut** : ✅ Prêt à l'emploi
