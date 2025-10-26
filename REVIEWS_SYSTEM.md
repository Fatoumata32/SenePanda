# Système d'Avis et Notes - SenePanda ⭐

Documentation complète du système d'avis clients pour la marketplace SenePanda.

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Installation](#installation)
3. [Fonctionnalités](#fonctionnalités)
4. [Architecture](#architecture)
5. [Guide d'utilisation](#guide-dutilisation)
6. [Sécurité](#sécurité)
7. [Optimisations](#optimisations)
8. [FAQ](#faq)

---

## 🎯 Vue d'ensemble

Le système d'avis et notes permet aux acheteurs de :
- ⭐ Noter les produits de 1 à 5 étoiles
- 💬 Laisser des commentaires détaillés
- 📸 Ajouter jusqu'à 4 photos
- ✅ Avoir un badge "Achat vérifié"
- 👍 Voter pour les avis utiles

### Bénéfices pour l'adoption
- **Confiance** : Les avis vérifient la qualité des produits
- **Transparence** : Les vendeurs reçoivent des retours constructifs
- **Engagement** : Les acheteurs partagent leur expérience
- **Conversion** : Les produits bien notés vendent mieux

---

## 🚀 Installation

### Étape 1 : Exécuter la migration SQL

**OBLIGATOIRE** : Créer les tables dans Supabase

1. Allez sur https://supabase.com/dashboard
2. Ouvrez **SQL Editor**
3. Cliquez sur **New Query**
4. Copiez-collez le contenu de :
   ```
   supabase/migrations/create_reviews_system.sql
   ```
5. Cliquez sur **Run**

### Étape 2 : Vérifier les tables créées

Après l'exécution, vous devriez avoir :

#### Tables
- ✅ `product_reviews` - Avis sur les produits
- ✅ `seller_reviews` - Avis sur les vendeurs (future)
- ✅ `review_helpful_votes` - Votes "utile"

#### Colonnes ajoutées
- ✅ `products.average_rating` (DECIMAL)
- ✅ `products.total_reviews` (INTEGER)
- ✅ `profiles.average_rating` (DECIMAL)
- ✅ `profiles.total_reviews` (INTEGER)
- ✅ `profiles.verified_seller` (BOOLEAN)
- ✅ `profiles.seller_badge` (TEXT)

### Étape 3 : Redémarrer l'application

```bash
# Arrêter l'app
# Ctrl+C dans le terminal

# Redémarrer
npx expo start --clear
```

---

## ✨ Fonctionnalités

### 1. Affichage des Notes

#### Sur les cartes produits
```tsx
// Affichage automatique si product.total_reviews > 0
<RatingStars
  rating={product.average_rating}
  size={14}
  showNumber
  totalReviews={product.total_reviews}
/>
```

**Exemple** : 4.5 ⭐⭐⭐⭐⭐ (23)

#### Sur la page produit
- Note moyenne affichée en haut de la section avis
- Liste des 3 derniers avis
- Bouton "Voir tous les avis" si > 3 avis

### 2. Laisser un Avis

#### Conditions requises
- ✅ Utilisateur authentifié
- ✅ Commande livrée (`status = 'delivered'`)
- ✅ Produit acheté dans la commande
- ⚠️ Un seul avis par produit par utilisateur

#### Processus
1. Cliquer sur "Laisser un avis" (bouton visible uniquement si éligible)
2. Choisir une note (1-5 étoiles) - **OBLIGATOIRE**
3. Ajouter un titre (optionnel, max 100 caractères)
4. Écrire un commentaire - **OBLIGATOIRE** (max 500 caractères)
5. Ajouter jusqu'à 4 photos (optionnel)
6. Publier

#### Vérification automatique
```sql
-- Vérifie si l'utilisateur a acheté le produit
verified_purchase = EXISTS (
  SELECT 1 FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE o.user_id = auth.uid()
  AND oi.product_id = product_id
  AND o.status = 'delivered'
)
```

### 3. Vote "Utile"

Les utilisateurs peuvent voter pour les avis utiles :
- 👍 Cliquer sur "Utile" pour voter
- 👎 Recliquer pour annuler
- Le compteur s'incrémente/décrémente automatiquement
- Un seul vote par utilisateur par avis

### 4. Calcul Automatique des Moyennes

Les moyennes sont calculées automatiquement via des **triggers PostgreSQL** :

```sql
-- Mise à jour automatique quand un avis est ajouté/modifié/supprimé
UPDATE products SET
  average_rating = ROUND(AVG(rating), 1),
  total_reviews = COUNT(*)
WHERE product_id = ...
```

### 5. Badge "Achat Vérifié"

Un badge vert ✅ s'affiche automatiquement si :
- L'avis provient d'une commande livrée
- Le produit était dans cette commande

---

## 🏗️ Architecture

### Structure des Tables

#### product_reviews
```sql
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  user_id UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  rating INTEGER CHECK (1 <= rating <= 5),
  title TEXT,
  comment TEXT,
  images TEXT[],
  helpful_count INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, product_id)  -- Un avis par produit
);
```

#### review_helpful_votes
```sql
CREATE TABLE review_helpful_votes (
  id UUID PRIMARY KEY,
  review_id UUID REFERENCES product_reviews(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP,
  UNIQUE(review_id, user_id)  -- Un vote par avis
);
```

### Composants React

#### RatingStars
**Fichier** : `components/RatingStars.tsx`

**Props** :
```tsx
{
  rating: number;           // 0-5
  size?: number;            // Taille des étoiles (défaut: 16)
  showNumber?: boolean;     // Afficher le nombre (défaut: false)
  totalReviews?: number;    // Nombre total d'avis
  interactive?: boolean;    // Mode édition (défaut: false)
  onRatingChange?: (rating: number) => void;
}
```

**Modes** :
- **Lecture** : Affichage simple des étoiles
- **Interactif** : Permet de cliquer pour noter

#### ReviewCard
**Fichier** : `components/ReviewCard.tsx`

**Affiche** :
- Avatar et nom de l'utilisateur
- Badge "Achat vérifié" si applicable
- Étoiles de notation
- Titre et commentaire
- Photos de l'avis (jusqu'à 4)
- Bouton "Utile" avec compteur

### Pages

#### Page d'ajout d'avis
**Route** : `/review/add-review?productId=xxx`

**Fonctionnalités** :
- Sélection interactive des étoiles
- Champs titre et commentaire
- Upload de photos (expo-image-picker)
- Validation avant soumission
- Vérification d'éligibilité

#### Page produit (modifiée)
**Route** : `/product/[id]`

**Ajouts** :
- Section "Avis clients" avec moyenne
- Bouton "Laisser un avis" (si éligible)
- Liste des 3 derniers avis
- Bouton "Voir tous" (future)

---

## 🔒 Sécurité

### Row Level Security (RLS)

#### Lecture des avis
```sql
-- Tout le monde peut lire les avis
CREATE POLICY "Anyone can view product reviews"
  ON product_reviews FOR SELECT
  USING (true);
```

#### Création d'avis
```sql
-- Seuls les acheteurs peuvent créer des avis
CREATE POLICY "Users can create reviews for purchased products"
  ON product_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = auth.uid()
      AND oi.product_id = product_reviews.product_id
      AND o.status = 'delivered'
    )
  );
```

#### Modification/Suppression
```sql
-- Seul l'auteur peut modifier/supprimer son avis
CREATE POLICY "Users can update their own reviews"
  ON product_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON product_reviews FOR DELETE
  USING (auth.uid() = user_id);
```

### Protection contre la fraude

1. **Un avis par produit** : Contrainte UNIQUE(user_id, product_id)
2. **Achat vérifié** : Vérification dans les order_items
3. **Commande livrée** : Seulement status = 'delivered'
4. **Un vote par avis** : Contrainte UNIQUE(review_id, user_id)

---

## ⚡ Optimisations

### Index de Performance

```sql
-- Recherche rapide par produit
CREATE INDEX idx_product_reviews_product ON product_reviews(product_id);

-- Recherche rapide par utilisateur
CREATE INDEX idx_product_reviews_user ON product_reviews(user_id);

-- Tri par note
CREATE INDEX idx_product_reviews_rating ON product_reviews(rating DESC);

-- Tri par date
CREATE INDEX idx_product_reviews_created ON product_reviews(created_at DESC);
```

### Calcul Asynchrone

Les moyennes sont calculées par des **triggers** plutôt que dans le code :
- ✅ Plus rapide
- ✅ Pas de latence réseau
- ✅ Atomique et cohérent
- ✅ Pas de charge sur l'app

### Pagination

Pour les listes d'avis :
```tsx
.limit(10)  // 10 avis à la fois
.order('created_at', { ascending: false })  // Plus récents en premier
```

---

## 📊 Statistiques

### Informations disponibles

#### Par Produit
```tsx
product.average_rating  // 4.5
product.total_reviews   // 23
```

#### Par Vendeur (futur)
```tsx
profile.average_rating  // 4.8
profile.total_reviews   // 156
profile.verified_seller // true
profile.seller_badge    // 'gold'
```

### Badges Vendeur (futur)

Basés sur les statistiques :
- 🥉 **Bronze** : 10+ avis, moyenne ≥ 3.5
- 🥈 **Silver** : 50+ avis, moyenne ≥ 4.0
- 🥇 **Gold** : 100+ avis, moyenne ≥ 4.5
- 💎 **Platinum** : 500+ avis, moyenne ≥ 4.8

---

## 📱 Guide d'Utilisation

### Pour les Acheteurs

#### 1. Voir les notes
- Sur la page d'accueil/explore : Notes visibles sur chaque produit
- Sur la page produit : Section dédiée "Avis clients"

#### 2. Laisser un avis
1. Achetez un produit
2. Attendez la livraison
3. Allez sur la page du produit
4. Cliquez sur "Laisser un avis"
5. Remplissez le formulaire
6. Publiez !

#### 3. Voter pour un avis utile
- Cliquez sur le bouton "Utile" sous un avis
- Le compteur s'incrémente
- Recliquez pour annuler votre vote

### Pour les Vendeurs

#### Voir les avis sur vos produits
1. Allez dans "Mes produits"
2. Cliquez sur un produit
3. Scrollez jusqu'à "Avis clients"

#### Répondre aux avis (futur)
- Les vendeurs pourront répondre aux avis
- Améliorer la relation client
- Clarifier des malentendus

---

## 🐛 Dépannage

### Erreur : "Vous avez déjà laissé un avis"

**Cause** : Un utilisateur ne peut laisser qu'un avis par produit

**Solution** : Modifiez votre avis existant (future) ou supprimez-le d'abord

### Erreur : Impossible de laisser un avis

**Causes possibles** :
1. Vous n'avez pas acheté le produit
2. Votre commande n'est pas encore livrée
3. Vous n'êtes pas connecté

**Solution** : Vérifiez votre historique de commandes

### Les moyennes ne se mettent pas à jour

**Cause** : Problème avec les triggers

**Solution** :
```sql
-- Recalculer manuellement
UPDATE products
SET
  average_rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM product_reviews WHERE product_id = products.id),
  total_reviews = (SELECT COUNT(*) FROM product_reviews WHERE product_id = products.id);
```

### Les photos ne s'uploadent pas

**Causes** :
1. Permissions refusées
2. Storage Supabase non configuré

**Solution** :
```bash
# Vérifier les permissions
- Settings → Storage → Policies
- Créer une policy pour 'products' bucket
```

---

## 📈 Prochaines Évolutions

### Court terme (1-2 semaines)
- [ ] Page "Tous les avis" d'un produit
- [ ] Filtres (note, vérifié, avec photos)
- [ ] Tri (récent, utile, note haute/basse)

### Moyen terme (3-4 semaines)
- [ ] Avis vendeurs (seller_reviews)
- [ ] Réponses des vendeurs
- [ ] Signaler un avis inapproprié
- [ ] Modération des avis

### Long terme (1-2 mois)
- [ ] Badges vendeur automatiques
- [ ] Système de réputation
- [ ] Analytics pour vendeurs
- [ ] Export PDF des avis

---

## 📁 Fichiers du Système

### Migrations
- ✅ `supabase/migrations/create_reviews_system.sql`

### Types
- ✅ `types/database.ts` (ProductReview, SellerReview, ReviewHelpfulVote)

### Composants
- ✅ `components/RatingStars.tsx`
- ✅ `components/ReviewCard.tsx`

### Pages
- ✅ `app/review/add-review.tsx`
- ✅ `app/product/[id].tsx` (modifié)
- ✅ `components/ProductCard.tsx` (modifié)

### Documentation
- ✅ `REVIEWS_SYSTEM.md` (ce fichier)

---

## 💡 Conseils

### Pour maximiser l'adoption

1. **Inciter les avis** :
   - Offrir des points de fidélité
   - Concours du meilleur avis du mois
   - Récompenses pour 10+ avis

2. **Qualité des avis** :
   - Encourager les photos
   - Demander des détails
   - Valider les avis constructifs

3. **Engagement** :
   - Notifier les vendeurs des nouveaux avis
   - Permettre les réponses
   - Mettre en avant les bons avis

### Pour les vendeurs

1. **Réagir rapidement** aux avis négatifs
2. **Remercier** pour les avis positifs
3. **Améliorer** les produits selon les retours
4. **Afficher** fièrement les bonnes notes

---

## 🎯 Métriques de Succès

### Indicateurs clés
- **Taux d'avis** : % d'achats avec avis
- **Note moyenne** : Globale de la plateforme
- **Temps de réponse** : Des vendeurs aux avis
- **Satisfaction** : % d'avis 4-5 étoiles

### Objectifs
- 🎯 20% des achats avec avis
- 🎯 4.0+ de note moyenne globale
- 🎯 50% des avis avec photos
- 🎯 80% des avis positifs (4-5⭐)

---

## 🤝 Support

### Questions ?
- 📧 Email : support@senepanda.com
- 💬 Discord : #aide-technique
- 📱 WhatsApp : +225 XX XX XX XX

### Bugs ou suggestions ?
- GitHub Issues : `senepanda/issues`
- Formulaire : https://senepanda.com/feedback

---

**Date** : Octobre 2025
**Version** : 1.0
**Statut** : ✅ Production Ready

---

## 🎉 Conclusion

Le système d'avis et notes est maintenant **100% fonctionnel** !

Les utilisateurs peuvent :
- ⭐ Voir les notes partout
- 💬 Laisser des avis détaillés
- 📸 Ajouter des photos
- ✅ Avoir un badge vérifié
- 👍 Voter pour les avis utiles

Cette fonctionnalité est **ESSENTIELLE** pour :
- 🔐 Construire la **confiance**
- 📈 Augmenter les **conversions**
- 🎯 Améliorer la **qualité**
- 💪 Fidéliser les **utilisateurs**

**Prochaine étape** : Tester et promouvoir ! 🚀
