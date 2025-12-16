import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useNavigation } from '@/contexts/NavigationContext';
import NavigationService from '@/lib/navigation';
import { RoleSwitchButton } from '@/components/RoleSwitchButton';

export default function SellerLayout() {
  const { isAuthenticated, isLoading } = useNavigation();

  // Vérifier si on doit cacher la barre de navigation
  const hideTabBar = isLoading || !isAuthenticated;

  const handleTabPress = (e: any, routeName: string) => {
    // Le profil est toujours accessible
    if (routeName === 'profile') {
      return;
    }

    // Pour les autres pages, bloquer si non connecté
    if (!isAuthenticated) {
      e.preventDefault();
      NavigationService.goToLogin(`/seller/${routeName}` as any);
      return;
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primaryOrange,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: hideTabBar
          ? { display: 'none' }
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
        name="my-shop"
        options={{
          title: 'Ma Boutique',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront" size={size} color={color} />
          ),
          headerShown: true,
          headerTitle: 'Ma Boutique',
          headerRight: () => (
            <View style={{ marginRight: 16 }}>
              <RoleSwitchButton size={22} color={Colors.primaryGold} />
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => handleTabPress(e, 'my-shop'),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Produits',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => handleTabPress(e, 'products'),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => handleTabPress(e, 'orders'),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Ventes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => handleTabPress(e, 'sales'),
        }}
      />

      {/* Pages cachées (pas dans le tab bar) */}
      <Tabs.Screen
        name="add-product"
        options={{
          href: null, // Ne pas afficher dans les tabs
        }}
      />
      <Tabs.Screen
        name="setup"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="shop-settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="benefits"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="subscription-plans"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="choose-subscription"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="shop-wizard"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="shop-wizard-v2"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="product-success"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="shop-success"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="start-live"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="live-stream"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-product"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
