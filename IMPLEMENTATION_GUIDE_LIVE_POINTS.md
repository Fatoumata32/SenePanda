# GUIDE D'IMPLÉMENTATION - LIVE POINTS & ACHIEVEMENTS

Version: 1.0.0
Date: Janvier 2025
Auteur: Claude Sonnet 4.5

---

## 📋 SOMMAIRE

1. Vue d'ensemble des améliorations
2. Système de points pendant les lives
3. Système de badges et achievements
4. Intégration dans l'application
5. Configuration base de données
6. Tests et validation
7. Troubleshooting

---

## 1. VUE D'ENSEMBLE DES AMÉLIORATIONS

### Fonctionnalités ajoutées

✅ **Points gagnés pendant les lives** (2 pts/min de visionnage)
✅ **Points pour interactions** (messages, réactions, achats)
✅ **Système de badges** avec 18 achievements déblocables
✅ **Progression animée** avec pourcentages et barres
✅ **Tracking automatique** du temps de visionnage
✅ **Récompenses en points** pour chaque badge débloqué

### Fichiers créés

```
project/
├── supabase/migrations/
│   ├── add_live_points_system.sql        # Système points live
│   └── add_badges_achievements_system.sql # Système badges
├── hooks/
│   ├── useLivePoints.ts                   # Hook points live
│   └── useAchievements.ts                 # Hook achievements
└── components/
    └── AchievementBadge.tsx               # Badge animé (existait déjà)
```

---

## 2. SYSTÈME DE POINTS PENDANT LES LIVES

### 2.1 Tables créées

**live_viewing_sessions**
- Tracking de chaque session de visionnage
- Points gagnés par type (watching, messages, reactions, purchase)
- Stats détaillées (temps total, interactions)

### 2.2 Fonctions SQL

```sql
-- Enregistrer/récupérer une session
record_live_view_session(p_live_session_id, p_viewer_id)

-- Mettre à jour le temps de visionnage (appelé toutes les 30s)
update_live_watch_time(p_live_session_id, p_viewer_id, p_seconds_watched)

-- Attribuer points pour interactions
award_live_interaction_points(p_live_session_id, p_viewer_id, p_interaction_type)
-- Types: 'message' (1pt), 'reaction' (1pt), 'purchase' (50pts)

-- Terminer une session
end_live_viewing_session(p_live_session_id, p_viewer_id)
```

### 2.3 Barème de points

| Action | Points |
|--------|--------|
| 1 minute de visionnage | 2 pts |
| Message dans le chat | 1 pt |
| Réaction envoyée | 1 pt |
| Achat pendant le live | 50 pts |

### 2.4 Utilisation du hook useLivePoints

```typescript
import { useLivePoints } from '@/hooks/useLivePoints';

function LiveViewer({ liveSessionId }: { liveSessionId: string }) {
  const {
    pointsEarned,           // Points totaux et détails
    isTracking,             // État du tracking
    startTracking,          // Démarrer manuellement
    stopTracking,           // Arrêter manuellement
    awardInteractionPoints, // Attribuer points pour action
  } = useLivePoints(liveSessionId, true); // true = auto-start

  // Exemple: attribuer points pour un message
  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
    await awardInteractionPoints('message');
  };

  return (
    <View>
      <Text>Points gagnés: {pointsEarned.totalPoints}</Text>
      <Text>Temps regardé: {Math.floor(pointsEarned.watchTime / 60)}min</Text>
    </View>
  );
}
```

### 2.5 Tracking automatique

Le hook démarre automatiquement le tracking quand `autoTrack=true`:
- ✅ Enregistre le début de la session
- ✅ Incrémente toutes les 10 secondes en local
- ✅ Envoie au serveur toutes les 30 secondes
- ✅ Calcule et attribue les points (2pts/min)
- ✅ Termine proprement au démontage

---

## 3. SYSTÈME DE BADGES ET ACHIEVEMENTS

### 3.1 Tables créées

**achievement_definitions**
- 18 achievements prédéfinis
- 4 catégories: shopping, live, social, points
- 4 niveaux de rareté: common, rare, epic, legendary

**user_achievements**
- Progression pour chaque utilisateur
- État débloqué/verrouillé
- Pourcentage de complétion

### 3.2 Achievements disponibles

#### 🛒 Shopping (4 badges)
- **Premier Achat** (100 pts) - Effectuer 1 achat
- **Acheteur Régulier** (500 pts) - Effectuer 10 achats
- **Gros Dépensier** (1000 pts) - Dépenser 100,000 FCFA
- **Maître du Panier** (2500 pts) - Effectuer 50 achats

#### 📺 Live Shopping (7 badges)
- **Premier Live** (50 pts) - Regarder 1 live
- **Fan de Live** (300 pts) - Regarder 10 lives
- **Accro au Live** (1500 pts) - Regarder 50 lives
- **VIP Live Shopping** (5000 pts) - Regarder 100 lives
- **Lève-tôt** (200 pts) - Top 10 premiers spectateurs
- **Acheteur Live** (1000 pts) - 5 achats pendant un live
- **Maître du Chat** (400 pts) - 100 messages envoyés

#### 👥 Social (4 badges)
- **Premier Filleul** (200 pts) - Parrainer 1 ami
- **Influenceur** (1500 pts) - Parrainer 5 amis
- **Ambassadeur** (5000 pts) - Parrainer 20 amis
- **Expert Avis** (300 pts) - 10 avis produits

#### 💰 Points & Streak (5 badges)
- **Bienvenue !** (50 pts) - Première connexion
- **Assidu** (500 pts) - Streak de 7 jours
- **Fidèle** (2000 pts) - Streak de 30 jours
- **Collectionneur** (1000 pts) - 10,000 points accumulés
- **Roi des Points** (5000 pts) - 50,000 points accumulés

### 3.3 Fonctions SQL

```sql
-- Initialiser achievements pour nouveau user (automatique)
initialize_user_achievements(p_user_id)

-- Mettre à jour progression d'un achievement
update_achievement_progress(p_user_id, p_achievement_code, p_increment)

-- Récupérer résumé complet avec progression
get_user_achievements_summary(p_user_id)
```

### 3.4 Utilisation du hook useAchievements

```typescript
import { useAchievements } from '@/hooks/useAchievements';

function MyComponent() {
  const {
    summary,              // Résumé complet
    loading,              // État chargement
    trackPurchase,        // Tracker un achat
    trackLiveView,        // Tracker une vue de live
    trackChatMessage,     // Tracker un message
    getUnlockedAchievements, // Filtres
  } = useAchievements();

  // Exemple: tracker un achat
  const handlePurchase = async (amount: number) => {
    await processPayment();
    await trackPurchase(amount);
  };

  return (
    <View>
      <Text>Badges débloqués: {summary?.unlocked_achievements}/{summary?.total_achievements}</Text>
      <Text>Complétion: {summary?.completion_percentage}%</Text>
    </View>
  );
}
```

### 3.5 Helpers de tracking

Le hook fournit des helpers pour chaque type d'achievement:

```typescript
// Shopping
await trackPurchase(amount); // Met à jour tous les achievements shopping

// Live
await trackLiveView();        // +1 live regardé
await trackLivePurchase();    // +1 achat pendant live
await trackChatMessage();     // +1 message chat
await trackEarlyBird();       // Débloquer early bird

// Social
await trackReferral();        // +1 filleul
await trackReview();          // +1 avis produit

// Streak & Points
await trackLogin();           // Première connexion
await trackStreak(days);      // Mettre à jour streak
await trackPoints(total);     // Vérifier paliers points
```

---

## 4. INTÉGRATION DANS L'APPLICATION

### 4.1 Dans le Live Viewer (spectateur)

**Fichier:** `app/(tabs)/live-viewer/[id].tsx` (à créer) ou intégrer dans le viewer existant

```typescript
import { useLivePoints } from '@/hooks/useLivePoints';
import { useAchievements } from '@/hooks/useAchievements';

export default function LiveViewerScreen() {
  const { id } = useLocalSearchParams();
  const { trackLiveView, trackChatMessage, trackLivePurchase } = useAchievements();
  const {
    pointsEarned,
    awardInteractionPoints,
  } = useLivePoints(id as string, true);

  // Démarrage: tracker vue de live
  useEffect(() => {
    trackLiveView();
  }, []);

  // Envoyer message
  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
    await awardInteractionPoints('message');
    await trackChatMessage();
  };

  // Envoyer réaction
  const handleReaction = async (type: string) => {
    await sendReaction(type);
    await awardInteractionPoints('reaction');
  };

  // Achat pendant live
  const handlePurchase = async (productId: string) => {
    await processPurchase(productId);
    await awardInteractionPoints('purchase');
    await trackLivePurchase();
  };

  return (
    <View>
      {/* UI existante */}

      {/* Widget points gagnés */}
      <View style={styles.pointsWidget}>
        <Sparkles size={16} color="#FFD700" />
        <Text style={styles.pointsText}>
          +{pointsEarned.totalPoints} pts ce live
        </Text>
      </View>
    </View>
  );
}
```

### 4.2 Page Achievements

**Fichier:** `app/(tabs)/achievements.tsx` (à créer)

```typescript
import { useAchievements } from '@/hooks/useAchievements';
import AchievementBadge from '@/components/AchievementBadge';

export default function AchievementsScreen() {
  const { summary, loading, getAchievementsByCategory } = useAchievements();

  if (loading) return <LoadingIndicator />;

  return (
    <ScrollView>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Badges</Text>
        <Text style={styles.progress}>
          {summary?.unlocked_achievements}/{summary?.total_achievements} débloqués
        </Text>
        <ProgressBar
          progress={summary?.completion_percentage || 0}
          color="#FFD700"
        />
      </View>

      <Section title="🛒 Shopping">
        {getAchievementsByCategory('shopping').map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            icon={() => <Text>{achievement.icon}</Text>}
            title={achievement.name}
            description={achievement.description}
            unlocked={achievement.is_unlocked}
            progress={achievement.percentage}
            color={achievement.color}
          />
        ))}
      </Section>

      {/* Répéter pour live, social, points */}
    </ScrollView>
  );
}
```

### 4.3 Notification de badge débloqué

```typescript
import { Alert } from 'react-native';

const { updateProgress } = useAchievements();

const checkAchievement = async (code: string) => {
  const result = await updateProgress(code);

  if (result?.newly_unlocked) {
    Alert.alert(
      '🎉 Badge Débloqué !',
      `${result.name}\n\n+${result.pointsReward} points`,
      [{ text: 'Cool !' }]
    );
  }
};
```

---

## 5. CONFIGURATION BASE DE DONNÉES

### 5.1 Appliquer les migrations

**Via Supabase Dashboard:**

1. Aller dans SQL Editor
2. Créer une nouvelle query
3. Copier le contenu de `add_live_points_system.sql`
4. Exécuter
5. Répéter avec `add_badges_achievements_system.sql`

**Via Supabase CLI:**

```bash
# Appliquer migration points live
supabase db push --file supabase/migrations/add_live_points_system.sql

# Appliquer migration badges
supabase db push --file supabase/migrations/add_badges_achievements_system.sql
```

### 5.2 Vérifications post-migration

```sql
-- Vérifier tables créées
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('live_viewing_sessions', 'achievement_definitions', 'user_achievements');

-- Vérifier achievements insérés
SELECT COUNT(*) FROM achievement_definitions WHERE is_active = TRUE;
-- Devrait retourner 18

-- Tester fonction pour un user
SELECT * FROM get_user_achievements_summary('user-uuid-here');
```

### 5.3 Initialiser achievements pour users existants

```sql
-- Pour tous les users existants
INSERT INTO user_achievements (user_id, achievement_id, current_progress, required_progress)
SELECT
  p.id as user_id,
  ad.id as achievement_id,
  0 as current_progress,
  ad.requirement_value as required_progress
FROM profiles p
CROSS JOIN achievement_definitions ad
WHERE ad.is_active = TRUE
ON CONFLICT (user_id, achievement_id) DO NOTHING;
```

---

## 6. TESTS ET VALIDATION

### 6.1 Tests manuels - Points Live

```typescript
// 1. Démarrer un live (vendeur)
// 2. Rejoindre en tant que spectateur (viewer)
// 3. Vérifier tracking automatique

// Après 1 minute:
const { data } = await supabase
  .from('live_viewing_sessions')
  .select('*')
  .eq('viewer_id', viewerId)
  .single();

console.log('Watch time:', data.total_watch_time_seconds); // ~60s
console.log('Points from watching:', data.points_from_watching); // ~2pts

// 4. Envoyer un message
await awardInteractionPoints('message');
// Vérifier: points_from_messages += 1

// 5. Envoyer une réaction
await awardInteractionPoints('reaction');
// Vérifier: points_from_reactions += 1

// 6. Effectuer un achat
await awardInteractionPoints('purchase');
// Vérifier: points_from_purchase += 50
```

### 6.2 Tests manuels - Achievements

```typescript
// 1. Vérifier initialisation
const { summary } = useAchievements();
console.log('Total achievements:', summary?.total_achievements); // 18

// 2. Tester premier achat
await trackPurchase(5000);
// Badge "Premier Achat" devrait se débloquer

// 3. Tester progression
await updateProgress('shopping_spree', 1);
// Vérifier current_progress = 1, required_progress = 10

// 4. Tester streak
await trackStreak(7);
// Badge "Assidu" devrait se débloquer
```

### 6.3 Tests de performance

```sql
-- Vérifier index
EXPLAIN ANALYZE
SELECT * FROM live_viewing_sessions
WHERE viewer_id = 'user-uuid' AND left_at IS NULL;

-- Devrait utiliser idx_live_viewing_sessions_viewer

-- Tester avec charge
-- Simuler 100 spectateurs simultanés
-- Temps de réponse < 100ms par requête
```

---

## 7. TROUBLESHOOTING

### Problème: Points ne s'accumulent pas

**Diagnostic:**
```sql
-- Vérifier session active
SELECT * FROM live_viewing_sessions
WHERE viewer_id = 'user-uuid'
AND left_at IS NULL;

-- Vérifier dernière mise à jour
SELECT updated_at, total_watch_time_seconds
FROM live_viewing_sessions
WHERE id = 'session-uuid';
```

**Solution:**
- Vérifier que `useLivePoints` est appelé avec `autoTrack=true`
- Vérifier logs console pour erreurs
- Vérifier que le user est bien authentifié

### Problème: Achievements non initialisés

**Diagnostic:**
```sql
-- Compter achievements pour un user
SELECT COUNT(*) FROM user_achievements
WHERE user_id = 'user-uuid';
-- Devrait être 18
```

**Solution:**
```sql
-- Réinitialiser pour un user
DELETE FROM user_achievements WHERE user_id = 'user-uuid';
SELECT initialize_user_achievements('user-uuid');
```

### Problème: Badge ne se débloque pas

**Diagnostic:**
```typescript
// Vérifier progression
const { data } = await supabase.rpc('update_achievement_progress', {
  p_user_id: userId,
  p_achievement_code: 'first_purchase',
  p_increment: 1
});

console.log('Achievement response:', data);
```

**Solution:**
- Vérifier que le code d'achievement est correct
- Vérifier que required_progress est atteint
- Vérifier les logs SQL dans Supabase Dashboard

### Problème: Performances dégradées

**Symptômes:**
- Lenteur dans l'interface live
- Latence dans l'attribution des points

**Solutions:**
1. Augmenter intervalle de mise à jour (30s → 60s)
2. Vérifier les index SQL
3. Activer le pooling Supabase
4. Monitorer avec Supabase Analytics

---

## 8. PROCHAINES ÉTAPES

### Améliorations suggérées

1. **Notifications push**
   - Alerter quand badge débloqué
   - Notification quotidienne de streak

2. **Leaderboard**
   - Classement par points totaux
   - Classement par badges débloqués

3. **Événements spéciaux**
   - Double points certains jours
   - Challenges hebdomadaires

4. **Partage social**
   - Partager badges sur réseaux sociaux
   - Carte de visite avec achievements

5. **Analytics vendeur**
   - Voir quels spectateurs sont les plus engagés
   - Stats de rétention basées sur les points

---

## SUPPORT

Pour toute question ou problème:
- **Slack:** #senepanda-dev
- **Email:** tech@senepanda.com
- **Docs:** Consulter DOCUMENTATION_TECHNIQUE_TEXTE.md

**Dernière mise à jour:** Janvier 2025
**Version:** 1.0.0
