# 🔥 Firebase Integration - SenePanda

## 🎯 Aperçu

Firebase a été ajouté à votre application SenePanda pour fournir :

- 📊 **Analytics** - Tracking du comportement utilisateur
- 🔔 **Notifications Push** - Notifications via Firebase Cloud Messaging (FCM)

**Important :** Supabase est **conservé** pour l'authentification, la base de données et le storage. Firebase est utilisé en **complément**.

---

## 📖 Documentation

### 🚀 Guides de Démarrage

| Guide | Description | Temps |
|-------|-------------|-------|
| **[FIREBASE_QUICK_START.md](./FIREBASE_QUICK_START.md)** | Démarrage rapide - Étapes minimales pour activer Firebase | 5 min |
| **[FIREBASE_USAGE_EXAMPLES.md](./FIREBASE_USAGE_EXAMPLES.md)** | 20+ exemples concrets d'utilisation | 15 min |
| **[FIREBASE_IMPLEMENTATION_COMPLETE.md](./FIREBASE_IMPLEMENTATION_COMPLETE.md)** | Récapitulatif complet de l'implémentation | 10 min |

### 📚 Guide Complet

| Guide | Description | Temps |
|-------|-------------|-------|
| **[MIGRATION_FIREBASE_GUIDE.md](./MIGRATION_FIREBASE_GUIDE.md)** | Guide complet de migration Supabase → Firebase (si nécessaire) | 2-3h lecture |

---

## ⚡ Démarrage en 3 Étapes

### 1. Appliquer la Migration SQL

```bash
# Ajouter la colonne fcm_token à la table profiles
npx supabase migration up
```

Ou manuellement dans Supabase Dashboard → SQL Editor :
```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS fcm_token TEXT,
ADD COLUMN IF NOT EXISTS fcm_token_updated_at TIMESTAMPTZ;
```

### 2. Rebuild l'Application

```bash
npx expo prebuild --clean
npx expo run:android
```

### 3. Vérifier dans les Logs

Vous devriez voir :
```
✅ [Firebase] FCM Token: eXaMpLeToKeN...
✅ [Firebase] Initialisation terminée
```

---

## 📊 Utilisation Rapide

### Analytics

```typescript
import { useFirebaseAnalytics } from '@/hooks/useFirebaseAnalytics';

function MyScreen() {
  const analytics = useFirebaseAnalytics();

  // Tracker une vue de produit
  await analytics.trackProductView('product_id', 'Product Name', 25000);

  // Tracker un achat
  await analytics.trackPurchase('order_id', 50000, 'wave', 2);

  // Tracker un live
  await analytics.trackLiveJoin('live_id', 'Seller Name');
}
```

### Notifications

```typescript
import { useFirebaseNotifications } from '@/hooks/useFirebaseNotifications';

function MyScreen() {
  const notifications = useFirebaseNotifications();

  // Notifier le vendeur d'une commande
  await notifications.sendOrderNotification(
    sellerId,
    orderId,
    'ORD-001',
    50000
  );

  // Notifier les followers d'un live
  await notifications.sendLiveNotification(
    followerIds,
    'Shop Name',
    liveSessionId
  );
}
```

---

## 📁 Fichiers Créés

### Code Source

```
providers/
└── FirebaseProvider.tsx          # Provider Firebase (Analytics + Messaging)

hooks/
├── useFirebaseAnalytics.ts       # Hook pour Analytics
└── useFirebaseNotifications.ts   # Hook pour Notifications

lib/
└── firebase.ts                   # Configuration Firebase

supabase/migrations/
└── add_fcm_token_to_profiles.sql # Migration pour FCM token
```

### Documentation

```
FIREBASE_QUICK_START.md              # ⚡ Guide de démarrage (5 min)
FIREBASE_USAGE_EXAMPLES.md           # 💻 Exemples d'utilisation (20+ exemples)
FIREBASE_IMPLEMENTATION_COMPLETE.md  # ✅ Récapitulatif complet
MIGRATION_FIREBASE_GUIDE.md          # 📚 Guide de migration complet
README_FIREBASE.md                   # 📖 Ce fichier
```

---

## ✅ Ce qui est Déjà Fait

- ✅ Packages React Native Firebase installés
- ✅ Configuration Gradle (Android)
- ✅ google-services.json configuré
- ✅ FirebaseProvider créé et intégré
- ✅ Hooks useFirebaseAnalytics et useFirebaseNotifications créés
- ✅ Documentation complète
- ✅ Exemples d'utilisation

---

## ⚙️ Configuration Requise

### Pour les Notifications Serveur

1. **Obtenir la Server Key Firebase**
   - Aller sur https://console.firebase.google.com
   - Projet : educ-app-ea92d
   - Settings → Cloud Messaging → Server key

2. **Créer l'Edge Function Supabase**

Voir le code complet dans [FIREBASE_USAGE_EXAMPLES.md](./FIREBASE_USAGE_EXAMPLES.md#edge-function-pour-envoyer-des-notifications)

3. **Déployer**

```bash
supabase functions deploy send-notification
supabase secrets set FIREBASE_SERVER_KEY=votre_server_key
```

---

## 📊 Voir les Analytics

### Firebase Console

1. https://console.firebase.google.com
2. Sélectionner **educ-app-ea92d**
3. Analytics → Dashboard

### DebugView (Temps Réel)

```bash
# Activer DebugView
adb shell setprop debug.firebase.analytics.app com.senepanda.app

# Relancer l'app
# Les événements apparaissent immédiatement dans Firebase Console → DebugView
```

---

## 🔔 Tester les Notifications

### Test Rapide (Firebase Console)

1. Firebase Console → Cloud Messaging
2. **Send your first message**
3. Copier votre FCM token (visible dans les logs de l'app)
4. Envoyer un test

### Test Programmatique

```typescript
const { sendNotification } = useFirebaseNotifications();

await sendNotification(
  userId,
  'Test Notification',
  'Ceci est un test',
  { type: 'test' }
);
```

---

## 🎯 Événements Analytics Disponibles

### E-commerce
- `trackProductView()` - Vue de produit
- `trackAddToCart()` - Ajout au panier
- `trackBeginCheckout()` - Début du checkout
- `trackPurchase()` - Achat confirmé

### Live Shopping
- `trackLiveJoin()` - Rejoindre un live
- `trackLiveLeave()` - Quitter un live
- `trackLiveChatMessage()` - Message dans le chat
- `trackLiveReaction()` - Réaction pendant le live
- `trackLivePurchase()` - Achat pendant un live

### Engagement
- `trackSearch()` - Recherche
- `trackShare()` - Partage
- `trackLogin()` - Connexion
- `trackSignUp()` - Inscription

### Panda Coins
- `trackCoinsEarned()` - Gains de coins
- `trackCoinsSpent()` - Dépenses de coins
- `trackRewardClaimed()` - Récompense réclamée
- `trackBadgeUnlocked()` - Badge débloqué

### Vendeurs
- `trackProductCreated()` - Création de produit
- `trackLiveStarted()` - Démarrage de live
- `trackLiveEnded()` - Fin de live
- `trackSubscriptionUpgrade()` - Upgrade d'abonnement

---

## 🔔 Types de Notifications Disponibles

- `sendOrderNotification()` - Nouvelle commande
- `sendLiveNotification()` - Live en cours
- `sendChatNotification()` - Nouveau message
- `sendDealNotification()` - Flash deal
- `sendCoinsNotification()` - Gain de coins
- `sendRewardNotification()` - Récompense débloquée

---

## 🔧 Build de Production

```bash
# Build avec EAS
eas build --platform android --profile production

# Build local
cd android
./gradlew assembleRelease
```

---

## 🐛 Dépannage

### Pas de Token FCM

**Solution :**
```typescript
// Vérifier les permissions
const authStatus = await messaging().requestPermission();
console.log('Auth Status:', authStatus);
```

### Notifications Non Reçues

**Vérifications :**
1. Token FCM valide ?
2. App en background (pas fermée) ?
3. Server Key correcte ?

### Analytics Non Visible

**Solutions :**
1. Attendre 24h (première fois)
2. Activer DebugView (voir ci-dessus)
3. Vérifier les logs de l'app

---

## 💰 Coûts

### Gratuit (Spark Plan)
- Analytics : Illimité
- Cloud Messaging : Gratuit
- 10K utilisateurs : **$0/mois**

### Pay-as-you-go (Blaze Plan)
- 50K utilisateurs : **~$20/mois**
- 100K utilisateurs : **~$50/mois**

---

## 🎉 Prochaines Étapes

1. ✅ Lire [FIREBASE_QUICK_START.md](./FIREBASE_QUICK_START.md)
2. ✅ Appliquer la migration SQL
3. ✅ Rebuild l'app
4. ✅ Tester les notifications
5. ✅ Voir les analytics
6. ✅ Intégrer dans vos écrans (voir [FIREBASE_USAGE_EXAMPLES.md](./FIREBASE_USAGE_EXAMPLES.md))

---

## 📞 Support

- 📖 [Documentation Firebase](https://firebase.google.com/docs)
- 📖 [React Native Firebase](https://rnfirebase.io/)
- 📖 [Firebase Console](https://console.firebase.google.com)

---

## ✨ Conclusion

Firebase est **prêt à l'emploi** ! Commencez par :

1. **Analytics** - Ajoutez quelques `trackProductView()` dans vos écrans
2. **Notifications** - Testez avec Firebase Console
3. **Consultez les exemples** - 20+ cas d'usage dans FIREBASE_USAGE_EXAMPLES.md

**Bonne intégration ! 🚀**
