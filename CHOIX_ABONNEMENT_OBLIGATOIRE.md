# 📋 Système de choix d'abonnement obligatoire avant création de boutique

## 🎯 Vue d'ensemble

J'ai implémenté un système qui **oblige les nouveaux vendeurs à choisir un plan d'abonnement** avant de pouvoir créer leur boutique.

## ✅ Ce qui a été fait

### 1. **Nouvelle page : Choix d'abonnement** (`app/seller/choose-subscription.tsx`)

Une page dédiée qui affiche tous les plans disponibles avec :

#### Fonctionnalités
- ✅ **Affichage de tous les plans** (Free, Starter, Pro, Premium)
- ✅ **Design moderne et élégant** avec cartes visuelles
- ✅ **Badge "Recommandé"** sur le plan Starter
- ✅ **Sélection interactive** avec feedback visuel
- ✅ **Détails complets** de chaque plan :
  - Icône colorée distinctive
  - Prix mensuel (ou "Gratuit" pour Free)
  - Liste des fonctionnalités incluses
  - Indicateur de sélection
- ✅ **Comportement intelligent** :
  - Plan Free → Création automatique de l'abonnement + redirect vers création de boutique
  - Plans payants → Redirect vers la page de paiement

#### Design
- Gradient personnalisé par plan (gris, bleu, violet, or)
- Animations fluides
- Mise en avant visuelle du plan sélectionné
- Bordure colorée et ombre
- Badge "Recommandé" en float

### 2. **Modification du flux d'inscription** (`app/role-selection.tsx`)

Le flux a été modifié pour inclure la sélection d'abonnement :

#### Ancien flux ❌
```
Inscription → Choix de rôle → Création de boutique → Accueil
```

#### Nouveau flux ✅
```
Inscription → Choix de rôle (Vendeur) → Choix d'abonnement → Création de boutique → Accueil
```

#### Logique implémentée
```typescript
if (vendeur) {
  // Vérifier l'abonnement
  const subscription = await getActiveSubscription(userId);

  if (!subscription) {
    // ⚠️ PAS D'ABONNEMENT → Obligatoire de choisir
    router.replace('/seller/choose-subscription');
  } else if (!shop_name) {
    // ✅ Abonnement OK, pas de boutique → Créer la boutique
    router.replace('/seller/my-shop');
  } else {
    // ✅ Tout existe → Accueil
    router.replace('/(tabs)/home');
  }
}
```

### 3. **Gestion intelligente du plan Free**

Le plan Free est géré automatiquement :

```typescript
// Si plan Free sélectionné
if (selectedPlan.plan_type === 'free') {
  // Créer l'abonnement automatiquement (pas de paiement requis)
  await supabase.from('user_subscriptions').upsert({
    user_id: userId,
    plan_id: selectedPlan.id,
    plan_type: 'free',
    status: 'active',
    is_active: true,
    start_date: now(),
    end_date: null, // Illimité
  });

  // Rediriger directement vers création de boutique
  router.replace('/seller/my-shop');
}
```

### 4. **Intégration avec le système de paiement**

Pour les plans payants, l'utilisateur est redirigé vers la page de paiement existante :

```typescript
router.push({
  pathname: '/seller/subscription-plans',
  params: {
    selectedPlanId: selectedPlan.id,
    fromOnboarding: 'true' // Indique que ça vient du onboarding
  }
});
```

## 📁 Fichiers créés/modifiés

```
✅ app/seller/choose-subscription.tsx (créé)
   - Page de sélection de plan d'abonnement
   - Design moderne avec cartes interactives
   - Gestion automatique du plan Free

✅ app/role-selection.tsx (modifié)
   - Ajout de la vérification d'abonnement
   - Redirection vers choose-subscription si pas d'abonnement
   - Logique de flux améliorée
```

## 🚀 Flux utilisateur complet

### Nouveau vendeur (sans abonnement)

```
1. Inscription
   ↓
2. Choix de rôle: "Vendeur"
   ↓
3. 🆕 Page de choix d'abonnement
   ↓ (Si Free)
   ├→ Abonnement Free créé automatiquement
   ↓
4. Création de boutique (my-shop)
   ↓
5. Accueil
```

### Plans payants

```
3. Page de choix d'abonnement
   ↓ (Si Starter/Pro/Premium)
   ├→ Redirection vers page de paiement
   ↓
4. Paiement avec preuve
   ↓
5. Validation admin
   ↓
6. Abonnement activé
   ↓
7. Création de boutique
   ↓
8. Accueil
```

### Vendeur existant (avec abonnement)

```
1. Connexion
   ↓
2. Vérification: Abonnement existe ✅
   ↓
3. Vérification: Boutique existe ✅
   ↓
4. Redirection directe vers Accueil
```

## 🎨 Interface de la page choose-subscription

### Header
```
┌─────────────────────────────────────┐
│ ← Choisir un plan                   │
└─────────────────────────────────────┘
```

### Titre
```
Choisissez votre plan d'abonnement

Sélectionnez le plan qui correspond le mieux
à vos besoins. Vous pourrez toujours le
modifier plus tard.
```

### Cartes de plans
```
┌────────────────────────────────────┐
│    [Icône]  Free                   │
│             Démarrez gratuitement   │
│                                     │
│    Gratuit                          │
│                                     │
│    ✓ 10 produits                   │
│    ✓ 1 image par produit           │
│    ✗ Mise en avant                 │
│    ✗ Statistiques avancées         │
│                                     │
│    ✓ Sélectionné                   │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│    ⭐ Recommandé                    │
│    [Icône]  Starter                │
│             Pour bien démarrer      │
│                                     │
│    5 000 FCFA /mois                │
│                                     │
│    ✓ 50 produits                   │
│    ✓ 3 images par produit          │
│    ✓ Mise en avant                 │
│    ✓ Statistiques avancées         │
└────────────────────────────────────┘

[Pro et Premium avec même format...]
```

### Info
```
┌────────────────────────────────────┐
│  ℹ️  Essayez sans risque            │
│                                     │
│  Commencez avec le plan Free et    │
│  passez à un plan payant quand     │
│  vous êtes prêt. Aucun engagement. │
└────────────────────────────────────┘
```

### Footer
```
┌────────────────────────────────────┐
│                                     │
│  [Commencer gratuitement →]        │
│  (ou "Continuer →" si plan payant) │
│                                     │
└────────────────────────────────────┘
```

## 🧪 Tests à effectuer

### Test 1: Nouveau vendeur - Plan Free
1. Créer un nouveau compte
2. Choisir "Vendeur"
3. ✅ Devrait afficher la page de choix d'abonnement
4. Sélectionner "Free"
5. Cliquer "Commencer gratuitement"
6. ✅ Devrait rediriger vers création de boutique
7. ✅ Vérifier que l'abonnement Free est créé en BDD

### Test 2: Nouveau vendeur - Plan payant
1. Créer un nouveau compte
2. Choisir "Vendeur"
3. ✅ Page de choix d'abonnement
4. Sélectionner "Starter"
5. Cliquer "Continuer"
6. ✅ Devrait rediriger vers page de paiement
7. ✅ Vérifier que selectedPlanId est passé

### Test 3: Vendeur avec abonnement
1. Se connecter avec compte vendeur ayant un abonnement
2. ✅ Devrait passer la page de choix d'abonnement
3. ✅ Devrait aller directement à création de boutique (si pas de boutique)
4. ✅ Ou aller à l'accueil (si boutique existe)

### Test 4: Changement de sélection
1. Sur la page de choix
2. Sélectionner "Free" → bordure verte, checkmark
3. Sélectionner "Starter" → bordure change, checkmark déplacé
4. ✅ Bouton affiche le bon texte

### Test 5: Retour arrière
1. Sur la page de choix
2. Cliquer sur "←"
3. ✅ Devrait retourner à la page précédente

## 🔍 Vérifications SQL

### Vérifier qu'un abonnement a été créé
```sql
SELECT
  us.id,
  us.user_id,
  us.plan_type,
  us.status,
  us.is_active,
  us.start_date,
  p.first_name,
  p.last_name,
  p.phone
FROM user_subscriptions us
JOIN profiles p ON us.user_id = p.id
WHERE us.plan_type = 'free'
AND us.status = 'active'
ORDER BY us.created_at DESC
LIMIT 5;
```

### Vérifier le flux complet
```sql
-- Voir un utilisateur spécifique
SELECT
  p.id,
  p.first_name,
  p.is_seller,
  p.shop_name,
  us.plan_type,
  us.status,
  us.is_active
FROM profiles p
LEFT JOIN user_subscriptions us ON p.id = us.user_id
WHERE p.phone = '+221771234567';
```

## 💡 Avantages du système

### Pour le business
1. ✅ **Augmente les conversions** vers plans payants
2. ✅ **Onboarding structuré** et clair
3. ✅ **Collecte de données** sur les préférences
4. ✅ **Point de contact** pour upselling
5. ✅ **Formalise le choix** de plan

### Pour l'utilisateur
1. ✅ **Choix conscient** et informé
2. ✅ **Comparaison facile** des plans
3. ✅ **Pas de surprise** sur les limitations
4. ✅ **Free accessible** sans friction
5. ✅ **Visibilité claire** des fonctionnalités

### Pour les développeurs
1. ✅ **Flux unifié** et prévisible
2. ✅ **Moins de cas limites** à gérer
3. ✅ **Code modulaire** et maintenable
4. ✅ **Logs et analytics** facilités
5. ✅ **Tests simplifiés**

## 🎯 Points clés

### Obligatoire
- ✅ Tous les vendeurs DOIVENT choisir un plan
- ✅ Impossible de créer une boutique sans abonnement
- ✅ Le plan Free est accessible sans paiement

### Non-bloquant
- ✅ Le plan Free n'a aucune friction
- ✅ Les vendeurs existants ne sont pas impactés
- ✅ Possibilité de changer de plan plus tard

### Intelligent
- ✅ Détection automatique de l'état du vendeur
- ✅ Redirection appropriée selon le contexte
- ✅ Pas de boucles infinies

## 📞 Support

En cas de problème :

1. **Vérifier les tables Supabase**
   - `user_subscriptions` : Abonnements actifs
   - `subscription_plans` : Plans disponibles
   - `profiles` : is_seller et shop_name

2. **Vérifier les logs**
   - Console navigateur (Expo Dev Tools)
   - Logs de navigation
   - Erreurs SQL

3. **Tester le flux complet**
   - Nouveau compte → Choix vendeur → Choix plan → Boutique
   - Avec chaque type de plan

## ✅ Checklist de validation

- [ ] Page choose-subscription créée et stylée
- [ ] Tous les plans s'affichent correctement
- [ ] Sélection de plan fonctionne
- [ ] Plan Free crée l'abonnement automatiquement
- [ ] Plans payants redirigent vers paiement
- [ ] role-selection vérifie l'abonnement
- [ ] Vendeurs sans abonnement sont redirigés
- [ ] Vendeurs avec abonnement peuvent créer boutique
- [ ] Flux complet testé de bout en bout
- [ ] Documentation à jour

---

**Date:** 2025-12-02
**Version:** 1.0
**Statut:** ✅ Implémenté et prêt à tester

**Le système est maintenant en place ! 🎉**
