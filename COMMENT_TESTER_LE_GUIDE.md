# 🎯 Comment Tester le Guide Interactif

## 🚀 Méthode 1 : Bouton Flottant (LA PLUS SIMPLE)

### Sur la page d'accueil
1. Ouvrez l'application
2. Allez sur la page **Home** (Accueil)
3. Vous verrez un **bouton flottant orange** en bas à droite avec une icône de livre 📖
4. Cliquez sur ce bouton **"Guide"**
5. Une alerte apparaît → Cliquez sur **"Lancer"**
6. Le guide interactif démarre! 🎉

```
┌─────────────────────────────┐
│                             │
│   Page d'accueil            │
│                             │
│   [Produits...]             │
│                             │
│                             │
│                      ┌────┐ │
│                      │📖  │ │ ← Cliquez ici!
│                      │Guide│ │
│                      └────┘ │
└─────────────────────────────┘
```

## 🎯 Méthode 2 : Depuis les Paramètres

### Navigation
1. Ouvrez l'application
2. Allez dans **Profil** (onglet en bas)
3. Cliquez sur **Paramètres** ⚙️ (en haut à droite)
4. Scrollez jusqu'à la section **"Assistance"**
5. Cliquez sur **"Revoir le guide interactif"** 📖
6. Confirmez → Le guide démarre!

## 🔧 Méthode 3 : Pour les Développeurs

### Via le code
```typescript
import { useOnboarding } from '@/contexts/OnboardingContext';

function MyComponent() {
  const { resetOnboarding, startOnboarding } = useOnboarding();

  const testGuide = async () => {
    await resetOnboarding();
    setTimeout(() => startOnboarding(), 500);
  };

  return <Button onPress={testGuide} title="Tester le guide" />;
}
```

### Via AsyncStorage
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Réinitialiser pour simuler un nouveau utilisateur
await AsyncStorage.removeItem('@onboarding_completed');

// Relancer l'app → le guide démarre automatiquement
```

## 📱 Ce qui va se passer

### Déroulement du guide (11 étapes)

1. **Étape 1 - Bienvenue** 👋
   - Position: Centre de l'écran
   - Message de bienvenue général

2. **Étape 2 - Recherche** 🔍
   - Position: En haut
   - Montre la barre de recherche

3. **Étape 3 - Catégories** 📦
   - Position: En haut
   - Explique comment explorer les catégories

4. **Étape 4 - Ventes Flash** ⚡
   - Position: En haut
   - Présente les offres limitées

5. **Étape 5 - Favoris** ❤️
   - Écran: Favoris
   - Position: En bas
   - Explique comment sauvegarder des produits

6. **Étape 6 - Panier** 🛒
   - Écran: Panier
   - Position: En bas
   - Gestion du panier et commandes

7. **Étape 7 - Profil** 👤
   - Écran: Profil
   - Position: En bas
   - Informations personnelles

8. **Étape 8 - Points** 🎁
   - Écran: Profil
   - Position: En haut
   - Programme de fidélité

9. **Étape 9 - Parrainage** 🤝
   - Écran: Profil
   - Position: En haut
   - Inviter des amis

10. **Étape 10 - Vendeur** 🏪
    - Écran: Profil
    - Position: En haut
    - Comment créer une boutique

11. **Étape 11 - Terminé** 🚀
    - Écran: Home
    - Position: Centre
    - Message de félicitations!

## 🎮 Navigation dans le guide

### Boutons disponibles
- **Suivant** ➡️ : Passe à l'étape suivante
- **Précédent** ⬅️ : Revient à l'étape précédente (désactivé sur l'étape 1)
- **Passer** ⏭️ : Termine le guide immédiatement
- **X** (en haut à droite) : Ferme et termine le guide

### Indicateurs visuels
- **Compteur** : "3/11" montre l'étape actuelle
- **Dots** : Points de progression (point actif = plus grand et blanc)
- **Spotlight** : Animation pulse sur l'élément ciblé

## 🐛 Dépannage

### Le bouton flottant n'apparaît pas
1. Vérifiez que vous êtes sur la page **Home**
2. Rechargez l'application (Cmd+R ou Ctrl+R)
3. Vérifiez qu'il n'y a pas d'erreurs dans la console

### Le guide ne démarre pas
1. Vérifiez la console pour les erreurs
2. Essayez de réinitialiser AsyncStorage:
   ```typescript
   await AsyncStorage.removeItem('@onboarding_completed');
   ```
3. Relancez l'app complètement

### Le guide s'affiche au mauvais endroit
- C'est normal! Le guide suit les écrans définis
- Naviguez manuellement vers l'écran mentionné dans l'étape
- Ou cliquez sur "Suivant" pour continuer

### La section "Assistance" n'apparaît pas dans les Paramètres
- Utilisez le **bouton flottant** sur la page Home à la place
- C'est plus simple et plus visible!

## 💡 Conseils

### Pour une meilleure expérience
1. **Suivez les étapes dans l'ordre** pour la première fois
2. **Lisez chaque message** pour comprendre les fonctionnalités
3. **N'hésitez pas à passer** si vous connaissez déjà une feature
4. **Relancez le guide** quand vous voulez via le bouton flottant

### Personnalisation
- Le bouton flottant est en **bas à droite**
- Couleur: **Orange** (primaryOrange)
- Toujours visible sur la page **Home**
- Peut être masqué en modifiant `home.tsx` (commentez `<OnboardingDebugButton />`)

## 🎨 Design du Bouton Flottant

```
Apparence:
┌────────┐
│   📖   │  ← Icône BookOpen
│ Guide  │  ← Texte
└────────┘

Couleur: Orange (#FF8C00)
Taille: 70x70px
Position: Bas droite (20px du bord)
Shadow: Ombre portée pour visibilité
```

## 📊 Statistiques

- **11 étapes** au total
- **~2-3 minutes** pour compléter
- **3 boutons** de navigation
- **Auto-sauvegarde** de la progression
- **Relançable** à volonté

## ✅ Checklist de Test

- [ ] Le bouton flottant apparaît sur Home
- [ ] Clic sur le bouton → Alert apparaît
- [ ] Clic "Lancer" → Guide démarre
- [ ] Étape 1/11 s'affiche (Bienvenue)
- [ ] Bouton "Suivant" fonctionne
- [ ] Progression s'affiche (dots + compteur)
- [ ] Peut passer le guide avec "Passer"
- [ ] Peut fermer avec "X"
- [ ] Peut relancer le guide après l'avoir terminé

## 🎯 Résultat Attendu

Quand tout fonctionne:
1. ✅ Bouton visible et cliquable
2. ✅ Guide démarre proprement
3. ✅ 11 étapes s'affichent correctement
4. ✅ Navigation fluide
5. ✅ Animations smooth
6. ✅ Peut être relancé

---

**Le moyen le plus simple: Cliquez sur le bouton orange en bas à droite de la page d'accueil!** 🎯
