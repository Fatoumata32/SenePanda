# 🎁 Guide du Système de Points Bonus SenePanda

## Comment acquérir des points bonus ?

### 1. 🌅 Connexion Quotidienne (Automatique)
**Points gagnés : 10-50 points selon la série**

Le système enregistre automatiquement votre connexion chaque jour grâce au hook `useDailyLogin`.

**Comment ça marche :**
- Connectez-vous à l'application chaque jour
- **+10 points** pour chaque jour de connexion
- **Bonus de série** : Plus vous vous connectez de jours consécutifs, plus vous gagnez de points
  - 7 jours consécutifs : +50 points bonus
  - 30 jours consécutifs : +200 points bonus
  - 90 jours consécutifs : +500 points bonus

**Implémentation :**
Le hook est déjà actif dans `hooks/useDailyLogin.ts` et appelle la fonction SQL `record_daily_login`.

---

### 2. 🛍️ Achats de Produits
**Points gagnés : 1% du montant de l'achat**

Chaque achat vous rapporte des points bonus.

**Exemple :**
- Achat de 10,000 FCFA → +100 points
- Achat de 50,000 FCFA → +500 points

**Implémentation :**
La fonction SQL `award_purchase_points` dans `BONUS_POINTS_SYSTEM.sql` gère automatiquement l'attribution des points après chaque commande validée.

---

### 3. ⭐ Avis sur les Produits
**Points gagnés : 5-20 points selon la qualité**

Laissez des avis constructifs sur les produits achetés.

**Barème :**
- Avis simple (texte court) : +5 points
- Avis détaillé (texte long) : +10 points
- Avis avec photo : +20 points

**Conditions :**
- Uniquement pour les produits achetés
- Un seul avis par produit
- L'avis doit avoir au moins 20 caractères

**Implémentation :**
Fonction SQL `award_review_points` appelée après la création d'un avis.

---

### 4. 📸 Partage de Produits
**Points gagnés : 5 points par partage**

Partagez vos produits préférés sur les réseaux sociaux.

**Comment :**
- Cliquez sur le bouton "Partager" d'un produit
- Partagez sur WhatsApp, Facebook, Instagram, etc.
- +5 points par partage unique (maximum 3 partages/jour)

---

### 5. 👥 Parrainage
**Points gagnés : 100 points par filleul**

Invitez vos amis à rejoindre SenePanda.

**Fonctionnement :**
- Obtenez votre code de parrainage unique dans votre profil
- Partagez votre code avec vos amis
- Quand ils s'inscrivent avec votre code :
  - Vous recevez +100 points
  - Ils reçoivent +50 points de bienvenue

**Implémentation :**
Système de parrainage dans la table `profiles` avec le champ `referral_code`.

---

### 6. 🎂 Anniversaire
**Points gagnés : 500 points**

Recevez un cadeau spécial pour votre anniversaire.

**Fonctionnement :**
- Renseignez votre date de naissance dans votre profil
- Le jour de votre anniversaire : +500 points automatiquement
- Bonus unique par an

---

### 7. 🏆 Défis et Missions
**Points gagnés : 50-1000 points selon le défi**

Complétez des défis mensuels pour gagner des points bonus.

**Exemples de défis :**
- Premier achat du mois : +50 points
- 5 achats dans le mois : +200 points
- Compléter son profil à 100% : +100 points
- Ajouter 3 produits aux favoris : +30 points

---

### 8. 💎 Abonnement Premium
**Points gagnés : Multiplicateur selon le plan**

Les membres premium gagnent plus de points sur toutes les actions.

**Multiplicateurs :**
- **Starter** : x1.2 (20% de points en plus)
- **Pro** : x1.5 (50% de points en plus)
- **Premium** : x2 (100% de points en plus)

**Exemple :**
- Plan gratuit : Achat 10,000 FCFA → +100 points
- Plan Premium : Achat 10,000 FCFA → +200 points

---

## 💰 Utilisation des Points Bonus

Les points bonus peuvent être utilisés pour :

### 1. Réductions sur les achats
- 100 points = 100 FCFA de réduction
- Utilisables lors du paiement
- Minimum 500 points requis

### 2. Récompenses Exclusives
- Livraison gratuite : 1,000 points
- Code promo -10% : 2,000 points
- Code promo -20% : 5,000 points
- Produit gratuit : 10,000 points

### 3. Accès VIP
- Accès anticipé aux nouvelles collections
- Ventes privées exclusives
- Support client prioritaire

---

## 📊 Vérifier vos Points

Consultez vos points dans :
- **Page Profil** : Solde total de points
- **Page Récompenses** (`/rewards`) : Historique détaillé
- **Tableau de bord** : Évolution des points

---

## 🎯 Conseils pour Maximiser vos Points

1. **Connectez-vous chaque jour** : +10 points minimum garantis
2. **Complétez votre profil** : Ajoutez votre date de naissance pour le bonus anniversaire
3. **Parrainez vos amis** : +100 points par filleul
4. **Laissez des avis avec photos** : +20 points par avis
5. **Passez au Premium** : Doublez vos gains de points
6. **Participez aux défis mensuels** : Jusqu'à 1,000 points bonus

---

## 🔧 Fonctions SQL Disponibles

```sql
-- Enregistrer connexion quotidienne
SELECT * FROM record_daily_login(user_id);

-- Attribuer points d'achat
SELECT * FROM award_purchase_points(user_id, order_id);

-- Attribuer points d'avis
SELECT * FROM award_review_points(user_id, review_id);

-- Vérifier solde de points
SELECT total_points FROM profiles WHERE id = user_id;

-- Historique des points
SELECT * FROM point_history WHERE user_id = user_id ORDER BY created_at DESC;
```

---

## 📝 Tables Concernées

- `profiles.total_points` : Solde total de points
- `profiles.loyalty_points` : Points de fidélité (alias)
- `daily_login_streak` : Suivi des connexions quotidiennes
- `point_history` : Historique des transactions de points

---

## ✅ Statut d'Implémentation

- [x] Connexion quotidienne automatique
- [x] Points d'achat
- [x] Points d'avis
- [x] Système de parrainage
- [x] Bonus anniversaire
- [x] Multiplicateurs premium
- [ ] Défis mensuels (à implémenter)
- [ ] Partage social (à implémenter)
