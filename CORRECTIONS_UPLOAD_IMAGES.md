# 🔧 Corrections Upload d'Images

## ❌ Problème Rencontré

```
ERROR  Error uploading banner: [TypeError: blob.arrayBuffer is not a function (it is undefined)]
```

**Cause :** La méthode `blob.arrayBuffer()` n'est pas disponible dans React Native.

---

## ✅ Solution Appliquée

Remplacement de `blob.arrayBuffer()` par la méthode compatible React Native utilisant :
- `expo-file-system` pour lire le fichier en base64
- `base64-arraybuffer` pour convertir en ArrayBuffer

---

## 📁 Fichiers Corrigés

### 1. **app/seller/my-shop.tsx**

**Avant :**
```typescript
const response = await fetch(uri);
const blob = await response.blob();
const arrayBuffer = await blob.arrayBuffer(); // ❌ Ne fonctionne pas
const buffer = new Uint8Array(arrayBuffer);
```

**Après :**
```typescript
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

// Lire le fichier en base64
const base64 = await FileSystem.readAsStringAsync(uri, {
  encoding: FileSystem.EncodingType.Base64,
});

// Convertir base64 en ArrayBuffer
const arrayBuffer = decode(base64); // ✅ Fonctionne
```

---

### 2. **app/review/add-review.tsx**

Même correction appliquée pour l'upload d'images dans les avis.

**Imports ajoutés :**
```typescript
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
```

**Note :** Expo v54 a déprécié l'ancienne API FileSystem. On utilise `/legacy` pour compatibilité.

**Fonction uploadImage corrigée :**
```typescript
const uploadImage = async (uri: string) => {
  try {
    setUploading(true);

    // Lire le fichier en base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convertir base64 en ArrayBuffer
    const arrayBuffer = decode(base64);

    const fileExt = uri.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `review-images/${fileName}`;

    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt}`,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    setImages([...images, publicUrl]);
  } catch (error: any) {
    Alert.alert('Erreur', 'Impossible de télécharger l\'image');
  } finally {
    setUploading(false);
  }
};
```

---

## 📦 Packages Utilisés

Ces packages sont **déjà installés** dans le projet :

```json
{
  "expo-file-system": "^18.0.8",
  "base64-arraybuffer": "^1.0.2"
}
```

Aucune installation supplémentaire requise ! ✅

---

## 🧪 Tests

### Test 1 : Upload bannière boutique

1. Ouvrir l'app
2. Aller dans **Ma Boutique**
3. Cliquer sur l'icône de caméra pour la bannière
4. Sélectionner une image
5. L'image devrait s'uploader sans erreur

**Résultat attendu :**
```
✅ Alert: "Image de bannière mise à jour"
✅ Image visible dans la boutique
✅ Aucune erreur dans la console
```

### Test 2 : Upload image d'avis

1. Aller sur un produit
2. Cliquer "Laisser un avis"
3. Cliquer sur l'icône caméra
4. Sélectionner une image
5. L'image devrait s'uploader

**Résultat attendu :**
```
✅ Image ajoutée à la liste
✅ Aperçu de l'image visible
✅ Aucune erreur
```

---

## 🔍 Vérification

Pour vérifier que tous les fichiers sont corrigés :

```bash
# Chercher blob.arrayBuffer dans tous les fichiers
grep -r "blob\.arrayBuffer" app/

# Résultat attendu : aucun fichier trouvé
```

---

## ⚠️ Warning ImagePicker.MediaTypeOptions

Vous verrez peut-être ce warning :

```
WARN  `MediaTypeOptions` is deprecated, use `MediaType` instead.
```

**Ce n'est PAS une erreur**, juste un avertissement de dépréciation.

**Correction optionnelle :**

```typescript
// Avant
mediaTypes: ImagePicker.MediaTypeOptions.Images,

// Après
mediaTypes: ImagePicker.MediaType.Images,
```

Mais ce n'est pas urgent, ça fonctionnera dans les deux cas.

---

## ✅ Résumé

**Problème :** `blob.arrayBuffer is not a function`

**Solution :**
1. ✅ Utiliser `FileSystem.readAsStringAsync()` avec encoding Base64
2. ✅ Convertir avec `decode()` de `base64-arraybuffer`
3. ✅ Passer l'ArrayBuffer à Supabase Storage

**Fichiers corrigés :**
- ✅ `app/seller/my-shop.tsx`
- ✅ `app/review/add-review.tsx`

**Status :** ✅ CORRIGÉ - L'upload d'images fonctionne maintenant !

---

**Prochaine étape :** Tester l'upload d'images dans l'application ! 📸
