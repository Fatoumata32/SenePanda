# 🔥 Firebase - Exemples d'Utilisation

Ce guide contient des exemples concrets d'utilisation de Firebase Analytics et Notifications dans l'application SenePanda.

## 📊 Firebase Analytics

### 1. Tracker les Vues de Produit

```typescript
// app/(tabs)/home.tsx
import { useFirebaseAnalytics } from '@/hooks/useFirebaseAnalytics';

export default function HomeScreen() {
  const analytics = useFirebaseAnalytics();

  const handleProductPress = async (product: Product) => {
    // Tracker la vue du produit
    await analytics.trackProductView(
      product.id,
      product.name,
      product.price,
      product.category
    );

    // Naviguer vers la page produit
    router.push(`/products/${product.id}`);
  };

  return (
    <FlatList
      data={products}
      renderItem={({ item }) => (
        <ProductCard
          product={item}
          onPress={() => handleProductPress(item)}
        />
      )}
    />
  );
}
```

### 2. Tracker l'Ajout au Panier

```typescript
// components/ProductCard.tsx
import { useFirebaseAnalytics } from '@/hooks/useFirebaseAnalytics';

export default function ProductCard({ product }: { product: Product }) {
  const analytics = useFirebaseAnalytics();
  const { addToCart } = useCart();

  const handleAddToCart = async () => {
    // Ajouter au panier
    await addToCart(product, 1);

    // Tracker dans Analytics
    await analytics.trackAddToCart(
      product.id,
      product.name,
      product.price,
      1
    );

    Toast.show('Produit ajouté au panier');
  };

  return (
    <View>
      <Text>{product.name}</Text>
      <Button title="Ajouter au panier" onPress={handleAddToCart} />
    </View>
  );
}
```

### 3. Tracker le Processus d'Achat

```typescript
// app/checkout.tsx
import { useFirebaseAnalytics } from '@/hooks/useFirebaseAnalytics';

export default function CheckoutScreen() {
  const analytics = useFirebaseAnalytics();
  const { cartItems } = useCart();

  // Tracker le début du checkout
  useEffect(() => {
    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    analytics.trackBeginCheckout(totalAmount, itemCount);
  }, []);

  const handlePaymentSuccess = async (orderId: string, paymentMethod: string) => {
    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Tracker l'achat réussi
    await analytics.trackPurchase(
      orderId,
      totalAmount,
      paymentMethod,
      itemCount
    );

    router.push('/orders');
  };

  return (
    <View>
      {/* Interface de paiement */}
    </View>
  );
}
```

### 4. Tracker les Lives Shopping

```typescript
// app/live/[id].tsx
import { useFirebaseAnalytics } from '@/hooks/useFirebaseAnalytics';

export default function LiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const analytics = useFirebaseAnalytics();
  const [joinTime, setJoinTime] = useState<number>(0);

  // Tracker le join du live
  useEffect(() => {
    const now = Date.now();
    setJoinTime(now);

    analytics.trackLiveJoin(id, session.seller_name);

    return () => {
      // Tracker le leave avec la durée
      const watchDuration = Math.floor((Date.now() - joinTime) / 1000);
      analytics.trackLiveLeave(id, watchDuration);
    };
  }, [id]);

  const handleSendMessage = async (message: string) => {
    await sendChatMessage(message);

    // Tracker l'envoi de message
    await analytics.trackLiveChatMessage(id);
  };

  const handleReaction = async (type: 'heart' | 'fire' | 'clap') => {
    await sendReaction(type);

    // Tracker la réaction
    await analytics.trackLiveReaction(id, type);
  };

  const handleProductPurchase = async (product: Product) => {
    const orderId = await purchaseProduct(product);

    // Tracker l'achat pendant le live
    await analytics.trackLivePurchase(id, product.id, product.price);
  };

  return (
    <View>
      {/* Interface du live */}
    </View>
  );
}
```

### 5. Tracker les Recherches

```typescript
// app/(tabs)/explore.tsx
import { useFirebaseAnalytics } from '@/hooks/useFirebaseAnalytics';

export default function ExploreScreen() {
  const analytics = useFirebaseAnalytics();

  const handleSearch = async (query: string) => {
    // Effectuer la recherche
    const results = await searchProducts(query);

    // Tracker la recherche
    await analytics.trackSearch(query, results.length);

    setSearchResults(results);
  };

  return (
    <View>
      <SearchBar onSearch={handleSearch} />
      <ProductList products={searchResults} />
    </View>
  );
}
```

### 6. Tracker les Connexions

```typescript
// providers/AuthProvider.tsx
import { useFirebaseAnalytics } from '@/hooks/useFirebaseAnalytics';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const analytics = useFirebaseAnalytics();

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data.user) {
      // Tracker la connexion
      await analytics.trackLogin('email');

      // Définir les propriétés utilisateur
      const profile = await getProfile(data.user.id);
      await analytics.setUserProfile(
        data.user.id,
        profile.is_seller,
        profile.subscription_plan
      );
    }

    return { data, error };
  };

  return (
    <AuthContext.Provider value={{ signIn, ... }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 7. Tracker les Panda Coins

```typescript
// contexts/CoinsContext.tsx
import { useFirebaseAnalytics } from '@/hooks/useFirebaseAnalytics';

export function CoinsProvider({ children }: { children: React.ReactNode }) {
  const analytics = useFirebaseAnalytics();

  const earnCoins = async (amount: number, reason: string) => {
    // Ajouter les coins
    await addCoinsToDatabase(amount, reason);

    // Tracker dans Analytics
    await analytics.trackCoinsEarned(amount, reason);

    setBalance((prev) => prev + amount);
  };

  const spendCoins = async (amount: number, reason: string) => {
    // Dépenser les coins
    await deductCoinsFromDatabase(amount, reason);

    // Tracker dans Analytics
    await analytics.trackCoinsSpent(amount, reason);

    setBalance((prev) => prev - amount);
  };

  return (
    <CoinsContext.Provider value={{ earnCoins, spendCoins, ... }}>
      {children}
    </CoinsContext.Provider>
  );
}
```

### 8. Tracker les Vues d'Écran

```typescript
// app/(tabs)/_layout.tsx
import { useFirebaseAnalytics } from '@/hooks/useFirebaseAnalytics';
import { usePathname } from 'expo-router';

export default function TabsLayout() {
  const analytics = useFirebaseAnalytics();
  const pathname = usePathname();

  // Tracker chaque changement d'écran
  useEffect(() => {
    const screenName = pathname.split('/').pop() || 'home';
    analytics.trackScreen(screenName);
  }, [pathname]);

  return <Tabs>...</Tabs>;
}
```

---

## 🔔 Firebase Cloud Messaging (Notifications)

### 1. Envoyer une Notification de Commande

```typescript
// lib/orders.ts
import { useFirebaseNotifications } from '@/hooks/useFirebaseNotifications';

export async function createOrder(orderData: OrderData) {
  const notifications = useFirebaseNotifications();

  // Créer la commande
  const order = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  // Envoyer une notification au vendeur
  await notifications.sendOrderNotification(
    orderData.seller_id,
    order.id,
    order.order_number,
    order.total_amount
  );

  return order;
}
```

### 2. Notifier les Followers d'un Live

```typescript
// app/seller/start-live.tsx
import { useFirebaseNotifications } from '@/hooks/useFirebaseNotifications';

export default function StartLiveScreen() {
  const notifications = useFirebaseNotifications();
  const { user } = useAuth();

  const startLive = async (title: string) => {
    // Créer la session live
    const session = await createLiveSession(title);

    // Récupérer les followers
    const followers = await supabase
      .from('user_follows')
      .select('follower_id')
      .eq('following_id', user.id);

    const followerIds = followers.data?.map((f) => f.follower_id) || [];

    // Notifier tous les followers
    await notifications.sendLiveNotification(
      followerIds,
      user.shop_name,
      session.id
    );

    router.push(`/seller/live-stream/${session.id}`);
  };

  return (
    <View>
      <Button title="Démarrer le Live" onPress={() => startLive('Mon Live')} />
    </View>
  );
}
```

### 3. Notification de Message Chat

```typescript
// hooks/useChat.ts
import { useFirebaseNotifications } from '@/hooks/useFirebaseNotifications';

export function useChat(conversationId: string) {
  const notifications = useFirebaseNotifications();
  const { user } = useAuth();

  const sendMessage = async (content: string, recipientId: string) => {
    // Envoyer le message
    const message = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      })
      .select()
      .single();

    // Notifier le destinataire
    await notifications.sendChatNotification(
      recipientId,
      user.shop_name || user.email,
      content,
      conversationId
    );

    return message;
  };

  return { sendMessage };
}
```

### 4. Notification de Flash Deal

```typescript
// app/seller/create-flash-deal.tsx
import { useFirebaseNotifications } from '@/hooks/useFirebaseNotifications';

export default function CreateFlashDealScreen() {
  const notifications = useFirebaseNotifications();

  const publishDeal = async (dealData: FlashDeal) => {
    // Créer le deal
    const deal = await createFlashDeal(dealData);

    // Récupérer tous les utilisateurs intéressés
    const interestedUsers = await supabase
      .from('profiles')
      .select('id')
      .eq('is_seller', false);

    const userIds = interestedUsers.data?.map((u) => u.id) || [];

    // Notifier tous les utilisateurs
    await notifications.sendDealNotification(
      userIds,
      dealData.title,
      dealData.discount_percentage,
      deal.id
    );

    Toast.show('Deal publié et notifications envoyées !');
  };

  return (
    <View>
      {/* Formulaire de création de deal */}
    </View>
  );
}
```

### 5. Notification de Récompense Débloquée

```typescript
// contexts/CoinsContext.tsx
import { useFirebaseNotifications } from '@/hooks/useFirebaseNotifications';

export function CoinsProvider({ children }: { children: React.ReactNode }) {
  const notifications = useFirebaseNotifications();

  const claimReward = async (reward: Reward) => {
    const { user } = await supabase.auth.getUser();

    // Réclamer la récompense
    await supabase.from('claimed_rewards').insert({
      user_id: user.id,
      reward_id: reward.id,
    });

    // Dépenser les coins
    await spendCoins(reward.coins_cost, `Récompense: ${reward.name}`);

    // Notifier l'utilisateur
    await notifications.sendRewardNotification(user.id, reward.name);

    return true;
  };

  return (
    <CoinsContext.Provider value={{ claimReward, ... }}>
      {children}
    </CoinsContext.Provider>
  );
}
```

### 6. Notification de Bonus de Connexion Quotidienne

```typescript
// components/DailyLoginTracker.tsx
import { useFirebaseNotifications } from '@/hooks/useFirebaseNotifications';

export default function DailyLoginTracker() {
  const notifications = useFirebaseNotifications();
  const { earnCoins } = useCoins();

  const checkDailyLogin = async () => {
    const { user } = await supabase.auth.getUser();
    const today = new Date().toISOString().split('T')[0];

    // Vérifier la dernière connexion
    const { data: lastLogin } = await supabase
      .from('daily_streaks')
      .select('last_login_date')
      .eq('user_id', user.id)
      .single();

    if (lastLogin?.last_login_date !== today) {
      // Donner le bonus quotidien
      const bonusAmount = 10;
      await earnCoins(bonusAmount, 'Connexion quotidienne');

      // Notifier l'utilisateur
      await notifications.sendCoinsNotification(
        user.id,
        bonusAmount,
        'Bonus de connexion quotidienne !'
      );
    }
  };

  useEffect(() => {
    checkDailyLogin();
  }, []);

  return null;
}
```

---

## 🔧 Edge Function pour Envoyer des Notifications

Créez une Edge Function Supabase pour envoyer des notifications FCM depuis le serveur :

```typescript
// supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FIREBASE_SERVER_KEY = Deno.env.get('FIREBASE_SERVER_KEY')!;

serve(async (req) => {
  try {
    const { userId, notification, data } = await req.json();

    // Créer le client Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Récupérer le token FCM de l'utilisateur
    const { data: profile } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', userId)
      .single();

    if (!profile?.fcm_token) {
      return new Response(
        JSON.stringify({ error: 'User has no FCM token' }),
        { status: 400 }
      );
    }

    // Envoyer la notification via FCM
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${FIREBASE_SERVER_KEY}`,
      },
      body: JSON.stringify({
        to: profile.fcm_token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: data || {},
      }),
    });

    const result = await fcmResponse.json();

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

### Déployer la Function

```bash
# Dans votre terminal
supabase functions deploy send-notification

# Définir le secret
supabase secrets set FIREBASE_SERVER_KEY=votre_server_key_firebase
```

---

## 📱 Tester les Notifications

### 1. Test Manuel via Firebase Console

1. Aller sur https://console.firebase.google.com
2. Sélectionner votre projet (educ-app-ea92d)
3. Aller dans **Cloud Messaging**
4. Cliquer sur **Send your first message**
5. Remplir :
   - Titre : "Test Notification"
   - Texte : "Ceci est un test"
   - App : com.senepanda.app
6. Cliquer sur **Send test message**
7. Coller votre FCM token (visible dans les logs)

### 2. Test Programmatique

```typescript
// Test dans une page de développement
import { useFirebaseNotifications } from '@/hooks/useFirebaseNotifications';

export default function TestNotificationsScreen() {
  const { fcmToken, sendNotification } = useFirebaseNotifications();
  const { user } = useAuth();

  const testNotification = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    const result = await sendNotification(
      user.id,
      'Test Notification',
      'Ceci est un test de notification Firebase',
      { test: 'true' }
    );

    Alert.alert(
      'Résultat',
      result.success ? 'Notification envoyée !' : 'Erreur'
    );
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>FCM Token:</Text>
      <Text selectable>{fcmToken || 'Pas de token'}</Text>

      <Button title="Tester la notification" onPress={testNotification} />
    </View>
  );
}
```

---

## 📊 Voir les Analytics dans Firebase Console

1. Aller sur https://console.firebase.google.com
2. Sélectionner votre projet
3. Aller dans **Analytics** → **Dashboard**
4. Vous verrez :
   - Utilisateurs actifs
   - Sessions
   - Événements personnalisés
   - Conversions

### Événements Personnalisés Trackés

- `view_item` - Vues de produit
- `add_to_cart` - Ajouts au panier
- `purchase` - Achats
- `live_join` - Joins de live
- `live_purchase` - Achats pendant un live
- `search` - Recherches
- `coins_earned` - Gains de coins
- `coins_spent` - Dépenses de coins
- etc.

---

## 🎯 Bonnes Pratiques

### 1. Ne Pas Spammer les Utilisateurs

```typescript
// Limiter les notifications
const canSendNotification = async (userId: string, type: string) => {
  const { data } = await supabase
    .from('notification_history')
    .select('created_at')
    .eq('user_id', userId)
    .eq('type', type)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1);

  // Max 1 notification du même type par jour
  return data?.length === 0;
};
```

### 2. Tracker Uniquement les Événements Importants

```typescript
// ✅ BON
analytics.trackPurchase(orderId, amount, method, itemCount);

// ❌ MAUVAIS - Trop granulaire
analytics.trackEvent('button_click', { button_id: 'btn_123' });
```

### 3. Utiliser des Paramètres Cohérents

```typescript
// Toujours utiliser les mêmes noms de paramètres
await analytics.logEvent('custom_event', {
  item_id: 'abc',      // ✅ Cohérent
  item_name: 'Product', // ✅ Cohérent
  value: 1000,         // ✅ Cohérent
  currency: 'XOF',     // ✅ Cohérent
});
```

---

## 🔍 Debugging

### Voir les Logs Firebase

```typescript
// Activer les logs détaillés
import { firebase } from '@react-native-firebase/app';

if (__DEV__) {
  firebase.app().setLogLevel('debug');
}
```

### Vérifier le Token FCM

```typescript
const { fcmToken } = useFirebase();
console.log('FCM Token:', fcmToken);
```

### Tester la Réception de Notifications

```typescript
// Écouter toutes les notifications
messaging().onMessage((message) => {
  console.log('Notification reçue:', message);
});
```

---

## 📖 Ressources

- [Firebase Analytics](https://firebase.google.com/docs/analytics)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase](https://rnfirebase.io/)
- [Événements Analytics Recommandés](https://support.google.com/firebase/answer/9267735)

---

**Dernière mise à jour:** 2026-01-11
