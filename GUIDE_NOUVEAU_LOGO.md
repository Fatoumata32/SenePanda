# Guide - Nouveau Logo SenePanda

## Description du Logo
Le nouveau logo SenePanda présente un panda stylisé dont le corps forme un "S" (pour Sene), sur un fond jaune (#FDB913). Un petit sac shopping orange dans le coin supérieur droit rappelle l'aspect e-commerce de l'application.

### Couleurs principales:
- **Jaune principal**: `#FDB913`
- **Orange accent**: `#F59E0B`
- **Noir panda**: `#3C3C3B`
- **Blanc**: `#FFFFFF`

## Fichiers à générer

Le fichier SVG source est disponible à: `assets/images/logo-senepanda.svg`

### Méthode 1: Utiliser un convertisseur en ligne (Recommandé)

1. Allez sur https://cloudconvert.com/svg-to-png ou https://svgtopng.com/
2. Uploadez le fichier `logo-senepanda.svg`
3. Générez les tailles suivantes:

#### Pour l'icône de l'app (icon.png):
- **1024x1024** px (haute résolution)
- Sauvegardez comme: `assets/images/icon.png`

#### Pour l'icône adaptative (adaptive-icon.png):
- **1024x1024** px
- Sauvegardez comme: `assets/images/adaptive-icon.png`

#### Pour l'écran splash (splash-icon.png):
- **1284x1284** px
- Sauvegardez comme: `assets/images/splash-icon.png`

### Méthode 2: Utiliser ImageMagick (Command line)

Si vous avez ImageMagick installé:

```bash
# Icon principal
magick convert -density 300 -background none assets/images/logo-senepanda.svg -resize 1024x1024 assets/images/icon.png

# Adaptive icon
magick convert -density 300 -background none assets/images/logo-senepanda.svg -resize 1024x1024 assets/images/adaptive-icon.png

# Splash icon
magick convert -density 300 -background none assets/images/logo-senepanda.svg -resize 1284x1284 assets/images/splash-icon.png
```

### Méthode 3: Utiliser Inkscape (Gratuit)

1. Téléchargez Inkscape: https://inkscape.org/
2. Ouvrez `logo-senepanda.svg`
3. Fichier > Exporter PNG
4. Définissez la largeur: 1024px (ou 1284px pour splash)
5. Exportez vers les chemins appropriés

## Après génération des images

1. Vérifiez que les fichiers sont bien créés dans `assets/images/`
2. Testez l'app avec:
   ```bash
   npx expo start
   ```
3. Le nouveau logo devrait apparaître automatiquement

## Configuration app.config.js

Le fichier est déjà configuré pour utiliser ces images:

```javascript
{
  "icon": "./assets/images/icon.png",
  "adaptiveIcon": {
    "foregroundImage": "./assets/images/adaptive-icon.png",
    "backgroundColor": "#FDB913"
  },
  "splash": {
    "image": "./assets/images/splash-icon.png",
    "backgroundColor": "#FDB913"
  }
}
```

## Variantes du logo (optionnel)

Si vous souhaitez des variantes:

### Logo sans fond (transparent):
Modifiez la ligne 3 du SVG:
```svg
<rect width="1024" height="1024" fill="none" rx="180"/>
```

### Logo carré (sans coins arrondis):
Modifiez `rx="180"` en `rx="0"` ligne 3

### Couleurs alternatives:
- Fond blanc: `fill="#FFFFFF"` et ajustez le noir du panda
- Style nuit: Fond `#1F2937` avec panda blanc

## Support

Pour toute question sur le logo, référez-vous au fichier SVG source qui contient tous les éléments vectoriels modifiables.
