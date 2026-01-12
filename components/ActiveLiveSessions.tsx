import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Video, Eye, Users, Sparkles } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { useActiveLiveSessions } from '@/hooks/useLiveShopping';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

function ActiveLiveSessions() {
  const router = useRouter();
  const { sessions, isLoading } = useActiveLiveSessions(10);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (sessions && sessions.length > 0) {
      // Animation de pulsation pour attirer l'attention
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [sessions]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={Colors.primaryOrange} />
      </View>
    );
  }

  if (!sessions || sessions.length === 0) {
    return null; // Ne rien afficher s'il n'y a pas de lives
  }

  const handleLivePress = (sessionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Agora pour Expo Go (interface compatible)
    router.push({
      pathname: '/(tabs)/live-viewer/[id]',
      params: { id: sessionId }
    } as any);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255, 107, 107, 0.1)', 'rgba(255, 140, 66, 0.05)', 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Animated.View style={[styles.titleContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.iconWrapper}>
              <Video size={22} color="#FF6B6B" strokeWidth={2.5} />
              <View style={styles.pulseDot} />
            </View>
            <Text style={styles.title}>🔥 Lives Shopping</Text>
            <View style={styles.liveBadge}>
              <Sparkles size={12} color="#FFD93D" fill="#FFD93D" />
              <Text style={styles.liveText}>EN DIRECT</Text>
            </View>
          </Animated.View>
        </View>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={180}
      >
        {sessions.map((session, index) => (
          <TouchableOpacity
            key={session.id}
            style={styles.liveCard}
            onPress={() => handleLivePress(session.id)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8C42', '#FFD93D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Overlay semi-transparent */}
              <View style={styles.cardOverlay}>
                {/* Badge LIVE animé */}
                <Animated.View style={[styles.liveBadgeCard, { transform: [{ scale: pulseAnim }] }]}>
                  <View style={styles.liveIndicatorCard} />
                  <Text style={styles.liveTextCard}>LIVE</Text>
                  <Sparkles size={10} color="#FFD93D" fill="#FFD93D" />
                </Animated.View>

                {/* Icône vidéo principale */}
                <View style={styles.videoIconContainer}>
                  <View style={styles.videoIconBg}>
                    <Video size={40} color="#fff" strokeWidth={2} />
                  </View>
                </View>

                {/* Titre de la session */}
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle} numberOfLines={2}>
                    {session.title || 'Live Shopping'}
                  </Text>
                  <Text style={styles.sessionSubtitle} numberOfLines={1}>
                    {session.seller_name || 'Vendeur'}
                  </Text>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Users size={16} color="#fff" strokeWidth={2} />
                    <Text style={styles.statText}>{session.viewer_count || 0}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Eye size={16} color="#fff" strokeWidth={2} />
                    <Text style={styles.statText}>Regarder</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.lg,
  },
  headerGradient: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    marginBottom: 0,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrapper: {
    position: 'relative',
  },
  pulseDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF6B6B',
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6B6B',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: 16,
  },
  liveCard: {
    width: 170,
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.large,
  },
  cardGradient: {
    flex: 1,
  },
  cardOverlay: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  liveBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  liveIndicatorCard: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveTextCard: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  videoIconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIconBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  sessionInfo: {
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sessionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});

export default ActiveLiveSessions;
