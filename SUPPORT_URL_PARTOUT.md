# Support des URLs d'Images Partout - SenePanda

## Ce Qui a Été Ajouté

### Option "Lien URL" Partout !

Maintenant, **partout où vous pouvez ajouter une image**, vous avez 3 options :
1. 📷 **Galerie** - Choisir depuis vos photos
2. 📸 **Appareil photo** - Prendre une photo
3. 🔗 **Lien URL** - Coller un lien d'image

## Modifications par Fichier

### 1. Images Produits
**Fichier** : `app/seller/add-product.tsx`

**Avant** :
```
Alert: Ajouter une photo
- Galerie
- Prendre une photo
- Annuler
```

**Maintenant** :
```
Alert: Ajouter une photo
- Galerie
- Prendre une photo
- Lien URL  ← NOUVEAU !
- Annuler
```

**Fonction ajoutée** :
```typescript
const addImageFromUrl = () => {
  Alert.prompt(
    'Lien de l\'image',
    'Collez le lien URL de votre image',
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Ajouter',
        onPress: (url) => {
          if (url && url.trim()) {
            setImageUris([...imageUris, url.trim()]);
          }
        },
      },
    ],
    'plain-text'
  );
};
```

**Logique d'upload** :
```typescript
const uploadImage = async (uri: string) => {
  // Si c'est déjà une URL HTTP/HTTPS, on la retourne directement
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  // Sinon, on upload le fichier local
  const result = await uploadProductImage(uri);
  ...
};
```

### 2. Composant ImageUploader
**Fichier** : `components/ImageUploader.tsx`

**Modifications** :
- Ajout de `handleAddFromUrl()`
- Option "Lien URL" dans Alert

**Utilisé par** :
- Profil (avatar)
- Toutes les pages qui utilisent ImageUploader

### 3. Wizard Boutique
**Fichier** : `app/seller/shop-wizard.tsx`

**Nouveautés** :
```
┌─────────────────────────────────────┐
│ Logo              + URL personnalisée│ ← NOUVEAU !
├─────────────────────────────────────┤
│ URL: https://example.com/logo...    │
│ ✕ Supprimer                         │
├─────────────────────────────────────┤
│ [🛍️] [🏪] [🏬] [🎨]...            │
└─────────────────────────────────────┘
```

**État** :
```typescript
const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
const [customBannerUrl, setCustomBannerUrl] = useState<string | null>(null);
```

**Fonctions** :
```typescript
const handleCustomLogo = () => {
  Alert.prompt('Logo personnalisé', 'Collez le lien URL...', ...);
};

const handleCustomBanner = () => {
  Alert.prompt('Bannière personnalisée', 'Collez le lien URL...', ...);
};
```

**Sauvegarde** :
```typescript
shop_logo_url: customLogoUrl || selectedLogo.id
shop_banner_url: customBannerUrl || selectedBanner.id
```

**Preview** :
```typescript
{customLogoUrl ? (
  <Image source={{ uri: customLogoUrl }} ... />
) : (
  <View>
    <Text>{selectedLogo.icon}</Text>
  </View>
)}
```

### 4. Page Boutique Publique
**Fichier** : `app/shop/[id].tsx`

**Détection URL vs ID** :
```typescript
const isLogoUrl = shop.shop_logo_url?.startsWith('http://') ||
                  shop.shop_logo_url?.startsWith('https://');
const isBannerUrl = shop.shop_banner_url?.startsWith('http://') ||
                    shop.shop_banner_url?.startsWith('https://');

const logo = isLogoUrl ? null : getLogoById(shop.shop_logo_url || '');
const banner = isBannerUrl ? null : getBannerById(shop.shop_banner_url || '');
```

**Affichage** :
```typescript
{isLogoUrl ? (
  <Image source={{ uri: shop.shop_logo_url }} ... />
) : (
  <View>
    <Text>{logo?.icon}</Text>
  </View>
)}
```

### 5. ProductCard
**Fichier** : `components/ProductCard.tsx`

**Même logique** :
```typescript
const isLogoUrl = product.seller?.shop_logo_url?.startsWith('http://') ||
                  product.seller?.shop_logo_url?.startsWith('https://');

const logo = isLogoUrl ? null : getLogoById(...);
```

**Badge boutique** :
```typescript
{isLogoUrl ? (
  <Image source={{ uri: product.seller.shop_logo_url }} ... />
) : (
  <View>
    <Text>{logo?.icon}</Text>
  </View>
)}
```

## Comment Utiliser

### Ajouter un Produit avec URL
1. Aller à **Ajouter produit**
2. Cliquer "Ajouter" pour une photo
3. Choisir **"Lien URL"**
4. Coller l'URL : `https://example.com/image.jpg`
5. L'image s'affiche immédiatement !

### Créer Boutique avec Logo Personnalisé
1. **Wizard** → Étape 2
2. Cliquer **"+ URL personnalisée"** sous Logo
3. Coller URL de votre logo
4. Voir le **preview en temps réel** se mettre à jour !
5. Ou cliquer un des emojis prédéfinis pour annuler l'URL

### Mélanger les Deux
```
Produit 1: Photo galerie ✅
Produit 2: URL image ✅
Produit 3: Photo caméra ✅
Produit 4: URL image ✅
Produit 5: Photo galerie ✅

Boutique Logo: URL personnalisée ✅
Boutique Bannière: Gradient prédéfini ✅
```

## Avantages

### Pour les Utilisateurs
- ✅ **Flexibilité** : 3 méthodes au choix
- ✅ **Rapide** : Coller URL = instantané
- ✅ **Économie** : Pas d'upload si image déjà en ligne
- ✅ **Qualité** : Utiliser images HD déjà hébergées

### Pour l'Application
- ✅ **Moins de stockage** : URLs ne consomment pas Supabase storage
- ✅ **Performance** : Pas d'upload = plus rapide
- ✅ **Compatibilité** : Fonctionne avec toutes les images web
- ✅ **Flexibilité** : Mix URL + uploads locaux

## Logique de Détection

### Dans l'Upload
```typescript
if (uri.startsWith('http://') || uri.startsWith('https://')) {
  return uri; // C'est déjà une URL, on retourne tel quel
}
// Sinon upload le fichier local
```

### Dans l'Affichage
```typescript
const isUrl = value?.startsWith('http://') || value?.startsWith('https://');

if (isUrl) {
  return <Image source={{ uri: value }} />;
} else {
  return <View>{getPresetById(value)}</View>;
}
```

## Exemples d'URLs Valides

### Images Produits
```
https://images.pexels.com/photos/123456/photo.jpg
https://cdn.example.com/products/item-123.png
https://imgur.com/abc123.webp
```

### Logos Boutique
```
https://logo.clearbit.com/company.com
https://ui-avatars.com/api/?name=Ma+Boutique&size=200
https://api.dicebear.com/7.x/identicon/svg?seed=shop123
```

### Bannières
```
https://images.unsplash.com/photo-123456
https://picsum.photos/800/200
https://source.unsplash.com/random/800x200
```

## Cas d'Usage

### 1. Vendeur avec Site Web
```
J'ai déjà mes produits sur mon site
→ Je copie les URLs des images
→ Je les colle dans SenePanda
→ Pas besoin de re-télécharger !
```

### 2. Réutilisation d'Images
```
Image déjà sur Instagram/Facebook
→ Copier l'URL de l'image
→ Coller dans l'app
→ Image partagée instantanément
```

### 3. Images Stock
```
Trouver image sur Unsplash/Pexels
→ Copier lien
→ Coller dans produit
→ Image HD professionnelle !
```

### 4. Logo Existant
```
Entreprise avec logo en ligne
→ URL du logo officiel
→ Cohérence de marque partout
```

## Résumé des Changements

| Fichier | Fonction Ajoutée | Impact |
|---------|------------------|--------|
| `add-product.tsx` | `addImageFromUrl()` | URL pour images produits |
| `ImageUploader.tsx` | `handleAddFromUrl()` | URL pour tous les ImageUploader |
| `shop-wizard.tsx` | `handleCustomLogo/Banner()` | URL personnalisée boutique |
| `shop/[id].tsx` | Détection `isLogoUrl` | Affiche URLs ou presets |
| `ProductCard.tsx` | Détection `isLogoUrl` | Badge avec URL ou preset |

## Tests

### Tester URL Produit
1. Ajouter produit
2. Choisir "Lien URL"
3. Coller : `https://picsum.photos/400`
4. Vérifier image s'affiche
5. Publier produit
6. Voir dans Explorer

### Tester URL Boutique
1. Wizard → Étape 2
2. "+ URL personnalisée" (Logo)
3. Coller : `https://ui-avatars.com/api/?name=Test&size=200`
4. Voir preview en temps réel
5. Créer boutique
6. Visiter page boutique

### Tester Mix
1. Produit 1 : Galerie
2. Produit 2 : URL
3. Produit 3 : Caméra
4. Boutique : Logo URL + Bannière preset
5. Tout fonctionne ensemble !

## Résultat Final

**Flexibilité maximale** :
- 🎨 Designs prédéfinis (emojis + gradients)
- 📷 Upload local (galerie + caméra)
- 🔗 URLs d'images (instantané)

**3 méthodes, 1 app, infinies possibilités !** 🚀

---

**Tous les cas d'usage sont maintenant couverts !** ✅
