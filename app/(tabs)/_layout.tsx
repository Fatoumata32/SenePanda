import { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import HomeIcon from '@/components/icons/HomeIcon';
import ShopIcon from '@/components/icons/ShopIcon';
import HeartIcon from '@/components/icons/HeartIcon';
import MessageIcon from '@/components/icons/MessageIcon';
import UserIcon from '@/components/icons/UserIcon';

export default function TabLayout() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(!!session?.user);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const handleTabPress = (e: any, routeName: string) => {
    // Bloquer l'accès si non connecté et ce n'est pas la page profile
    if (!isAuthenticated && routeName !== 'profile') {
      e.preventDefault();
      router.push('/(tabs)/profile');
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primaryGold,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: isAuthenticated ? {
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
        } : {
          display: 'none',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <HomeIcon size={26} color={color} focused={focused} />
          ),
        }}
        listeners={{
          tabPress: (e) => handleTabPress(e, 'index'),
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
