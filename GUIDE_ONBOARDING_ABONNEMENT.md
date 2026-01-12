# 🚀 Guide Onboarding avec Question d'Abonnement

## 🎯 Fonctionnalité Implémentée

Système d'onboarding qui demande aux nouveaux utilisateurs s'ils souhaitent être **Acheteur** ou **Vendeur** lors de leur première connexion.

---

## 📁 Fichiers Créés

### 1. **components/OnboardingSubscriptionModal.tsx**
Modal d'onboarding avec 2 options

**Fonctionnalités :**
- ✅ Design moderne avec gradients
- ✅ 2 options claires : Acheteur / Vendeur
- ✅ Liste des bénéfices pour chaque rôle
- ✅ Redirection automatique vers les plans d'abonnement
- ✅ Option "Je déciderai plus tard"

**Utilisation :**
```typescript
import { OnboardingSubscriptionModal } from '../components/OnboardingSubscriptionModal';

<OnboardingSubscriptionModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  onBecomeSeller={() => router.push('/seller/subscription-plans')}
  onSkip={() => setShowModal(false)}
  userName={user.firstName}
/>
```

---

### 2. **hooks/useOnboarding.ts**
Hook pour gérer le flux d'onboarding

**Fonctionnalités :**
- ✅ Détecte automatiquement les nouveaux utilisateurs
- ✅ Sauvegarde le statut dans AsyncStorage
- ✅ Affiche le modal uniquement pour les nouvelles inscriptions
- ✅ Fonction de reset pour les tests

**Utilisation :**
```typescript
import { useOnboarding } from '../hooks/useOnboarding';

const { shouldShowModal, completeOnboarding } = useOnboarding();
```

---

## 🔄 Flux Complet

### 1. Inscription d'un nouvel utilisateur

```
Utilisateur s'inscrit
        ↓
Profile créé dans Supabase
        ↓
useOnboarding détecte nouvelle inscription
        ↓
OnboardingSubscriptionModal s'affiche
        ↓
Utilisateur choisit: Acheteur OU Vendeur
        ↓
        ├─→ Acheteur: Modal se ferme, profil = 'buyer'
        │
        └─→ Vendeur: Redirection vers /seller/subscription-plans
                    ↓
                    Choix du plan (STARTER / PRO / PREMIUM)
                    ↓
                    Demande d'abonnement créée
                    ↓
                    Attente validation admin
```

### 2. Connexion d'un utilisateur existant

```
Utilisateur se connecte
        ↓
useOnboarding vérifie created_at du profil
        ↓
created_at > 5 minutes ?
        ↓
OUI → Ne pas afficher le modal
NON → Afficher le modal (c'est une nouvelle inscription)
```

---

## 📱 Intégration dans l'App

### Dans app/(tabs)/index.tsx ou home.tsx

```typescript
import { useOnboarding } from '../hooks/useOnboarding';
import { OnboardingSubscriptionModal } from '../components/OnboardingSubscriptionModal';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const { shouldShowModal, completeOnboarding } = useOnboarding();

  const handleBecomeSeller = async () => {
    await completeOnboarding();
    router.push('/seller/subscription-plans');
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  return (
    <View>
      {/* Contenu de la page */}

      <OnboardingSubscriptionModal
        visible={shouldShowModal}
        onClose={handleSkip}
        onBecomeSeller={handleBecomeSeller}
        onSkip={handleSkip}
        userName={user?.firstName || 'vous'}
      />
    </View>
  );
}
```

### Dans app/simple-auth.tsx (après inscription)

```typescript
// Après création du compte
const handleSignUp = async () => {
  // ... création du compte

  if (error) {
    Alert.alert('Erreur', error.message);
  } else {
    // Succès - rediriger vers home
    // Le modal s'affichera automatiquement
    router.replace('/(tabs)');
  }
};
```

---

## 🎨 Personnalisation

### Modifier les options du modal

```typescript
// Dans OnboardingSubscriptionModal.tsx

// Option Acheteur
<TouchableOpacity
  style={styles.optionCard}
  onPress={() => setSelectedOption('buyer')}
>
  {/* Modifier l'icône */}
  <Ionicons name="cart" size={32} color={Colors.white} />

  {/* Modifier le titre */}
  <Text style={styles.optionTitle}>Je suis Acheteur</Text>

  {/* Modifier les bénéfices */}
  <View style={styles.benefitItem}>
    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
    <Text style={styles.benefitText}>Nouveau bénéfice</Text>
  </View>
</TouchableOpacity>
```

### Modifier le délai de détection

```typescript
// Dans hooks/useOnboarding.ts

// Ligne 62 : Changer 5 minutes en 10 minutes
const isNewUser = diffMinutes < 10; // au lieu de 5
```

---

## 🧪 Tests

### Test 1 : Nouvelle inscription

```bash
# 1. Créer un nouveau compte
# 2. Après inscription, le modal devrait s'afficher automatiquement
# 3. Sélectionner "Je suis Vendeur"
# 4. Cliquer "Voir les Plans d'Abonnement"
# 5. Vous devriez être redirigé vers /seller/subscription-plans
```

**Résultat attendu :**
- ✅ Modal s'affiche
- ✅ Options acheteur/vendeur visibles
- ✅ Redirection fonctionne
- ✅ Modal ne s'affiche plus à la prochaine connexion

### Test 2 : Utilisateur existant

```bash
# 1. Se connecter avec un compte existant (> 5 minutes)
# 2. Le modal ne devrait PAS s'afficher
```

**Résultat attendu :**
- ✅ Connexion normale
- ✅ Pas de modal
- ✅ Navigation directe

### Test 3 : Reset de l'onboarding

```typescript
import { useOnboarding } from '../hooks/useOnboarding';

const { resetOnboarding } = useOnboarding();

// Dans un bouton de test
<Button
  title="Reset Onboarding"
  onPress={resetOnboarding}
/>

// Le modal devrait s'afficher à nouveau
```

---

## 💾 Stockage

### AsyncStorage

Le statut d'onboarding est sauvegardé localement :

```typescript
// Clé de stockage
@senepanda_onboarding_completed

// Données sauvegardées
{
  "completed": true,
  "completedAt": "2025-01-30T12:00:00.000Z"
}
```

### Supabase

Aucune donnée supplémentaire n'est sauvegardée dans Supabase. Le hook utilise :
- `profiles.created_at` - Pour détecter les nouveaux utilisateurs
- `profiles.role` - Pour vérifier le rôle choisi
- `profiles.subscription_plan` - Pour vérifier si vendeur

---

## 🎯 Cas d'Usage

### 1. Utilisateur devient vendeur immédiatement

```
1. Inscription
2. Modal s'affiche
3. Sélectionne "Je suis Vendeur"
4. Redirigé vers plans d'abonnement
5. Choisit plan STARTER
6. Demande d'abonnement envoyée
```

### 2. Utilisateur veut d'abord explorer (acheteur)

```
1. Inscription
2. Modal s'affiche
3. Sélectionne "Je suis Acheteur"
4. Modal se ferme
5. Navigation normale dans l'app
6. Peut devenir vendeur plus tard via Profil > Abonnement
```

### 3. Utilisateur indécis

```
1. Inscription
2. Modal s'affiche
3. Clique "Je déciderai plus tard"
4. Modal se ferme
5. Considéré comme acheteur par défaut
```

---

## 🔧 Fonctions Utilitaires

### Vérifier si l'utilisateur a choisi vendeur

```typescript
import { hasChosenSellerRole } from '../hooks/useOnboarding';

const isSeller = await hasChosenSellerRole(userId);

if (isSeller) {
  // Afficher fonctionnalités vendeur
} else {
  // Mode acheteur
}
```

### Forcer l'affichage du modal

```typescript
const { resetOnboarding } = useOnboarding();

// Réinitialiser l'onboarding
await resetOnboarding();

// Le modal s'affichera à la prochaine vérification
```

---

## 📊 Analytics (Optionnel)

### Tracking des choix utilisateur

```typescript
// Dans OnboardingSubscriptionModal.tsx

const handleContinue = async () => {
  // ... code existant

  // Tracker le choix
  if (selectedOption === 'seller') {
    // Analytics: Utilisateur a choisi vendeur
    await analytics.track('onboarding_chose_seller');
  } else {
    // Analytics: Utilisateur a choisi acheteur
    await analytics.track('onboarding_chose_buyer');
  }

  // ... reste du code
};
```

---

## 🎨 Variantes de Design

### Modal version compacte

```typescript
// Réduire la taille des cartes d'options
optionCard: {
  padding: 16, // au lieu de 20
  minHeight: 200, // limiter la hauteur
}
```

### Ajouter des animations

```bash
npm install react-native-animatable
```

```typescript
import * as Animatable from 'react-native-animatable';

<Animatable.View
  animation="fadeInUp"
  duration={600}
  delay={200}
>
  <TouchableOpacity style={styles.optionCard}>
    {/* Contenu */}
  </TouchableOpacity>
</Animatable.View>
```

---

## 🚨 Dépannage

### Le modal ne s'affiche pas pour un nouveau utilisateur

**Solutions :**
1. Vérifier que `created_at` du profil est récent (< 5 min)
2. Vérifier AsyncStorage avec React Native Debugger
3. Vérifier les logs dans useOnboarding

```typescript
console.log('Onboarding status:', {
  hasCompleted: hasCompletedOnboarding,
  shouldShow: shouldShowModal,
  isLoading,
});
```

### Le modal s'affiche en boucle

**Solution :**
Vérifier que `completeOnboarding()` est bien appelée :

```typescript
const handleSkip = async () => {
  await completeOnboarding(); // ← Important !
};
```

### AsyncStorage n'est pas persisté

**Solution :**
Vérifier que le package est installé :

```bash
npm install @react-native-async-storage/async-storage
```

---

## ✅ Checklist de Déploiement

- [x] Composant OnboardingSubscriptionModal créé
- [x] Hook useOnboarding créé
- [ ] Intégrer dans app/(tabs)/index.tsx
- [ ] Tester avec nouvelle inscription
- [ ] Tester avec utilisateur existant
- [ ] Tester redirection vers plans d'abonnement
- [ ] Tester option "Je déciderai plus tard"
- [ ] Ajouter analytics (optionnel)
- [ ] Documenter pour l'équipe

---

## 📚 Ressources

### Expo AsyncStorage
https://docs.expo.dev/versions/latest/sdk/async-storage/

### React Navigation (pour router.push)
https://reactnavigation.org/docs/getting-started

---

## 🎉 Résumé

**Fichiers créés :**
- ✅ `components/OnboardingSubscriptionModal.tsx`
- ✅ `hooks/useOnboarding.ts`
- ✅ `GUIDE_ONBOARDING_ABONNEMENT.md`

**Fonctionnalités :**
- ✅ Détection automatique nouveaux utilisateurs
- ✅ Modal avec 2 choix : Acheteur/Vendeur
- ✅ Redirection vers plans d'abonnement
- ✅ Sauvegarde du statut
- ✅ Design moderne et attractif

**Workflow :**
```
Inscription → Modal → Choix rôle → Acheteur (continuer) OU Vendeur (plans)
```

**Prochaine étape :** Intégrer dans `app/(tabs)/index.tsx` ! 🚀
