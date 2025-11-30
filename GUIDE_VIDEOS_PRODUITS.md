# 🎥 Guide : Ajout de Vidéos aux Produits

## 📋 Vue d'ensemble

Les vendeurs avec les plans **Pro** et **Premium** peuvent maintenant ajouter des vidéos à leurs produits pour mieux les présenter.

## ✨ Fonctionnalités

### 🎯 Accès par Plan

| Plan | Photos | Vidéos | Durée Max |
|------|--------|--------|-----------|
| **Gratuit** | ✅ 5 max | ❌ Non | - |
| **Starter** | ✅ 5 max | ❌ Non | - |
| **Pro** | ✅ 5 max | ✅ Oui | 30 sec |
| **Premium** | ✅ 5 max | ✅ Oui | 30 sec |

### 📹 Limites des Vidéos

- **Durée maximale** : 30 secondes
- **Format** : MP4, MOV, ou tout format supporté par votre appareil
- **Une vidéo par produit** : Pour l'instant, un seul fichier vidéo est supporté
- **Ajout** : Depuis la galerie ou par URL

## 🚀 Installation et Configuration

### Étape 1 : Migration de la Base de Données

1. Ouvrir **Supabase Dashboard** → **SQL Editor**
2. Copier le contenu de `supabase/migrations/add_video_support_to_products.sql`
3. Coller et **Run**
4. ✅ Vérifier le message de succès

### Étape 2 : Vérification

```sql
-- Vérifier que la colonne existe
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name = 'video_url';
```

Résultat attendu :
```
column_name | data_type
------------|----------
video_url   | text
```

## 💡 Utilisation

### Pour les Vendeurs

#### 1. Ajouter un Produit avec Vidéo

1. **Accéder à** : Menu vendeur → "Ajouter un produit"
2. **Ajouter des photos** (obligatoire, 1 minimum)
3. **Section Vidéo** :
   - Si vous avez Pro/Premium : Bouton "Ajouter une vidéo" actif
   - Si vous avez Gratuit/Starter : Message "Passez à Pro ou Premium"

#### 2. Deux Méthodes d'Ajout

**Méthode 1 : Depuis la Galerie**
- Cliquer sur "Ajouter une vidéo"
- Sélectionner une vidéo depuis votre galerie
- La vidéo sera limitée à 30 secondes automatiquement

**Méthode 2 : Par URL**
- Entrer l'URL de la vidéo dans le champ
- Cliquer sur le bouton "+"
- Formats supportés : .mp4, .mov, liens YouTube, Vimeo, etc.

#### 3. Prévisualisation

- La vidéo s'affiche avec des contrôles natifs
- Lecture en boucle automatique
- Possibilité de supprimer et remplacer

#### 4. Publication

- Remplir les autres champs (titre, prix, etc.)
- Cliquer sur "Publier le produit"
- La vidéo est sauvegardée avec le produit

### Pour les Acheteurs

- La vidéo s'affichera sur la page de détail du produit
- Lecture avec contrôles (play, pause, volume)
- Améliore la compréhension du produit

## 🔒 Gestion des Droits

### Code de Vérification

Le système vérifie automatiquement le plan de l'utilisateur :

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('subscription_plan')
  .eq('id', user.id)
  .single();

if (profile.subscription_plan !== 'pro' && profile.subscription_plan !== 'premium') {
  // Afficher message d'upgrade
}
```

### Messages d'Upgrade

Si un utilisateur Gratuit/Starter tente d'ajouter une vidéo :

```
Fonctionnalité Premium

Les vidéos sont disponibles uniquement pour les plans
Pro et Premium. Passez à un plan supérieur pour
débloquer cette fonctionnalité.

[Plus tard] [Voir les plans]
```

## 📊 Structure de la Base de Données

### Table products

```sql
CREATE TABLE products (
  -- ... autres colonnes
  video_url TEXT,  -- Nouvelle colonne
  -- ...
);
```

### Exemple de Données

```json
{
  "id": "uuid-123",
  "title": "Masque traditionnel",
  "image_url": "https://...",
  "images": ["url1", "url2", "url3"],
  "video_url": "https://storage.supabase.co/videos/product-123.mp4",
  // ... autres champs
}
```

## 🎨 Interface Utilisateur

### Badge Premium

Les utilisateurs Pro/Premium voient un badge :

```
┌─────────────────────────────────┐
│ Vidéo du produit   [PRO/PREMIUM]│
│                                 │
│ Ajoutez une vidéo de 30        │
│ secondes maximum pour mieux     │
│ présenter votre produit         │
└─────────────────────────────────┘
```

### Utilisateurs Gratuits

```
┌─────────────────────────────────┐
│ Vidéo du produit                │
│                                 │
│ Passez à Pro ou Premium pour    │
│ ajouter des vidéos              │
│                                 │
│ [Vidéo (Pro/Premium uniquement)]│
└─────────────────────────────────┘
```

## 💻 Détails Techniques

### Composants Utilisés

```typescript
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
```

### Picker de Vidéo

```typescript
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Videos,
  allowsEditing: true,
  quality: 1,
  videoMaxDuration: 30, // 30 secondes max
});
```

### Lecteur Vidéo

```typescript
<Video
  source={{ uri: videoUri }}
  style={styles.videoPreview}
  useNativeControls
  resizeMode="contain"
  isLooping
/>
```

## 🎯 Améliorations Futures

### Prévues

- ✅ Upload automatique vers Supabase Storage
- ✅ Compression automatique des vidéos
- ✅ Miniatures automatiques
- ✅ Support de plusieurs vidéos (galerie)
- ✅ Édition de vidéos (trim, filtres)

### En Cours

- 🔄 Lecture de vidéos dans le feed produits
- 🔄 Statistiques de visionnage
- 🔄 Intégration avec YouTube/Vimeo

## 📱 Tests

### Scénarios à Tester

1. **Utilisateur Gratuit**
   - ✅ Bouton vidéo désactivé
   - ✅ Message d'upgrade affiché
   - ✅ Clic redirige vers plans

2. **Utilisateur Pro/Premium**
   - ✅ Bouton vidéo actif
   - ✅ Picker de galerie fonctionne
   - ✅ URL vidéo fonctionne
   - ✅ Prévisualisation fonctionne
   - ✅ Suppression fonctionne
   - ✅ Sauvegarde en BDD fonctionne

3. **Limites**
   - ✅ Durée max 30 sec respectée
   - ✅ Une seule vidéo par produit
   - ✅ Formats supportés uniquement

## 🐛 Dépannage

### Problème : "Column video_url does not exist"

**Solution** : Exécuter la migration SQL

```sql
-- Dans Supabase SQL Editor
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;
```

### Problème : Vidéo ne se charge pas

**Solutions** :
1. Vérifier que l'URL est accessible
2. Vérifier le format (MP4 recommandé)
3. Vérifier les permissions de stockage
4. Tester avec une autre vidéo

### Problème : expo-av non installé

**Solution** :
```bash
npm install expo-av
```

## 📞 Support

Pour toute question :
1. Consulter ce guide
2. Vérifier les logs de l'app
3. Tester avec une vidéo de test
4. Vérifier le plan d'abonnement de l'utilisateur

## 🎉 Résumé

✅ Migration BDD créée
✅ Interface utilisateur ajoutée
✅ Vérification des plans intégrée
✅ Picker de vidéo fonctionnel
✅ Prévisualisation avec contrôles
✅ Sauvegarde en base de données
✅ Messages d'upgrade pour utilisateurs gratuits

Le système de vidéos est maintenant opérationnel ! 🚀
