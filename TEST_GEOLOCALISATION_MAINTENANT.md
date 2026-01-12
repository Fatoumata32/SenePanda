# 🚀 TESTER LA GÉOLOCALISATION MAINTENANT

## ✅ Étape 1 : Vérifier que tout est en place

Tout est déjà configuré ! Voici ce qui a été fait :

### ✓ Fichiers créés
- ✅ `app/test-location.tsx` - Page de test complète
- ✅ `hooks/useLocation.ts` - Hook de géolocalisation
- ✅ `lib/geolocation.ts` - Fonctions de géolocalisation
- ✅ `components/LocationPicker.tsx` - Composant de sélection
- ✅ `app/settings/edit-location.tsx` - Page d'édition de localisation

### ✓ Configuration
- ✅ `expo-location` installé (v19.0.7)
- ✅ Permissions configurées dans `app.json`
- ✅ Migration SQL prête : `supabase/migrations/add_geolocation_system.sql`

## 🎯 Étape 2 : Exécuter la migration SQL

**IMPORTANT : Cette étape est obligatoire**

### Option A : Avec Supabase CLI

```bash
cd supabase
npx supabase db push
```

### Option B : Via l'interface Supabase

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans "SQL Editor"
4. Cliquez sur "New query"
5. Copiez le contenu de `supabase/migrations/add_geolocation_system.sql`
6. Collez et cliquez sur "Run"
7. Vérifiez qu'il n'y a pas d'erreur

### Vérification

Pour vérifier que la migration a fonctionné :

```sql
-- Dans SQL Editor de Supabase
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'update_user_location',
  'find_nearby_sellers',
  'find_nearby_products'
);
```

Vous devez voir 3 fonctions.

## 📱 Étape 3 : Lancer l'application

```bash
npm start
# ou
npx expo start
```

Puis choisissez :
- `a` pour Android
- `i` pour iOS
- `w` pour Web

## 🧪 Étape 4 : Accéder à la page de test

### Méthode 1 : Via le profil (Mode Développeur uniquement)

1. Ouvrez l'app en mode développement
2. Allez dans l'onglet **Profil** (en bas)
3. Faites défiler vers le bas
4. Cliquez sur **"🧪 Test Géolocalisation"** (visible uniquement en mode dev)

### Méthode 2 : URL directe

Dans le navigateur Expo ou via deep linking :
```
exp://localhost:8081/--/test-location
```

## 🎮 Étape 5 : Exécuter les tests

### Test rapide

1. Sur la page de test, cliquez sur **"Test GPS uniquement"**
2. Accordez la permission de localisation quand demandé
3. Vérifiez que vos coordonnées s'affichent

### Test complet (recommandé)

1. Cliquez sur **"Lancer le test complet"**
2. Attendez 10-15 secondes
3. Vérifiez tous les résultats :
   - ✅ Permission accordée
   - ✅ GPS obtenu
   - ✅ Adresse convertie
   - ✅ Position sauvegardée en BDD
   - ✅ Vendeurs trouvés (peut être 0 si aucun vendeur)
   - ✅ Produits trouvés (peut être 0 si aucun produit)

## 📊 Résultats attendus

### État actuel

Vous devriez voir :
```
Permission: ✅ Accordée
Coordonnées GPS: 14.716677, -17.467686
Précision: 20 m
Adresse: Dakar, Sénégal
Ville: Dakar
Pays: Sénégal
```

### Résultats des tests

Tous les tests doivent afficher **✅** :

```
✅ Permission accordée
✅ GPS: 14.716677, -17.467686 (précision: 20m)
✅ Adresse: Dakar, Sénégal
✅ Position sauvegardée en BDD
✅ 5 vendeur(s) trouvé(s) dans un rayon de 50km
✅ 12 produit(s) trouvé(s) dans un rayon de 50km
```

## 🔧 En cas de problème

### "Permission refusée"

**iOS :**
1. Paramètres > Confidentialité > Localisation
2. Activez "Localisation"
3. Trouvez "Expo Go" ou "SenePanda"
4. Sélectionnez "Lorsque l'app est utilisée"

**Android :**
1. Paramètres > Apps > Expo Go (ou SenePanda)
2. Permissions > Localisation
3. Sélectionnez "Autoriser uniquement pendant l'utilisation"

### "Impossible d'obtenir la position"

1. Vérifiez que le GPS est activé
2. Si sur émulateur, configurez une localisation :
   - **iOS Simulator** : Features > Location > Custom Location
   - **Android Emulator** : Extended Controls (...) > Location
3. Sur téléphone réel, allez à l'extérieur ou près d'une fenêtre

### "Erreur BDD: function does not exist"

La migration SQL n'a pas été exécutée. Voir **Étape 2** ci-dessus.

### "0 vendeur trouvé"

C'est normal si :
- Aucun vendeur n'a activé sa géolocalisation
- Vous êtes loin de tout vendeur (rayon : 50 km)

**Pour tester avec des données :**

1. Créez un compte vendeur
2. Allez dans Paramètres > Ma Localisation
3. Activez votre localisation
4. Retournez au test et relancez

## 🎯 Que tester exactement ?

### ✅ Checklist minimale

- [ ] Permission de localisation accordée
- [ ] GPS obtenu (latitude, longitude)
- [ ] Précision < 100m
- [ ] Adresse convertie (pas "Adresse non disponible")
- [ ] Position sauvegardée en BDD (pas d'erreur)
- [ ] Fonction de recherche vendeurs fonctionne (même 0 résultat)
- [ ] Fonction de recherche produits fonctionne (même 0 résultat)

### ✅ Checklist avancée

- [ ] Distance calculée correctement (en km ou m)
- [ ] Badge premium affiché pour vendeurs premium
- [ ] Vendeurs triés par : Premium > Distance > Note
- [ ] Produits triés par : Vendeur Premium > Distance
- [ ] Changement de position met à jour les résultats
- [ ] Précision GPS raisonnable (< 50m en extérieur)
- [ ] Ville et pays correctement extraits

## 📸 Captures d'écran de référence

Quand tout fonctionne, vous devriez voir :

### Page de test
```
┌─────────────────────────────────┐
│ 📍 État actuel                  │
│ Permission: ✅ Accordée         │
│ GPS: 14.716677, -17.467686      │
│ Précision: 20 m                 │
│ Adresse: Dakar, Sénégal         │
│ Ville: Dakar                    │
│ Pays: Sénégal                   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 📊 Résultats des tests          │
│ ✅ Permission accordée          │
│ ✅ GPS: 14.716677, -17.467686   │
│ ✅ Adresse: Dakar, Sénégal      │
│ ✅ Position sauvegardée en BDD  │
│ ✅ 5 vendeur(s) trouvé(s)       │
│ ✅ 12 produit(s) trouvé(s)      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 👥 Vendeurs proches             │
│ ┌───────────────────────────┐   │
│ │ Jean Dupont    [PREMIUM]  │   │
│ │ 📍 2.5 km                 │   │
│ │ ⭐ 4.8 (23 avis)          │   │
│ │ 📦 45 produits            │   │
│ └───────────────────────────┘   │
└─────────────────────────────────┘
```

## 🚀 Prochaines étapes après validation

Une fois que tous les tests passent :

1. ✅ Intégrer la géolocalisation dans la page d'accueil
2. ✅ Ajouter un filtre "Près de moi" sur la recherche
3. ✅ Afficher la distance sur les cartes produits
4. ✅ Créer une carte interactive avec vendeurs
5. ✅ Ajouter notifications push pour vendeurs proches

## 📞 Besoin d'aide ?

Consultez le fichier **GUIDE_TEST_LOCALISATION.md** pour :
- Interprétation détaillée des résultats
- Scénarios de test avancés
- Debugging approfondi
- Vérification SQL directe

## 🎉 C'est tout !

Le système de géolocalisation est prêt à être testé. Suivez les étapes ci-dessus et vous verrez les résultats en temps réel.

**Bonne chance ! 🚀**

---

**Date de création :** 2025-12-02
**Version :** 1.0
**Système testé :** Géolocalisation avec priorité premium
