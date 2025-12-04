# 🏆 Système de Réputation Vendeur

## Vue d'ensemble

Le système de réputation vendeur de SenePanda calcule et affiche dynamiquement le niveau de réputation d'un vendeur en fonction de plusieurs facteurs mesurables. Ce guide explique comment fonctionne le système et comment l'utiliser.

---

## 🎯 Fonctionnalités

### ✅ Calcul automatique et dynamique
- **Score global** calculé sur 100 points
- **6 niveaux de réputation** : Nouveau, Bronze, Argent, Or, Platine, Diamant
- Mise à jour automatique basée sur les performances réelles

### ✅ Facteurs de calcul
Le score est calculé en fonction de :

1. **Note moyenne** (40% du score)
   - Note sur 5 étoiles donnée par les acheteurs
   - Poids le plus important dans le calcul

2. **Nombre d'avis** (25% du score)
   - Volume total d'avis reçus
   - Indicateur de confiance et d'expérience

3. **Votes utiles** (20% du score)
   - Nombre de votes "utile" sur les avis de produits
   - Mesure la qualité des descriptions

4. **Taux de réponse** (10% du score)
   - Rapidité de réponse aux messages clients
   - Améliore l'engagement client

5. **Taux de complétion** (5% du score)
   - Pourcentage de commandes livrées avec succès
   - Indicateur de fiabilité

### ✅ Affichage visuel
- Badge coloré avec emoji représentant le niveau
- Étoiles pour la note moyenne
- Statistiques détaillées (avis, votes)
- Barre de progression vers le niveau suivant
- Score de réputation sur 100

---

## 📊 Niveaux de Réputation

| Niveau | Score | Emoji | Couleur | Critères |
|--------|-------|-------|---------|----------|
| **Nouveau** | 0-19 | 🌱 | Gris | Vendeur débutant |
| **Bronze** | 20-39 | 🥉 | Bronze | ≥ 4.0 ⭐ + 5 avis |
| **Argent** | 40-59 | 🥈 | Argent | ≥ 4.5 ⭐ + 20 avis |
| **Or** | 60-79 | 🥇 | Or | ≥ 4.7 ⭐ + 50 avis |
| **Platine** | 80-94 | 💎 | Platine | ≥ 4.9 ⭐ + 100 avis |
| **Diamant** | 95-100 | 💠 | Cyan | Excellence absolue |

---

## 🔧 Installation

### 1. Appliquer la migration SQL

Exécutez la migration pour créer les fonctions nécessaires :

```bash
npx supabase db push
```

Ou exécutez manuellement le fichier :
```bash
psql -f supabase/migrations/add_seller_reputation_system.sql
```

### 2. Vérifier les fonctions créées

Les fonctions suivantes doivent être disponibles :
- `get_seller_order_stats(seller_id)` - Statistiques de commandes
- `update_seller_average_rating()` - Trigger de mise à jour automatique
- `calculate_seller_badge(seller_id)` - Calcul du badge
- `get_top_sellers(limit, min_reviews)` - Classement des meilleurs vendeurs
- `get_seller_reputation_details(seller_id)` - Statistiques détaillées

---

## 💻 Utilisation du Code

### Composant SellerReputationBadge

```tsx
import SellerReputationBadge from '@/components/SellerReputationBadge';
import { useSellerReputation } from '@/hooks/useSellerReputation';

function SellerProfile({ sellerId }) {
  const { reputation, loading, error } = useSellerReputation(sellerId);

  if (loading) return <ActivityIndicator />;
  if (error || !reputation) return null;

  return (
    <SellerReputationBadge
      reputation={reputation}
      size="medium"        // 'small' | 'medium' | 'large'
      showDetails={true}   // Afficher les statistiques
      showProgress={true}  // Afficher la progression
    />
  );
}
```

### Hook useMyReputation (pour le vendeur connecté)

```tsx
import { useMyReputation } from '@/hooks/useSellerReputation';

function MyProfile() {
  const { reputation, loading, refresh } = useMyReputation();

  // Rafraîchir manuellement
  const handleRefresh = () => {
    refresh();
  };

  return (
    <View>
      {reputation && (
        <SellerReputationBadge reputation={reputation} />
      )}
      <Button onPress={handleRefresh} title="Rafraîchir" />
    </View>
  );
}
```

### Hook useTopSellersByReputation

```tsx
import { useTopSellersByReputation } from '@/hooks/useSellerReputation';

function TopSellersScreen() {
  const { sellers, loading, error } = useTopSellersByReputation(10);

  return (
    <FlatList
      data={sellers}
      renderItem={({ item }) => (
        <View>
          <Text>{item.sellerId}</Text>
          <SellerReputationBadge reputation={item.reputation} size="small" />
        </View>
      )}
    />
  );
}
```

---

## 🧮 Algorithme de Calcul

### Formule du Score

```typescript
score = (
  (note_moyenne / 5 * 100) * 0.40 +  // 40% note moyenne
  (avis_normalized) * 0.25 +          // 25% nombre d'avis
  (votes_normalized) * 0.20 +         // 20% votes utiles
  (taux_réponse) * 0.10 +            // 10% taux de réponse
  (taux_complétion) * 0.05           // 5% taux de complétion
)
```

### Normalisation

Les valeurs sont normalisées selon des seuils :

**Pour les avis :**
- Excellent : ≥ 100 avis = 100 points
- Bon : ≥ 50 avis = 75 points
- Moyen : ≥ 20 avis = 50 points
- Faible : ≥ 5 avis = 25 points

**Pour les votes :**
- Excellent : ≥ 200 votes = 100 points
- Bon : ≥ 100 votes = 75 points
- Moyen : ≥ 30 votes = 50 points
- Faible : ≥ 10 votes = 25 points

**Pour la note moyenne :**
- Excellent : ≥ 4.8 ⭐ = 100 points
- Bon : ≥ 4.5 ⭐ = 80 points
- Moyen : ≥ 4.0 ⭐ = 60 points
- Faible : ≥ 3.5 ⭐ = 40 points

---

## 🎨 Personnalisation

### Modifier les seuils de niveaux

Éditez `lib/reputationSystem.ts` :

```typescript
export const REPUTATION_THRESHOLDS = {
  nouveau: { min: 0, max: 19, nextLevel: 'bronze' },
  bronze: { min: 20, max: 39, nextLevel: 'silver' },
  // ... personnalisez ici
};
```

### Modifier les poids des facteurs

```typescript
export const REPUTATION_WEIGHTS = {
  averageRating: 40,  // Modifiez ces valeurs
  totalReviews: 25,   // Total doit faire 100
  positiveVotes: 20,
  responseRate: 10,
  completionRate: 5,
};
```

### Modifier l'apparence du badge

Éditez `components/SellerReputationBadge.tsx` :

```typescript
const getLevelConfig = (level: ReputationLevel) => {
  return {
    nouveau: {
      color: '#94A3B8',  // Changez les couleurs
      emoji: '🌱',        // Changez les emojis
      // ...
    },
    // ...
  };
};
```

---

## 🔍 Fonctions SQL Disponibles

### 1. Obtenir les statistiques de commandes

```sql
SELECT * FROM get_seller_order_stats('seller-uuid');
```

Retourne :
- `response_rate` : Taux de réponse (0-100)
- `completion_rate` : Taux de complétion (0-100)
- `total_orders` : Nombre total de commandes
- `completed_orders` : Nombre de commandes complétées

### 2. Obtenir le classement des meilleurs vendeurs

```sql
SELECT * FROM get_top_sellers(10, 5);
```

Paramètres :
- `limit` : Nombre de vendeurs à retourner (défaut: 10)
- `min_reviews` : Nombre minimum d'avis requis (défaut: 5)

### 3. Obtenir les détails de réputation

```sql
SELECT * FROM get_seller_reputation_details('seller-uuid');
```

Retourne toutes les statistiques détaillées d'un vendeur.

### 4. Vue seller_reputation_view

```sql
SELECT * FROM seller_reputation_view
WHERE reputation_level IN ('gold', 'platinum', 'diamond')
ORDER BY reputation_score DESC
LIMIT 20;
```

Vue matérialisée avec score et niveau pré-calculés.

---

## 📈 Conseils pour Améliorer la Réputation

Le système fournit automatiquement des conseils via la fonction `getReputationImprovementTips()` :

```typescript
import { getReputationImprovementTips } from '@/lib/reputationSystem';

const tips = getReputationImprovementTips({
  averageRating: 4.3,
  totalReviews: 15,
  totalVotes: 20,
  responseRate: 70,
  completionRate: 85,
});

// Affiche des conseils personnalisés :
// - "Améliorez la qualité de vos produits..."
// - "Encouragez vos clients à laisser des avis..."
// - etc.
```

---

## 🔄 Mise à Jour Automatique

Le système met à jour automatiquement la réputation via des triggers SQL :

- ✅ Quand un avis est ajouté/modifié/supprimé → `trigger_update_seller_rating`
- ✅ Quand la note change → `trigger_update_seller_badge`
- ✅ Les badges sont recalculés automatiquement

---

## 🧪 Tests et Validation

### Tester le calcul de réputation

```typescript
import { calculateReputation } from '@/lib/reputationSystem';

const reputation = calculateReputation({
  averageRating: 4.8,
  totalReviews: 120,
  totalVotes: 250,
  responseRate: 95,
  completionRate: 98,
});

console.log(reputation);
// {
//   level: 'platinum',
//   score: 92,
//   nextLevelScore: 95,
//   progress: 80,
//   ...
// }
```

### Créer des données de test

```sql
-- Insérer des avis de test
INSERT INTO seller_reviews (seller_id, user_id, rating, comment)
VALUES
  ('seller-uuid', 'user-1', 5, 'Excellent vendeur !'),
  ('seller-uuid', 'user-2', 5, 'Très satisfait'),
  ('seller-uuid', 'user-3', 4, 'Bien');

-- Vérifier le calcul automatique
SELECT average_rating, total_reviews, seller_badge
FROM profiles
WHERE id = 'seller-uuid';
```

---

## 🐛 Dépannage

### Le badge ne s'affiche pas

1. Vérifiez que le vendeur a `is_seller = true`
2. Vérifiez que la migration SQL a bien été appliquée
3. Vérifiez les erreurs dans la console

### Le score ne se met pas à jour

1. Vérifiez que les triggers sont actifs :
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%seller%';
```

2. Testez manuellement la fonction :
```sql
SELECT update_seller_average_rating();
```

### Erreur "get_seller_order_stats does not exist"

La migration n'a pas été appliquée correctement. Réexécutez :
```bash
npx supabase db push
```

---

## 📝 Changelog

### Version 1.0.0 (2025-12-03)
- ✅ Système de calcul de réputation complet
- ✅ 6 niveaux de réputation avec badges visuels
- ✅ Hook React pour récupération des données
- ✅ Migrations SQL avec triggers automatiques
- ✅ Intégration dans le profil vendeur
- ✅ Affichage des statistiques détaillées
- ✅ Barre de progression vers niveau suivant
- ✅ Conseils personnalisés d'amélioration

---

## 🎓 Ressources

### Fichiers du système

- `components/SellerReputationBadge.tsx` - Composant visuel
- `lib/reputationSystem.ts` - Logique de calcul
- `hooks/useSellerReputation.ts` - Hooks React
- `supabase/migrations/add_seller_reputation_system.sql` - Base de données
- `types/database.ts` - Types TypeScript

### Documentation complémentaire

- [Guide des avis produits](./GUIDE_AVIS_PRODUITS.md) *(à créer)*
- [Guide du système de votes](./GUIDE_VOTES.md) *(à créer)*
- [Guide de l'interface vendeur](./GUIDE_VENDEUR.md) *(à créer)*

---

## 🤝 Contribution

Pour améliorer le système de réputation :

1. Proposez des ajustements de poids des facteurs
2. Suggérez de nouveaux niveaux ou badges
3. Améliorez l'algorithme de calcul
4. Ajoutez de nouveaux facteurs de réputation

---

## 📞 Support

Pour toute question ou problème :

1. Vérifiez la section Dépannage ci-dessus
2. Consultez les logs de la console
3. Vérifiez l'état de la base de données
4. Ouvrez une issue avec les détails du problème

---

**Système de Réputation SenePanda v1.0.0**
*Construit avec ❤️ pour encourager l'excellence des vendeurs*
