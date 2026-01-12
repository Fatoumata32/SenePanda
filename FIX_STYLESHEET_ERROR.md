# 🔧 Fix: StyleSheet.create undefined

## ❌ Erreur

```
ERROR [TypeError: Cannot read property 'create' of undefined]
WARN Route is missing the required default export
```

## 💡 Cause

Le cache Metro est corrompu après les changements de fichiers (déplacement des composants ZegoCloud).

## ✅ Solution

### Étape 1: Arrêter le serveur

Appuyez sur `Ctrl+C` dans le terminal où tourne `npm start`

### Étape 2: Nettoyer le cache

```bash
# Supprimer tous les caches
npx expo start -c

# OU plus radical
rm -rf node_modules/.cache
rm -rf .expo
npx expo start -c
```

### Étape 3: Fermer et redémarrer Expo Go

1. **Fermez complètement Expo Go** (force close)
2. **Réouvrez Expo Go**
3. **Scannez à nouveau** le QR code

## 🎯 Résultat Attendu

Après le redémarrage propre:

```
✅ Pas d'erreur "create of undefined"
✅ Routes chargées correctement
✅ Application démarre normalement
```

## 📝 Note

Cette erreur arrive quand:
- On déplace des fichiers pendant que Metro tourne
- Le cache n'est pas invalidé correctement
- Les imports changent de chemin

**Toujours redémarrer avec `-c` après avoir déplacé des fichiers!**

---

**Solution:** `npx expo start -c` + Force close Expo Go
