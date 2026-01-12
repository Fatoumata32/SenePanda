# 🚀 Installation du Système Live Shopping

## Étape 1 : Appliquer la migration SQL

### Via Supabase Dashboard (Recommandé)

1. **Connectez-vous** à votre dashboard Supabase : https://app.supabase.com
2. **Sélectionnez** votre projet
3. **Allez dans** : SQL Editor (icône SQL dans le menu gauche)
4. **Créez une nouvelle requête**
5. **Copiez-collez** le contenu COMPLET du fichier :
   ```
   supabase/migrations/create_live_shopping_system.sql
   ```
6. **Exécutez** (bouton Run ou Ctrl+Enter)
7. **Vérifiez** : Vous devriez voir "Success. No rows returned"

### Vérification de l'installation

Exécutez cette requête pour vérifier que les tables sont créées :

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'live_%';
```

Vous devriez voir :
- ✅ live_sessions
- ✅ live_featured_products
- ✅ live_chat_messages
- ✅ live_reactions
- ✅ live_viewers
- ✅ live_orders

### Vérification des fonctions RPC

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%live%';
```

Vous devriez voir :
- ✅ start_live_session
- ✅ end_live_session
- ✅ update_viewer_count
- ✅ record_live_view
- ✅ get_active_live_sessions
- ✅ get_live_stats

## Étape 2 : Ajouter le bouton Live pour les Premium

Le bouton "Démarrer un Live" doit apparaître uniquement pour les vendeurs **PREMIUM**.

### Dans `app/seller/my-shop.tsx`

Ajoutez ce code après le header (ligne ~667) :

```typescript
{/* Bouton Live Shopping - Premium Only */}
{profileSubscription?.plan_type === 'premium' && (
  <TouchableOpacity
    style={styles.liveShoppingBanner}
    onPress={() => router.push('/seller/start-live')}
    activeOpacity={0.9}
  >
    <LinearGradient
      colors={['#FF6B6B', '#FF8C42']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.liveShoppingGradient}
    >
      <View style={styles.liveShoppingContent}>
        <View style={styles.liveShoppingIcon}>
          <Video size={32} color={Colors.white} />
        </View>
        <View style={styles.liveShoppingText}>
          <Text style={styles.liveShoppingTitle}>Live Shopping 🔥</Text>
          <Text style={styles.liveShoppingSubtitle}>
            Vendez en direct et boostez vos ventes !
          </Text>
        </View>
        <View style={styles.liveShoppingArrow}>
          <ChevronRight size={24} color={Colors.white} />
        </View>
      </View>
    </LinearGradient>
  </TouchableOpacity>
)}
```

### Ajoutez les imports nécessaires :

```typescript
import { Video, ChevronRight } from 'lucide-react-native';
```

### Ajoutez les styles :

```typescript
liveShoppingBanner: {
  marginHorizontal: Spacing.lg,
  marginTop: Spacing.lg,
  borderRadius: BorderRadius.xl,
  overflow: 'hidden',
  ...Shadows.large,
},
liveShoppingGradient: {
  padding: Spacing.lg,
},
liveShoppingContent: {
  flexDirection: 'row',
  alignItems: 'center',
},
liveShoppingIcon: {
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: Spacing.md,
},
liveShoppingText: {
  flex: 1,
},
liveShoppingTitle: {
  fontSize: Typography.fontSize.lg,
  fontWeight: '800',
  color: Colors.white,
  marginBottom: 4,
},
liveShoppingSubtitle: {
  fontSize: Typography.fontSize.sm,
  color: Colors.white,
  opacity: 0.9,
},
liveShoppingArrow: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  alignItems: 'center',
  justifyContent: 'center',
},
```

## Étape 3 : Ajouter un badge Premium sur le profil

Dans `app/(tabs)/profile.tsx`, ajoutez un badge pour indiquer le plan Premium :

```typescript
{profile?.subscription_plan === 'premium' && (
  <View style={styles.premiumBadge}>
    <LinearGradient
      colors={['#FFD700', '#FF8C00']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.premiumBadgeGradient}
    >
      <Text style={styles.premiumBadgeText}>👑 PREMIUM</Text>
    </LinearGradient>
  </View>
)}
```

## Étape 4 : Tester le système

### Test 1 : Créer une session live

```typescript
// Via l'interface ou directement en SQL :
INSERT INTO live_sessions (seller_id, title, description, status)
VALUES (
  'YOUR_USER_ID',
  'Test Live Shopping',
  'Ceci est un test',
  'scheduled'
);
```

### Test 2 : Démarrer un live

```sql
SELECT start_live_session('SESSION_ID_HERE');
```

### Test 3 : Ajouter un spectateur

```sql
SELECT record_live_view('SESSION_ID_HERE', 'USER_ID_HERE');
```

### Test 4 : Mettre à jour le compteur

```sql
SELECT update_viewer_count('SESSION_ID_HERE');
```

### Test 5 : Récupérer les lives actifs

```sql
SELECT * FROM get_active_live_sessions(10);
```

## Étape 5 : Configuration du streaming vidéo (Optionnel)

Pour le streaming vidéo réel, vous devez intégrer un service tiers :

### Option A : Agora.io (Recommandé)
```bash
npm install react-native-agora
```

**Avantages :**
- ✅ Ultra low latency
- ✅ Excellent pour l'Afrique
- ✅ Gratuit jusqu'à 10K minutes/mois
- ✅ SDK complet React Native

### Option B : Twilio Live
```bash
npm install @twilio/live-player-sdk
```

**Avantages :**
- ✅ Très stable
- ✅ Support excellent
- ✅ Facile à intégrer

### Option C : AWS IVS (Interactive Video Service)
```bash
npm install amazon-ivs-react-native-player
```

**Avantages :**
- ✅ Infrastructure AWS
- ✅ Scalable à l'infini
- ✅ Pay-as-you-go

### Option D : Mux
```bash
npm install @mux/mux-player-react
```

**Avantages :**
- ✅ Simple à utiliser
- ✅ Analytics intégrés
- ✅ CDN mondial

## Étape 6 : Activer les notifications

### Créer une fonction pour notifier les followers

```sql
CREATE OR REPLACE FUNCTION notify_followers_of_live(p_seller_id UUID, p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insérer une notification pour chaque follower
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT
    follower_id,
    'live_started',
    'Live en cours ! 🔴',
    (SELECT shop_name FROM profiles WHERE id = p_seller_id) || ' est en direct !',
    jsonb_build_object('session_id', p_session_id)
  FROM user_follows
  WHERE followed_id = p_seller_id;
END;
$$;
```

### Appeler lors du démarrage d'un live

```typescript
await supabase.rpc('notify_followers_of_live', {
  p_seller_id: sellerId,
  p_session_id: sessionId
});
```

## Étape 7 : Ajouter une section "Lives" dans l'app

### Dans `app/(tabs)/explore.tsx`

Ajoutez une section pour les lives actifs en haut :

```typescript
const { sessions: activeLives } = useActiveLiveSessions(10);

// Dans le render :
{activeLives.length > 0 && (
  <View style={styles.livesSection}>
    <Text style={styles.sectionTitle}>🔴 Lives en cours</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {activeLives.map((live) => (
        <TouchableOpacity
          key={live.id}
          style={styles.liveCard}
          onPress={() => router.push(`/live/${live.id}`)}
        >
          <Image
            source={{ uri: live.thumbnail_url }}
            style={styles.liveThumbnail}
          />
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>🔴 LIVE</Text>
          </View>
          <View style={styles.liveInfo}>
            <Text style={styles.liveTitle}>{live.title}</Text>
            <Text style={styles.liveViewers}>
              👁️ {live.viewer_count}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
)}
```

## 🎉 Checklist de vérification

Avant de lancer en production, vérifiez que :

- [ ] ✅ La migration SQL est appliquée sans erreur
- [ ] ✅ Les 6 tables sont créées
- [ ] ✅ Les 6 fonctions RPC fonctionnent
- [ ] ✅ Le bouton Live apparaît pour les Premium
- [ ] ✅ Les hooks React sont importés
- [ ] ✅ La page start-live.tsx est fonctionnelle
- [ ] ✅ Les policies RLS sont actives
- [ ] ✅ Les index sont créés pour les performances
- [ ] ✅ Le système de notifications est configuré
- [ ] ✅ (Optionnel) Le streaming vidéo est intégré

## 📊 Monitoring & Analytics

### Requête pour voir les statistiques

```sql
SELECT
  COUNT(*) as total_lives,
  SUM(viewer_count) as total_current_viewers,
  SUM(peak_viewer_count) as total_peak_viewers,
  SUM(total_views) as total_views,
  SUM(total_sales) as total_sales,
  SUM(total_orders) as total_orders
FROM live_sessions
WHERE status = 'live';
```

### Top vendeurs en live

```sql
SELECT
  p.shop_name,
  COUNT(ls.id) as live_count,
  SUM(ls.total_sales) as total_revenue,
  AVG(ls.viewer_count) as avg_viewers
FROM live_sessions ls
JOIN profiles p ON ls.seller_id = p.id
WHERE ls.status = 'ended'
GROUP BY p.shop_name
ORDER BY total_revenue DESC
LIMIT 10;
```

## 🆘 Troubleshooting

### Erreur : "Cannot find project ref"
→ Utilisez le dashboard Supabase pour exécuter la migration SQL

### Erreur : "Permission denied for table"
→ Vérifiez que les RLS policies sont bien créées

### Le compteur de spectateurs ne s'actualise pas
→ Vérifiez que le heartbeat fonctionne (20s)

### Les messages du chat n'apparaissent pas
→ Vérifiez que Realtime est activé dans Supabase

### Le bouton Live n'apparaît pas
→ Vérifiez que `subscription_plan === 'premium'`

## 🚀 Prêt à lancer !

Une fois toutes ces étapes complétées, votre système Live Shopping est **opérationnel** !

Les vendeurs Premium peuvent maintenant :
- 🔴 Lancer des lives en 1 clic
- 💬 Chatter avec les clients
- 🎁 Vendre en temps réel
- 📊 Voir les stats live
- 🔥 Booster leurs ventes de 300% !

**Bienvenue dans le futur du e-commerce ! 🎉**
