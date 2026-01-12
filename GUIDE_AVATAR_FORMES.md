# 🎨 Guide des Formes d'Avatar

## 📋 Vue d'ensemble

Le composant `TeardropAvatar` propose maintenant **6 formes différentes** pour les avatars de profil, permettant une personnalisation moderne et élégante.

## ✨ Formes Disponibles

### 1. 🟦 Squircle (Par défaut)
**Style iOS moderne** - Carré avec coins super-arrondis

```typescript
<TeardropAvatar
  imageUri={imageUri}
  size={140}
  shape="squircle"  // Forme par défaut
  glowColor={['#93C5FD', '#60A5FA']}
  borderWidth={4}
  borderColor="#FFFFFF"
>
  <Text style={styles.avatarText}>AB</Text>
</TeardropAvatar>
```

**Caractéristiques :**
- ✅ Design moderne type iOS/macOS
- ✅ Coins super-arrondis (superellipse)
- ✅ Élégant et professionnel
- ✅ **Recommandé pour les profils**

---

### 2. ⭕ Circle
**Forme circulaire classique**

```typescript
<TeardropAvatar
  imageUri={imageUri}
  size={140}
  shape="circle"
  glowColor={['#93C5FD', '#60A5FA']}
>
  <Text style={styles.avatarText}>AB</Text>
</TeardropAvatar>
```

**Caractéristiques :**
- ✅ Classique et universel
- ✅ Fonctionne avec tous les designs
- ✅ Standard pour les réseaux sociaux

---

### 3. ⬡ Hexagon
**Hexagone moderne**

```typescript
<TeardropAvatar
  imageUri={imageUri}
  size={140}
  shape="hexagon"
  glowColor={['#8B5CF6', '#6B21A8']}
>
  <Text style={styles.avatarText}>AB</Text>
</TeardropAvatar>
```

**Caractéristiques :**
- ✅ Design gaming/tech
- ✅ Forme géométrique distinctive
- ✅ Idéal pour badges et récompenses

---

### 4. 💧 Teardrop
**Goutte d'eau originale**

```typescript
<TeardropAvatar
  imageUri={imageUri}
  size={140}
  shape="teardrop"
  glowColor={['#3B82F6', '#1D4ED8']}
>
  <Text style={styles.avatarText}>AB</Text>
</TeardropAvatar>
```

**Caractéristiques :**
- ✅ Unique et créatif
- ✅ Pointe en bas à droite
- ✅ Design original SenePanda

---

### 5. 🛡️ Shield
**Bouclier protecteur**

```typescript
<TeardropAvatar
  imageUri={imageUri}
  size={140}
  shape="shield"
  glowColor={['#10B981', '#059669']}
>
  <Text style={styles.avatarText}>AB</Text>
</TeardropAvatar>
```

**Caractéristiques :**
- ✅ Symbolise protection/sécurité
- ✅ Idéal pour badges premium
- ✅ Design héroïque

---

### 6. 💎 Diamond
**Diamant précieux**

```typescript
<TeardropAvatar
  imageUri={imageUri}
  size={140}
  shape="diamond"
  glowColor={['#F59E0B', '#D97706']}
>
  <Text style={styles.avatarText}>AB</Text>
</TeardropAvatar>
```

**Caractéristiques :**
- ✅ Symbolise excellence/valeur
- ✅ Forme de losange élégante
- ✅ Parfait pour membres premium

---

## 🎨 Options de Personnalisation

### Bordures

Ajoutez une bordure autour de l'avatar :

```typescript
<TeardropAvatar
  imageUri={imageUri}
  size={140}
  shape="squircle"
  borderWidth={4}           // Épaisseur de la bordure
  borderColor="#FFFFFF"     // Couleur de la bordure
/>
```

**Exemples de bordures :**
- `borderWidth={2}` - Bordure fine
- `borderWidth={4}` - Bordure moyenne (recommandé)
- `borderWidth={6}` - Bordure épaisse

**Couleurs de bordure suggérées :**
- Mode clair : `#FFFFFF` (blanc)
- Mode sombre : `#374151` (gris sombre)
- Premium : `#F59E0B` (or)
- Pro : `#8B5CF6` (violet)

### Dégradés de Couleur

Personnalisez le dégradé pour les avatars sans image :

```typescript
<TeardropAvatar
  size={140}
  glowColor={['#93C5FD', '#60A5FA']}  // Bleu
  // ou
  glowColor={['#F59E0B', '#D97706']}  // Orange
  // ou
  glowColor={['#8B5CF6', '#6B21A8']}  // Violet
>
  <Text style={styles.avatarText}>AB</Text>
</TeardropAvatar>
```

**Palettes suggérées :**
- 🔵 Bleu : `['#93C5FD', '#60A5FA']`
- 🟠 Orange : `['#F59E0B', '#D97706']`
- 🟣 Violet : `['#8B5CF6', '#6B21A8']`
- 🟢 Vert : `['#10B981', '#059669']`
- 🔴 Rouge : `['#EF4444', '#DC2626']`
- 🟡 Or : `['#FCD34D', '#F59E0B']`

### Tailles

Adaptez la taille selon le contexte :

```typescript
// Petite (liste, commentaires)
<TeardropAvatar size={40} shape="circle" />

// Moyenne (profil compact)
<TeardropAvatar size={80} shape="squircle" />

// Grande (page profil principale)
<TeardropAvatar size={140} shape="squircle" />

// Extra-large (bannière)
<TeardropAvatar size={200} shape="shield" />
```

## 💡 Cas d'Utilisation

### Page de Profil Principale
```typescript
<TeardropAvatar
  imageUri={profile.avatar_url}
  size={140}
  shape="squircle"
  glowColor={['#93C5FD', '#60A5FA']}
  borderWidth={4}
  borderColor={isDark ? '#374151' : '#FFFFFF'}
>
  <Text style={styles.avatarText}>{userInitials}</Text>
</TeardropAvatar>
```

### Badge Premium
```typescript
<TeardropAvatar
  imageUri={profile.avatar_url}
  size={80}
  shape="diamond"
  glowColor={['#F59E0B', '#D97706']}
  borderWidth={3}
  borderColor="#F59E0B"
>
  <Text style={styles.avatarText}>VIP</Text>
</TeardropAvatar>
```

### Avatar Gaming
```typescript
<TeardropAvatar
  imageUri={profile.avatar_url}
  size={100}
  shape="hexagon"
  glowColor={['#8B5CF6', '#6B21A8']}
  borderWidth={4}
  borderColor="#8B5CF6"
>
  <Text style={styles.avatarText}>LVL 10</Text>
</TeardropAvatar>
```

### Avatar Vendeur
```typescript
<TeardropAvatar
  imageUri={seller.shop_logo_url}
  size={60}
  shape="shield"
  glowColor={['#10B981', '#059669']}
  borderWidth={2}
  borderColor="#10B981"
>
  <Text style={styles.avatarText}>SHOP</Text>
</TeardropAvatar>
```

## 🎯 Recommandations par Plan

### Plan Gratuit
```typescript
<TeardropAvatar
  shape="circle"
  glowColor={['#6B7280', '#4B5563']}
/>
```

### Plan Starter
```typescript
<TeardropAvatar
  shape="squircle"
  glowColor={['#3B82F6', '#1D4ED8']}
  borderWidth={2}
  borderColor="#3B82F6"
/>
```

### Plan Pro
```typescript
<TeardropAvatar
  shape="hexagon"
  glowColor={['#8B5CF6', '#6B21A8']}
  borderWidth={4}
  borderColor="#8B5CF6"
/>
```

### Plan Premium
```typescript
<TeardropAvatar
  shape="diamond"
  glowColor={['#F59E0B', '#D97706']}
  borderWidth={4}
  borderColor="#F59E0B"
/>
```

## 📱 Exemples Complets

### Profil avec Thème
```typescript
import TeardropAvatar from '@/components/TeardropAvatar';
import { useTheme } from '@/contexts/ThemeContext';

function ProfileScreen() {
  const { isDark } = useTheme();

  return (
    <TeardropAvatar
      imageUri={user.avatar_url}
      size={140}
      shape="squircle"
      glowColor={['#93C5FD', '#60A5FA']}
      borderWidth={4}
      borderColor={isDark ? '#374151' : '#FFFFFF'}
    >
      <Text style={styles.avatarText}>{initials}</Text>
    </TeardropAvatar>
  );
}
```

### Avatar Dynamique selon Plan
```typescript
function DynamicAvatar({ user }) {
  const getAvatarConfig = () => {
    switch (user.subscription_plan) {
      case 'premium':
        return {
          shape: 'diamond',
          glowColor: ['#F59E0B', '#D97706'],
          borderColor: '#F59E0B',
        };
      case 'pro':
        return {
          shape: 'hexagon',
          glowColor: ['#8B5CF6', '#6B21A8'],
          borderColor: '#8B5CF6',
        };
      case 'starter':
        return {
          shape: 'squircle',
          glowColor: ['#3B82F6', '#1D4ED8'],
          borderColor: '#3B82F6',
        };
      default:
        return {
          shape: 'circle',
          glowColor: ['#6B7280', '#4B5563'],
          borderColor: '#9CA3AF',
        };
    }
  };

  const config = getAvatarConfig();

  return (
    <TeardropAvatar
      imageUri={user.avatar_url}
      size={100}
      {...config}
      borderWidth={4}
    >
      <Text>{user.initials}</Text>
    </TeardropAvatar>
  );
}
```

## 🔧 Props de l'API

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `imageUri` | `string \| null` | `null` | URL de l'image de profil |
| `size` | `number` | `140` | Taille de l'avatar en pixels |
| `shape` | `AvatarShape` | `'squircle'` | Forme de l'avatar |
| `glowColor` | `string[]` | `['#93C5FD', '#60A5FA']` | Couleurs du dégradé |
| `borderWidth` | `number` | `0` | Épaisseur de la bordure |
| `borderColor` | `string` | `'#FFFFFF'` | Couleur de la bordure |
| `children` | `React.ReactNode` | - | Contenu (texte initiales) |
| `style` | `ViewStyle` | - | Styles personnalisés |

### Type AvatarShape

```typescript
type AvatarShape =
  | 'teardrop'  // Goutte d'eau originale
  | 'circle'    // Cercle classique
  | 'hexagon'   // Hexagone
  | 'squircle'  // Carré super-arrondi (défaut)
  | 'shield'    // Bouclier
  | 'diamond';  // Diamant
```

## 🎨 Design Système

### Hiérarchie Visuelle

```
Premium (Diamond) > Pro (Hexagon) > Starter (Squircle) > Free (Circle)
```

### Cohérence

- **Page profil** : `squircle` avec bordure
- **Badges** : Forme selon le plan
- **Liste/Cards** : `circle` pour simplicité
- **Chat** : `circle` compact

## ✅ Checklist d'Implémentation

- [x] Composant TeardropAvatar amélioré
- [x] 6 formes disponibles
- [x] Support des bordures
- [x] Support des dégradés
- [x] Documentation complète
- [x] Exemples d'utilisation
- [x] Configuration par défaut "squircle"
- [x] Compatibilité mode sombre/clair

## 🎉 Résultat

L'avatar de profil utilise maintenant une forme **squircle** moderne (style iOS) avec une bordure élégante qui s'adapte au thème de l'application ! 🚀

Les utilisateurs bénéficient d'un design professionnel et moderne, avec la possibilité de personnaliser les formes selon les préférences ou le plan d'abonnement.
