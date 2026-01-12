# 🚀 Firebase - Démarrage Rapide

## ✅ Ce qui est déjà configuré

- ✅ Packages React Native Firebase installés
- ✅ Configuration Gradle (Android)
- ✅ google-services.json en place
- ✅ FirebaseProvider créé
- ✅ Hooks useFirebaseAnalytics et useFirebaseNotifications
- ✅ Intégration dans app/_layout.tsx

---

## 📋 Étapes pour Activer Firebase

### 1. Appliquer la Migration SQL

```bash
# Exécuter la migration pour ajouter fcm_token à profiles
npx supabase migration up

# Ou manuellement dans le SQL Editor de Supabase
```

Copiez le contenu de `supabase/migrations/add_fcm_token_to_profiles.sql` dans le SQL Editor.

---

### 2. Rebuild l'Application

```bash
# Nettoyer et rebuild
npx expo prebuild --clean

# Lancer sur Android
npx expo run:android
```

---

### 3. Vérifier que Firebase Fonctionne

Au démarrage de l'app, vous devriez voir dans les logs :

```
🔥 [Firebase] Initialisation...
✅ [Firebase] Permission notifications accordée
✅ [Firebase] FCM Token: eXaMpLeToKeN...
✅ [Firebase] Initialisation terminée
```

---

## 🎯 Utilisation Rapide

### Analytics - Tracker un Événement

```typescript
import { useFirebaseAnalytics } from '@/hooks/useFirebaseAnalytics';

function MyComponent() {
  const analytics = useFirebaseAnalytics();

  const handleButtonClick = async () => {
    // Tracker l'événement
    await analytics.trackProductView('product_123', 'T-Shirt', 25000);
  };
}
```

### Notifications - Envoyer une Notification

```typescript
import { useFirebaseNotifications } from '@/hooks/useFirebaseNotifications';

function MyComponent() {
  const notifications = useFirebaseNotifications();

  const sendNotif = async () => {
    await notifications.sendOrderNotification(
      'seller_id',
      'order_123',
      'ORD-001',
      50000
    );
  };
}
```

---

## 🔧 Configuration Firebase Console

### 1. Obtenir la Server Key

1. Allez sur https://console.firebase.google.com
2. Sélectionnez votre projet : **educ-app-ea92d**
3. ⚙️ Project Settings → Cloud Messaging
4. Copiez la **Server key**

### 2. Configurer Supabase Edge Function

```bash
# Définir le secret dans Supabase
supabase secrets set FIREBASE_SERVER_KEY=votre_server_key_ici

# Créer la fonction send-notification
# (voir FIREBASE_USAGE_EXAMPLES.md pour le code)

# Déployer
supabase functions deploy send-notification
```

---

## 📊 Voir les Analytics

1. Aller sur https://console.firebase.google.com
2. Sélectionner **educ-app-ea92d**
3. Analytics → Dashboard
4. Voir les événements en temps réel dans DebugView

### Activer DebugView (pour voir les événements immédiatement)

```bash
# Android
adb shell setprop debug.firebase.analytics.app com.senepanda.app
adb shell setprop log.tag.FA VERBOSE
adb shell setprop log.tag.FA-SVC VERBOSE

# Ensuite relancer l'app
```

---

## 🔔 Tester les Notifications

### Test Rapide depuis Firebase Console

1. Firebase Console → Cloud Messaging
2. **Send your first message**
3. Titre : "Test"
4. Corps : "Notification de test"
5. Target : com.senepanda.app
6. **Send test message**
7. Collez votre FCM token (visible dans les logs app)
8. Cliquez **Test**

---

## 🐛 Dépannage

### Problème : Pas de Token FCM

**Cause :** Permissions non accordées

**Solution :**
```typescript
// Vérifier dans les logs
console.log('Permission:', notificationPermission);

// Redemander la permission
const authStatus = await messaging().requestPermission();
```

### Problème : Notifications Non Reçues

**Vérifications :**
1. L'app est-elle en foreground ou background ?
2. Le token est-il valide ?
3. La Server Key est-elle correcte ?

**Debug :**
```typescript
messaging().onMessage((message) => {
  console.log('Message reçu:', message);
});
```

### Problème : Analytics Non Visible

**Cause :** Délai de traitement (~24h pour la première fois)

**Solution :** Utiliser DebugView pour voir en temps réel

```bash
adb shell setprop debug.firebase.analytics.app com.senepanda.app
```

---

## 📱 Build Production

### Android

```bash
# Build avec EAS
eas build --platform android --profile production

# Ou build local
cd android
./gradlew assembleRelease

# APK dans: android/app/build/outputs/apk/release/
```

---

## 🎉 C'est Prêt !

Votre application est maintenant configurée avec :

- 📊 **Firebase Analytics** pour tracker le comportement utilisateur
- 🔔 **Firebase Cloud Messaging** pour les notifications push
- 🔄 **Supabase** pour l'authentification et les données (inchangé)

### Prochaines Étapes

1. ✅ Appliquer la migration SQL
2. ✅ Rebuild l'app
3. ✅ Tester les notifications
4. ✅ Voir les analytics dans Firebase Console
5. ✅ Configurer l'Edge Function pour les notifications serveur

---

## 📚 Documentation Complète

- [FIREBASE_USAGE_EXAMPLES.md](./FIREBASE_USAGE_EXAMPLES.md) - Exemples d'utilisation détaillés
- [MIGRATION_FIREBASE_GUIDE.md](./MIGRATION_FIREBASE_GUIDE.md) - Guide complet de migration

---

**Besoin d'aide ?** Consultez les exemples dans `FIREBASE_USAGE_EXAMPLES.md`
