# COMMENCEZ ICI - NOUVEAU DEVELOPPEUR

Vous venez de rejoindre le projet SenePanda.

Voici exactement quoi faire.

---

## ETAPE 1 - COMPRENDRE LE PROJET (30 minutes)

Lisez ces 3 documents dans cet ordre:

**1. TECH_STACK_RESUME.md (5 min)**
Vue d'ensemble rapide: stack, fonctionnalités, architecture.

**2. OUTILS_ET_TECHNOLOGIES.md (15 min)**
Liste complète des technologies et outils utilisés.

**3. README.md (10 min)**
Vue d'ensemble générale du projet.

---

## ETAPE 2 - INSTALLER LE PROJET (30 minutes)

```bash
# Cloner
git clone <repository-url>
cd project

# Installer
npm install

# Configurer
cp .env.example .env
# Éditer .env avec vos clés
```

**Variables minimales nécessaires dans .env:**
```
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
```

---

## ETAPE 3 - CONFIGURER SUPABASE (30 minutes)

**1. Créer projet:**
- Aller sur supabase.com
- Créer nouveau projet
- Noter URL et clé anon

**2. Appliquer migrations:**
Dans SQL Editor, exécuter dans cet ordre:

1. `supabase/migrations/20251011232345_create_marketplace_schema.sql`
2. `supabase/migrations/add_subscription_plan_to_profiles.sql`
3. `supabase/migrations/add_geolocation_system.sql`
4. `supabase/migrations/add_live_notifications.sql`

**3. Créer bucket Storage:**
- Storage → New Bucket
- Nom: `product-images`
- Public: Oui

**4. Activer Realtime:**
- Database → Replication
- Activer pour: profiles, products, live_sessions

---

## ETAPE 4 - LANCER L'APP (5 minutes)

```bash
npx expo start --clear
```

**Options:**
- Appuyer sur `a` pour Android
- Appuyer sur `i` pour iOS (macOS uniquement)
- Scanner QR code avec Expo Go

---

## ETAPE 5 - EXPLORER LE CODE (1-2 heures)

**Structure à explorer:**

**Pages principales:**
- `app/(tabs)/home.tsx` - Page d'accueil acheteurs
- `app/seller/my-shop.tsx` - Boutique vendeur
- `app/seller/start-live.tsx` - Live Shopping

**Hooks importants:**
- `hooks/useSubscriptionAccess.ts` - Vérification abonnement
- `hooks/useLiveShopping.ts` - Sessions live
- `hooks/useCart.ts` - Panier d'achat

**Composants clés:**
- `components/ActiveLiveSessions.tsx` - Lives actifs
- `components/PointsDashboard.tsx` - Points utilisateur
- `components/ProductCard.tsx` - Carte produit

---

## ETAPE 6 - LIRE LA DOC COMPLETE (selon besoin)

**Documentation technique complète:**
`TECHNICAL_DOCUMENTATION.md` (1900 lignes)

Sections:
1. Vue d'ensemble
2. Stack technique
3. Architecture
4. Structure projet
5. Fonctionnalités
6. Base de données
7. Authentification
8. Abonnement
9. Live Shopping
10. Paiements
11. Configuration
12. Démarrage
13. Déploiement
14. Conventions
15. Dépannage

**Lisez en plusieurs fois selon vos besoins.**

---

## ETAPE 7 - TESTER LES FONCTIONNALITES (1 heure)

**Créer compte test Premium:**

Dans Supabase SQL Editor:

```sql
-- 1. Créer utilisateur
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('test@senepanda.sn', crypt('Test123!', gen_salt('bf')), NOW())
RETURNING id;

-- 2. Noter l'ID retourné, puis créer profil
INSERT INTO profiles (
  id, email, phone, full_name, role,
  subscription_plan, subscription_status, points
) VALUES (
  '<id-de-letape-1>',
  'test@senepanda.sn',
  '771234567',
  'Testeur Premium',
  'both',
  'premium',
  'active',
  1000
);
```

**Se connecter avec:**
- Email: test@senepanda.sn
- Password: Test123!

**Tester:**
- Ajouter produits (illimité en Premium)
- Démarrer une session live (Premium)
- Acheter un produit
- Vérifier points quotidiens

---

## PROBLEMES COURANTS

**App ne démarre pas:**
```bash
rm -rf .expo node_modules/.cache
npm install
npx expo start --clear
```

**Erreurs Supabase:**
Vérifier que toutes les migrations sont appliquées.
Lire: `FIX_TOUTES_ERREURS.md`

**Erreurs TypeScript:**
```bash
npm run typecheck
```
Lire: `FIX_TYPESCRIPT_ERRORS.md`

---

## PROCHAINES ETAPES

**Pour développer une feature:**
1. Consulter `GUIDE_DEVELOPPEUR.md`
2. Trouver la section correspondante
3. Lire la doc spécifique
4. Explorer le code existant
5. Coder !

**Pour résoudre un bug:**
1. Consulter `DOCUMENTATION_INDEX.md`
2. Section "Corrections et Fixes"
3. Chercher le problème spécifique

**Pour déployer:**
1. Lire `CHECKLIST_DEPLOIEMENT.md`
2. Suivre étape par étape

---

## NAVIGATION DOCUMENTATION

**150+ documents disponibles.**

**Index complet:**
`DOCUMENTATION_INDEX.md`

**Guide développeur:**
`GUIDE_DEVELOPPEUR.md`

**Par fonctionnalité:**
- Live Shopping: Section dans DOCUMENTATION_INDEX.md
- Abonnements: Section dans DOCUMENTATION_INDEX.md
- Points: GUIDE_POINTS_BONUS.md
- Paiements: INTEGRATION_WAVE_PAYMENT.md
- Localisation: GUIDE_LOCALISATION.md

---

## CONVENTIONS DE CODE

**Avant de coder:**

**TypeScript:**
- Typage strict
- Interfaces pour données
- Types pour unions

**Fichiers:**
- Composants: PascalCase (ProductCard.tsx)
- Hooks: camelCase + use (useCart.ts)
- Utils: camelCase (payment.ts)

**Git:**
- Branches: feature/nom-feature
- Commits: Messages clairs en français
- JAMAIS commit .env

**Voir détails:**
`TECHNICAL_DOCUMENTATION.md` section 14

---

## RESSOURCES

**Documentation officielle:**
- Expo: docs.expo.dev
- Supabase: supabase.com/docs
- Agora: docs.agora.io
- React Native: reactnative.dev

**Support:**
- Technique: tech@senepanda.com
- Business: business@senepanda.com

---

## CHECKLIST PREMIER JOUR

- [ ] Lire TECH_STACK_RESUME.md
- [ ] Lire OUTILS_ET_TECHNOLOGIES.md
- [ ] Lire README.md
- [ ] Cloner le repo
- [ ] Installer dépendances
- [ ] Configurer .env
- [ ] Créer projet Supabase
- [ ] Appliquer migrations
- [ ] Lancer l'app
- [ ] Créer compte test
- [ ] Tester les fonctionnalités
- [ ] Explorer le code

---

## CHECKLIST PREMIERE SEMAINE

- [ ] Lire TECHNICAL_DOCUMENTATION.md complet
- [ ] Comprendre architecture
- [ ] Tester tous les plans d'abonnement
- [ ] Tester Live Shopping
- [ ] Tester paiements (sandbox)
- [ ] Faire un build local
- [ ] Lire code: app/, components/, hooks/
- [ ] Contribuer à une première issue

---

## VOUS ETES PRET !

Après ces étapes, vous connaissez:
- La stack technique complète
- L'architecture du projet
- Les fonctionnalités principales
- Comment naviguer dans le code
- Où trouver la documentation

**Bon développement sur SenePanda !**

---

**Version:** 2.0.0
**Date:** Janvier 2025
**Temps total setup:** 3-4 heures

**Questions?** tech@senepanda.com
