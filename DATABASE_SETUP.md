# Configuration de la Base de Données

Ce document explique comment configurer la table `favorites` dans Supabase pour activer la fonctionnalité des favoris.

## Étapes pour créer la table Favorites

### Option 1 : Via l'interface Supabase (Recommandé)

1. Ouvrez votre projet Supabase : https://supabase.com/dashboard
2. Allez dans **SQL Editor** (dans le menu de gauche)
3. Cliquez sur **New Query**
4. Copiez-collez le contenu du fichier `supabase/migrations/create_favorites_table.sql`
5. Cliquez sur **Run** pour exécuter le script

### Option 2 : Via le CLI Supabase

Si vous avez le CLI Supabase installé :

```bash
cd project
supabase db push
```

## Structure de la table Favorites

```sql
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
```

### Colonnes :

- **id** : Identifiant unique du favori (UUID)
- **user_id** : Référence à l'utilisateur qui a mis le produit en favori
- **product_id** : Référence au produit mis en favori
- **created_at** : Date de création du favori

### Contraintes :

- **UNIQUE(user_id, product_id)** : Un utilisateur ne peut pas mettre le même produit en favori deux fois
- **ON DELETE CASCADE** : Si un utilisateur ou un produit est supprimé, les favoris associés sont automatiquement supprimés

## Sécurité (Row Level Security)

Les politiques de sécurité suivantes sont appliquées :

1. **SELECT** : Les utilisateurs peuvent voir uniquement leurs propres favoris
2. **INSERT** : Les utilisateurs peuvent ajouter des favoris uniquement pour eux-mêmes
3. **DELETE** : Les utilisateurs peuvent supprimer uniquement leurs propres favoris

## Index pour les performances

Trois index sont créés pour optimiser les requêtes :

1. `idx_favorites_user_id` : Recherche rapide par utilisateur
2. `idx_favorites_product_id` : Recherche rapide par produit
3. `idx_favorites_created_at` : Tri par date de création

## Vérification

Pour vérifier que la table a été créée correctement :

1. Dans Supabase, allez dans **Table Editor**
2. Cherchez la table `favorites`
3. Vérifiez que les colonnes et les politiques sont présentes

## Fonctionnalités activées

Une fois la table créée, les utilisateurs pourront :

- ❤️ Ajouter des produits à leurs favoris en cliquant sur le cœur
- 📋 Voir tous leurs favoris dans la page "Mes Favoris"
- 🗑️ Retirer des produits de leurs favoris
- 🔐 Avoir un accès sécurisé uniquement à leurs propres favoris

## Dépannage

### Erreur "Could not find the table 'public.favorites'"

Si vous voyez cette erreur, cela signifie que la table n'a pas encore été créée. Suivez les étapes ci-dessus pour la créer.

### Erreur de permission

Si vous avez des erreurs de permission, vérifiez que :
- Row Level Security est activé
- Les politiques sont correctement créées
- L'utilisateur est authentifié
