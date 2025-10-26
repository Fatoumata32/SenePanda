# Configuration du Stockage d'Images Supabase

Ce document explique comment configurer et utiliser le système de stockage d'images pour votre marketplace.

## Configuration initiale

### 1. Créer le bucket de stockage dans Supabase

Exécutez le script SQL de migration pour créer le bucket et les politiques de sécurité:

```sql
-- Fichier: supabase/migrations/create_storage_buckets.sql
```

Vous pouvez l'exécuter de plusieurs façons:

**Option A: Via le SQL Editor de Supabase**
1. Allez dans votre projet Supabase
2. Cliquez sur "SQL Editor" dans le menu de gauche
3. Copiez-collez le contenu du fichier `supabase/migrations/create_storage_buckets.sql`
4. Cliquez sur "Run" pour exécuter

**Option B: Via la CLI Supabase**
```bash
supabase migration up
```

### 2. Vérifier la création du bucket

1. Allez dans "Storage" dans votre dashboard Supabase
2. Vous devriez voir un bucket nommé "images"
3. Le bucket doit être configuré comme "Public"

## Structure des dossiers

Les images sont organisées par type:

```
images/
  ├── products/
  │   └── {product_id}/
  │       ├── product-{timestamp}-0.jpg
  │       ├── product-{timestamp}-1.jpg
  │       └── ...
  ├── shops/
  │   └── {shop_id}/
  │       ├── logo-{timestamp}.jpg
  │       └── banner-{timestamp}.jpg
  └── profiles/
      └── {user_id}/
          └── avatar-{timestamp}.jpg
```

## Politiques de sécurité

### Lecture (SELECT)
- **Qui**: Tout le monde (public)
- **Quoi**: Toutes les images du bucket "images"

### Upload (INSERT)
- **Qui**: Utilisateurs authentifiés uniquement
- **Quoi**: N'importe quelle image dans le bucket "images"

### Mise à jour (UPDATE)
- **Qui**: Propriétaire du dossier uniquement
- **Quoi**: Uniquement leurs propres images

### Suppression (DELETE)
- **Qui**: Propriétaire du dossier uniquement
- **Quoi**: Uniquement leurs propres images

## Utilisation dans le code

### Importer les fonctions d'upload

```typescript
import {
  pickImageFromGallery,
  takePhoto,
  uploadProductImage,
  uploadProductImages,
  uploadShopLogo,
  uploadShopBanner,
  uploadProfileAvatar,
  deleteImageFromSupabase
} from '@/lib/image-upload';
```

### Upload d'une image de produit

```typescript
// Sélectionner une image depuis la galerie
const imageUri = await pickImageFromGallery([1, 1]);

if (imageUri) {
  // Upload l'image
  const result = await uploadProductImage(imageUri, productId, 0);

  if (result.success) {
    console.log('Image uploadée:', result.url);
  } else {
    console.error('Erreur:', result.error);
  }
}
```

### Upload de plusieurs images

```typescript
// Sélectionner plusieurs images
const imageUris = ['uri1', 'uri2', 'uri3'];

// Upload toutes les images en parallèle
const results = await uploadProductImages(imageUris, productId);

// Vérifier les résultats
const urls = results
  .filter(r => r.success)
  .map(r => r.url);

console.log('Images uploadées:', urls);
```

### Prendre une photo avec la caméra

```typescript
const photoUri = await takePhoto([1, 1]);

if (photoUri) {
  const result = await uploadProductImage(photoUri);
  // ...
}
```

### Upload du logo d'une boutique

```typescript
const logoUri = await pickImageFromGallery([1, 1]);

if (logoUri) {
  const result = await uploadShopLogo(logoUri, shopId);
  // ...
}
```

### Upload d'une photo de profil

```typescript
const { data: { user } } = await supabase.auth.getUser();

const avatarUri = await pickImageFromGallery([1, 1]);

if (avatarUri && user) {
  const result = await uploadProfileAvatar(avatarUri, user.id);
  // ...
}
```

### Supprimer une image

```typescript
const imageUrl = 'https://...supabase.co/storage/v1/object/public/images/products/...';

const deleted = await deleteImageFromSupabase(imageUrl);

if (deleted) {
  console.log('Image supprimée avec succès');
}
```

## Affichage des images

### Utiliser le composant ProductImage

```typescript
import { ProductImage } from '@/components/ProductImage';

// Dans votre composant
<ProductImage
  imageUrl={product.image_url}
  images={product.images}
  style={styles.image}
/>
```

Le composant `ProductImage`:
- Affiche automatiquement `image_url` en priorité
- Sinon, affiche la première image de `images[]`
- Gère le cache et l'optimisation
- Affiche un placeholder pendant le chargement

## Bonnes pratiques

### 1. Optimisation des images
Les images sont automatiquement compressées à 80% de qualité lors de la sélection:

```typescript
const result = await ImagePicker.launchImageLibraryAsync({
  quality: 0.8, // 80% de qualité
});
```

### 2. Limiter le nombre d'images
Limitez le nombre d'images par produit (recommandé: 5 maximum):

```typescript
if (imageUris.length >= 5) {
  Alert.alert('Limite atteinte', 'Maximum 5 images par produit');
  return;
}
```

### 3. Gestion des erreurs
Toujours vérifier le résultat de l'upload:

```typescript
const result = await uploadProductImage(uri);

if (!result.success) {
  Alert.alert('Erreur', result.error || 'Échec de l\'upload');
  return;
}
```

### 4. Permissions
Demander les permissions avant d'accéder à la galerie ou la caméra:

```typescript
// Les fonctions pickImageFromGallery et takePhoto
// demandent automatiquement les permissions
```

### 5. Nettoyage des anciennes images
Supprimer les anciennes images lors de la mise à jour d'un produit:

```typescript
// Supprimer les anciennes images
if (oldProduct.images) {
  for (const imageUrl of oldProduct.images) {
    await deleteImageFromSupabase(imageUrl);
  }
}

// Upload les nouvelles images
const results = await uploadProductImages(newImageUris, productId);
```

## Dépannage

### Erreur: "Bucket not found"
- Vérifiez que le bucket "images" existe dans Storage
- Exécutez le script de migration SQL

### Erreur: "Permission denied"
- Vérifiez que les politiques RLS sont correctement configurées
- Vérifiez que l'utilisateur est bien authentifié

### Images ne s'affichent pas
- Vérifiez que le bucket est configuré en mode "Public"
- Vérifiez l'URL de l'image dans la console
- Vérifiez que l'image existe dans Storage

### Upload échoue
- Vérifiez la connexion internet
- Vérifiez que le fichier est bien une image
- Vérifiez la taille du fichier (max 50MB par défaut)

## Exemple complet

Voici un exemple complet d'ajout de produit avec images:

```typescript
const handleAddProduct = async () => {
  try {
    setLoading(true);

    // 1. Récupérer l'utilisateur
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    // 2. Séparer les URLs existantes des fichiers locaux
    const localFiles = imageUris.filter(
      uri => !uri.startsWith('http')
    );
    const existingUrls = imageUris.filter(
      uri => uri.startsWith('http')
    );

    // 3. Upload des fichiers locaux
    let uploadedUrls = [];
    if (localFiles.length > 0) {
      const results = await uploadProductImages(localFiles);

      const failedUploads = results.filter(r => !r.success);
      if (failedUploads.length > 0) {
        throw new Error(`Échec de l'upload de ${failedUploads.length} image(s)`);
      }

      uploadedUrls = results.map(r => r.url);
    }

    // 4. Combiner toutes les URLs
    const allImageUrls = [...existingUrls, ...uploadedUrls];

    // 5. Créer le produit
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        seller_id: user.id,
        title,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category_id: selectedCategory,
        image_url: allImageUrls[0],    // Image principale
        images: allImageUrls,          // Toutes les images
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    Alert.alert('Succès', 'Produit créé avec succès!');
    router.push(`/product/${product.id}`);

  } catch (error) {
    Alert.alert('Erreur', error.message);
  } finally {
    setLoading(false);
  }
};
```

## Support

Pour plus d'informations sur Supabase Storage:
- [Documentation officielle](https://supabase.com/docs/guides/storage)
- [API Reference](https://supabase.com/docs/reference/javascript/storage)
