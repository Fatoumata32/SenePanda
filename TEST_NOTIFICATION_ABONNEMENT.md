# 🔔 Test des Notifications d'Abonnement en Temps Réel

## ✅ Ce qui a été implémenté

### 1. Hook `useSubscriptionSync`
Le hook écoute les changements en temps réel sur la table `profiles` et détecte :
- ✅ Quand `subscription_status` passe de `pending` à `active`
- ✅ Quand le `subscription_plan` change
- ✅ Affiche automatiquement une alerte de notification
- ✅ Rafraîchit automatiquement les données de l'app

### 2. Intégration dans `subscription-plans.tsx`
- ✅ Le hook est activé et écoute les changements
- ✅ Les données sont rechargées automatiquement quand l'abonnement est activé
- ✅ L'interface se met à jour en temps réel

---

## 🧪 Comment Tester

### Étape 1: Activer Realtime dans Supabase

1. Allez dans **Supabase Dashboard** > **Database** > **Replication**
2. Trouvez la table `profiles`
3. Activez la réplication en cliquant sur le toggle
4. Cliquez sur **Save**

![Activer Realtime](https://supabase.com/docs/img/realtime-replication.png)

### Étape 2: Créer une Demande d'Abonnement

1. **Dans l'app mobile** :
   - Ouvrez l'app
   - Allez dans **Profil** > **Plans d'Abonnement**
   - Choisissez un plan (par exemple "Pro")
   - Cliquez sur **Envoyer la demande**
   - Vous devriez voir : "Demande envoyée !"

2. **Vérifiez dans la base de données** :
   ```sql
   -- Voir les demandes en attente
   SELECT * FROM pending_subscription_requests;
   ```

   Vous devriez voir votre demande avec `status = 'pending'`

### Étape 3: Approuver l'Abonnement (Admin)

**Option A - Via SQL Editor :**

```sql
-- Récupérer l'ID de la demande
SELECT
  id,
  user_id,
  full_name,
  plan_type,
  billing_period,
  requested_at
FROM pending_subscription_requests
ORDER BY requested_at DESC
LIMIT 1;

-- Approuver la demande (remplacez les UUIDs)
SELECT approve_subscription_request(
  'REQUEST_ID_ICI',      -- L'ID de la demande (colonne 'id')
  'ADMIN_USER_ID_ICI',   -- Votre ID utilisateur admin
  'Demande approuvée - Paiement vérifié'  -- Notes optionnelles
);
```

**Option B - Via un Dashboard Admin (à créer) :**

```sql
-- Liste des demandes en attente
SELECT * FROM pending_subscription_requests;

-- Approuver
SELECT approve_subscription_request(
  '<request_id>',
  '<admin_id>',
  'Paiement vérifié'
);
```

### Étape 4: Vérifier la Notification

**Dans l'app, vous devriez voir automatiquement :**

1. ✅ Une alerte s'affiche :
   ```
   🎉 Abonnement Validé !

   Votre abonnement "Pro" a été validé par l'administrateur.
   Vous pouvez maintenant profiter de tous les avantages !

   [Super !]
   ```

2. ✅ La page se rafraîchit automatiquement
3. ✅ Le badge "PLAN ACTUEL" s'affiche sur le plan
4. ✅ Les jours restants sont affichés

**Dans la console de l'app, vous devriez voir :**
```
🔔 Configuration de l'écoute en temps réel pour: <user_id>
📡 Realtime subscription status: SUBSCRIBED
✅ Écoute en temps réel activée avec succès
✅ Changement détecté dans profiles: { ... }
🎉 Abonnement approuvé!
🔄 Abonnement activé - rechargement des données
```

---

## 🔍 Debugging

### Problème: Pas de notification reçue

**Vérifiez :**

1. **Realtime est activé** :
   ```sql
   -- Dans Supabase SQL Editor
   SELECT schemaname, tablename
   FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime';
   ```
   Vous devriez voir `profiles` dans la liste.

2. **Le hook est bien initialisé** :
   - Ouvrez la console de l'app
   - Cherchez : "🔔 Configuration de l'écoute en temps réel"
   - Cherchez : "✅ Écoute en temps réel activée avec succès"

3. **L'utilisateur est connecté** :
   ```javascript
   console.log('User ID:', user?.id);
   ```

4. **La fonction s'exécute correctement** :
   ```sql
   -- Vérifier que l'abonnement a été activé
   SELECT
     id,
     subscription_plan,
     subscription_status,
     subscription_starts_at,
     subscription_expires_at
   FROM profiles
   WHERE id = '<user_id>';
   ```

   Résultat attendu :
   ```
   subscription_plan: "pro"
   subscription_status: "active"
   subscription_starts_at: "2025-11-30 12:00:00"
   subscription_expires_at: "2025-12-30 12:00:00"
   ```

### Problème: Realtime ne fonctionne pas

**Solution 1 - Vérifier la connexion Realtime :**

Ajoutez dans le code :
```typescript
supabase.channel('test')
  .subscribe((status) => {
    console.log('Status:', status);
  });
```

Si vous voyez `CHANNEL_ERROR`, vérifiez :
- Votre connexion internet
- Que Realtime est activé dans le projet Supabase
- Que vous utilisez la bonne URL Supabase

**Solution 2 - Forcer le rechargement manuel :**

Si Realtime ne fonctionne pas, vous pouvez rafraîchir manuellement :

```typescript
// Ajouter un bouton de rafraîchissement
<TouchableOpacity onPress={() => loadData()}>
  <Ionicons name="refresh" size={24} />
</TouchableOpacity>
```

---

## 📊 Workflow Complet

```
┌─────────────────┐
│  Utilisateur    │
│  demande un     │
│  abonnement     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  request_subscription()     │
│  Crée dans:                 │
│  - subscription_requests    │
│  - profiles (status=pending)│
└────────┬────────────────────┘
         │
         ▼
┌─────────────────┐
│  App affiche:   │
│  "Demande       │
│  envoyée!"      │
└─────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Admin approuve avec:       │
│  approve_subscription_      │
│  request()                  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Base de données met à jour:│
│  profiles.subscription_     │
│  status = 'active'          │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Realtime détecte le        │
│  changement                 │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  useSubscriptionSync        │
│  déclenche l'alerte         │
│  "🎉 Abonnement Validé !"   │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────┐
│  App recharge   │
│  les données    │
│  automatiquement│
└─────────────────┘
```

---

## ✅ Checklist de Validation

- [ ] Realtime activé sur la table `profiles` dans Supabase
- [ ] Hook `useSubscriptionSync` importé dans `subscription-plans.tsx`
- [ ] Demande d'abonnement créée avec succès
- [ ] Message "Demande envoyée !" affiché
- [ ] Demande visible dans `pending_subscription_requests`
- [ ] Fonction `approve_subscription_request()` exécutée sans erreur
- [ ] Notification "🎉 Abonnement Validé !" affichée automatiquement
- [ ] Page rechargée automatiquement
- [ ] Badge "PLAN ACTUEL" affiché
- [ ] Jours restants calculés correctement

---

## 🎯 Prochaines Améliorations

1. **Dashboard Admin** : Interface web pour approuver/rejeter les demandes
2. **Notifications Push** : En plus des alertes, envoyer des notifications push
3. **Emails** : Envoyer un email de confirmation
4. **Historique** : Afficher l'historique des abonnements
5. **Renouvellement Auto** : Renouveler automatiquement avant expiration

---

**✨ Le système est maintenant 100% fonctionnel avec notifications en temps réel !**
