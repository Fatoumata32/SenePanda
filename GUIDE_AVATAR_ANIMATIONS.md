# 🎨 Guide des Animations d'Avatar

## 🎯 Fonctionnalité Implémentée

Deux composants d'avatar avec animations au clic :
- **AnimatedAvatar** - Animation zoom out simple
- **ProfileAvatarAnimated** - Animations avancées + zoom en plein écran

---

## 📁 Fichiers Créés

### 1. **components/AnimatedAvatar.tsx**
Avatar simple avec animation zoom out

**Caractéristiques :**
- ✅ Animation zoom out au clic (scale: 1 → 0.85 → 1)
- ✅ Effet de rebond naturel (spring animation)
- ✅ Support image OU initiales
- ✅ Bordure personnalisable
- ✅ Légère ombre portée

**Utilisation basique :**
```typescript
import { AnimatedAvatar } from '../components/AnimatedAvatar';

<AnimatedAvatar
  imageUri={user.avatar_url}
  size={80}
  initials="JD"
  onPress={() => console.log('Avatar cliqué')}
  borderColor={Colors.primary}
  borderWidth={3}
/>
```

---

### 2. **components/ProfileAvatarAnimated.tsx**
Avatar avancé avec options multiples

**Caractéristiques :**
- ✅ 3 types d'animations : `scale`, `bounce`, `pulse`
- ✅ Modal de zoom en plein écran
- ✅ Badge personnalisable (vérifié, premium, etc.)
- ✅ Gradient de fond pour les initiales
- ✅ Animations fluides (spring + timing)

**Utilisation avancée :**
```typescript
import { ProfileAvatarAnimated } from '../components/ProfileAvatarAnimated';

<ProfileAvatarAnimated
  imageUri={user.avatar_url}
  size={120}
  initials="JD"
  showBadge={true}
  badgeIcon="checkmark-circle"
  badgeColor={Colors.success}
  enableZoomModal={true}
  animationType="bounce"
  onPress={() => console.log('Avatar cliqué')}
/>
```

---

## 🎬 Types d'Animations

### 1. Animation "scale" (Simple)
```typescript
animationType="scale"
```
- Zoom out rapide
- Animation linéaire
- Durée: 150ms
- **Usage:** Interfaces minimalistes

### 2. Animation "bounce" (Rebond) ⭐ RECOMMANDÉ
```typescript
animationType="bounce"
```
- Zoom out avec effet de rebond
- Animation spring naturelle
- Friction/tension personnalisés
- **Usage:** Applications modernes, réseaux sociaux

### 3. Animation "pulse" (Pulsation)
```typescript
animationType="pulse"
```
- Zoom out + légère rotation (5°)
- Effet de "pulsation"
- Animation combinée (parallel)
- **Usage:** Notifications, alertes, highlights

---

## 🏷️ Badges

### Ajouter un badge

```typescript
<ProfileAvatarAnimated
  imageUri={user.avatar_url}
  size={100}
  showBadge={true}
  badgeIcon="checkmark-circle"
  badgeColor={Colors.success}
/>
```

### Icônes de badge populaires

```typescript
// Vérifié
badgeIcon="checkmark-circle"
badgeColor={Colors.success}

// Premium
badgeIcon="diamond"
badgeColor={Colors.gold}

// VIP
badgeIcon="star"
badgeColor={Colors.warning}

// En ligne
badgeIcon="ellipse"
badgeColor={Colors.success}

// Occupé
badgeIcon="ellipse"
badgeColor={Colors.error}

// Admin
badgeIcon="shield-checkmark"
badgeColor={Colors.primary}
```

---

## 🔍 Modal de Zoom

### Activer le zoom en plein écran

```typescript
<ProfileAvatarAnimated
  imageUri={user.avatar_url}
  size={100}
  enableZoomModal={true}
/>
```

**Fonctionnement :**
1. L'utilisateur clique sur l'avatar
2. Modal s'ouvre avec animation de scale
3. Image affichée en grand (90% de l'écran)
4. Cliquer en dehors ferme le modal
5. Bouton de fermeture en haut à droite

**Animations du modal :**
- Apparition: Scale de 0 à 1 + fade in
- Disparition: Scale de 1 à 0 + fade out
- Background: Noir semi-transparent (95%)

---

## 📱 Exemples d'Intégration

### Dans la page Profil

```typescript
// app/(tabs)/profile.tsx

import { ProfileAvatarAnimated } from '../components/ProfileAvatarAnimated';

// Remplacer l'avatar existant
<ProfileAvatarAnimated
  imageUri={profile?.avatar_url || null}
  size={100}
  initials={userInitials}
  showBadge={profile?.is_premium}
  badgeIcon="diamond"
  badgeColor="#FFD700"
  enableZoomModal={true}
  animationType="bounce"
  onPress={() => {
    // Optionnel: ouvrir une modal d'édition
    setEditModalVisible(true);
  }}
/>
```

### Dans une liste de messages (Chat)

```typescript
import { AnimatedAvatar } from '../components/AnimatedAvatar';

// Avatar compact dans la liste
messages.map(message => (
  <View key={message.id} style={styles.messageItem}>
    <AnimatedAvatar
      imageUri={message.sender.avatar_url}
      size={40}
      initials={message.sender.initials}
      onPress={() => router.push(`/profile/${message.sender.id}`)}
    />
    <Text>{message.content}</Text>
  </View>
))
```

### Dans une carte de vendeur

```typescript
<ProfileAvatarAnimated
  imageUri={seller.avatar_url}
  size={60}
  initials={seller.initials}
  showBadge={seller.is_verified}
  badgeIcon="checkmark-circle"
  badgeColor={Colors.success}
  animationType="bounce"
  onPress={() => router.push(`/seller/${seller.id}`)}
/>
```

---

## 🎨 Personnalisation

### Couleurs de bordure

```typescript
// Bordure primaire
borderColor={Colors.primary}
borderWidth={3}

// Bordure dorée (premium)
borderColor="#FFD700"
borderWidth={4}

// Bordure gradient (utiliser ProfileAvatarAnimated)
// Le composant utilise déjà un gradient pour les initiales
```

### Tailles recommandées

```typescript
// Mini (liste, chat)
size={40}

// Petit (carte produit)
size={60}

// Moyen (profil compact)
size={80}

// Grand (page profil)
size={120}

// Extra large (modal plein écran)
size={200}
```

---

## 🧪 Tests

### Test 1 : AnimatedAvatar basique

```typescript
import { AnimatedAvatar } from '../components/AnimatedAvatar';
import { Alert } from 'react-native';

<AnimatedAvatar
  imageUri={null} // Affichera les initiales
  size={100}
  initials="AB"
  onPress={() => Alert.alert('Avatar', 'Animation testée !')}
/>
```

**Résultat attendu :**
- Animation zoom out lors du clic
- Retour en douceur avec rebond
- Alert s'affiche

### Test 2 : ProfileAvatarAnimated avec badge

```typescript
<ProfileAvatarAnimated
  imageUri="https://i.pravatar.cc/300"
  size={120}
  initials="JD"
  showBadge={true}
  badgeIcon="star"
  badgeColor="#FFD700"
  animationType="pulse"
/>
```

**Résultat attendu :**
- Avatar avec image chargée
- Badge doré en bas à droite
- Animation pulse (zoom + légère rotation)

### Test 3 : Modal de zoom

```typescript
<ProfileAvatarAnimated
  imageUri="https://i.pravatar.cc/300"
  size={100}
  enableZoomModal={true}
  animationType="bounce"
/>
```

**Résultat attendu :**
- Clic ouvre le modal
- Image agrandie en plein écran
- Bouton de fermeture visible
- Clic en dehors ferme le modal

---

## ⚡ Performance

### Optimisations appliquées

1. **useNativeDriver: true**
   - Animations sur le thread natif
   - 60 FPS garantis
   - Pas de blocage du JS thread

2. **Spring animations**
   - Naturelles et fluides
   - Paramètres optimisés (friction: 4-5, tension: 80-100)

3. **Minimal re-renders**
   - Animations gérées par Animated API
   - Pas de setState pendant l'animation

### Mesures de performance

```typescript
import { InteractionManager } from 'react-native';

// Tester le temps de réponse
const start = Date.now();
handlePress();
InteractionManager.runAfterInteractions(() => {
  console.log(`Animation time: ${Date.now() - start}ms`);
  // Attendu: < 200ms
});
```

---

## 🔧 Personnalisation Avancée

### Créer une animation custom

```typescript
// Créer votre propre composant basé sur AnimatedAvatar

import { AnimatedAvatar } from '../components/AnimatedAvatar';

const MyCustomAvatar = (props) => {
  const handlePress = () => {
    // Votre logique custom
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    props.onPress?.();
  };

  return (
    <AnimatedAvatar
      {...props}
      onPress={handlePress}
      borderColor="#FF6B6B"
    />
  );
};
```

### Ajouter un feedback haptique

```bash
# Installer expo-haptics
npm install expo-haptics
```

```typescript
import * as Haptics from 'expo-haptics';

<ProfileAvatarAnimated
  imageUri={user.avatar_url}
  size={100}
  onPress={() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Avatar cliqué avec vibration');
  }}
/>
```

---

## 🎯 Cas d'Usage

### 1. Profil utilisateur principal
```typescript
<ProfileAvatarAnimated
  imageUri={user.avatar_url}
  size={120}
  initials={getInitials(user.name)}
  showBadge={user.is_premium}
  badgeIcon="diamond"
  badgeColor="#FFD700"
  enableZoomModal={true}
  animationType="bounce"
/>
```

### 2. Liste de contacts
```typescript
contacts.map(contact => (
  <AnimatedAvatar
    key={contact.id}
    imageUri={contact.avatar_url}
    size={50}
    initials={contact.initials}
    onPress={() => openChat(contact.id)}
  />
))
```

### 3. Vendeurs vérifiés
```typescript
<ProfileAvatarAnimated
  imageUri={seller.avatar_url}
  size={80}
  initials={seller.initials}
  showBadge={seller.is_verified}
  badgeIcon="checkmark-circle"
  badgeColor={Colors.success}
  animationType="bounce"
/>
```

### 4. Statut en ligne
```typescript
<ProfileAvatarAnimated
  imageUri={user.avatar_url}
  size={60}
  initials={user.initials}
  showBadge={true}
  badgeIcon="ellipse"
  badgeColor={user.is_online ? Colors.success : Colors.gray}
  animationType="pulse"
/>
```

---

## 📚 Propriétés Complètes

### AnimatedAvatar

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| imageUri | string \| null | null | URL de l'image |
| size | number | 80 | Taille en pixels |
| onPress | () => void | undefined | Callback au clic |
| initials | string | 'U' | Initiales si pas d'image |
| style | ViewStyle | {} | Style custom |
| borderColor | string | Colors.primary | Couleur bordure |
| borderWidth | number | 3 | Épaisseur bordure |

### ProfileAvatarAnimated

Toutes les props de `AnimatedAvatar` +

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| showBadge | boolean | false | Afficher le badge |
| badgeIcon | IconName | 'checkmark-circle' | Icône du badge |
| badgeColor | string | Colors.success | Couleur du badge |
| enableZoomModal | boolean | false | Modal zoom plein écran |
| animationType | 'scale' \| 'bounce' \| 'pulse' | 'bounce' | Type d'animation |

---

## ✅ Checklist d'Intégration

- [x] Composants AnimatedAvatar créés
- [x] Composants ProfileAvatarAnimated créés
- [ ] Remplacer les avatars existants dans profile.tsx
- [ ] Tester sur Android
- [ ] Tester sur iOS
- [ ] Ajouter feedback haptique (optionnel)
- [ ] Intégrer dans les listes de messages
- [ ] Intégrer dans les cartes vendeurs

---

## 🎉 Résumé

**Composants créés :**
- ✅ `AnimatedAvatar` - Animation simple
- ✅ `ProfileAvatarAnimated` - Animation avancée

**Animations disponibles :**
- ✅ Scale (simple)
- ✅ Bounce (rebond)
- ✅ Pulse (pulsation + rotation)

**Fonctionnalités :**
- ✅ Zoom out au clic
- ✅ Modal plein écran
- ✅ Badges personnalisables
- ✅ Support image + initiales
- ✅ Performance optimisée (60 FPS)

**Prochaine étape :** Intégrer dans `app/(tabs)/profile.tsx` ! 🚀
