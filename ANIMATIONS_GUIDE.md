# 🎬 Guide des Animations - SenePanda

## 📚 Table des matières
- [Introduction](#introduction)
- [Patterns d'Animation](#patterns-danimation)
- [Composants Animés](#composants-animés)
- [Pages Animées](#pages-animées)
- [Best Practices](#best-practices)
- [Exemples de Code](#exemples-de-code)

## Introduction

Ce guide explique comment les animations sont implémentées dans SenePanda et comment ajouter de nouvelles animations en suivant les mêmes patterns.

### Principes de base

1. **Toujours utiliser `useNativeDriver: true`** pour les performances
2. **Spring animations** pour les interactions
3. **Timing animations** pour les transitions
4. **Interpolations** pour les effets basés sur le scroll

## Patterns d'Animation

### 1. Animation de Press (Boutons, Cartes)

```javascript
const scaleAnim = useRef(new Animated.Value(1)).current;

const handlePressIn = () => {
  Animated.spring(scaleAnim, {
    toValue: 0.95,
    useNativeDriver: true,
    friction: 3,
  }).start();
};

const handlePressOut = () => {
  Animated.spring(scaleAnim, {
    toValue: 1,
    useNativeDriver: true,
    friction: 3,
  }).start();
};

<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
  <TouchableOpacity
    onPressIn={handlePressIn}
    onPressOut={handlePressOut}>
    {/* Contenu */}
  </TouchableOpacity>
</Animated.View>
```

### 2. Animation de Fade-in

```javascript
const fadeAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 400,
    useNativeDriver: true,
  }).start();
}, []);

<Animated.View style={{ opacity: fadeAnim }}>
  {/* Contenu */}
</Animated.View>
```

### 3. Animation de Slide

```javascript
const slideAnim = useRef(new Animated.Value(-50)).current;

useEffect(() => {
  Animated.spring(slideAnim, {
    toValue: 0,
    useNativeDriver: true,
    friction: 8,
  }).start();
}, []);

<Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
  {/* Contenu */}
</Animated.View>
```

### 4. Animations Parallèles (Fade + Slide)

```javascript
const fadeAnim = useRef(new Animated.Value(0)).current;
const slideAnim = useRef(new Animated.Value(30)).current;

useEffect(() => {
  Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }),
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }),
  ]).start();
}, []);

<Animated.View style={{
  opacity: fadeAnim,
  transform: [{ translateY: slideAnim }]
}}>
  {/* Contenu */}
</Animated.View>
```

### 5. Animation basée sur le Scroll

```javascript
const scrollY = useRef(new Animated.Value(0)).current;

const opacity = scrollY.interpolate({
  inputRange: [0, 100],
  outputRange: [1, 0],
  extrapolate: 'clamp',
});

const scale = scrollY.interpolate({
  inputRange: [-100, 0, 100],
  outputRange: [1.2, 1, 0.95],
  extrapolate: 'clamp',
});

<Animated.FlatList
  onScroll={Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  )}
  scrollEventThrottle={16}
/>

<Animated.View style={{
  opacity: opacity,
  transform: [{ scale: scale }]
}}>
  {/* Contenu */}
</Animated.View>
```

## Composants Animés

### CategoryChip

**Animations:**
- Press: scale 0.95
- Selected: scale 1.05
- Transition: spring (friction: 3)

**Quand utiliser:**
- Filtres de catégories
- Sélections multiples
- Tags interactifs

### ProductCard

**Animations:**
- Entrée: fade-in (400ms)
- Press: scale 0.97
- Apparition: progressive

**Quand utiliser:**
- Grilles de produits
- Listes de résultats
- Favoris

### ProfileCard

**Animations:**
- Entrée: fade + scale
- Press: spring animation
- Duration: 400ms

**Quand utiliser:**
- Sections de profil
- Paramètres
- Options de menu

## Pages Animées

### Page d'accueil

**Effets principaux:**
1. **Hero Parallax**
   - Scale dynamique
   - Opacity fade
   - Pull-to-refresh effect

2. **Scroll Animations**
   - Header fade-out
   - Parallax effect
   - Smooth transitions

**Code clé:**
```javascript
const headerOpacity = scrollY.interpolate({
  inputRange: [0, 100],
  outputRange: [1, 0],
  extrapolate: 'clamp',
});

const heroScale = scrollY.interpolate({
  inputRange: [-100, 0, 100],
  outputRange: [1.2, 1, 0.95],
  extrapolate: 'clamp',
});
```

### Page Explorer

**Effets principaux:**
1. **Entrée animée**
   - Fade + Slide
   - Duration: 500ms
   - Friction: 8

2. **Filtres interactifs**
   - Press animations
   - Spring physics

**Code clé:**
```javascript
Animated.parallel([
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 500,
    useNativeDriver: true,
  }),
  Animated.spring(slideAnim, {
    toValue: 0,
    useNativeDriver: true,
    friction: 8,
  }),
]).start();
```

### Page Profil

**Effets principaux:**
1. **User Card**
   - Slide-up animation
   - Fade-in
   - Spring physics

2. **Profile Cards**
   - Entrée séquentielle
   - Individual animations

## Best Practices

### ✅ À Faire

1. **Toujours utiliser useNativeDriver**
```javascript
// ✅ Bon
Animated.timing(value, {
  toValue: 1,
  useNativeDriver: true,
})

// ❌ Mauvais
Animated.timing(value, {
  toValue: 1,
  useNativeDriver: false,
})
```

2. **Spring pour interactions**
```javascript
// ✅ Bon - Interactions tactiles
Animated.spring(scaleAnim, {
  toValue: 0.95,
  useNativeDriver: true,
  friction: 3,
})
```

3. **Extrapolate clamp**
```javascript
// ✅ Bon - Évite valeurs hors limites
scrollY.interpolate({
  inputRange: [0, 100],
  outputRange: [1, 0],
  extrapolate: 'clamp',
})
```

4. **ScrollEventThrottle pour scroll**
```javascript
// ✅ Bon - 60fps
<Animated.FlatList
  scrollEventThrottle={16}
  onScroll={...}
/>
```

### ❌ À Éviter

1. **Pas de useNativeDriver pour layout**
```javascript
// ❌ width, height, margin ne supportent pas useNativeDriver
Animated.timing(width, {
  toValue: 100,
  useNativeDriver: true, // ERREUR!
})
```

2. **Pas d'animations bloquantes**
```javascript
// ❌ Éviter les animations trop longues
Animated.timing(value, {
  toValue: 1,
  duration: 5000, // Trop long!
})
```

3. **Pas de valeurs non-clampées**
```javascript
// ❌ Peut causer des bugs visuels
scrollY.interpolate({
  inputRange: [0, 100],
  outputRange: [1, 0],
  // Manque extrapolate: 'clamp'
})
```

## Exemples de Code

### Créer un nouveau bouton animé

```javascript
import { TouchableOpacity, Animated } from 'react-native';
import { useRef } from 'react';

export default function AnimatedButton({ children, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
```

### Créer une carte avec fade-in

```javascript
import { View, Animated } from 'react-native';
import { useRef, useEffect } from 'react';

export default function FadeInCard({ children }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {children}
    </Animated.View>
  );
}
```

### Créer un header avec parallax

```javascript
import { Animated } from 'react-native';
import { useRef } from 'react';

export default function ParallaxHeader() {
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [1.2, 1, 0.95],
    extrapolate: 'clamp',
  });

  return (
    <Animated.FlatList
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      scrollEventThrottle={16}
      ListHeaderComponent={
        <Animated.View style={{
          opacity: headerOpacity,
          transform: [{ scale: headerScale }]
        }}>
          {/* Header content */}
        </Animated.View>
      }
    />
  );
}
```

## Configuration recommandée

### Timings Standards

```javascript
const ANIMATION_TIMINGS = {
  // Interactions rapides
  PRESS: 150,

  // Transitions standards
  FADE: 400,
  SLIDE: 500,

  // Entrées de page
  PAGE_ENTER: 600,

  // Spring friction
  SPRING_FAST: 3,
  SPRING_SMOOTH: 8,
};
```

### Scales Standards

```javascript
const ANIMATION_SCALES = {
  PRESS: 0.95,
  PRESS_CARD: 0.97,
  SELECTED: 1.05,
  NORMAL: 1.0,
  ENTRY: 0.95,
};
```

## Ressources

### Documentation
- [React Native Animated](https://reactnative.dev/docs/animated)
- [useNativeDriver](https://reactnative.dev/docs/animations#using-the-native-driver)
- [Interpolation](https://reactnative.dev/docs/animations#interpolation)

### Outils
- [Flipper](https://fbflipper.com/) - Debug animations
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)

### Inspirations
- [Material Design Motion](https://material.io/design/motion)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/animation/)

---

**Maintenu par**: L'équipe SenePanda
**Dernière mise à jour**: 18 Octobre 2025
**Version**: 1.0.0
