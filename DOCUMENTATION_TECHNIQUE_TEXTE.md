# DOCUMENTATION TECHNIQUE - SENEPANDA V2.0

Pour: Développeurs rejoignant le projet
Version: 2.0.0
Date: Décembre 2024 - Janvier 2025
Plateforme: React Native + Expo + Supabase

---

## TABLE DES MATIERES

1. Vue d'ensemble du projet
2. Stack technique
3. Architecture générale
4. Structure du projet
5. Fonctionnalités principales
6. Base de données Supabase
7. Système d'authentification
8. Système d'abonnement
9. Live Shopping
10. Système de paiement
11. Configuration et environnement
12. Guide de démarrage
13. Déploiement
14. Conventions de code
15. Dépannage et support

---

## 1. VUE D'ENSEMBLE DU PROJET

### Qu'est-ce que SenePanda

SenePanda est une marketplace e-commerce multi-vendeurs destinée au marché sénégalais. L'application propose des fonctionnalités avancées de commerce en direct via streaming vidéo, appelées Live Shopping.

### Principales caractéristiques

L'application offre les fonctionnalités suivantes:

- Marketplace multi-vendeurs permettant aux acheteurs et vendeurs d'interagir sur une seule plateforme
- Live Shopping pour la vente en direct via streaming vidéo haute définition
- Système d'abonnement avec quatre plans: Free, Starter, Pro et Premium
- Système de points gamifié avec récompenses pour fidéliser les utilisateurs
- Paiement via Mobile Money incluant Orange Money, Wave et Free Money
- Géolocalisation pour trouver les vendeurs à proximité
- Système multi-rôle permettant à un utilisateur d'être acheteur ET vendeur simultanément

### Objectifs business

Les objectifs principaux de la plateforme sont:

- Simplifier le commerce en ligne au Sénégal en réduisant les barrières technologiques
- Permettre aux vendeurs de présenter leurs produits en direct comme dans un marché physique
- Réduire les frictions dans le processus d'achat grâce aux paiements Mobile Money
- Fidéliser les utilisateurs via un système de points et récompenses attractif
- Créer une communauté d'acheteurs et vendeurs engagés

---

## 2. STACK TECHNIQUE

### Frontend

Le frontend de l'application utilise les technologies suivantes:

React Native version 0.81.5 comme framework mobile principal permettant de développer pour iOS et Android avec une seule base de code.

Expo version 54.0.30 comme toolchain et système de build facilitant le développement et le déploiement.

Expo Router version 6.0.21 pour la navigation basée sur le système de fichiers, similaire à Next.js.

TypeScript version 5.9.2 pour le typage statique et une meilleure maintenabilité du code.

React version 19.1.0 comme bibliothèque UI de base.

### Backend

Le backend repose entièrement sur Supabase qui fournit:

Supabase Client version 2.86.0 pour la communication avec le backend.

PostgreSQL version 15 ou supérieure comme base de données relationnelle.

Edge Functions pour les opérations serverless côté serveur.

Realtime pour la synchronisation en temps réel des données.

Authentication intégrée pour la gestion des utilisateurs.

Storage pour le stockage des images et médias.

### Services tiers

L'application intègre plusieurs services externes:

Agora SDK version 4.5.3 pour le streaming vidéo HD en direct et le chat temps réel via RTM.

Meilisearch version 0.54.0 pour la recherche rapide et pertinente de produits.

Cloudflare R2 pour le stockage optimisé et la distribution des images et médias.

Wave API pour l'intégration des paiements mobile money au Sénégal.

### Bibliothèques principales

Les bibliothèques essentielles incluent:

react-native-agora pour l'intégration du streaming vidéo.

agora-react-native-rtm pour la messagerie temps réel pendant les lives.

expo-camera pour l'accès à la caméra lors des sessions live.

expo-location pour la géolocalisation des vendeurs.

expo-notifications pour les notifications push.

expo-local-authentication pour l'authentification biométrique.

---

## 3. ARCHITECTURE GENERALE

### Schéma d'architecture

L'architecture de SenePanda suit un modèle client-serveur moderne:

L'application mobile React Native sert d'interface utilisateur pour les acheteurs et vendeurs. Elle communique avec Expo Router qui gère toute la navigation de l'application.

Expo Router fait le lien entre l'interface utilisateur et les services backend:

Premier service: Supabase qui gère l'authentification, la base de données PostgreSQL, le stockage des fichiers, les subscriptions en temps réel et les Edge Functions serverless.

Deuxième service: Agora SDK qui gère le streaming vidéo HD, le chat temps réel RTM et les 166 heures de streaming mensuelles pour les abonnés Premium.

Ces services principaux communiquent ensuite avec des services externes:

Wave pour le traitement des paiements Mobile Money.

Meilisearch pour la recherche indexée de produits.

Cloudflare R2 pour le stockage et la distribution de médias.

### Pattern architectural

L'application suit une architecture en couches avec séparation claire entre:

Couche UI: Les composants visuels dans le dossier components.

Couche Logique: Les hooks personnalisés dans le dossier hooks.

Couche Data: Les appels API et interactions avec Supabase dans le dossier lib.

La gestion d'état global utilise Context API pour les données partagées comme l'authentification, le panier et les notifications.

Les custom hooks encapsulent la logique réutilisable et les appels API.

L'architecture suit le principe Atomic Design avec des composants réutilisables organisés du plus simple au plus complexe.

### Flux de données

Le flux de données typique dans l'application suit ce parcours:

L'utilisateur effectue une action dans un composant UI. Le composant appelle un custom hook qui encapsule la logique métier. Le hook utilise le client Supabase pour communiquer avec PostgreSQL. La réponse met à jour le Context global si nécessaire. Le changement de Context déclenche un re-render de l'UI avec les nouvelles données.

---

## 4. STRUCTURE DU PROJET

### Dossier app

Le dossier app contient toutes les pages de l'application organisées selon Expo Router.

Sous-dossier tabs: Contient la navigation principale avec home.tsx pour la page d'accueil, explore.tsx pour l'exploration des produits, profile.tsx pour le profil utilisateur et lives.tsx pour les sessions live actives.

Sous-dossier seller: Espace dédié aux vendeurs avec my-shop.tsx pour gérer la boutique, add-product.tsx pour ajouter des produits, products.tsx pour lister les produits, subscription-plans.tsx pour les abonnements, start-live.tsx pour démarrer un live et my-lives.tsx pour gérer les sessions.

Sous-dossier auth: Gestion de l'authentification avec phone-auth.tsx pour l'authentification par téléphone.

Fichiers racine: checkout.tsx pour le paiement, cart.tsx pour le panier et simple-auth.tsx pour l'authentification simplifiée.

### Dossier components

Le dossier components regroupe tous les composants réutilisables:

ActiveLiveSessions.tsx affiche les sessions live en cours.

ProductCard.tsx affiche une carte produit avec image, prix et informations.

LocationBanner.tsx affiche la bannière de localisation.

PointsDashboard.tsx affiche le tableau de bord des points.

Sous-dossier profile: Composants liés au profil comme SettingsModal.tsx et StatsCard.tsx.

Sous-dossier seller: Composants vendeurs comme ProductPerformance.tsx pour les statistiques.

Sous-dossier subscription: Composants d'abonnement comme PaymentMethodSelector.tsx.

### Dossier hooks

Le dossier hooks contient les hooks personnalisés:

useLiveShopping.ts pour gérer les sessions live.

useSubscriptionAccess.ts pour vérifier l'accès aux fonctionnalités premium.

useSubscriptionLimits.ts pour gérer les limites par plan d'abonnement.

useDailyLogin.ts pour gérer la connexion quotidienne et les points.

useSmartLocation.ts pour la géolocalisation intelligente.

useCart.ts pour la gestion du panier d'achat.

useBonusSystem.ts pour le système de bonus et points.

useProfileSubscriptionSync.ts pour synchroniser l'abonnement en temps réel.

### Dossier contexts

Le dossier contexts contient les Context Providers:

CartContext.tsx pour l'état global du panier.

OnboardingContext.tsx pour l'état de l'onboarding.

NotificationContext.tsx pour les notifications.

NavigationContext.tsx pour l'état de navigation.

### Dossier lib

Le dossier lib contient les utilitaires et configurations:

supabase.ts initialise le client Supabase.

agoraConfig.ts configure Agora pour le streaming.

payment.ts service de gestion des paiements.

wavePayment.ts intégration spécifique Wave.

smartGeolocation.ts gestion de la géolocalisation.

reputationSystem.ts système de réputation vendeurs.

### Dossier utils

Le dossier utils contient les fonctions utilitaires:

subscriptionAccess.ts avec la logique métier des abonnements.

### Dossier constants

Le dossier constants contient les constantes de l'application:

Colors.ts définit la palette de couleurs de l'application.

### Dossier types

Le dossier types contient les définitions TypeScript:

database.types.ts avec les types auto-générés depuis Supabase.

index.ts avec les types personnalisés de l'application.

### Dossier supabase

Le dossier supabase contient tout le backend:

Sous-dossier migrations: Scripts SQL pour créer et modifier la base de données.

Sous-dossier functions: Edge Functions serverless comme wave-webhook pour les callbacks de paiement.

### Dossier assets

Le dossier assets contient les ressources statiques:

Sous-dossier images: Images et icônes de l'application.

Sous-dossier fonts: Polices personnalisées.

### Fichiers de configuration

package.json définit les dépendances du projet.

app.config.js configure Expo et les builds.

tsconfig.json configure TypeScript.

.env contient les variables d'environnement sensibles.

---

## 5. FONCTIONNALITES PRINCIPALES

### Fonctionnalités pour les acheteurs

Page d'accueil: La page home.tsx affiche une section hero avec des boutons Acheter et Vendre, les catégories populaires, les flash deals avec compte à rebours, les sessions live actives, les produits recommandés et une bannière de localisation. Elle utilise les hooks useLiveShopping et useSmartLocation.

Page exploration: La page explore.tsx permet de naviguer par catégories, d'appliquer des filtres sur prix, note et distance, de trier par récents, populaires ou prix, d'effectuer une recherche avec Meilisearch et même d'utiliser la recherche vocale via Expo Speech Recognition.

Panier: La page cart.tsx permet d'ajouter et supprimer des articles, de modifier les quantités, de calculer le total avec frais et de valider avant le checkout. Elle utilise le CartContext pour la gestion d'état.

Système de points: La page my-benefits.tsx affiche le solde de points actuel, le niveau atteint parmi Bronze, Argent, Or ou Platine, l'historique des transactions de points et les récompenses disponibles à échanger.

Les utilisateurs gagnent des points de plusieurs façons: 10 points par connexion quotidienne, 1 pourcent du montant pour chaque achat, 20 points pour un avis produit avec photo et 100 points pour chaque parrainage.

### Fonctionnalités pour les vendeurs

Ma Boutique: La page my-shop.tsx permet d'éditer le profil de la boutique incluant nom, description et téléphone. Les vendeurs peuvent uploader un logo, personnaliser le thème en choisissant parmi 6 gradients prédéfinis ou créer un gradient personnalisé avec couleur primaire, secondaire et angle. La page affiche les 4 derniers produits et permet de basculer entre mode édition et visualisation.

Le thème sélectionné est sauvegardé dans Supabase dans les champs shop_gradient_theme et shop_custom_gradient de la table profiles.

Gestion des produits: La page products.tsx offre un CRUD complet pour lister tous les produits du vendeur, ajouter un nouveau produit, modifier un produit existant, supprimer un produit et activer ou désactiver un produit.

Le système vérifie les limites d'abonnement via useSubscriptionLimits avant d'autoriser l'ajout de produits. Les limites sont: 0 produits pour Free avec boutique cachée, 50 produits maximum pour Starter, 200 produits maximum pour Pro et illimité pour Premium.

Live Shopping: La page start-live.tsx réservée aux abonnés Premium permet de créer une session live, de sélectionner les produits à mettre en avant, de définir le titre et la description, de streamer en vidéo HD via Agora et de chatter en temps réel via Agora RTM. La limite est de 166 heures par mois.

La configuration Agora utilise l'App ID depuis les variables d'environnement, un nom de canal unique par session et un token de sécurité généré.

### Live Shopping pour les spectateurs

Visualisation: La page live-viewer dans le dossier tabs permet aux acheteurs de regarder le stream en direct, voir les produits présentés, ajouter au panier pendant le live, envoyer des messages dans le chat et voir le nombre de spectateurs en temps réel.

Le hook useLiveShopping récupère les sessions actives depuis Supabase avec les informations du vendeur et écoute les nouvelles sessions en temps réel.

Chaque session contient un identifiant unique, l'ID du vendeur, le titre et la description, le statut parmi scheduled, live ou ended, le nombre de spectateurs, les IDs des produits mis en avant, le canal Agora, les dates de début et fin.

---

## 6. BASE DE DONNEES SUPABASE

### Table profiles

La table profiles stocke les informations utilisateur étendues:

Champs d'identification: id référençant auth.users, email unique, phone unique, full_name, avatar_url.

Champs de rôle: role avec valeur par défaut buyer pouvant être buyer, seller ou both. preferred_role indique le rôle préféré de l'utilisateur.

Champs boutique: shop_name, shop_description, shop_logo_url, shop_phone, shop_address pour les informations de la boutique. shop_gradient_theme avec valeur par défaut sunset et shop_custom_gradient au format JSONB pour la personnalisation visuelle.

Champs abonnement: subscription_plan avec valeur par défaut free pouvant être free, starter, pro ou premium. subscription_status avec valeur par défaut active et subscription_expires_at pour la date d'expiration.

Champs points et réputation: points pour le solde actuel avec valeur par défaut 0, total_points pour le cumul historique et reputation_score avec valeur par défaut 5.00.

Champs localisation: latitude et longitude au format décimal, city, country avec valeur par défaut Sénégal.

Champs de suivi: created_at et updated_at avec timestamps automatiques.

Row Level Security: Les profils vendeurs actifs sont visibles publiquement. La politique "Public can view active seller profiles" permet la lecture si le rôle est seller ou both ET que subscription_status est active. Seul le propriétaire peut modifier son profil via la politique "Users can update own profile".

### Table products

La table products stocke le catalogue de produits:

Champs de base: id auto-généré, seller_id référençant profiles obligatoire, title obligatoire, description optionnelle, price obligatoire au format décimal, compare_at_price pour le prix barré.

Champs catalogue: category obligatoire, images au format tableau de textes pour les URLs, video_url pour une vidéo de présentation, stock avec valeur par défaut 0, status avec valeur par défaut active pouvant être active, draft ou archived.

Champs performance: views avec valeur par défaut 0, favorites_count avec valeur par défaut 0.

Champs de suivi: created_at et updated_at avec timestamps automatiques.

Vue SQL: La vue active_seller_products filtre automatiquement les produits pour n'afficher que ceux dont le statut est active ET dont le vendeur a un subscription_status active ET dont subscription_expires_at est NULL ou dans le futur.

### Table live_sessions

La table live_sessions stocke les sessions de live shopping:

Champs de base: id auto-généré, seller_id référençant profiles obligatoire, title obligatoire, description optionnelle.

Champs statut: status avec valeur par défaut scheduled pouvant être scheduled, live ou ended.

Champs Agora: agora_channel unique pour le nom du canal, agora_token pour le token de sécurité.

Champs performance: viewer_count avec valeur par défaut 0, featured_products au format tableau d'UUID avec valeur par défaut tableau vide.

Champs temporels: scheduled_for pour la planification, started_at pour le début effectif, ended_at pour la fin, duration_minutes calculé automatiquement.

Champs de suivi: created_at avec timestamp automatique.

Trigger: La fonction calculate_live_duration calcule automatiquement la durée en minutes quand le statut passe à ended et que started_at existe. Elle extrait les secondes entre ended_at et started_at puis divise par 60.

### Table orders

La table orders stocke les commandes:

Champs de base: id auto-généré, buyer_id référençant profiles, seller_id référençant profiles.

Champs montants: items au format JSONB contenant les produits avec quantités et prix, subtotal obligatoire, shipping_cost avec valeur par défaut 0, total obligatoire.

Champs paiement: status avec valeur par défaut pending, payment_method, payment_status avec valeur par défaut pending.

Champs livraison: shipping_address au format JSONB.

Champs de suivi: created_at et updated_at avec timestamps automatiques.

### Table daily_login_streak

La table daily_login_streak suit les connexions quotidiennes:

Champs de base: id auto-généré, user_id référençant profiles unique.

Champs streak: current_streak avec valeur par défaut 0, longest_streak avec valeur par défaut 0, last_login_date au format date, total_logins avec valeur par défaut 0.

Champs de suivi: created_at avec timestamp automatique.

### Fonction is_seller_subscription_active

Cette fonction vérifie si l'abonnement d'un vendeur est actif. Elle prend en paramètre seller_id de type UUID et retourne un booléen.

Le fonctionnement: Récupérer subscription_status et subscription_expires_at depuis profiles. Retourner vrai si subscription_status est active ET que subscription_expires_at est NULL ou dans le futur.

### Fonction can_seller_add_product

Cette fonction vérifie si un vendeur peut ajouter un produit. Elle prend en paramètre seller_id de type UUID et retourne un booléen.

Le fonctionnement: Récupérer le subscription_plan du vendeur. Définir la limite selon le plan: 0 pour free, 50 pour starter, 200 pour pro, 999999 pour premium illimité. Compter les produits actifs du vendeur. Retourner vrai si le compte actuel est inférieur à la limite.

### Fonction record_daily_login

Cette fonction enregistre une connexion quotidienne et attribue les points. Elle prend en paramètre p_user_id de type UUID et retourne les points attribués et le nouveau streak.

Le fonctionnement: Récupérer ou créer l'enregistrement de streak pour l'utilisateur. Si premier login, créer l'enregistrement avec streak de 1, ajouter 10 points et retourner.

Si login existant, vérifier si c'est un nouveau jour. Si oui, vérifier si le streak continue en comparant avec la veille. Si le streak continue, l'incrémenter et ajouter des bonus aux paliers: 50 points à 7 jours, 200 points à 30 jours, 500 points à 90 jours.

Si le streak est cassé, le réinitialiser à 1. Mettre à jour la table daily_login_streak, ajouter les points au profil et retourner les points et le streak.

Si déjà connecté aujourd'hui, retourner 0 points et le streak actuel.

### Ordre d'exécution des migrations

Les migrations doivent être appliquées dans cet ordre:

Migration 1: create_marketplace_schema.sql crée le schéma de base avec toutes les tables principales.

Migration 2: add_subscription_plan_to_profiles.sql ajoute le système d'abonnement complet.

Migration 3: add_geolocation_system.sql ajoute la géolocalisation et les recherches par proximité.

Migration 4: add_seller_reputation_system.sql ajoute le système de réputation des vendeurs.

Migration 5: add_live_notifications.sql ajoute les notifications pour les sessions live.

Migration 6: add_product_views.sql ajoute le tracking des vues de produits.

Application via Dashboard: Se connecter sur supabase.com, ouvrir le SQL Editor, créer une nouvelle query, copier-coller le contenu de la migration et exécuter.

---

## 7. SYSTEME D'AUTHENTIFICATION

### Système multi-rôle

SenePanda utilise un système flexible où un utilisateur peut avoir trois statuts:

Acheteur uniquement avec role défini à buyer.

Vendeur uniquement avec role défini à seller.

Les deux simultanément avec role défini à both.

Cette flexibilité permet à n'importe quel utilisateur de devenir vendeur sans créer un nouveau compte.

### Flux d'inscription

L'inscription se déroule en plusieurs étapes dans simple-auth.tsx:

Étape 1: Créer le compte dans Supabase Auth avec email et mot de passe via supabase.auth.signUp.

Étape 2: Créer le profil utilisateur dans la table profiles avec l'ID du user Auth, l'email, le téléphone, le role par défaut buyer, le subscription_plan free et 50 points de bonus de bienvenue.

Étape 3: Enregistrer la première connexion quotidienne via la fonction record_daily_login pour attribuer les premiers points de connexion.

### Flux de connexion

La connexion utilise supabase.auth.signInWithPassword avec email et mot de passe. Si la connexion réussit, la fonction record_daily_login est appelée pour enregistrer la connexion du jour et attribuer les points quotidiens si c'est un nouveau jour.

### Hook useAuth

Le hook useAuth personnalisé gère l'état d'authentification:

État initial: user à null et loading à true.

Au montage: Récupérer la session actuelle via supabase.auth.getSession, mettre à jour user et passer loading à false.

Écoute des changements: S'abonner à onAuthStateChange pour mettre à jour user à chaque changement de session.

Nettoyage: Se désabonner lors du démontage du composant.

Retour: L'objet contenant user et loading.

### Sélection de rôle

Le composant role-selection.tsx permet de choisir son rôle:

L'utilisateur sélectionne buyer ou seller. Le système met à jour les champs role et preferred_role dans profiles. Si seller est choisi, redirection vers seller/setup pour configurer la boutique. Si buyer est choisi, redirection vers la page d'accueil tabs/home.

### Basculement de rôle

Le composant RoleSwitchButton.tsx permet aux utilisateurs avec role both de basculer:

Le bouton détecte le rôle actuel depuis preferred_role. Au clic, il inverse le rôle entre buyer et seller. Il met à jour preferred_role dans Supabase. Il redirige vers l'interface appropriée: seller pour les vendeurs, tabs/home pour les acheteurs.

---

## 8. SYSTEME D'ABONNEMENT

### Plans disponibles

Plan Free gratuit: 0 produits, pas de Live Shopping, pas de commission car pas de vente, multiplicateur de points x1.

Plan Starter à 5000 FCFA par mois: 50 produits maximum, pas de Live Shopping, commission de 15 pourcent, multiplicateur de points x1.2.

Plan Pro à 15000 FCFA par mois: 200 produits maximum, pas de Live Shopping, commission de 10 pourcent, multiplicateur de points x1.5.

Plan Premium à 35000 FCFA par mois: produits illimités, Live Shopping avec 166 heures par mois, commission de 5 pourcent, multiplicateur de points x2.

### Hook useSubscriptionAccess

Ce hook vérifie l'accès aux fonctionnalités premium:

État initial: isActive à false, plan à free, loading à true.

Au montage: Récupérer le user authentifié. Charger le profil avec subscription_plan, subscription_status et subscription_expires_at. Calculer si l'abonnement est actif: subscription_status doit être active ET subscription_expires_at doit être NULL ou dans le futur.

Synchronisation temps réel: S'abonner aux changements de la table profiles pour le user actuel. Rafraîchir automatiquement quand le profil change.

Retour: L'objet contenant isActive, plan et loading.

### Hook useSubscriptionLimits

Ce hook gère les limites par plan:

Récupérer le plan actuel via useSubscriptionAccess. Définir les limites pour chaque plan dans un objet de configuration. Calculer canAddProduct en comparant le nombre actuel de produits à la limite. Calculer canStartLive en vérifiant si le plan est premium.

Retour: L'objet contenant canAddProduct, canStartLive, productLimit pour la limite de produits, liveHoursLimit pour les heures de live et currentCount pour le nombre actuel.

### Hook useProfileSubscriptionSync

Ce hook synchronise l'abonnement en temps réel:

État initial: syncStatus à synced.

Au montage: Récupérer le user authentifié. S'abonner aux changements de profiles filtré sur l'ID du user.

Quand un changement arrive: Passer syncStatus à syncing. Vérifier si subscription_status est passé à active alors qu'il ne l'était pas avant. Si oui, afficher une alerte "Abonnement activé" avec le nom du plan. Repasser syncStatus à synced.

Nettoyage: Se désabonner lors du démontage.

Retour: L'objet contenant syncStatus.

---

## 9. LIVE SHOPPING

### Configuration Agora

Le fichier agoraConfig.ts configure le SDK Agora:

La constante agoraConfig exporte un objet avec appId récupéré depuis les variables d'environnement.

La méthode generateToken prend en paramètres channelName et uid. Elle effectue une requête POST vers l'endpoint agora/token de l'API avec le nom du canal et l'UID. Elle retourne le token de sécurité généré côté serveur.

### Démarrage d'une session live

La page start-live.tsx permet aux vendeurs Premium de démarrer un live:

Étape 1 Vérification: Récupérer canStartLive depuis useSubscriptionLimits. Si false, afficher une alerte indiquant que le plan Premium est requis et arrêter.

Étape 2 Création session: Générer un nom de canal unique avec le timestamp. Insérer dans live_sessions avec seller_id, title, description, agora_channel, featured_products contenant les IDs des produits sélectionnés, status à scheduled et scheduled_for à maintenant.

Étape 3 Token Agora: Générer le token de sécurité via agoraConfig.generateToken en passant le nom du canal et l'ID du user.

Étape 4 Initialisation moteur: Créer une instance RtcEngine avec l'App ID et le profil LiveBroadcasting. Définir le rôle à Broadcaster pour émettre. Activer la vidéo et démarrer l'aperçu.

Étape 5 Rejoindre canal: Appeler joinChannel avec le token, le nom du canal et l'UID 0.

Étape 6 Mise à jour statut: Mettre à jour la session dans Supabase avec status à live, started_at à maintenant et agora_token sauvegardé.

### Visualisation d'une session

La page live-viewer permet aux acheteurs de regarder:

Étape 1 Récupération session: Charger la session depuis live_sessions avec les informations du vendeur depuis profiles. Vérifier que le statut est live, sinon afficher une alerte.

Étape 2 Génération token: Générer un token viewer via agoraConfig.generateToken avec le canal de la session et un viewerId unique.

Étape 3 Initialisation moteur: Créer une instance RtcEngine avec le profil LiveBroadcasting. Définir le rôle à Audience pour recevoir uniquement.

Étape 4 Rejoindre canal: Appeler joinChannel avec le token, le nom du canal et le viewerId.

Étape 5 Incrément compteur: Appeler la fonction SQL increment_viewer_count pour augmenter le nombre de spectateurs de la session.

### Hook useLiveShopping

Ce hook gère les sessions live actives:

État initial: activeSessions à tableau vide, loading à true.

Fonction fetchActiveSessions: Charger depuis live_sessions les sessions avec status égal à live. Joindre les informations du vendeur depuis profiles incluant id, shop_name, shop_logo_url et avatar_url. Trier par started_at descendant. Mettre à jour activeSessions et passer loading à false.

Au montage: Appeler fetchActiveSessions. S'abonner aux changements de live_sessions filtré sur status égal à live. À chaque changement, rafraîchir en appelant fetchActiveSessions.

Nettoyage: Se désabonner lors du démontage.

Retour: L'objet contenant activeSessions et loading.

---

## 10. SYSTEME DE PAIEMENT

### Méthodes supportées

Le fichier payment.ts définit les méthodes de paiement:

Orange Money: ID orange_money, montant minimum 0, maximum 2000000 FCFA, pas de frais, traitement instantané.

Wave: ID wave, montant minimum 0, maximum 5000000 FCFA, pas de frais, traitement instantané.

Free Money: ID free_money, montant minimum 0, maximum 1000000 FCFA, pas de frais, traitement instantané.

Carte Bancaire: ID card, montant minimum 500, maximum 10000000 FCFA, frais de 2.5 pourcent, traitement instantané.

### Validation numéro téléphone

La fonction validatePhoneNumber vérifie le format selon le provider:

Orange Money accepte les numéros commençant par 77 ou 78 suivis de 7 chiffres.

Wave accepte les numéros commençant par 70, 76, 77 ou 78 suivis de 7 chiffres.

Free Money accepte uniquement les numéros commençant par 76 suivis de 7 chiffres.

La fonction supprime les espaces du numéro avant de tester le pattern regex correspondant.

### Intégration Wave

La classe WavePayment dans wavePayment.ts gère l'API Wave:

Le constructeur prend l'API key en paramètre et définit l'URL de base à https://api.wave.com/v1.

La méthode initiatePayment prend amount, currency, phone et description. Elle fait une requête POST vers checkout/sessions avec l'Authorization Bearer. Le body contient amount converti en centimes, currency, client_reference unique, redirect_url et error_url vers l'app, payment_method avec type mobile_money et phone, metadata avec description. Elle retourne les données de la session incluant wave_launch_url.

La méthode checkPaymentStatus prend checkoutId. Elle fait une requête GET vers checkout/sessions/{checkoutId} avec l'Authorization. Elle retourne payment_status pouvant être pending, success ou failed.

### Flux de paiement

La page checkout.tsx gère le processus complet:

Étape 1 Création commande: Insérer dans orders avec buyer_id, items contenant le panier, subtotal, total incluant les frais de livraison, payment_method sélectionné et payment_status à pending.

Étape 2 Initiation paiement: Si la méthode est Wave, créer une instance WavePayment avec l'API key. Appeler initiatePayment avec le total de la commande, la devise XOF, le téléphone saisi et la description avec l'ID de commande. Ouvrir le navigateur sur wave_launch_url pour que l'utilisateur confirme.

Étape 3 Attente callback: Le webhook Wave côté Supabase reçoit la confirmation et met à jour payment_status de la commande.

Étape 4 Attribution points: Calculer les points gagnés à 1 pourcent du total. Mettre à jour points et total_points dans profiles en utilisant une requête SQL d'incrémentation.

Étape 5 Finalisation: Vider le panier via clearCart. Rediriger vers la page order-success.

Gestion erreur: En cas d'échec, afficher une alerte avec le message d'erreur.

---

## 11. CONFIGURATION ET ENVIRONNEMENT

### Variables d'environnement

Le fichier .env contient toutes les variables sensibles:

Section Supabase: EXPO_PUBLIC_SUPABASE_URL avec l'URL du projet, EXPO_PUBLIC_SUPABASE_ANON_KEY avec la clé publique, SUPABASE_SERVICE_ROLE_KEY réservée au serveur uniquement.

Section Agora pour Live Shopping: EXPO_PUBLIC_AGORA_APP_ID avec l'identifiant de l'application, AGORA_APP_CERTIFICATE réservé au serveur pour générer les tokens.

Section Cloudflare R2 pour le stockage: EXPO_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL avec l'URL publique du bucket, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY et CLOUDFLARE_R2_BUCKET_NAME tous réservés au serveur.

Section Meilisearch pour la recherche: EXPO_PUBLIC_MEILISEARCH_HOST avec l'URL de l'instance, EXPO_PUBLIC_MEILISEARCH_API_KEY pour les recherches publiques, MEILISEARCH_ADMIN_KEY réservé au serveur pour l'indexation.

Section Wave pour les paiements: EXPO_PUBLIC_WAVE_API_KEY pour l'API publique, WAVE_SECRET_KEY réservé au serveur pour les webhooks.

Les variables préfixées par EXPO_PUBLIC sont accessibles côté client. Les autres ne doivent être utilisées que dans les Edge Functions côté serveur.

### Configuration Expo

Le fichier app.config.js configure l'application:

Métadonnées: name à SenePanda, slug à senepanda, version à 2.0.0, orientation à portrait.

Apparence: icon vers le fichier d'icône, scheme à senepanda pour les deep links, userInterfaceStyle à automatic pour supporter mode clair et sombre.

Splash screen: image vers le logo, resizeMode à contain, backgroundColor à #FF6B6B.

Configuration iOS: supportsTablet à true, bundleIdentifier à com.senepanda.app.

Configuration Android: adaptiveIcon avec foregroundImage et backgroundColor, package à com.senepanda.app, permissions incluant CAMERA, RECORD_AUDIO, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, READ_EXTERNAL_STORAGE et WRITE_EXTERNAL_STORAGE.

Plugins: expo-router pour la navigation, expo-camera pour l'accès caméra, expo-location pour la géolocalisation, expo-notifications pour les notifications push, expo-build-properties avec minSdkVersion 24, compileSdkVersion 34 et targetSdkVersion 34 pour Android.

Configuration EAS: projectId unique pour les builds cloud.

---

## 12. GUIDE DE DEMARRAGE

### Prérequis nécessaires

Installer Node.js version 18 ou supérieure. Installer npm ou yarn comme gestionnaire de paquets. Avoir Git installé pour cloner le projet. Créer un compte Supabase sur supabase.com. Créer un compte Expo pour les builds sur expo.dev. Installer Android Studio pour l'émulateur Android ou Xcode pour le simulateur iOS sur macOS.

### Installation du projet

Étape 1 Cloner: Exécuter git clone suivi de l'URL du repository puis cd project pour entrer dans le dossier.

Étape 2 Dépendances: Exécuter npm install pour installer toutes les dépendances définies dans package.json.

Étape 3 Configuration: Copier le fichier .env.example vers .env puis éditer .env pour renseigner toutes les clés API et URLs.

Étape 4 Lancement: Exécuter npx expo start pour démarrer le serveur de développement.

Étape 5 Test: Appuyer sur a pour lancer sur Android, sur i pour lancer sur iOS ou scanner le QR code avec l'app Expo Go sur un téléphone physique.

### Configuration Supabase

Étape 1 Créer projet: Se connecter sur supabase.com et créer un nouveau projet en choisissant un nom et une région.

Étape 2 Migrations: Aller dans SQL Editor et exécuter les migrations dans l'ordre suivant. D'abord create_marketplace_schema.sql pour créer toutes les tables de base. Ensuite add_subscription_plan_to_profiles.sql pour ajouter le système d'abonnement. Puis add_geolocation_system.sql pour la localisation. Puis add_live_notifications.sql pour les notifications live. Enfin add_product_views.sql pour le tracking des vues.

Étape 3 Storage: Aller dans Storage, créer un nouveau bucket nommé product-images et le rendre public pour permettre l'affichage des images.

Étape 4 Realtime: Aller dans Database puis Replication et activer la réplication pour les tables profiles, products et live_sessions afin de permettre la synchronisation temps réel.

### Lancement en développement

Pour démarrer avec le cache nettoyé: npx expo start --clear

Pour utiliser le mode tunnel permettant de tester sur un device physique même en 4G: npx expo start --tunnel

Pour lancer directement sur l'émulateur Android: npx expo run:android

Pour lancer sur le simulateur iOS sur macOS uniquement: npx expo run:ios

### Création d'un compte de test

Ouvrir le SQL Editor dans Supabase Dashboard et exécuter ces commandes:

Créer un utilisateur dans auth.users avec un email, un mot de passe hashé et email_confirmed_at à maintenant. Noter l'ID retourné.

Créer le profil dans profiles avec l'ID du user, l'email, un numéro de téléphone, un nom complet, le role à both pour tester toutes les fonctionnalités, subscription_plan à premium pour accéder au Live Shopping, subscription_status à active et 1000 points de départ.

Se connecter dans l'app avec cet email et mot de passe pour tester.

---

## 13. DEPLOIEMENT

### Build Android APK

Étape 1 Installation EAS: Exécuter npm install -g eas-cli pour installer l'outil de build en ligne de commande.

Étape 2 Authentification: Exécuter eas login et renseigner les identifiants Expo.

Étape 3 Configuration: Exécuter eas build:configure pour créer le fichier eas.json avec les profils de build.

Étape 4 Build preview: Exécuter eas build --platform android --profile preview pour créer un APK de test.

Étape 5 Build production: Exécuter eas build --platform android --profile production pour créer un APK signé pour le Play Store.

Étape 6 Téléchargement: Le lien de téléchargement de l'APK est fourni dans la console après la fin du build.

### Build iOS

Pour TestFlight: Exécuter eas build --platform ios --profile preview pour créer un build de test.

Pour Production: Exécuter eas build --platform ios --profile production. Cela nécessite un compte Apple Developer actif et les certificats configurés.

### Déploiement Edge Functions

Étape 1 Installation CLI: Exécuter npm install -g supabase pour installer l'outil Supabase en ligne de commande.

Étape 2 Authentification: Exécuter supabase login pour se connecter au compte Supabase.

Étape 3 Link projet: Exécuter supabase link --project-ref suivi de la référence du projet pour lier le dossier local au projet cloud.

Étape 4 Déploiement: Exécuter supabase functions deploy suivi du nom de la fonction comme wave-webhook pour déployer une fonction spécifique.

Étape 5 Secrets: Exécuter supabase secrets set suivi du nom et de la valeur pour définir les variables d'environnement secrètes comme WAVE_SECRET_KEY.

### Configuration production

Créer un fichier .env.production avec toutes les variables pour l'environnement de production en utilisant les URLs et clés de production plutôt que de développement.

Dans le fichier eas.json, définir le profil production avec les variables d'environnement spécifiques. Pour Android, définir buildType à apk et gradleCommand à :app:assembleRelease pour créer un APK signé.

---

## 14. CONVENTIONS DE CODE

### TypeScript

Utiliser des interfaces pour les types de données structurées comme les modèles de base de données. Par exemple définir interface Product avec les champs id, title, price et seller_id.

Utiliser des types pour les unions et alias simples. Par exemple type PaymentMethod pour les valeurs possibles orange_money, wave ou card.

Typer toujours les fonctions avec les paramètres et le type de retour. Par exemple async function fetchProduct prend id de type string et retourne Promise de Product ou null.

### Composants React

Toujours définir une interface pour les props du composant. Par exemple ProductCardProps avec product obligatoire, onPress optionnel et showFavorite optionnel avec valeur par défaut true.

Utiliser la déstructuration des props dans la signature de la fonction pour plus de clarté.

Utiliser memo pour les composants qui reçoivent souvent les mêmes props afin d'éviter des re-renders inutiles.

### Hooks personnalisés

Préfixer tous les hooks avec use suivi du nom descriptif. Par exemple useProducts pour charger des produits.

Typer explicitement le retour du hook avec un objet contenant les états et fonctions exposées. Par exemple retourner products, loading et error.

Toujours nettoyer les effets avec un return dans useEffect pour éviter les fuites mémoire, particulièrement pour les subscriptions Supabase.

### Gestion d'erreurs

Utiliser des blocs try-catch pour toutes les opérations asynchrones susceptibles d'échouer.

Logger les erreurs dans la console avec un préfixe indiquant le composant ou la fonction. Par exemple console.error avec [ProductCard] Failed to load.

Afficher des messages d'erreur conviviaux à l'utilisateur via Alert.alert plutôt que d'exposer les messages techniques.

### Vérifications nullish

Utiliser l'opérateur de coalescence nulle ?? pour fournir des valeurs par défaut. Par exemple product?.title ?? 'Sans titre' affiche Sans titre si title est undefined ou null.

Utiliser le chaînage optionnel ?. pour accéder aux propriétés d'objets potentiellement null. Par exemple user?.profile?.name évite les erreurs si user ou profile est null.

### Styling

Utiliser StyleSheet.create pour définir les styles afin de bénéficier de l'optimisation de React Native.

Organiser les styles à la fin du fichier après la logique du composant pour une meilleure lisibilité.

Définir les couleurs dans le fichier Colors.ts plutôt que de les coder en dur pour faciliter la maintenance et le theming.

Utiliser des noms de style descriptifs comme container, title, button plutôt que des noms génériques comme style1 ou style2.

---

## 15. DEPANNAGE ET SUPPORT

### Problèmes courants

Erreur de migration SQL: Si une migration échoue, vérifier que les migrations précédentes ont bien été exécutées dans l'ordre. Consulter les logs dans Supabase Dashboard section Database puis Logs. Si nécessaire, restaurer un backup de la base de données et réexécuter.

Application ne démarre pas: Nettoyer le cache en supprimant les dossiers .expo et node_modules/.cache. Réinstaller les dépendances avec npm install. Relancer avec npx expo start --clear.

Erreurs TypeScript: Exécuter npm run typecheck pour voir toutes les erreurs. Vérifier que les types importés depuis database.types.ts sont à jour. Régénérer les types Supabase si la structure de base a changé.

Build échoue: Vérifier que toutes les variables d'environnement sont définies dans eas.json. Consulter les logs du build sur le dashboard Expo. Vérifier les versions des dépendances dans package.json.

Synchronisation temps réel ne fonctionne pas: Vérifier que Realtime est activé pour la table dans Supabase Dashboard. Vérifier que les RLS policies autorisent la lecture en temps réel. Consulter les logs du client Supabase dans la console du navigateur ou de l'app.

### Documentation de référence

Pour la vue d'ensemble: Lire README.md pour comprendre le contexte général du projet.

Pour le démarrage rapide: Consulter START_ICI.md qui donne les étapes essentielles en quelques minutes.

Pour la navigation complète: Utiliser SOMMAIRE_COMPLET.md qui référence tous les documents disponibles.

Pour le déploiement: Suivre QUICK_START.md pour un déploiement rapide ou CHECKLIST_DEPLOIEMENT.md pour une checklist complète.

### Guides fonctionnels spécifiques

Pour le système de points: GUIDE_POINTS_BONUS.md explique comment gagner et utiliser les points.

Pour le Live Shopping: LIVE_SHOPPING_INSTALLATION.md couvre la configuration complète d'Agora.

Pour la géolocalisation: GUIDE_LOCALISATION.md détaille le système de localisation des vendeurs.

Pour les abonnements: README_ABONNEMENTS.md documente tout le système d'abonnement.

### Scripts SQL utiles

Le script COMPLETE_FIX_ALL.sql contient la configuration complète de la base de données en un seul fichier.

Les migrations individuelles dans le dossier supabase/migrations permettent des mises à jour ciblées.

### Ressources externes

Documentation Expo disponible sur docs.expo.dev pour tout ce qui concerne le framework.

Documentation Supabase sur supabase.com/docs pour la base de données et l'authentification.

Documentation Agora sur docs.agora.io pour le streaming vidéo et RTM.

Documentation React Native sur reactnative.dev pour les composants et APIs.

Documentation TypeScript sur typescriptlang.org/docs pour le langage.

### Support et contact

Pour les questions techniques: Contacter tech@senepanda.com avec une description détaillée du problème.

Pour les questions business: Contacter business@senepanda.com pour tout ce qui concerne les fonctionnalités métier.

Pour la documentation: Ce fichier contient toutes les informations nécessaires, complété par les autres documents MD du projet.

---

## CONCLUSION

Ce document technique fournit toutes les informations nécessaires pour qu'un développeur puisse comprendre, maintenir et faire évoluer l'application SenePanda.

Les points essentiels à retenir:

SenePanda est une marketplace e-commerce multi-vendeurs construite avec React Native, Expo et Supabase, ciblant spécifiquement le marché sénégalais avec des moyens de paiement locaux.

L'architecture est organisée en couches claires avec séparation entre UI dans components, logique dans hooks et data dans lib, facilitant la maintenance et l'évolutivité.

Le système d'abonnement à quatre niveaux contrôle l'accès aux fonctionnalités premium comme le Live Shopping réservé au plan Premium avec 166 heures de streaming mensuelles.

La base de données PostgreSQL via Supabase utilise des vues, fonctions et triggers pour automatiser la logique métier comme les limites de produits et l'attribution de points.

Le Live Shopping repose sur Agora SDK pour le streaming vidéo HD et le chat temps réel, permettant aux vendeurs de présenter leurs produits comme dans un marché traditionnel.

Le système de paiement intègre Wave, Orange Money et Free Money pour s'adapter aux habitudes locales, avec validation des formats de numéros sénégalais.

Prochaines étapes recommandées pour un nouveau développeur:

Lire ce document en entier pour avoir une vision complète de l'architecture et des fonctionnalités.

Suivre le guide de démarrage section 12 pour installer et lancer l'application localement.

Explorer le code en commençant par les pages dans app pour comprendre les écrans principaux.

Examiner les hooks dans le dossier hooks pour comprendre la logique métier réutilisable.

Tester les différentes fonctionnalités en créant un compte test avec les différents plans d'abonnement.

Consulter les guides spécifiques selon les fonctionnalités à développer ou maintenir.

Version: 2.0.0
Dernière mise à jour: Janvier 2025
Statut: Production Ready

Pour toute question ou besoin de clarification, consulter les autres documents de documentation dans le projet ou contacter l'équipe technique.

Bon développement sur SenePanda.
