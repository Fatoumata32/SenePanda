# Système de Sélection de Rôle UX - "Je suis dedans"

## Vue d'ensemble

Implémentation d'une logique UX simple et persistante basée sur le principe psychologique "je suis dedans". Le rôle utilisateur (Acheteur/Vendeur) est demandé **une seule fois** après la première connexion et stocké de manière persistante.

## Principes

- **Zéro friction** : Le rôle est demandé une seule fois
- **Zéro répétition** : Plus jamais de re-sélection au démarrage
- **Expérience fluide** : Redirection automatique vers l'interface appropriée
- **Respect du temps utilisateur** : Changement de rôle uniquement via les paramètres

## Architecture

### 1. Base de données (Supabase)

**Migration** : `supabase/migrations/add_preferred_role.sql`

```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_role TEXT CHECK (preferred_role IN ('buyer', 'seller'));
```

La colonne `preferred_role` stocke le choix de l'utilisateur de manière permanente.

### 2. Gestion d'état (NavigationContext)

**Fichier** : `contexts/NavigationContext.tsx`

**Fonctionnalités** :
- Récupération du rôle depuis la base de données (source de vérité)
- Cache local dans AsyncStorage pour la performance
- Synchronisation bidirectionnelle DB ↔ AsyncStorage
- Migration automatique des anciennes versions

**API** :
```typescript
const {
  userRole,           // 'buyer' | 'seller' | null
  hasRoleSelected,    // boolean
  setUserRole,        // (role: 'buyer' | 'seller') => Promise<void>
} = useNavigation();
```

### 3. Interface utilisateur

#### A. Écran de sélection (première connexion)

**Fichier** : `components/RoleSelectionScreen.tsx`

**Design** :
- Interface visuelle attractive avec gradients
- Deux grandes cartes claires : "Je veux acheter" / "Je veux vendre"
- Liste de fonctionnalités pour chaque rôle
- Note de réassurance : "Vous pourrez changer ce choix plus tard"

**Comportement** :
- Affiché uniquement si `hasRoleSelected === false`
- Sauvegarde le choix en DB + AsyncStorage
- Redirection automatique vers l'interface appropriée

#### B. Redirection automatique

**Fichier** : `components/RoleRedirect.tsx`

**Logique** :
```
1. Si non authentifié → Rien (laisser passer)
2. Si authentifié ET rôle non sélectionné → Afficher RoleSelectionScreen
3. Si authentifié ET rôle sélectionné :
   - Si userRole === 'seller' ET dans (tabs) → Rediriger vers /seller/my-shop
   - Si userRole === 'buyer' ET dans seller → Rediriger vers /(tabs)
   - Sinon → Laisser passer (déjà dans la bonne section)
```

#### C. Changement de rôle (paramètres)

**Fichier** : `app/(tabs)/profile.tsx`

**Emplacement** : Paramètres → Section "Préférences d'interface"

**Options** :
- Mode Acheteur (avec icône ShoppingBag)
- Mode Vendeur (avec icône Store)

**Comportement** :
- Mise à jour en DB + AsyncStorage
- Alerte de confirmation
- Redirection automatique vers l'interface correspondante

## Parcours utilisateur

### Première connexion

```
1. Utilisateur se connecte pour la première fois
2. NavigationContext détecte hasRoleSelected === false
3. RoleRedirect affiche RoleSelectionScreen
4. Utilisateur choisit "Je veux acheter" ou "Je veux vendre"
5. Rôle sauvegardé en DB (preferred_role) + AsyncStorage
6. Redirection automatique vers l'interface appropriée
7. FIN - Plus jamais redemandé
```

### Reconnexions suivantes

```
1. Utilisateur se connecte
2. NavigationContext récupère le rôle depuis la DB
3. Synchronisation avec AsyncStorage
4. RoleRedirect détecte que hasRoleSelected === true
5. Redirection automatique vers l'interface appropriée
6. Pas d'écran de sélection
```

### Changement de rôle

```
1. Utilisateur ouvre Profil → Paramètres
2. Section "Préférences d'interface"
3. Sélectionne "Mode Acheteur" ou "Mode Vendeur"
4. Mise à jour en DB + AsyncStorage
5. Alerte de confirmation
6. Redirection vers l'interface correspondante
```

## Gestion de la persistance

### Double couche de stockage

**1. Base de données (Source de vérité)**
- Stockage permanent
- Survit aux désinstallations (si compte conservé)
- Synchronisé sur tous les appareils de l'utilisateur

**2. AsyncStorage (Cache local)**
- Démarrage ultra-rapide
- Pas besoin d'attendre la DB au premier rendu
- Synchronisé avec la DB à chaque changement

### Stratégie de synchronisation

```typescript
// Au démarrage
1. Vérifier la DB (source de vérité)
2. Si rôle trouvé → Mettre à jour AsyncStorage
3. Si pas de rôle en DB → Vérifier AsyncStorage (migration)
4. Si rôle dans AsyncStorage → Migrer vers DB

// Au changement
1. Mettre à jour la DB
2. Mettre à jour AsyncStorage
3. Mettre à jour l'état local
```

## Intégration dans l'application

### app/_layout.tsx

```tsx
<AuthProvider>
  <NavigationProvider>
    <AuthGuard>
      <RoleRedirect>
        {/* Reste de l'app */}
      </RoleRedirect>
    </AuthGuard>
  </NavigationProvider>
</AuthProvider>
```

**Ordre important** :
1. `AuthProvider` : Gère l'authentification
2. `NavigationProvider` : Gère le rôle utilisateur
3. `AuthGuard` : Affiche loader pendant vérification auth
4. `RoleRedirect` : Gère sélection + redirection de rôle

## Points techniques importants

### 1. Mise à jour de is_seller

Quand l'utilisateur sélectionne "Mode Vendeur", le champ `is_seller` est également mis à jour :

```typescript
await supabase
  .from('profiles')
  .update({
    preferred_role: 'seller',
    is_seller: true  // Cohérence avec l'ancien système
  })
  .eq('id', user.id);
```

### 2. Migration d'anciennes versions

Les utilisateurs existants qui ont déjà un rôle dans AsyncStorage bénéficient d'une migration automatique :

```typescript
const roleFromStorage = await AsyncStorage.getItem('user_preferred_role');
if (roleFromStorage && !roleFromDB) {
  // Migrer vers la DB
  await setUserRole(roleFromStorage);
}
```

### 3. Nettoyage à la déconnexion

Lors de la déconnexion, AsyncStorage est nettoyé mais la DB conserve le choix :

```typescript
if (!authenticated) {
  await AsyncStorage.removeItem('user_preferred_role');
}
```

## Fichiers modifiés/créés

### Créés
- ✅ `components/RoleSelectionScreen.tsx` - Écran de sélection
- ✅ `components/RoleRedirect.tsx` - Logique de redirection
- ✅ `supabase/migrations/add_preferred_role.sql` - Migration DB

### Modifiés
- ✅ `contexts/NavigationContext.tsx` - Gestion persistante du rôle
- ✅ `types/database.ts` - Ajout du champ preferred_role
- ✅ `app/_layout.tsx` - Intégration de RoleRedirect
- ✅ `app/(tabs)/profile.tsx` - Option de changement de rôle

## Installation

### 1. Appliquer la migration Supabase

**Option A - Via Supabase Dashboard** :
1. Aller dans SQL Editor
2. Copier le contenu de `supabase/migrations/add_preferred_role.sql`
3. Exécuter la requête

**Option B - Via CLI** :
```bash
npx supabase db push
```

### 2. Tester le parcours

#### Test 1 : Première connexion (nouveau utilisateur)
1. Créer un nouveau compte
2. Vérifier que l'écran de sélection s'affiche
3. Choisir "Je veux acheter"
4. Vérifier la redirection vers (tabs)
5. Se déconnecter et reconnecter
6. Vérifier qu'on arrive directement dans (tabs) sans re-sélection

#### Test 2 : Changement de rôle
1. Aller dans Profil → Paramètres
2. Section "Préférences d'interface"
3. Changer pour "Mode Vendeur"
4. Vérifier la redirection vers /seller/my-shop
5. Se déconnecter et reconnecter
6. Vérifier qu'on arrive directement dans /seller/my-shop

#### Test 3 : Persistance
1. Sélectionner un rôle
2. Fermer complètement l'app
3. Redémarrer l'app
4. Vérifier qu'on arrive dans la bonne interface sans re-sélection

## Avantages de cette approche

### Pour l'utilisateur
- **Expérience fluide** : Pas de friction au démarrage
- **Contrôle** : Peut changer de rôle quand il veut
- **Cohérence** : Même interface sur tous les appareils
- **Rapidité** : Démarrage instantané

### Pour les développeurs
- **Maintenable** : Code clair et bien structuré
- **Évolutif** : Facile d'ajouter d'autres rôles
- **Testable** : Logique séparée en composants
- **Robuste** : Double couche de persistance

### Pour le business
- **Engagement** : L'utilisateur "s'installe" dans son rôle
- **Conversion** : Moins de friction = plus d'utilisation
- **Analytique** : Données claires sur les préférences utilisateur
- **Flexibilité** : Les utilisateurs peuvent facilement basculer

## Prochaines améliorations possibles

1. **Analytique** : Tracker les changements de rôle
2. **Recommandations** : Suggérer le rôle vendeur aux acheteurs actifs
3. **Mode hybride** : Permettre d'utiliser les deux interfaces simultanément
4. **Onboarding personnalisé** : Guide différent selon le rôle choisi
5. **Notifications** : Alertes spécifiques au rôle

## Support

Pour toute question ou problème :
1. Vérifier que la migration DB a bien été appliquée
2. Vérifier les logs de NavigationContext
3. Tester en mode debug avec breakpoints dans RoleRedirect
