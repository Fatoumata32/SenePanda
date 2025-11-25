import { Tabs, useSegments } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useNavigation } from '@/contexts/NavigationContext';
import NavigationService from '@/lib/navigation';
import HomeIcon from '@/components/icons/HomeIcon';
import ShopIcon from '@/components/icons/ShopIcon';
import HeartIcon from '@/components/icons/HeartIcon';
import MessageIcon from '@/components/icons/MessageIcon';
import UserIcon from '@/components/icons/UserIcon';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CartBadge from '@/components/cart/CartBadge';

export default function TabLayout() {
  const { isAuthenticated, hasRoleSelected, isLoading } = useNavigation();
  const segments = useSegments();

  // Vérifier si on est sur une page où on ne veut pas afficher les tabs
  const currentPath = segments.join('/');
  const hideTabBar =
    isLoading || // Cacher pendant le chargement
    !isAuthenticated || // Cacher si non connecté
    currentPath === ''; // Cacher sur la page d'accueil initiale

  const handleTabPress = (e: any, routeName: string) => {
    // La page d'accueil (home) et le profil sont toujours accessibles
    if (routeName === 'home' || routeName === 'profile') {
      return; // Laisser la navigation se faire normalement
    }

    // Pour les autres pages, bloquer si non connecté
    if (!isAuthenticated) {
      e.preventDefault();
      NavigationService.goToLogin(`/(tabs)/${routeName}` as any);
      return;
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primaryGold,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: hideTabBar
          ? { display: 'none' } // Cacher complètement la barre de navigation
          : {
              backgroundColor: Colors.white,
              borderTopWidth: 0,
              paddingBottom: 8,
              paddingTop: 8,
              height: 65,
              elevation: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
            },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <HomeIcon size={26} color={color} focused={focused} />
          ),
        }}
        listeners={{
          tabPress: (e) => handleTabPress(e, 'home'),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Boutique',
          tabBarIcon: ({ color, focused }) => (
            <ShopIcon size={26} color={color} focused={focused} />
          ),
        }}
        listeners={{
          tabPress: (e) => handleTabPress(e, 'explore'),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoris',
          tabBarIcon: ({ color, focused }) => (
            <HeartIcon size={26} color={color} focused={focused} />
          ),
        }}
        listeners={{
          tabPress: (e) => handleTabPress(e, 'favorites'),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <MessageIcon size={26} color={color} focused={focused} />
          ),
        }}
        listeners={{
          tabPress: (e) => handleTabPress(e, 'messages'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <UserIcon size={26} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
