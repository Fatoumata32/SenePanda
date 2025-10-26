# Système de Plans d'Abonnement pour Vendeurs

## Vue d'ensemble

Ce système offre 4 niveaux d'abonnement aux vendeurs, chacun avec des avantages progressifs pour mettre en valeur leurs produits et augmenter leurs ventes. L'approche est équitable et transparente :

- **Plan gratuit** : Permet à tous de commencer
- **Plans payants** : Offrent des avantages tangibles qui justifient l'investissement
- **Mise en valeur algorithmique** : Basée sur la qualité, les évaluations ET le niveau d'abonnement

## Les 4 Plans d'Abonnement

### 1. GRATUIT (Free) - 0 XOF/mois

**Parfait pour débuter**
- Commission : 20%
- 5 produits maximum
- Photos standard (5 par produit)
- Visibilité standard dans les recherches
- Support standard

### 2. STARTER (Débutant) - 5,000 XOF/mois (~8.5 USD)

**Pour les vendeurs qui démarrent**
- Commission : 15% (-5%)
- 25 produits maximum
- Photos HD (10 par produit)
- Badge "Vendeur Vérifié"
- Boost de visibilité : +20%
- Apparition occasionnelle en page d'accueil (1 slot)
- Support prioritaire

**ROI** : Avec seulement 4-5 ventes/mois, le plan est déjà rentabilisé grâce à la commission réduite

### 3. PRO (Professionnel) - 15,000 XOF/mois (~25 USD)

**Pour les vendeurs établis**
- Commission : 10% (-10%)
- 100 produits maximum
- Photos HD + Vidéos (15 médias par produit)
- Badge "Vendeur Pro"
- Boost de visibilité : +50%
- Rotation automatique toutes les 2 heures (3 slots homepage)
- Apparition régulière en tête de recherche
- Support VIP
- Statistiques avancées

**ROI** : À partir de 10 ventes/mois, l'économie sur la commission couvre l'abonnement

### 4. PREMIUM (Elite) - 30,000 XOF/mois (~50 USD)

**Pour les vendeurs à fort volume**
- Commission : 7% (-13%)
- Produits illimités
- Photos HD + Vidéos + Photos 360° (30 médias par produit)
- Badge "Vendeur Elite"
- Boost de visibilité : +100%
- Position premium permanente (5 slots homepage)
- Priorité maximale dans les recherches
- Concierge dédié 24/7
- Statistiques + Analytics IA
- Campagnes marketing sponsorisées

**ROI** : Pour 20+ ventes/mois, ce plan maximise la visibilité et les profits

## Logique de Mise en Valeur

### Algorithme de Scoring

Chaque produit reçoit un score qui détermine sa position dans les résultats et sur la page d'accueil :

```typescript
Score = (Boost plan) + (Note moyenne × 10) + (Nombre d'avis × 2) + (Bonus fraîcheur)

Boosts par plan :
- Premium : +1000 (priorité maximale permanente)
- Pro : +300 à +500 (selon rotation de 2h)
- Starter : +0 à +100 (selon jour pair/impair)
- Free : +0
```

### Système de Rotation

**Plan PRO (rotation 2h)** :
- La journée est divisée en 12 slots de 2h
- Les produits Pro sont assignés à des slots basés sur un hash de leur ID
- Pendant leur slot : +500 points
- Hors slot : +300 points (toujours avantagés vs Free/Starter)

**Plan STARTER (rotation journalière)** :
- Apparition un jour sur deux
- Basé sur le jour de l'année + hash du produit ID
- Donne une chance équitable sans surcharger

**Plan PREMIUM** :
- Pas de rotation, toujours prioritaire
- Position garantie dans les premiers résultats

## Équité du Système

### Pourquoi ce système est équitable :

1. **Accessibilité** : Le plan gratuit permet à tous de commencer sans barrière financière

2. **Valeur proportionnelle** : Chaque plan offre des avantages concrets qui justifient le prix
   - Commission réduite = économie directe mesurable
   - Visibilité accrue = plus de ventes
   - Support amélioré = gain de temps

3. **ROI clair** : Les vendeurs peuvent facilement calculer leur retour sur investissement
   - Économie sur commission
   - Augmentation des ventes grâce à la visibilité

4. **Évolutif** : Les vendeurs peuvent commencer gratuitement et upgrader quand leur business grandit

5. **Transparence** : Les règles sont claires, pas de favoritisme caché

6. **Qualité récompensée** : Même avec un plan gratuit, un produit excellent (bonnes notes, beaucoup d'avis) peut bien se positionner

## Structure de la Base de Données

### Tables principales

1. **subscription_plans** : Définitions des plans
2. **seller_subscriptions** : Abonnements actifs des vendeurs
3. **featured_products_rotation** : Planification des rotations
4. **subscription_history** : Historique des changements

### Fonctions PostgreSQL

- `can_add_product(seller_uuid)` : Vérifie si le vendeur peut ajouter un produit
- `get_seller_plan_benefits(seller_uuid)` : Récupère les avantages du plan
- `upgrade_seller_plan(...)` : Gère la souscription/upgrade de plan

### Triggers

- `check_product_limit` : Empêche l'ajout de produits au-delà de la limite du plan

## Intégration dans l'Application

### Pages créées

1. **`/seller/subscription-plans`** : Affichage et souscription aux plans
2. **`/seller/benefits`** : Vue des avantages actuels du vendeur
3. **Composant `<FeaturedProducts />`** : Affichage des produits mis en avant sur homepage

### Navigation

- Accessible depuis le profil vendeur
- Badge visible indiquant le plan actuel
- Notifications pour les limites atteintes

## Migration

Pour activer le système, exécuter :

```bash
# Appliquer la migration
psql -f supabase/migrations/create_seller_subscription_plans.sql

# Tous les vendeurs existants sont automatiquement sur le plan "free"
```

## Monétisation

### Revenus estimés (exemple avec 100 vendeurs)

- 60 vendeurs Free : 0 XOF
- 25 vendeurs Starter (5k) : 125,000 XOF/mois
- 12 vendeurs Pro (15k) : 180,000 XOF/mois
- 3 vendeurs Premium (30k) : 90,000 XOF/mois

**Total : 395,000 XOF/mois (~650 USD)**

Plus les commissions sur toutes les ventes (7% à 20% selon le plan).

## Avantages pour la Plateforme

1. **Revenu récurrent prévisible** : Abonnements mensuels
2. **Commissions réduites = volume accru** : Les vendeurs premium vendent plus
3. **Qualité améliorée** : Les vendeurs qui investissent sont plus sérieux
4. **Croissance organique** : Les vendeurs réussis upgraderont naturellement
5. **Équilibre marketplace** : Pas de monopole, tous ont leur chance

## Support et Questions

Pour toute question sur le système d'abonnement :
- Support Starter : Réponse sous 24h
- Support Pro : Réponse sous 6h
- Support Premium : Concierge dédié avec réponse instantanée

---

**Date de création** : Octobre 2025
**Version** : 1.0.0
**Statut** : Production Ready
