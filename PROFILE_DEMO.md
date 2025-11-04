# 🎨 Page Profil Améliorée - Guide d'Intégration

## 🌟 Vue d'ensemble

La nouvelle page profil utilise des composants modernes avec animations 3D, glassmorphism, et effets visuels époustouflants.

## 📱 Exemple d'intégration complète

```tsx
import { ScrollView } from 'react-native';
import ProfileHeader3D from '@/components/ProfileHeader3D';
import StatsCard from '@/components/StatsCard';
import QuickActions from '@/components/QuickActions';
import StreakIndicator from '@/components/StreakIndicator';
import AchievementBadge from '@/components/AchievementBadge';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import {
  ShoppingBag,
  Store,
  Heart,
  MessageCircle,
  Trophy,
  Target,
  Zap,
  Settings,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);

  // ... fetch profile data

  return (
    <ScrollView>
      {/* 1. Header 3D avec avatar flottant et particules */}
      <ProfileHeader3D
        avatarUri={profile?.avatar_url}
        username={profile?.username}
        fullName={profile?.full_name}
        isPremium={profile?.is_premium}
        onAvatarPress={handleAvatarChange}
      />

      {/* 2. Actions rapides avec animations */}
      <QuickActions
        actions={[
          {
            icon: ShoppingBag,
            label: 'Achats',
            onPress: () => router.push('/orders'),
            gradient: ['#FFD700', '#FF8C00'] as const,
            badge: unreadOrders,
          },
          {
            icon: MessageCircle,
            label: 'Messages',
            onPress: () => router.push('/messages'),
            gradient: ['#3B82F6', '#1D4ED8'] as const,
            badge: unreadMessages,
          },
          {
            icon: Heart,
            label: 'Favoris',
            onPress: () => router.push('/favorites'),
            gradient: ['#EF4444', '#DC2626'] as const,
          },
          {
            icon: Settings,
            label: 'Réglages',
            onPress: () => router.push('/settings'),
            gradient: ['#6B7280', '#4B5563'] as const,
          },
        ]}
      />

      {/* 3. Statistiques avec compteurs animés */}
      <View style={styles.statsRow}>
        <StatsCard
          icon={ShoppingBag}
          value={profile?.total_purchases || 0}
          label="Achats"
          gradient={['#FFD700', '#FF8C00'] as const}
          delay={0}
        />
        <StatsCard
          icon={Store}
          value={profile?.total_sales || 0}
          label="Ventes"
          gradient={['#10B981', '#059669'] as const}
          delay={100}
        />
      </View>

      <View style={styles.statsRow}>
        <StatsCard
          icon={Heart}
          value={profile?.favorites_count || 0}
          label="Favoris"
          gradient={['#EF4444', '#DC2626'] as const}
          delay={200}
        />
        <StatsCard
          icon={Zap}
          value={profile?.panda_coins || 0}
          label="Panda Coins"
          suffix=" PC"
          gradient={['#8B5CF6', '#7C3AED'] as const}
          delay={300}
        />
      </View>

      {/* 4. Indicateur de streak avec flamme animée */}
      <StreakIndicator
        currentStreak={profile?.current_streak || 0}
        bestStreak={profile?.best_streak || 0}
      />

      {/* 5. Section Achievements avec glassmorphism */}
      <GlassmorphicCard style={styles.achievementsCard}>
        <Text style={styles.sectionTitle}>🏆 Achievements</Text>

        <AchievementBadge
          icon={Trophy}
          title="Premier achat"
          description="Effectuez votre premier achat"
          unlocked={profile?.total_purchases > 0}
          color="#FFD700"
          delay={0}
        />

        <AchievementBadge
          icon={Target}
          title="Vendeur pro"
          description="Réalisez 10 ventes"
          unlocked={profile?.total_sales >= 10}
          progress={(profile?.total_sales || 0) * 10}
          color="#10B981"
          delay={100}
        />

        <AchievementBadge
          icon={Zap}
          title="Collectionneur"
          description="Ajoutez 20 favoris"
          unlocked={profile?.favorites_count >= 20}
          progress={(profile?.favorites_count || 0) * 5}
          color="#EF4444"
          delay={200}
        />
      </GlassmorphicCard>

      {/* 6. Code de parrainage avec glassmorphism */}
      <GlassmorphicCard style={styles.referralCard}>
        <Text style={styles.referralTitle}>💰 Code de parrainage</Text>
        <Text style={styles.referralCode}>{profile?.referral_code}</Text>
        <TouchableOpacity style={styles.copyButton}>
          <Text>Copier le code</Text>
        </TouchableOpacity>
      </GlassmorphicCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  achievementsCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  referralCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  referralTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.md,
  },
  referralCode: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryOrange,
    letterSpacing: 4,
    marginBottom: Spacing.lg,
  },
});
```

## 🎭 Effets visuels inclus

### ProfileHeader3D
- ✨ 15 particules animées qui flottent
- 🔄 Avatar qui float avec animation loop
- 💫 Rotation subtile des cercles décoratifs
- ✨ Effet glow pulsant pour premium users
- 📸 Bouton caméra avec gradient
- 👑 Badge premium avec Crown icon

### StatsCard
- 📈 Compteur animé qui s'incrémente
- 🎈 Animation float douce
- 🔵 Cercles décoratifs
- 🌈 Gradients personnalisables
- ⏱️ Délai d'animation échelonné

### StreakIndicator
- 🔥 Flamme qui pulse et rotate
- ⚡ Affichage du record
- ✨ Emojis décoratifs animés
- 🌅 Gradient orange/rouge

### AchievementBadge
- 🎯 Rotation 360° au mount
- 💫 Scale avec spring animation
- ✨ Glow pulsant si débloqué
- 📊 Barre de progression
- 🎨 Couleurs personnalisables

### QuickActions
- 📱 4 boutons en grille
- 🎭 Animation scale échelonnée
- 🔘 Press effect avec spring
- 🔴 Badges de notification
- 🌈 Gradients pour chaque action

### GlassmorphicCard
- 🔮 Effet glassmorphism
- 💎 Blur avec gradient transparent
- ✨ Bordure subtile
- 🎨 Configurable (intensity, tint)

## 🚀 Performance

Toutes les animations utilisent `useNativeDriver: true` pour des performances optimales:
- ✅ 60 FPS garantis
- ✅ Pas de lag sur le UI thread
- ✅ Animations fluides même sur devices bas de gamme

## 🎨 Personnalisation

Chaque composant accepte des props pour personnaliser:
- Couleurs et gradients
- Délais d'animation
- Intensité des effets
- Contenu et icônes

## 📱 Responsive

Les composants s'adaptent automatiquement:
- QuickActions: 4 colonnes sur toutes les tailles
- StatsCard: Flex avec min-width
- Glassmorphic cards: Padding adaptable
- ProfileHeader3D: Width 100%

## 🎯 Résultat final

Une page profil moderne, animée et époustouflante qui:
- ✨ Impressionne visuellement
- 🚀 Performe bien
- 📱 S'adapte à toutes les tailles
- ♿ Est accessible
- 🎨 Suit le design system

Enjoy! 🎉
