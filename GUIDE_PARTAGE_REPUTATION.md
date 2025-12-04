# 📤 Système de Partage de Réputation - Guide Complet

## Vue d'ensemble

Le système de partage permet aux vendeurs de partager leur badge de réputation sur les réseaux sociaux, par message ou en image. Ce guide explique comment utiliser toutes les fonctionnalités de partage.

---

## 🎯 Fonctionnalités

### ✅ Modes de partage disponibles

1. **Partage texte** 📝
   - Message formaté avec statistiques
   - Compatible tous les apps
   - Partage natif iOS/Android

2. **Partage avec image** 🖼️
   - Capture d'écran du badge
   - Image PNG haute qualité
   - Watermark SenePanda

3. **Partage sur réseaux sociaux** 📱
   - WhatsApp
   - Facebook
   - Twitter
   - Instagram (copie)

4. **Copie dans le presse-papiers** 📋
   - Message prêt à coller
   - Compatible toutes apps

---

## 💻 Utilisation

### Composant ShareReputationButton

Le bouton de partage est disponible en 3 variantes :

#### 1. Variante Icon (bouton icône)

```tsx
import ShareReputationButton from '@/components/ShareReputationButton';

<ShareReputationButton
  reputation={reputation}
  shopName="Ma Boutique"
  viewRef={badgeRef}
  variant="icon"
  size="medium"
/>
```

#### 2. Variante Button (bouton avec texte)

```tsx
<ShareReputationButton
  reputation={reputation}
  shopName="Ma Boutique"
  viewRef={badgeRef}
  variant="button"
  size="large"
/>
```

#### 3. Variante Full (bouton complet)

```tsx
<ShareReputationButton
  reputation={reputation}
  shopName="Ma Boutique"
  viewRef={badgeRef}
  variant="full"
/>
```

### Props du composant

| Prop | Type | Requis | Description |
|------|------|--------|-------------|
| `reputation` | ReputationData | ✅ | Données de réputation |
| `shopName` | string | ❌ | Nom de la boutique |
| `viewRef` | RefObject | ❌ | Ref du badge pour capture |
| `variant` | 'icon' \| 'button' \| 'full' | ❌ | Style du bouton (défaut: 'icon') |
| `size` | 'small' \| 'medium' \| 'large' | ❌ | Taille (défaut: 'medium') |

---

## 🪝 Hook useShareReputation

Le hook fournit toutes les fonctions de partage :

### Fonctions disponibles

```typescript
const {
  shareText,        // Partage texte simple
  shareImage,       // Partage avec image
  shareToSocial,    // Partage sur un réseau social
  copyToClipboard,  // Copie dans le presse-papiers
  isSharing,        // État de chargement
} = useShareReputation();
```

### shareText()

Partage le badge en mode texte uniquement.

```typescript
const result = await shareText(
  reputation,
  'Ma Boutique',
  {
    customMessage: 'Mon message personnalisé' // Optionnel
  }
);

// result = { success: true, shared: true }
```

### shareImage()

Partage le badge avec une capture d'écran.

```typescript
const badgeRef = useRef(null);

const result = await shareImage(
  badgeRef,
  reputation,
  'Ma Boutique'
);

// L'image est capturée et partagée automatiquement
```

**Important :** Pour la capture d'image, le composant `SellerReputationBadge` doit avoir :
- Une référence (`ref={badgeRef}`)
- La prop `capturable={true}`

### shareToSocial()

Partage sur un réseau social spécifique.

```typescript
const platforms = ['facebook', 'twitter', 'whatsapp', 'instagram'];

await shareToSocial('whatsapp', reputation, 'Ma Boutique');
```

**Notes :**
- WhatsApp : Ouvre l'app avec le message pré-rempli
- Facebook : Ouvre le dialogue de partage
- Twitter : Ouvre avec le tweet pré-rempli
- Instagram : Copie le message (Instagram n'a pas d'API de partage)

### copyToClipboard()

Copie le message dans le presse-papiers.

```typescript
await copyToClipboard(reputation, 'Ma Boutique');
// Affiche : "✓ Copié! Message copié dans le presse-papiers"
```

---

## 📝 Format du Message

Le message généré automatiquement contient :

```
🥇 Badge Or sur SenePanda!

🏪 [Nom de la boutique]
⭐⭐⭐⭐⭐ 4.7/5
💬 85 avis clients
🎯 Score: 78/100

✨ Vendeur de confiance avec une qualité exceptionnelle.

#SenePanda #VendeurDeConfiance
```

### Message personnalisé selon le niveau

- **Diamant** : "🏆 Excellence absolue! Vendeur d'élite certifié."
- **Platine** : "⭐ Vendeur d'élite reconnu pour son excellence."
- **Or** : "✨ Vendeur de confiance avec une qualité exceptionnelle."
- **Argent** : "👍 Bon vendeur apprécié par ses clients."
- **Bronze** : "🎯 Vendeur fiable en progression."
- **Nouveau** : "🌟 Nouveau vendeur motivé!"

---

## 🎨 Capture d'Écran du Badge

Pour activer la capture d'image :

### 1. Créer une référence

```tsx
import { useRef } from 'react';

const badgeRef = useRef<View>(null);
```

### 2. Attacher au badge

```tsx
<SellerReputationBadge
  ref={badgeRef}
  reputation={reputation}
  capturable={true} // Important !
  showDetails={true}
/>
```

### 3. Passer au bouton de partage

```tsx
<ShareReputationButton
  reputation={reputation}
  viewRef={badgeRef}
  variant="button"
/>
```

### Résultat

- Badge capturé en PNG haute qualité
- Fond blanc avec padding
- Coins arrondis
- Prêt à partager sur tous les réseaux

---

## 📱 Exemples d'Utilisation

### Exemple 1 : Profil vendeur complet

```tsx
import { useRef } from 'react';
import SellerReputationBadge from '@/components/SellerReputationBadge';
import ShareReputationButton from '@/components/ShareReputationButton';
import { useMyReputation } from '@/hooks/useSellerReputation';

function VendeurProfile() {
  const { reputation } = useMyReputation();
  const badgeRef = useRef(null);

  return (
    <View>
      <SellerReputationBadge
        ref={badgeRef}
        reputation={reputation}
        size="large"
        showDetails={true}
        showProgress={true}
        capturable={true}
      />

      <ShareReputationButton
        reputation={reputation}
        shopName="Ma Super Boutique"
        viewRef={badgeRef}
        variant="full"
      />
    </View>
  );
}
```

### Exemple 2 : Bouton de partage rapide

```tsx
function QuickShareButton({ reputation, shopName }) {
  return (
    <ShareReputationButton
      reputation={reputation}
      shopName={shopName}
      variant="icon"
      size="small"
    />
  );
}
```

### Exemple 3 : Partage personnalisé

```tsx
import { useShareReputation } from '@/hooks/useShareReputation';

function CustomShare({ reputation }) {
  const { shareText, isSharing } = useShareReputation();

  const handleShare = async () => {
    await shareText(reputation, 'Ma Boutique', {
      customMessage: `
🎉 Nouvelle étape franchie !

Je viens d'atteindre le niveau ${reputation.level} sur SenePanda !

Merci à tous mes clients pour leur confiance 🙏

⭐ ${reputation.averageRating}/5 - ${reputation.totalReviews} avis
      `.trim()
    });
  };

  return (
    <TouchableOpacity onPress={handleShare} disabled={isSharing}>
      <Text>Partager ma progression</Text>
    </TouchableOpacity>
  );
}
```

### Exemple 4 : Modal de partage

```tsx
import { useState } from 'react';
import { useShareReputation } from '@/hooks/useShareReputation';

function ShareModal({ visible, reputation, shopName, onClose }) {
  const { shareToSocial, isSharing } = useShareReputation();

  const platforms = [
    { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp' },
    { id: 'facebook', name: 'Facebook', icon: 'logo-facebook' },
    { id: 'twitter', name: 'Twitter', icon: 'logo-twitter' },
  ];

  return (
    <Modal visible={visible} onRequestClose={onClose}>
      <View>
        <Text>Partager sur :</Text>
        {platforms.map(platform => (
          <TouchableOpacity
            key={platform.id}
            onPress={() => shareToSocial(platform.id, reputation, shopName)}
            disabled={isSharing}>
            <Text>{platform.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
}
```

### Exemple 5 : Partage automatique après niveau

```tsx
import { useEffect } from 'react';
import { useShareReputation } from '@/hooks/useShareReputation';

function AutoShareOnLevelUp({ reputation, previousLevel }) {
  const { shareText } = useShareReputation();

  useEffect(() => {
    // Partage automatique si niveau supérieur
    if (reputation.level !== previousLevel) {
      const levels = ['nouveau', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];
      const currentIndex = levels.indexOf(reputation.level);
      const prevIndex = levels.indexOf(previousLevel);

      if (currentIndex > prevIndex) {
        Alert.alert(
          '🎉 Nouveau niveau !',
          `Félicitations ! Vous avez atteint le niveau ${reputation.level}`,
          [
            { text: 'Plus tard', style: 'cancel' },
            {
              text: 'Partager',
              onPress: () => shareText(reputation)
            }
          ]
        );
      }
    }
  }, [reputation.level, previousLevel]);

  return null;
}
```

---

## 🎨 Personnalisation

### Modifier le message de partage

Éditez `hooks/useShareReputation.ts` :

```typescript
function generateShareMessage(reputation, shopName) {
  // Personnalisez le message ici
  let message = `Mon badge ${reputation.level} 🏆\n\n`;
  message += `⭐ ${reputation.averageRating}/5\n`;
  // ... votre format
  return message;
}
```

### Modifier les réseaux sociaux

Ajoutez un nouveau réseau dans `ShareReputationButton.tsx` :

```tsx
<SocialButton
  icon="logo-linkedin"
  label="LinkedIn"
  color="#0A66C2"
  onPress={() => onShareSocial('linkedin')}
/>
```

Puis dans le hook `useShareReputation.ts` :

```typescript
case 'linkedin':
  shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  break;
```

### Modifier l'apparence du badge capturé

Dans `SellerReputationBadge.tsx`, modifiez le style `capturableContainer` :

```typescript
capturableContainer: {
  backgroundColor: '#FFFFFF',
  padding: 20,
  borderRadius: 16,
  // Ajoutez un logo ou watermark ici
},
```

---

## 🔒 Permissions

### iOS

Ajoutez dans `app.json` :

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSPhotoLibraryAddUsageDescription": "Permet de sauvegarder votre badge de réputation"
      }
    }
  }
}
```

### Android

Aucune permission requise pour le partage. Les permissions sont gérées automatiquement par Expo.

---

## 🐛 Dépannage

### Le partage ne fonctionne pas

1. **Vérifier les imports**
```tsx
import ShareReputationButton from '@/components/ShareReputationButton';
import { useShareReputation } from '@/hooks/useShareReputation';
```

2. **Vérifier les dépendances**
```bash
npm install react-native-view-shot expo-sharing
```

3. **Vérifier la référence du badge**
```tsx
// ❌ Mauvais
<SellerReputationBadge reputation={reputation} />
<ShareReputationButton viewRef={badgeRef} /> // badgeRef n'existe pas

// ✅ Bon
const badgeRef = useRef(null);
<SellerReputationBadge ref={badgeRef} capturable={true} />
<ShareReputationButton viewRef={badgeRef} />
```

### L'image n'est pas capturée

1. Vérifier que `capturable={true}`
2. Vérifier que la ref est bien attachée
3. Attendre que le composant soit monté

```tsx
useEffect(() => {
  // Attendre le montage
  setTimeout(() => {
    shareImage(badgeRef, reputation);
  }, 500);
}, []);
```

### Le partage sur Instagram ne fonctionne pas

Instagram n'a pas d'API de partage de liens. Le système copie automatiquement le message dans le presse-papiers. L'utilisateur doit ensuite :

1. Ouvrir Instagram
2. Créer un post/story
3. Coller le message

---

## 📊 Statistiques de Partage

Pour tracker les partages (optionnel) :

```typescript
import { supabase } from '@/lib/supabase';

const trackShare = async (platform: string) => {
  await supabase
    .from('share_events')
    .insert({
      user_id: userId,
      share_type: platform,
      content_type: 'reputation_badge',
      shared_at: new Date().toISOString(),
    });
};

// Utilisation
const handleShare = async () => {
  const result = await shareText(reputation);
  if (result.shared) {
    await trackShare('native');
  }
};
```

---

## 🎁 Fonctionnalités Bonus

### generateShareStats()

Génère des statistiques formatées :

```typescript
import { generateShareStats } from '@/hooks/useShareReputation';

const stats = generateShareStats(reputation);
console.log(stats);
// 📊 Mes statistiques de vendeur:
// ⭐ Note: 4.7/5
// 💬 Avis: 85
// ...
```

### Message avec émojis personnalisés

```typescript
const levelEmojis = {
  nouveau: '🌱',
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '💠',
};

const emoji = levelEmojis[reputation.level];
```

---

## 🚀 Prochaines Améliorations

### Fonctionnalités à venir

- [ ] Stories Instagram automatiques
- [ ] Partage vidéo animé
- [ ] Templates personnalisables
- [ ] Partage sur LinkedIn
- [ ] QR Code du badge
- [ ] Watermark personnalisé
- [ ] Analytics de partage
- [ ] Campagnes de partage

---

## 📞 Support

Pour toute question sur le partage :

1. Consulter la section Dépannage
2. Vérifier les exemples de code
3. Tester avec le mode texte d'abord
4. Consulter les logs de la console

---

## ✨ Résumé

**Fonctionnalités implémentées :**
- ✅ Partage texte natif
- ✅ Partage avec image (capture)
- ✅ 4 réseaux sociaux (WhatsApp, Facebook, Twitter, Instagram)
- ✅ Copie presse-papiers
- ✅ 3 variantes de bouton
- ✅ Messages personnalisés par niveau
- ✅ Gestion des erreurs
- ✅ États de chargement
- ✅ Documentation complète

**Comment l'utiliser :**
1. Importer `ShareReputationButton`
2. Créer une ref pour le badge
3. Passer la ref au bouton
4. Profit ! 🎉

---

**Système de Partage SenePanda v1.0.0**
*Partagez votre excellence avec le monde ! 📤*

*Dernière mise à jour : 3 décembre 2025*
