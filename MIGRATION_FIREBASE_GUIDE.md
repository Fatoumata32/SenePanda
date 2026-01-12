# 🔥 Guide de Migration : Supabase → Firebase

## 📋 Table des Matières

1. [Configuration Terminée](#configuration-terminée)
2. [Architecture Firebase](#architecture-firebase)
3. [Plan de Migration](#plan-de-migration)
4. [Migration par Modules](#migration-par-modules)
5. [Exemples de Code](#exemples-de-code)
6. [Schema Firestore](#schema-firestore)
7. [Testing](#testing)
8. [Déploiement](#déploiement)

---

## ✅ Configuration Terminée

### 1. Gradle Configuration

**android/build.gradle** - Plugin Google Services ajouté ✅
```gradle
classpath('com.google.gms:google-services:4.4.4')
```

**android/app/build.gradle** - Firebase BoM et dépendances ajoutées ✅
```gradle
implementation platform('com.google.firebase:firebase-bom:34.7.0')
implementation 'com.google.firebase:firebase-analytics'
implementation 'com.google.firebase:firebase-auth'
implementation 'com.google.firebase:firebase-firestore'
implementation 'com.google.firebase:firebase-storage'
implementation 'com.google.firebase:firebase-functions'
implementation 'com.google.firebase:firebase-messaging'
```

### 2. Packages React Native

**Installés ✅**
```json
{
  "@react-native-firebase/app": "^21.8.1",
  "@react-native-firebase/auth": "^21.8.1",
  "@react-native-firebase/firestore": "^21.8.1",
  "@react-native-firebase/storage": "^21.8.1",
  "@react-native-firebase/functions": "^21.8.1",
  "@react-native-firebase/messaging": "^21.8.1",
  "@react-native-firebase/analytics": "^21.8.1"
}
```

### 3. Fichiers de Configuration

- ✅ `google-services.json` → `android/app/google-services.json`
- ✅ `lib/firebase.ts` → Configuration Firebase centralisée

---

## 🏗️ Architecture Firebase

### Services Utilisés

| Service Firebase | Remplace Supabase | Utilisation |
|-----------------|-------------------|-------------|
| **Authentication** | Supabase Auth | Connexion utilisateurs |
| **Firestore** | PostgreSQL | Base de données NoSQL |
| **Storage** | Supabase Storage | Images, vidéos, audio |
| **Functions** | Edge Functions | Serverless backend |
| **Messaging** | - | Notifications push |
| **Analytics** | - | Tracking utilisateurs |

### Structure du Projet

```
lib/
├── firebase.ts              # Configuration Firebase ✅
├── firebaseAuth.ts          # Helpers authentification (à créer)
├── firebaseFirestore.ts     # Helpers Firestore (à créer)
├── firebaseStorage.ts       # Helpers Storage (à créer)
└── firebaseFunctions.ts     # Helpers Functions (à créer)

providers/
├── FirebaseAuthProvider.tsx # Provider Auth Firebase (à créer)
└── FirebaseDataProvider.tsx # Provider Data Firebase (à créer)
```

---

## 📅 Plan de Migration

### Phase 1: Authentification (1-2 semaines)

**Priorité: HAUTE**

**Tâches:**
- [ ] Migrer AuthProvider vers Firebase Auth
- [ ] Adapter le système de PIN (4 digits)
- [ ] Migrer l'auto-login
- [ ] Tester la connexion/déconnexion
- [ ] Migrer les profils utilisateurs

**Fichiers à modifier:**
- `providers/AuthProvider.tsx`
- `lib/secureAuth.ts`
- `app/auth/*.tsx`

### Phase 2: Base de Données - Users & Profiles (2 semaines)

**Priorité: HAUTE**

**Tâches:**
- [ ] Créer collection `profiles` dans Firestore
- [ ] Migrer les données existantes
- [ ] Adapter les hooks de profil
- [ ] Implémenter les Security Rules
- [ ] Tester les opérations CRUD

**Collections Firestore:**
```
profiles/
├── {userId}/
    ├── id: string
    ├── email: string
    ├── phone_number: string
    ├── is_seller: boolean
    ├── panda_coins: number
    ├── shop_name?: string
    └── ...
```

### Phase 3: Produits & E-commerce (2-3 semaines)

**Priorité: HAUTE**

**Tâches:**
- [ ] Migrer collection `products`
- [ ] Migrer `categories`
- [ ] Migrer `cart_items`
- [ ] Migrer `orders` et `order_items`
- [ ] Adapter le système de paiement
- [ ] Implémenter les listeners temps réel

**Collections:**
```
products/
orders/
cart_items/
categories/
wishlists/
```

### Phase 4: Live Shopping (3-4 semaines)

**Priorité: MOYENNE**

**Tâches:**
- [ ] Migrer `live_sessions`
- [ ] Migrer `live_chat_messages` (sous-collection)
- [ ] Migrer `live_reactions`
- [ ] Migrer `live_viewers`
- [ ] Implémenter Firestore Realtime pour le chat
- [ ] Tester le système de points live

**Structure Firestore:**
```
live_sessions/
├── {sessionId}/
    ├── info (données de session)
    ├── chat/
    │   └── {messageId}/ (messages)
    ├── reactions/
    │   └── {reactionId}/
    └── viewers/
        └── {viewerId}/
```

### Phase 5: Chat & Messaging (2 semaines)

**Priorité: MOYENNE**

**Tâches:**
- [ ] Migrer `conversations`
- [ ] Migrer `messages`
- [ ] Implémenter Firebase Storage pour images/audio
- [ ] Adapter les listeners temps réel
- [ ] Tester les indicateurs de frappe

### Phase 6: Système de Fidélité (1-2 semaines)

**Priorité: BASSE**

**Tâches:**
- [ ] Migrer `loyalty_points`
- [ ] Migrer `points_transactions`
- [ ] Migrer `rewards` et `claimed_rewards`
- [ ] Migrer `badges` et achievements
- [ ] Tester les transactions atomiques

### Phase 7: Fonctionnalités Avancées (2-3 semaines)

**Priorité: BASSE**

**Tâches:**
- [ ] Migrer Flash Deals
- [ ] Migrer Abonnements
- [ ] Migrer Notifications
- [ ] Migrer Reviews
- [ ] Déployer Cloud Functions

### Phase 8: Testing & Optimisation (2-3 semaines)

**Priorité: HAUTE**

**Tâches:**
- [ ] Tests end-to-end
- [ ] Tests de performance
- [ ] Optimisation des requêtes Firestore
- [ ] Gestion des erreurs
- [ ] Documentation

**Estimation Totale: 15-20 semaines (3.5 - 5 mois)**

---

## 🔄 Migration par Modules

### Module 1: Authentication

#### Supabase (Actuel)

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(url, key);

// providers/AuthProvider.tsx
const { data: { session } } = await supabase.auth.getSession();
const { data: { user } } = await supabase.auth.signInWithPassword({
  email, password
});
```

#### Firebase (Nouveau)

```typescript
// lib/firebase.ts
import auth from '@react-native-firebase/auth';

// providers/FirebaseAuthProvider.tsx
const user = auth().currentUser;
const credential = await auth().signInWithEmailAndPassword(email, password);
```

#### Étapes de Migration

1. **Créer FirebaseAuthProvider.tsx**

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener de changement d'état auth
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Récupérer le profil depuis Firestore
        const profileDoc = await firestore()
          .collection('profiles')
          .doc(firebaseUser.uid)
          .get();

        setProfile(profileDoc.data() as Profile);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    // Auto-login
    checkAutoLogin();

    return unsubscribe;
  }, []);

  const checkAutoLogin = async () => {
    try {
      const savedEmail = await SecureStore.getItemAsync('user_email');
      const savedPassword = await SecureStore.getItemAsync('user_password');

      if (savedEmail && savedPassword) {
        await signIn(savedEmail, savedPassword);
      }
    } catch (error) {
      console.error('Auto-login failed:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const credential = await auth().signInWithEmailAndPassword(email, password);

      // Sauvegarder pour auto-login
      await SecureStore.setItemAsync('user_email', email);
      await SecureStore.setItemAsync('user_password', password);

      console.log('✅ Connexion réussie:', credential.user.uid);
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await auth().signOut();

      // Nettoyer les credentials
      await SecureStore.deleteItemAsync('user_email');
      await SecureStore.deleteItemAsync('user_password');

      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur de déconnexion:', error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');

    try {
      await firestore()
        .collection('profiles')
        .doc(user.uid)
        .update(data);

      setProfile((prev) => ({ ...prev, ...data } as Profile));
      console.log('✅ Profil mis à jour');
    } catch (error) {
      console.error('❌ Erreur mise à jour profil:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within FirebaseAuthProvider');
  return context;
};
```

2. **Créer un profil lors de l'inscription**

```typescript
// lib/firebaseAuth.ts
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export async function createUserWithProfile(
  email: string,
  password: string,
  phoneNumber: string,
  pin: string
) {
  try {
    // 1. Créer l'utilisateur Firebase Auth
    const credential = await auth().createUserWithEmailAndPassword(email, password);
    const userId = credential.user.uid;

    // 2. Créer le profil dans Firestore
    await firestore().collection('profiles').doc(userId).set({
      id: userId,
      email,
      phone_number: phoneNumber,
      pin: pin, // À hasher en production !
      is_seller: false,
      panda_coins: 0,
      created_at: firestore.FieldValue.serverTimestamp(),
      updated_at: firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Utilisateur et profil créés:', userId);
    return credential;
  } catch (error) {
    console.error('❌ Erreur création utilisateur:', error);
    throw error;
  }
}
```

---

### Module 2: Firestore Database

#### Conversion PostgreSQL → Firestore

**Supabase (SQL relationnel)**
```sql
-- Tables avec relations
profiles → products → cart_items
         → orders → order_items
```

**Firebase (NoSQL dénormalisé)**
```javascript
// Collection products
{
  id: "product123",
  seller_id: "user456",
  seller_name: "Shop Name", // Dénormalisé
  seller_avatar: "url",      // Dénormalisé
  price: 25000,
  stock: 10,
  images: ["url1", "url2"],
  created_at: Timestamp
}

// Collection orders
{
  id: "order789",
  user_id: "user123",
  seller_id: "user456",
  seller_name: "Shop Name", // Dénormalisé
  items: [                   // Items embedded
    {
      product_id: "product123",
      product_name: "Product",
      price: 25000,
      quantity: 2
    }
  ],
  total_amount: 50000,
  status: "pending",
  created_at: Timestamp
}
```

#### Exemples de Requêtes

**Supabase**
```typescript
const { data, error } = await supabase
  .from('products')
  .select('*, profiles!seller_id(shop_name, avatar_url)')
  .eq('is_active', true)
  .order('created_at', { ascending: false })
  .limit(20);
```

**Firebase**
```typescript
const productsRef = firestore().collection('products');
const snapshot = await productsRef
  .where('is_active', '==', true)
  .orderBy('created_at', 'desc')
  .limit(20)
  .get();

const products = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

#### Listeners Temps Réel

**Supabase**
```typescript
const channel = supabase
  .channel('products-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'products'
  }, (payload) => {
    console.log('Change:', payload);
  })
  .subscribe();
```

**Firebase**
```typescript
const unsubscribe = firestore()
  .collection('products')
  .where('seller_id', '==', sellerId)
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        console.log('New product:', change.doc.data());
      }
      if (change.type === 'modified') {
        console.log('Modified product:', change.doc.data());
      }
      if (change.type === 'removed') {
        console.log('Removed product:', change.doc.data());
      }
    });
  });

// Cleanup
return () => unsubscribe();
```

---

### Module 3: Storage

#### Upload de Fichiers

**Supabase**
```typescript
const { data, error } = await supabase.storage
  .from('chat-images')
  .upload(fileName, blob, {
    contentType: 'image/jpeg'
  });

const { data: { publicUrl } } = supabase.storage
  .from('chat-images')
  .getPublicUrl(fileName);
```

**Firebase**
```typescript
import storage from '@react-native-firebase/storage';

// Upload
const reference = storage().ref(`chat-images/${fileName}`);
await reference.putFile(localFilePath);

// Get URL
const downloadUrl = await reference.getDownloadURL();
console.log('Image URL:', downloadUrl);
```

#### Helper Upload Media

```typescript
// lib/firebaseStorage.ts
import storage from '@react-native-firebase/storage';
import { Platform } from 'react-native';

export async function uploadMedia(
  file: string, // URI local
  folder: 'chat-images' | 'chat-voice' | 'products' | 'profiles',
  fileName: string
): Promise<string> {
  try {
    const reference = storage().ref(`${folder}/${fileName}`);

    // Upload
    await reference.putFile(file);

    // Récupérer l'URL
    const downloadUrl = await reference.getDownloadURL();

    console.log('✅ Fichier uploadé:', downloadUrl);
    return downloadUrl;
  } catch (error) {
    console.error('❌ Erreur upload:', error);
    throw error;
  }
}

export async function deleteMedia(url: string): Promise<void> {
  try {
    const reference = storage().refFromURL(url);
    await reference.delete();
    console.log('✅ Fichier supprimé');
  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    throw error;
  }
}
```

---

### Module 4: Cloud Functions

#### Migration des Edge Functions

**Supabase Edge Function**
```typescript
// supabase/functions/wave-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const payload = await req.json();
  // Traiter le webhook
  return new Response(JSON.stringify({ success: true }));
});
```

**Firebase Cloud Function**
```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const waveWebhook = functions.https.onRequest(async (req, res) => {
  const payload = req.body;

  // Traiter le webhook
  if (payload.status === 'success') {
    const db = admin.firestore();
    await db.collection('orders').doc(payload.order_id).update({
      status: 'paid',
      payment_confirmed_at: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  res.json({ success: true });
});

// Fonction de création de profil
export const createUserProfile = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore();

  await db.collection('profiles').doc(user.uid).set({
    id: user.uid,
    email: user.email,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    panda_coins: 100 // Bonus de bienvenue
  });

  console.log('✅ Profil créé pour:', user.uid);
});
```

---

## 📊 Schema Firestore Complet

### Collections Principales

```
firestore/
├── profiles/
│   └── {userId}/
│       ├── id: string
│       ├── email: string
│       ├── phone_number: string
│       ├── pin: string
│       ├── is_seller: boolean
│       ├── panda_coins: number
│       ├── shop_name?: string
│       ├── shop_description?: string
│       ├── avatar_url?: string
│       ├── latitude?: number
│       ├── longitude?: number
│       └── created_at: Timestamp
│
├── products/
│   └── {productId}/
│       ├── id: string
│       ├── seller_id: string
│       ├── seller_name: string (dénormalisé)
│       ├── name: string
│       ├── description: string
│       ├── price: number
│       ├── stock: number
│       ├── images: string[]
│       ├── video_url?: string
│       ├── is_active: boolean
│       ├── category_id: string
│       └── created_at: Timestamp
│
├── orders/
│   └── {orderId}/
│       ├── id: string
│       ├── order_number: string
│       ├── user_id: string
│       ├── seller_id: string
│       ├── items: Array<{
│       │   product_id: string,
│       │   product_name: string,
│       │   price: number,
│       │   quantity: number
│       │ }>
│       ├── total_amount: number
│       ├── status: 'pending' | 'paid' | 'shipped' | 'delivered'
│       ├── payment_method: string
│       ├── live_session_id?: string
│       └── created_at: Timestamp
│
├── live_sessions/
│   └── {sessionId}/
│       ├── id: string
│       ├── seller_id: string
│       ├── seller_name: string (dénormalisé)
│       ├── title: string
│       ├── status: 'scheduled' | 'live' | 'ended'
│       ├── viewer_count: number
│       ├── chat_enabled: boolean
│       ├── started_at?: Timestamp
│       ├── ended_at?: Timestamp
│       │
│       ├── chat/ (sous-collection)
│       │   └── {messageId}/
│       │       ├── user_id: string
│       │       ├── user_name: string
│       │       ├── message: string
│       │       ├── type: 'text' | 'product' | 'system'
│       │       └── created_at: Timestamp
│       │
│       ├── reactions/ (sous-collection)
│       │   └── {reactionId}/
│       │       ├── user_id: string
│       │       ├── type: 'heart' | 'fire' | 'clap'
│       │       └── created_at: Timestamp
│       │
│       └── viewers/ (sous-collection)
│           └── {viewerId}/
│               ├── user_id: string
│               ├── joined_at: Timestamp
│               └── last_heartbeat: Timestamp
│
├── conversations/
│   └── {conversationId}/
│       ├── id: string
│       ├── participants: string[] (user_ids)
│       ├── last_message: string
│       ├── last_message_at: Timestamp
│       │
│       └── messages/ (sous-collection)
│           └── {messageId}/
│               ├── sender_id: string
│               ├── content: string
│               ├── type: 'text' | 'image' | 'voice'
│               ├── read: boolean
│               └── created_at: Timestamp
│
├── loyalty_points/
│   └── {userId}/
│       ├── user_id: string
│       ├── balance: number
│       ├── total_earned: number
│       ├── total_spent: number
│       └── updated_at: Timestamp
│       │
│       └── transactions/ (sous-collection)
│           └── {transactionId}/
│               ├── type: 'earn' | 'spend'
│               ├── amount: number
│               ├── reason: string
│               └── created_at: Timestamp
│
└── notifications/
    └── {notificationId}/
        ├── user_id: string
        ├── title: string
        ├── message: string
        ├── type: 'order' | 'live' | 'deal' | 'general'
        ├── data: any
        ├── read: boolean
        └── created_at: Timestamp
```

---

## 🔐 Security Rules

### Règles Firestore

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Profiles - Lecture publique, écriture propriétaire
    match /profiles/{userId} {
      allow read: if true;
      allow write: if isOwner(userId);
    }

    // Products - Lecture publique, écriture vendeur
    match /products/{productId} {
      allow read: if resource.data.is_active == true;
      allow create: if isAuthenticated() && request.resource.data.seller_id == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.seller_id == request.auth.uid;
    }

    // Orders - Lecture acheteur/vendeur, écriture acheteur
    match /orders/{orderId} {
      allow read: if isAuthenticated() &&
        (resource.data.user_id == request.auth.uid ||
         resource.data.seller_id == request.auth.uid);
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow update: if isAuthenticated() &&
        (resource.data.seller_id == request.auth.uid ||
         resource.data.user_id == request.auth.uid);
    }

    // Live Sessions - Lecture publique, écriture vendeur
    match /live_sessions/{sessionId} {
      allow read: if true;
      allow create, update, delete: if isAuthenticated() &&
        request.resource.data.seller_id == request.auth.uid;

      // Chat messages - Lecture publique, écriture authentifiés
      match /chat/{messageId} {
        allow read: if true;
        allow create: if isAuthenticated();
      }

      // Reactions
      match /reactions/{reactionId} {
        allow read: if true;
        allow create: if isAuthenticated();
      }

      // Viewers
      match /viewers/{viewerId} {
        allow read: if true;
        allow create, update: if isAuthenticated() && isOwner(viewerId);
      }
    }

    // Conversations - Lecture participants, écriture participants
    match /conversations/{conversationId} {
      allow read: if isAuthenticated() &&
        request.auth.uid in resource.data.participants;
      allow create: if isAuthenticated() &&
        request.auth.uid in request.resource.data.participants;

      // Messages
      match /messages/{messageId} {
        allow read: if isAuthenticated() &&
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
        allow create: if isAuthenticated() &&
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
      }
    }

    // Loyalty Points - Lecture propriétaire
    match /loyalty_points/{userId} {
      allow read: if isOwner(userId);
      allow write: if false; // Uniquement via Cloud Functions

      match /transactions/{transactionId} {
        allow read: if isOwner(userId);
        allow write: if false; // Uniquement via Cloud Functions
      }
    }

    // Notifications - Lecture propriétaire
    match /notifications/{notificationId} {
      allow read: if isOwner(resource.data.user_id);
      allow update: if isOwner(resource.data.user_id);
    }
  }
}
```

### Règles Storage

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }

    function isAudio() {
      return request.resource.contentType.matches('audio/.*');
    }

    function isUnder10MB() {
      return request.resource.size < 10 * 1024 * 1024;
    }

    // Chat images
    match /chat-images/{fileName} {
      allow read: if true;
      allow write: if isAuthenticated() && isImage() && isUnder10MB();
    }

    // Chat voice
    match /chat-voice/{fileName} {
      allow read: if true;
      allow write: if isAuthenticated() && isAudio() && isUnder10MB();
    }

    // Product images
    match /products/{sellerId}/{fileName} {
      allow read: if true;
      allow write: if isAuthenticated() &&
        request.auth.uid == sellerId &&
        isImage() &&
        isUnder10MB();
    }

    // Profile avatars
    match /profiles/{userId}/{fileName} {
      allow read: if true;
      allow write: if isAuthenticated() &&
        request.auth.uid == userId &&
        isImage() &&
        isUnder10MB();
    }
  }
}
```

---

## 🧪 Testing

### Tests Unitaires

```typescript
// __tests__/firebaseAuth.test.ts
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { createUserWithProfile } from '../lib/firebaseAuth';

describe('Firebase Authentication', () => {
  afterAll(async () => {
    // Cleanup
    await auth().signOut();
  });

  test('should create user with profile', async () => {
    const email = 'test@example.com';
    const password = 'password123';
    const phone = '771234567';
    const pin = '1234';

    const credential = await createUserWithProfile(email, password, phone, pin);

    expect(credential.user).toBeDefined();
    expect(credential.user.email).toBe(email);

    // Vérifier le profil dans Firestore
    const profileDoc = await firestore()
      .collection('profiles')
      .doc(credential.user.uid)
      .get();

    expect(profileDoc.exists).toBe(true);
    expect(profileDoc.data()?.phone_number).toBe(phone);
  });

  test('should sign in with email and password', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    const credential = await auth().signInWithEmailAndPassword(email, password);

    expect(credential.user).toBeDefined();
    expect(credential.user.email).toBe(email);
  });

  test('should sign out', async () => {
    await auth().signOut();
    const currentUser = auth().currentUser;

    expect(currentUser).toBeNull();
  });
});
```

### Tests d'Intégration

```typescript
// __tests__/liveShoppingFirebase.test.ts
import firestore from '@react-native-firebase/firestore';

describe('Live Shopping with Firebase', () => {
  let sessionId: string;

  test('should create live session', async () => {
    const sessionData = {
      seller_id: 'seller123',
      seller_name: 'Test Shop',
      title: 'Live Test',
      status: 'scheduled',
      viewer_count: 0,
      chat_enabled: true,
      created_at: firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await firestore().collection('live_sessions').add(sessionData);
    sessionId = docRef.id;

    expect(sessionId).toBeDefined();
  });

  test('should add chat message', async () => {
    const messageData = {
      user_id: 'user123',
      user_name: 'Test User',
      message: 'Hello!',
      type: 'text',
      created_at: firestore.FieldValue.serverTimestamp(),
    };

    await firestore()
      .collection('live_sessions')
      .doc(sessionId)
      .collection('chat')
      .add(messageData);

    const chatSnapshot = await firestore()
      .collection('live_sessions')
      .doc(sessionId)
      .collection('chat')
      .get();

    expect(chatSnapshot.size).toBe(1);
  });

  test('should listen to chat in real-time', (done) => {
    const unsubscribe = firestore()
      .collection('live_sessions')
      .doc(sessionId)
      .collection('chat')
      .orderBy('created_at', 'asc')
      .onSnapshot((snapshot) => {
        expect(snapshot.docs.length).toBeGreaterThan(0);
        unsubscribe();
        done();
      });
  });
});
```

---

## 🚀 Déploiement

### 1. Configuration Firebase Console

1. **Créer un projet Firebase**
   - Aller sur https://console.firebase.google.com
   - Créer un nouveau projet: "SenePanda"

2. **Activer les services**
   - Authentication → Email/Password
   - Firestore Database → Mode production
   - Storage → Mode production
   - Functions → Déployer les fonctions
   - Messaging → Configurer FCM

3. **Télécharger les fichiers de config**
   - Android: `google-services.json` ✅ (déjà fait)
   - iOS: `GoogleService-Info.plist` (si iOS)

### 2. Migration des Données

```javascript
// scripts/migrate-supabase-to-firebase.js
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

// Initialiser Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Initialiser Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrateProfiles() {
  console.log('🔄 Migration des profils...');

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) throw error;

  const db = admin.firestore();
  const batch = db.batch();

  profiles.forEach(profile => {
    const docRef = db.collection('profiles').doc(profile.id);
    batch.set(docRef, {
      ...profile,
      created_at: admin.firestore.Timestamp.fromDate(new Date(profile.created_at))
    });
  });

  await batch.commit();
  console.log(`✅ ${profiles.length} profils migrés`);
}

async function migrateProducts() {
  console.log('🔄 Migration des produits...');

  const { data: products, error } = await supabase
    .from('products')
    .select('*, profiles!seller_id(shop_name, avatar_url)');

  if (error) throw error;

  const db = admin.firestore();
  const batch = db.batch();

  products.forEach(product => {
    const docRef = db.collection('products').doc(product.id);
    batch.set(docRef, {
      ...product,
      seller_name: product.profiles?.shop_name || 'Unknown',
      seller_avatar: product.profiles?.avatar_url,
      created_at: admin.firestore.Timestamp.fromDate(new Date(product.created_at))
    });
  });

  await batch.commit();
  console.log(`✅ ${products.length} produits migrés`);
}

// Exécuter les migrations
(async () => {
  try {
    await migrateProfiles();
    await migrateProducts();
    // await migrateOrders();
    // await migrateLiveSessions();
    // ... etc

    console.log('✅ Migration terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur de migration:', error);
  }
})();
```

### 3. Build de l'Application

```bash
# 1. Installer les dépendances
npm install

# 2. Prebuild (génère les fichiers natifs)
npx expo prebuild --clean

# 3. Build Android avec EAS
eas build --platform android --profile production

# 4. Build iOS (si nécessaire)
eas build --platform ios --profile production
```

### 4. Déployer les Cloud Functions

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter
firebase login

# Initialiser le projet
firebase init functions

# Déployer les fonctions
firebase deploy --only functions
```

---

## 📝 Checklist de Migration

### Préparation
- [x] Configuration Firebase (google-services.json)
- [x] Installation des packages React Native Firebase
- [x] Configuration Gradle
- [ ] Configuration iOS (GoogleService-Info.plist)
- [ ] Créer le projet Firebase Console
- [ ] Activer Authentication
- [ ] Activer Firestore
- [ ] Activer Storage
- [ ] Configurer Security Rules

### Phase 1 - Auth
- [ ] Créer FirebaseAuthProvider
- [ ] Migrer la connexion email/password
- [ ] Migrer le système de PIN
- [ ] Migrer l'auto-login
- [ ] Tester la création de compte
- [ ] Tester la connexion
- [ ] Tester la déconnexion

### Phase 2 - Database
- [ ] Définir le schéma Firestore
- [ ] Créer les Security Rules
- [ ] Migrer la collection profiles
- [ ] Migrer la collection products
- [ ] Migrer la collection orders
- [ ] Migrer les autres collections
- [ ] Tester les requêtes CRUD

### Phase 3 - Realtime
- [ ] Adapter les listeners live_sessions
- [ ] Adapter les listeners chat
- [ ] Adapter les listeners notifications
- [ ] Adapter les listeners coins
- [ ] Tester la synchronisation temps réel

### Phase 4 - Storage
- [ ] Migrer les buckets Supabase → Firebase Storage
- [ ] Adapter l'upload d'images
- [ ] Adapter l'upload de vidéos
- [ ] Adapter l'upload audio (voice messages)
- [ ] Tester les uploads/downloads

### Phase 5 - Functions
- [ ] Migrer les Edge Functions → Cloud Functions
- [ ] Déployer les fonctions
- [ ] Tester les webhooks
- [ ] Tester les triggers

### Phase 6 - Testing
- [ ] Tests unitaires Auth
- [ ] Tests unitaires Firestore
- [ ] Tests d'intégration
- [ ] Tests end-to-end
- [ ] Tests de performance

### Phase 7 - Déploiement
- [ ] Migration des données de production
- [ ] Build APK/AAB
- [ ] Tests en production
- [ ] Monitoring et logs

---

## 💰 Estimation des Coûts

### Firebase (Pay-as-you-go)

**Gratuit (Spark Plan):**
- Authentication: 10K vérifications/mois
- Firestore: 50K lectures, 20K écritures, 20K suppressions/jour
- Storage: 5GB, 1GB téléchargement/jour
- Functions: 125K invocations/mois

**Au-delà (Blaze Plan):**
- Firestore: $0.06 / 100K lectures
- Storage: $0.026 / GB
- Functions: $0.40 / million invocations

**Estimation pour 10K utilisateurs actifs:**
- ~$50-100/mois (selon l'utilisation)

### Supabase (Plus économique pour gros volumes)

**Gratuit:**
- 500MB database
- 1GB file storage
- 2GB bandwidth

**Pro ($25/mois):**
- 8GB database
- 100GB file storage
- 50GB bandwidth

---

## 🎯 Recommandations Finales

### Option 1: Migration Complète (3-5 mois)
**Avantages:**
- Écosystème Firebase complet
- Scaling automatique
- Analytics intégré

**Inconvénients:**
- Coût élevé de migration
- Risque de bugs
- Coût mensuel potentiellement plus élevé

### Option 2: Garder Supabase (Recommandé)
**Avantages:**
- Déjà fonctionnel
- PostgreSQL = meilleur pour les relations
- Moins cher pour gros volumes
- Pas de risque de migration

**Inconvénients:**
- Pas d'Analytics Firebase
- Pas d'intégration native avec Google services

### Option 3: Hybride
**Utiliser Firebase pour:**
- Notifications (FCM)
- Analytics
- Crashlytics

**Garder Supabase pour:**
- Auth
- Database
- Storage

---

## 📞 Support

Pour toute question sur la migration, consultez:
- [Documentation Firebase](https://firebase.google.com/docs)
- [React Native Firebase](https://rnfirebase.io/)
- [Migration Guide officiel](https://firebase.google.com/docs/firestore/manage-data/move-data)

---

**Dernière mise à jour:** 2026-01-10
**Version:** 1.0.0
**Status:** Configuration initiale terminée ✅
