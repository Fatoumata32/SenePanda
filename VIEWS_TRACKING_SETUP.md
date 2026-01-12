# Configuration du Tracking des Vues de Produits

## Vue d'ensemble

Ce système permet de tracker le nombre de vues de chaque produit et d'afficher ces statistiques dans l'application.

## Fonctionnalités

- **Compteur de vues** : Incrémente automatiquement à chaque visite d'une page produit
- **Affichage des vues** : Visible sur les cartes produits et la page détail
- **Produits tendance** : Fonction RPC pour récupérer les produits les plus vus
- **Statistiques** : Classement des produits par popularité

## Installation

### Étape 1 : Appliquer la migration SQL

Connectez-vous à votre dashboard Supabase et exécutez le fichier SQL suivant :

**Fichier** : `supabase/migrations/add_product_views.sql`

Allez dans :
1. Supabase Dashboard > SQL Editor
2. Copiez-collez le contenu du fichier `supabase/migrations/add_product_views.sql`
3. Cliquez sur "Run"

Cette migration va :
- Ajouter la colonne `views_count` à la table `products`
- Créer un index pour améliorer les performances
- Créer 3 fonctions RPC :
  - `increment_product_views(product_id)` : Incrémente le compteur de vues
  - `get_product_view_stats(product_id)` : Récupère les statistiques de vues
  - `get_trending_products(limit_count)` : Récupère les produits les plus vus

### Étape 2 : Utilisation dans l'application

Le tracking est déjà intégré dans :

#### 1. Hook useProductViews (`hooks/useProductViews.ts`)

```typescript
import { useProductViews } from '@/hooks/useProductViews';

// Dans votre composant
const { viewStats, incrementViews } = useProductViews(productId);

// Incrémenter les vues
useEffect(() => {
  incrementViews();
}, [productId]);

// Afficher les stats
{viewStats && (
  <Text>{viewStats.totalViews} vues</Text>
)}
```

#### 2. Page détail produit (`app/product/[id].tsx`)

Le hook est déjà intégré et incrémente automatiquement les vues à chaque visite.

#### 3. Composant ProductCard (`components/ProductCard.tsx`)

Affiche automatiquement le nombre de vues si la donnée est disponible dans l'objet produit.

### Étape 3 : Récupérer les vues avec les produits

Pour que les vues s'affichent, vous devez inclure `views_count` dans vos requêtes :

```typescript
const { data: products } = await supabase
  .from('products')
  .select('*, views_count')
  .order('views_count', { ascending: false });
```

## Fonctionnalités disponibles

### 1. Produits tendance

```typescript
import { useTrendingProducts } from '@/hooks/useProductViews';

const { trendingProducts, isLoading, refresh } = useTrendingProducts(10);
```

### 2. Statistiques détaillées

```typescript
const { viewStats } = useProductViews(productId);

// viewStats contient :
// - totalViews: nombre total de vues
// - rank: classement du produit par rapport aux autres
```

## Structure de la base de données

### Colonne ajoutée à `products`

| Colonne | Type | Défaut | Description |
|---------|------|--------|-------------|
| views_count | INTEGER | 0 | Nombre de vues du produit |

### Fonctions RPC créées

1. **increment_product_views(product_id UUID)**
   - Incrémente le compteur de vues
   - Retourne le nouveau nombre de vues

2. **get_product_view_stats(product_id UUID)**
   - Retourne les statistiques complètes
   - Inclut le classement du produit

3. **get_trending_products(limit_count INTEGER)**
   - Retourne les N produits les plus vus
   - Filtre les produits en stock

## Interface utilisateur

### ProductCard
- Badge avec icône œil et nombre de vues
- Affiché uniquement si views_count > 0
- Design cohérent avec les autres badges

### Page détail produit
- Nombre de vues affiché à côté des étoiles
- Mise à jour automatique après incrémentation
- Style cohérent avec le reste de l'interface

## Performance

- Index créé sur `views_count DESC` pour accélérer les requêtes
- Mise à jour atomique du compteur (pas de condition de course)
- Cache automatique géré par React hooks

## Maintenance

### Réinitialiser les compteurs

```sql
UPDATE products SET views_count = 0;
```

### Vérifier les produits les plus vus

```sql
SELECT id, name, views_count
FROM products
ORDER BY views_count DESC
LIMIT 10;
```

### Supprimer le système de vues

```sql
DROP FUNCTION IF EXISTS increment_product_views(UUID);
DROP FUNCTION IF EXISTS get_product_view_stats(UUID);
DROP FUNCTION IF EXISTS get_trending_products(INTEGER);
DROP INDEX IF EXISTS idx_products_views_count;
ALTER TABLE products DROP COLUMN IF EXISTS views_count;
```

## Prochaines étapes possibles

- [ ] Ajouter un dashboard vendeur avec statistiques de vues
- [ ] Créer une section "Produits tendance" sur la page d'accueil
- [ ] Tracker les vues par période (jour/semaine/mois)
- [ ] Ajouter des graphiques d'évolution des vues
- [ ] Notification au vendeur quand son produit atteint X vues
