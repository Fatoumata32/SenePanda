import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

const LAST_LOGIN_CHECK_KEY = '@senepanda_last_login_check_v2';

/**
 * Composant invisible qui gère automatiquement:
 * - Le tracking de connexion quotidienne
 * - L'attribution des points de streak
 * - Le bonus de bienvenue pour les nouveaux utilisateurs
 *
 * À placer dans le layout principal de l'app
 */
export default function DailyLoginTracker() {
  const hasChecked = useRef(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userId && !hasChecked.current) {
      checkAndRecordLogin();
    }
  }, [userId]);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    } catch (error) {
      console.error('[DailyLogin] Error checking auth:', error);
    }

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUserId(session.user.id);
        hasChecked.current = false; // Reset pour le nouvel utilisateur
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        hasChecked.current = false;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  };

  const checkAndRecordLogin = async () => {
    if (!userId) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const lastCheck = await AsyncStorage.getItem(LAST_LOGIN_CHECK_KEY);

      // Si déjà vérifié aujourd'hui, ne rien faire
      if (lastCheck === today) {
        hasChecked.current = true;
        return;
      }

      console.log('🔔 [DailyLogin] Vérification connexion quotidienne...');

      // 1. D'abord vérifier et créer l'entrée loyalty_points si nécessaire
      await ensureLoyaltyPointsExists(userId);

      // 2. Vérifier le bonus de bienvenue
      await checkWelcomeBonus(userId);

      // 3. Enregistrer la connexion quotidienne
      const result = await recordDailyLogin(userId);

      // Marquer comme vérifié
      await AsyncStorage.setItem(LAST_LOGIN_CHECK_KEY, today);
      hasChecked.current = true;

      // Afficher notification des gains
      if (result?.success && result.points > 0) {
        // Récupérer le solde actuel pour l'afficher
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('panda_coins, current_streak, longest_streak')
          .eq('id', userId)
          .single();

        const totalCoins = currentProfile?.panda_coins || 0;
        const streak = result.streak || currentProfile?.current_streak || 1;
        const longestStreak = currentProfile?.longest_streak || streak;

        // Construire le message détaillé
        let title = '🔥 Connexion quotidienne !';
        let messageLines = [];

        // Points gagnés aujourd'hui
        messageLines.push(`✅ +${result.points} PandaCoins gagnés`);

        // Détail du bonus streak si applicable
        if (result.streak_bonus > 0) {
          messageLines.push(`🎁 Bonus streak: +${result.streak_bonus} points`);
        }

        // Streak actuel
        if (streak >= 7) {
          title = '🔥 Super streak !';
          messageLines.push(`📅 ${streak} jours consécutifs !`);
        } else {
          messageLines.push(`📅 Jour ${streak} de votre série`);
        }

        // Prochain bonus
        const daysToNextBonus = 7 - (streak % 7);
        if (daysToNextBonus < 7 && daysToNextBonus > 0) {
          messageLines.push(`⏳ Prochain bonus dans ${daysToNextBonus} jour${daysToNextBonus > 1 ? 's' : ''}`);
        }

        // Solde total
        messageLines.push(`\n💰 Solde total: ${totalCoins.toLocaleString()} PC`);

        const fullMessage = messageLines.join('\n');

        // Notification vocale
        try {
          const voiceMessage = `Félicitations! Vous avez gagné ${result.points} PandaCoins. Jour ${streak} de votre série.`;
          Speech.speak(voiceMessage, { language: 'fr-FR', rate: 0.9, volume: 0.7 });
        } catch (e) {}

        // Notification visuelle
        Alert.alert(title, fullMessage, [{ text: 'Merci ! 🐼', style: 'default' }]);
      }
    } catch (error) {
      console.error('[DailyLogin] Error:', error);
    }
  };

  const ensureLoyaltyPointsExists = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle();

      if (!data && !error) {
        // Créer l'entrée
        await supabase
          .from('loyalty_points')
          .insert({
            user_id: uid,
            total_points: 0,
            available_points: 0,
            lifetime_points: 0,
          });
        console.log('✅ [DailyLogin] Loyalty points créé');
      }
    } catch (error) {
      console.error('[DailyLogin] Error ensuring loyalty_points:', error);
    }
  };

  const checkWelcomeBonus = async (uid: string) => {
    try {
      const { data, error } = await supabase.rpc('award_welcome_bonus', {
        p_user_id: uid,
      });

      if (data?.success) {
        console.log('🎉 [DailyLogin] Bonus de bienvenue attribué:', data.points);

        // Mettre à jour aussi panda_coins dans le profil
        await updateProfilePoints(uid, data.points);

        Alert.alert(
          '🎉 Bienvenue sur SenePanda !',
          `Vous avez reçu ${data.points} PandaCoins de bienvenue !`,
          [{ text: 'Merci !', style: 'default' }]
        );
      }
    } catch (error) {
      // La fonction peut ne pas exister, essayer directement
      console.log('[DailyLogin] Welcome bonus via RPC skipped, trying direct...');
      await tryDirectWelcomeBonus(uid);
    }
  };

  const tryDirectWelcomeBonus = async (uid: string) => {
    try {
      // Vérifier si déjà réclamé
      const { data: profile } = await supabase
        .from('profiles')
        .select('welcome_bonus_claimed')
        .eq('id', uid)
        .single();

      if (profile?.welcome_bonus_claimed) return;

      const welcomePoints = 500;

      // Ajouter les points au profil directement
      try {
        const { error: rpcError } = await supabase.rpc('increment', {
          row_id: uid,
          column_name: 'panda_coins',
          amount: welcomePoints
        });

        if (rpcError) {
          // Si increment n'existe pas, faire un update direct
          await supabase
            .from('profiles')
            .update({
              panda_coins: welcomePoints,
              welcome_bonus_claimed: true
            })
            .eq('id', uid);
        } else {
          // Marquer comme réclamé
          await supabase
            .from('profiles')
            .update({ welcome_bonus_claimed: true })
            .eq('id', uid);
        }
      } catch {
        // Fallback: update direct
        await supabase
          .from('profiles')
          .update({
            panda_coins: welcomePoints,
            welcome_bonus_claimed: true
          })
          .eq('id', uid);
      }

      console.log('🎉 [DailyLogin] Bonus bienvenue direct attribué');

      Alert.alert(
        '🎉 Bienvenue sur SenePanda !',
        `Vous avez reçu ${welcomePoints} PandaCoins de bienvenue !`,
        [{ text: 'Merci !', style: 'default' }]
      );
    } catch (error) {
      console.error('[DailyLogin] Direct welcome bonus error:', error);
    }
  };

  const updateProfilePoints = async (uid: string, points: number) => {
    try {
      // Récupérer les points actuels
      const { data: profile } = await supabase
        .from('profiles')
        .select('panda_coins')
        .eq('id', uid)
        .single();

      const currentPoints = profile?.panda_coins || 0;
      const newPoints = currentPoints + points;

      // Mettre à jour
      await supabase
        .from('profiles')
        .update({ panda_coins: newPoints })
        .eq('id', uid);

      console.log(`✅ [DailyLogin] Points mis à jour: ${currentPoints} → ${newPoints}`);
    } catch (error) {
      console.error('[DailyLogin] Error updating profile points:', error);
    }
  };

  const recordDailyLogin = async (uid: string) => {
    try {
      // Essayer d'abord avec la fonction RPC
      const { data, error } = await supabase.rpc('record_daily_login', {
        p_user_id: uid,
      });

      if (error) {
        console.log('[DailyLogin] RPC not available, using direct method');
        return await recordDailyLoginDirect(uid);
      }

      // Mettre à jour aussi panda_coins dans le profil
      if (data?.success && data?.points > 0) {
        await updateProfilePoints(uid, data.points);
      }

      console.log('✅ [DailyLogin] Résultat:', data);
      return data;
    } catch (error) {
      console.error('[DailyLogin] Error recording login:', error);
      return await recordDailyLoginDirect(uid);
    }
  };

  const recordDailyLoginDirect = async (uid: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Récupérer le profil actuel
      const { data: profile } = await supabase
        .from('profiles')
        .select('last_login_date, current_streak, panda_coins')
        .eq('id', uid)
        .single();

      if (!profile) return null;

      const lastLogin = profile.last_login_date;
      let currentStreak = profile.current_streak || 0;
      let pointsEarned = 10; // Points de base
      let streakBonus = 0;

      // Calculer le streak
      if (!lastLogin) {
        currentStreak = 1;
      } else {
        const lastDate = new Date(lastLogin);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak += 1;
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      }

      // Bonus de streak (tous les 7 jours)
      if (currentStreak % 7 === 0) {
        streakBonus = 50;
        pointsEarned += streakBonus;
      }

      // Bonus supplémentaire pour 30 jours
      if (currentStreak >= 30 && currentStreak % 30 === 0) {
        streakBonus += 100;
        pointsEarned += 100;
      }

      // Mettre à jour le profil
      const newPoints = (profile.panda_coins || 0) + pointsEarned;
      await supabase
        .from('profiles')
        .update({
          last_login_date: today,
          current_streak: currentStreak,
          panda_coins: newPoints,
        })
        .eq('id', uid);

      console.log(`✅ [DailyLogin] Direct: streak=${currentStreak}, points=${pointsEarned}`);

      return {
        success: true,
        points: pointsEarned,
        streak: currentStreak,
        streak_bonus: streakBonus,
        message: `+${pointsEarned} points - Jour ${currentStreak}`
      };
    } catch (error) {
      console.error('[DailyLogin] Direct method error:', error);
      return null;
    }
  };

  // Ce composant ne rend rien visuellement
  return null;
}
