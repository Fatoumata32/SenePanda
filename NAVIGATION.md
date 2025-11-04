# 🧭 Système de Navigation Complet

Documentation complète du système de navigation robuste et centralisé de SenePanda.

## 📋 Table des matières

1. [Architecture](#architecture)
2. [Navigation Service](#navigation-service)
3. [Navigation Context](#navigation-context)
4. [Auth Guard](#auth-guard)
5. [Hooks personnalisés](#hooks-personnalisés)
6. [Exemples d'utilisation](#exemples-dutilisation)
7. [Routes et permissions](#routes-et-permissions)

---

## 🏗️ Architecture

Le système de navigation est composé de 4 couches principales:

```
┌─────────────────────────────────────┐
│      Navigation Service             │  ← Service centralisé
├─────────────────────────────────────┤
│      Navigation Context             │  ← État global
├─────────────────────────────────────┤
│      Auth Guard                     │  ← Protection des routes
├─────────────────────────────────────┤
│      Hooks personnalisés            │  ← Utilisation simplifiée
└─────────────────────────────────────┘
```

---

## 🛠️ Navigation Service

Service centralisé pour toutes les opérations de navigation.

### Fichier: `lib/navigation.ts`

### Fonctionnalités

#### 1. **Gestion des routes**
```typescript
// Types de routes
type PublicRoute = '/(tabs)/profile' | '/(tabs)/index' | '/register' | '/role-selection';
type ProtectedRoute = '/(tabs)/explore' | '/(tabs)/favorites' | '/orders' | '/seller/setup';
```

#### 2. **Vérifications de routes**
```typescript
// Vérifier si une route est protégée
NavigationService.isProtectedRoute(path: string): boolean

// Vérifier si une route est publique
NavigationService.isPublicRoute(path: string): boolean

// Vérifier si une route nécessite la sélection du rôle
NavigationService.requiresRoleSelection(path: string): boolean
```

#### 3. **Redirections intelligentes**
```typescript
// Redirection après login
NavigationService.handlePostLogin()

// Redirection après logout
NavigationService.handlePostLogout()

// Navigation avec redirection si non authentifié
NavigationService.navigateTo(route, isAuthenticated)
```

#### 4. **Gestion de l'état de redirection**
```typescript
// Sauvegarder une route pour redirection après login
NavigationService.setRedirectAfterLogin(route)

// Récupérer et effacer la redirection
NavigationService.getAndClearRedirect()
```

---

## 🌐 Navigation Context

Context React pour gérer l'état de navigation global.

### Fichier: `contexts/NavigationContext.tsx`

### État fourni

```typescript
type NavigationContextType = {
  isAuthenticated: boolean | null;      // État d'authentification
  hasRoleSelected: boolean | null;       // Rôle sélectionné
  isLoading: boolean;                    // Chargement en cours
  userRole: 'buyer' | 'seller' | null;  // Rôle de l'utilisateur
  setUserRole: (role) => void;          // Modifier le rôle
  refreshAuth: () => Promise<void>;     // Rafraîchir l'auth
};
```

### Utilisation

```tsx
import { NavigationProvider, useNavigation } from '@/contexts/NavigationContext';

// Dans _layout.tsx
<NavigationProvider>
  <AuthGuard>
    {children}
  </AuthGuard>
</NavigationProvider>

// Dans un composant
function MyComponent() {
  const { isAuthenticated, userRole, refreshAuth } = useNavigation();

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return <Dashboard role={userRole} />;
}
```

---

## 🛡️ Auth Guard

Composant qui protège les routes et affiche un loader pendant la vérification.

### Fichier: `components/AuthGuard.tsx`

### Fonctionnement

1. Utilise `NavigationContext` pour l'état
2. Affiche un loader si `isLoading = true`
3. Laisse passer si `isLoading = false`
4. La logique de redirection est gérée par `NavigationContext`

### Code

```tsx
export function AuthGuard({ children }) {
  const { isLoading } = useNavigation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
```

---

## 🎣 Hooks personnalisés

### 1. `useProtectedRoute`

Protège une route et gère les redirections automatiquement.

```typescript
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

function ProtectedPage() {
  const { canAccess, isLoading } = useProtectedRoute({
    requireAuth: true,        // Nécessite l'authentification
    requireRole: true,        // Nécessite la sélection du rôle
    redirectTo: '/(tabs)/profile',  // Redirection personnalisée (optionnel)
    onUnauthorized: () => {   // Callback personnalisé (optionnel)
      Alert.alert('Accès refusé', 'Vous devez être connecté');
    },
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!canAccess) {
    return null; // La redirection est gérée automatiquement
  }

  return <ProtectedContent />;
}
```

### 2. `useSafeNavigation`

Navigation sécurisée avec vérifications automatiques.

```typescript
import { useSafeNavigation } from '@/hooks/useProtectedRoute';

function MyComponent() {
  const {
    navigateTo,      // Navigation sécurisée
    goBack,          // Retour intelligent
    goToHome,        // Aller à l'accueil
    goToLogin,       // Aller au login
    goToRoleSelection, // Aller à la sélection du rôle
  } = useSafeNavigation();

  const handleOrderPress = () => {
    // Navigue vers /orders si authentifié, sinon vers login
    navigateTo('/orders');
  };

  const handleBackPress = () => {
    // Retour arrière intelligent (home si pas d'historique)
    goBack();
  };

  return (
    <View>
      <Button onPress={handleOrderPress} title="Mes commandes" />
      <Button onPress={handleBackPress} title="Retour" />
    </View>
  );
}
```

---

## 📱 Exemples d'utilisation

### Exemple 1: Page protégée simple

```tsx
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

export default function OrdersScreen() {
  // Protège automatiquement la route
  const { canAccess, isLoading } = useProtectedRoute({
    requireAuth: true,
    requireRole: true,
  });

  if (isLoading) return <LoadingScreen />;
  if (!canAccess) return null;

  return <OrdersList />;
}
```

### Exemple 2: Navigation avec bouton

```tsx
import { useSafeNavigation } from '@/hooks/useProtectedRoute';

function HomeScreen() {
  const { navigateTo } = useSafeNavigation();

  return (
    <TouchableOpacity onPress={() => navigateTo('/orders')}>
      <Text>Voir mes commandes</Text>
    </TouchableOpacity>
  );
}
```

### Exemple 3: Gestion du login/logout

```tsx
import { useNavigation } from '@/contexts/NavigationContext';
import NavigationService from '@/lib/navigation';
import { supabase } from '@/lib/supabase';

function ProfileScreen() {
  const { isAuthenticated, refreshAuth } = useNavigation();

  const handleLogin = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      await refreshAuth();
      // La redirection est gérée automatiquement par NavigationContext
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // La redirection vers login est automatique
  };

  return (
    <View>
      {isAuthenticated ? (
        <Button onPress={handleLogout} title="Se déconnecter" />
      ) : (
        <LoginForm onSubmit={handleLogin} />
      )}
    </View>
  );
}
```

### Exemple 4: Tab navigation avec protection

```tsx
import { useNavigation } from '@/contexts/NavigationContext';
import NavigationService from '@/lib/navigation';

export default function TabLayout() {
  const { isAuthenticated, hasRoleSelected } = useNavigation();

  const handleTabPress = (e: any, routeName: string) => {
    // Bloquer si non authentifié
    if (!isAuthenticated && routeName !== 'profile') {
      e.preventDefault();
      NavigationService.goToLogin(`/(tabs)/${routeName}` as any);
      return;
    }

    // Bloquer si rôle non sélectionné
    if (isAuthenticated && !hasRoleSelected) {
      e.preventDefault();
      NavigationService.goToRoleSelection();
      return;
    }
  };

  return (
    <Tabs>
      <Tabs.Screen
        name="explore"
        listeners={{ tabPress: (e) => handleTabPress(e, 'explore') }}
      />
    </Tabs>
  );
}
```

---

## 🔐 Routes et Permissions

### Routes publiques (accessibles sans auth)

```typescript
'/(tabs)/profile'    // Page de login/profil
'/(tabs)/index'      // Page d'accueil
'/register'          // Inscription
'/role-selection'    // Sélection du rôle
```

### Routes protégées (nécessitent auth)

```typescript
'/(tabs)/explore'    // Explorer
'/(tabs)/favorites'  // Favoris
'/(tabs)/messages'   // Messages
'/orders'            // Commandes
'/checkout'          // Paiement
'/seller/setup'      // Configuration vendeur
'/seller/products'   // Gestion produits
'/seller/orders'     // Commandes vendeur
```

### Routes nécessitant la sélection du rôle

```typescript
'/(tabs)/explore'
'/(tabs)/favorites'
'/(tabs)/messages'
'/seller/setup'
'/seller/products'
'/seller/orders'
```

---

## 🎯 Flux de navigation

### Flux d'authentification

```
Non authentifié → Tentative d'accès route protégée
                ↓
            Login avec redirection sauvegardée
                ↓
        Login réussi → Vérification du rôle
                ↓
        ┌─────────────────┐
        ↓                 ↓
   Rôle sélectionné  Pas de rôle
        ↓                 ↓
  Redirection        Sélection du rôle
   sauvegardée            ↓
        ↓            Rôle sélectionné
        ↓                 ↓
        └────→ Route finale
```

### Flux de logout

```
Utilisateur connecté → Logout
        ↓
  Effacer le rôle
        ↓
  Redirection vers login
```

---

## ✅ Avantages du système

1. **Centralisé**: Toute la logique de navigation en un seul endroit
2. **Type-safe**: Routes typées avec TypeScript
3. **Intelligent**: Gestion automatique des redirections
4. **Flexible**: Hooks personnalisables pour chaque besoin
5. **Sécurisé**: Protection automatique des routes sensibles
6. **Performant**: Utilise React Context pour éviter les re-renders inutiles
7. **Testable**: Logique séparée facile à tester
8. **Maintenable**: Code organisé et documenté

---

## 🚀 Migration depuis l'ancien système

### Avant (ancien système)

```tsx
// Navigation manuelle dans chaque composant
const router = useRouter();
const [isAuth, setIsAuth] = useState(false);

useEffect(() => {
  checkAuth().then(setIsAuth);
}, []);

if (!isAuth) {
  router.push('/(tabs)/profile');
}
```

### Après (nouveau système)

```tsx
// Utilisation du hook
const { canAccess } = useProtectedRoute();

if (!canAccess) return null;
```

**Bénéfices:**
- 90% moins de code
- Pas de duplication
- Gestion automatique
- Type-safe

---

## 📚 Ressources

- `lib/navigation.ts` - Service principal
- `contexts/NavigationContext.tsx` - Context global
- `components/AuthGuard.tsx` - Guard de protection
- `hooks/useProtectedRoute.ts` - Hooks personnalisés
- `app/(tabs)/_layout.tsx` - Exemple d'intégration

---

Enjoy la navigation fluide et sécurisée! 🎉
