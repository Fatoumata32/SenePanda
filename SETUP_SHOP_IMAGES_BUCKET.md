# 📸 Configuration du Bucket "shop-images" - Guide Rapide

## 🎯 Pourquoi ce bucket ?

Le bucket `shop-images` stocke les images personnalisées des boutiques vendeurs :
- **Bannières de boutique** (fond personnalisé)
- **Logos de boutique** (avatar/logo vendeur)
- **Images de marque** (branding)

---

## 🚀 Étapes de Configuration (5 minutes)

### **Étape 1 : Accéder à Supabase Dashboard**

1. Allez sur https://supabase.com
2. Connectez-vous à votre compte
3. Sélectionnez le projet **SenePanda**

---

### **Étape 2 : Créer le Bucket**

1. Dans le menu de gauche, cliquez sur **"Storage"** 📦
2. Cliquez sur **"New bucket"**
3. Configuration :

```
Nom du bucket: shop-images
Public bucket: ✅ COCHÉ (important pour afficher les images)
File size limit: 10 MB (recommandé pour les bannières HD)
Allowed MIME types: image/* (tous les formats d'image)
```

4. Cliquez sur **"Create bucket"**

---

### **Étape 3 : Créer la Structure des Dossiers**

Le bucket doit avoir cette structure :
```
shop-images/
├── banners/         (bannières de boutique 16:9)
└── logos/           (logos/avatars circulaires)
```

**Note :** Les dossiers seront créés automatiquement lors du premier upload.

---

### **Étape 4 : Configurer les Politiques RLS**

#### **Politique 1 : Upload par vendeurs authentifiés (INSERT)**

Nom : `Sellers can upload shop images`

```sql
CREATE POLICY "Sellers can upload shop images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shop-images'
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1] = 'banners'
    OR (storage.foldername(name))[1] = 'logos'
  )
);
```

#### **Politique 2 : Lecture publique (SELECT)**

Nom : `Anyone can view shop images`

```sql
CREATE POLICY "Anyone can view shop images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'shop-images');
```

#### **Politique 3 : Mise à jour par propriétaire (UPDATE)**

Nom : `Sellers can update their own images`

```sql
CREATE POLICY "Sellers can update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'shop-images' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'shop-images' AND auth.uid() IS NOT NULL);
```

#### **Politique 4 : Suppression par propriétaire (DELETE)**

Nom : `Sellers can delete their own images`

```sql
CREATE POLICY "Sellers can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'shop-images' AND auth.uid() IS NOT NULL);
```

---

### **Étape 5 : Vérification**

Exécutez cette requête dans le **SQL Editor** pour vérifier :

```sql
-- Vérifier le bucket
SELECT * FROM storage.buckets WHERE name = 'shop-images';

-- Vérifier les politiques
SELECT * FROM storage.policies WHERE bucket_id = 'shop-images';
```

**Résultats attendus :**
- 1 bucket avec `name = 'shop-images'` et `public = true`
- 4 politiques (INSERT, SELECT, UPDATE, DELETE)

---

## 🎨 Formats d'Images Recommandés

### **Bannières (banners/)**
- **Format :** 16:9 (paysage)
- **Résolution recommandée :** 1920x1080px
- **Résolution minimale :** 1280x720px
- **Taille max :** 5 MB
- **Formats acceptés :** JPG, PNG, WebP

### **Logos (logos/)**
- **Format :** Carré (1:1)
- **Résolution recommandée :** 512x512px
- **Résolution minimale :** 256x256px
- **Taille max :** 2 MB
- **Formats acceptés :** PNG (avec transparence recommandé), JPG

---

## 📂 Schéma de Nommage

Les fichiers sont automatiquement nommés ainsi :

### Bannières
```
banners/banner-{seller_profile_id}-{timestamp}.jpg

Exemple:
banners/banner-a1b2c3d4-1701234567890.jpg
```

### Logos
```
logos/logo-{seller_profile_id}-{timestamp}.png

Exemple:
logos/logo-a1b2c3d4-1701234567890.png
```

---

## 🔗 URLs Publiques

Une fois uploadée, chaque image a une URL publique :

```
https://votre-projet.supabase.co/storage/v1/object/public/shop-images/banners/banner-abc123-1701234567890.jpg
```

Ces URLs sont stockées dans la table `seller_profiles` :
- `banner_url` : URL de la bannière
- `logo_url` : URL du logo

---

## ✅ Checklist de Configuration

- [ ] Bucket `shop-images` créé
- [ ] Bucket configuré en **PUBLIC**
- [ ] Politique INSERT créée (authenticated users)
- [ ] Politique SELECT créée (public)
- [ ] Politique UPDATE créée (authenticated users)
- [ ] Politique DELETE créée (authenticated users)
- [ ] Test d'upload réussi depuis l'application

---

## 🧪 Tester depuis l'Application

1. Allez dans **Espace Vendeur**
2. Cliquez sur **"Ma Boutique"**
3. Cliquez sur l'icône **Caméra** en haut à droite
4. Sélectionnez une image
5. Vérifiez dans les logs :

```
✅ Logs attendus :
📤 Uploading banner...
✅ Banner uploaded: https://...
✅ Database updated
```

---

## ⚠️ Dépannage

### Erreur : "Bucket not found"
→ Le bucket n'existe pas. Retournez à l'Étape 2.

### Erreur : "Permission denied"
→ Les politiques RLS ne sont pas configurées. Vérifiez l'Étape 4.

### Erreur : "File too large"
→ Augmentez la limite de taille du bucket ou compressez l'image.

### Image ne s'affiche pas
→ Vérifiez que le bucket est bien configuré en **PUBLIC**.

---

## 🔄 Migration des Images Existantes (Optionnel)

Si vous avez déjà des images dans d'autres buckets, vous pouvez les migrer :

```sql
-- Exemple de migration depuis 'public' vers 'shop-images'
-- À adapter selon vos besoins
UPDATE seller_profiles
SET banner_url = REPLACE(
  banner_url,
  '/public/',
  '/shop-images/banners/'
)
WHERE banner_url IS NOT NULL;
```

---

## 📊 Monitoring

Pour surveiller l'utilisation du bucket :

```sql
-- Taille totale des images
SELECT
  bucket_id,
  COUNT(*) as total_files,
  pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
FROM storage.objects
WHERE bucket_id = 'shop-images'
GROUP BY bucket_id;

-- Images par dossier
SELECT
  (storage.foldername(name))[1] as folder,
  COUNT(*) as count
FROM storage.objects
WHERE bucket_id = 'shop-images'
GROUP BY folder;
```

---

## 🎉 C'est Tout !

Une fois configuré, les vendeurs pourront :
- ✅ Uploader des bannières personnalisées
- ✅ Uploader des logos de boutique
- ✅ Changer leur thème de couleur (gradients)
- ✅ Modifier les informations de leur boutique
- ✅ Avoir une boutique unique et créative !

**Temps estimé total : 5-10 minutes**
