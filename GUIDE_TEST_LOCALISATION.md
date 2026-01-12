# 🧪 Guide de test du système de géolocalisation

## 📍 Accès à la page de test

Pour accéder à la page de test de géolocalisation, utilisez l'URL :
```
/test-location
```

Ou ajoutez un bouton temporaire dans votre app pour y accéder facilement.

## ✅ Ce qui est testé

La page de test vérifie **6 composants critiques** du système de géolocalisation :

### 1. ✅ Permission de localisation
- Vérifie si l'utilisateur a accordé la permission d'accès à la localisation
- Si refusé, affiche un message explicatif

### 2. 📍 Récupération GPS
- Obtient la position GPS actuelle (latitude, longitude, précision)
- Utilise `expo-location` pour accéder au GPS du téléphone
- Affiche la précision en mètres

### 3. 🗺️ Géocodage inversé (GPS → Adresse)
- Convertit les coordonnées GPS en adresse lisible
- Extrait la ville, la région et le pays
- Utilise l'API de géocodage d'Expo

### 4. 💾 Mise à jour base de données
- Appelle la fonction `update_user_location` de Supabase
- Sauvegarde les coordonnées GPS et l'adresse dans la table `profiles`
- Met à jour `location_updated_at`

### 5. 👥 Recherche de vendeurs proches
- Appelle la fonction `find_nearby_sellers` de Supabase
- Recherche dans un rayon de 50 km
- **Priorise les vendeurs premium** (Premium > Pro > Starter > Free)
- Affiche : nom, distance, note, nombre de produits

### 6. 🛍️ Recherche de produits proches
- Appelle la fonction `find_nearby_products` de Supabase
- Recherche dans un rayon de 50 km
- **Priorise les produits des vendeurs premium**
- Affiche : titre, prix, vendeur, distance

## 🚀 Comment tester

### Test complet (recommandé)

1. Cliquez sur **"Lancer le test complet"**
2. Accordez la permission de localisation si demandé
3. Attendez que tous les tests se terminent (environ 10-15 secondes)
4. Vérifiez les résultats dans la section "Résultats des tests"

### Test GPS uniquement

1. Cliquez sur **"Test GPS uniquement"**
2. Vérifie rapidement si le GPS fonctionne
3. Plus rapide pour un test basique

## 📊 Interprétation des résultats

### Symboles

- ✅ = Test réussi
- ❌ = Test échoué
- ⏳ = Test en cours

### État actuel

La section "État actuel" affiche en temps réel :
- **Permission** : Accordée ou Refusée
- **Coordonnées GPS** : Latitude, Longitude
- **Précision** : En mètres (plus c'est bas, mieux c'est)
- **Adresse** : Adresse complète
- **Ville** : Ville extraite
- **Pays** : Pays extrait

### Résultats attendus

**✅ Tous les tests doivent afficher un ✅**

Si un test échoue :

1. **Permission refusée** : Allez dans les paramètres de l'app et activez la localisation
2. **GPS impossible** : Vérifiez que le GPS est activé sur le téléphone
3. **Géocodage échoué** : Vérifiez votre connexion internet
4. **Erreur BDD** : Vérifiez la migration SQL `add_geolocation_system.sql`
5. **0 vendeur trouvé** : Normal si aucun vendeur n'a de localisation dans la BDD
6. **0 produit trouvé** : Normal si aucun vendeur n'a de produits avec localisation

## 🔧 Résolution des problèmes

### Problème : "Permission refusée"

**Solution :**
- iOS : Paramètres > SenePanda > Localisation > "Toujours" ou "Lorsque l'app est utilisée"
- Android : Paramètres > Apps > SenePanda > Autorisations > Localisation

### Problème : "Impossible d'obtenir la position"

**Solutions :**
1. Vérifiez que le GPS est activé
2. Assurez-vous d'être à l'extérieur ou près d'une fenêtre
3. Redémarrez l'application
4. Sur Android, vérifiez le mode de localisation (Haute précision recommandé)

### Problème : "Géocodage échoué"

**Solutions :**
1. Vérifiez votre connexion internet
2. Le géocodage utilise les serveurs d'Expo, assurez-vous d'avoir internet
3. Certaines coordonnées isolées peuvent ne pas avoir d'adresse

### Problème : "Erreur BDD: function update_user_location does not exist"

**Solution :**
Exécutez la migration SQL :
```bash
# Dans le dossier supabase
npx supabase db push
```

Ou exécutez manuellement le fichier :
```sql
supabase/migrations/add_geolocation_system.sql
```

### Problème : "0 vendeur trouvé"

**C'est normal si :**
- Aucun vendeur n'a activé sa localisation
- Vous êtes dans une zone isolée
- Le rayon de recherche (50 km) est trop petit

**Pour tester avec des données :**
1. Créez un compte vendeur
2. Allez dans Paramètres > Ma Localisation
3. Activez votre localisation
4. Relancez le test

## 📱 Test sur émulateur vs Téléphone réel

### Émulateur iOS (Xcode)
- ✅ Fonctionne avec localisation simulée
- Simulator > Features > Location > Custom Location
- Entrez des coordonnées (ex: Paris = 48.8566, 2.3522)

### Émulateur Android (Android Studio)
- ✅ Fonctionne avec localisation simulée
- Extended Controls (...) > Location
- Entrez des coordonnées manuellement

### Téléphone réel
- ✅ **Recommandé** pour tests précis
- GPS réel, géocodage précis
- Testez à l'extérieur pour meilleure précision

## 🎯 Scénarios de test recommandés

### Test 1 : Utilisateur dans une grande ville
1. Allez dans une grande ville (Dakar, Paris, etc.)
2. Lancez le test complet
3. ✅ Devrait trouver des vendeurs et produits

### Test 2 : Utilisateur en zone rurale
1. Simulez une position en zone rurale
2. Lancez le test complet
3. ✅ Peut ne pas trouver de vendeurs (normal)

### Test 3 : Changement de position
1. Lancez le test à un endroit
2. Déplacez-vous de plusieurs km
3. Relancez le test
4. ✅ Les résultats doivent changer

### Test 4 : Vendeur premium vs Free
1. Créez 2 vendeurs avec la même distance
2. L'un premium, l'autre free
3. Lancez le test
4. ✅ Le vendeur premium doit apparaître en premier

## 📋 Checklist complète

Avant de valider le système, vérifiez :

- [ ] Permission de localisation accordée
- [ ] GPS obtenu avec précision < 100m
- [ ] Adresse convertie correctement
- [ ] Position sauvegardée en BDD
- [ ] Recherche de vendeurs fonctionne
- [ ] Recherche de produits fonctionne
- [ ] Vendeurs premium apparaissent en premier
- [ ] Distance calculée correctement
- [ ] Formatage de distance correct (km/m)

## 🔍 Debugging

### Logs utiles

Ouvrez la console pour voir les logs :

```javascript
// Hook useLocation
console.log('Permission:', hasPermission);
console.log('Coords:', coords);
console.log('Address:', address);

// Service geolocation
console.log('Update result:', updateResult);
console.log('Sellers found:', sellers.length);
console.log('Products found:', products.length);
```

### Vérifier la BDD directement

```sql
-- Voir les utilisateurs avec localisation
SELECT id, username, latitude, longitude, location_updated_at
FROM profiles
WHERE latitude IS NOT NULL;

-- Tester la fonction manually
SELECT * FROM update_user_location(
  'user-id',
  14.7167,  -- Latitude Dakar
  -17.4677, -- Longitude Dakar
  'Dakar, Sénégal',
  'Dakar'
);

-- Tester recherche vendeurs
SELECT * FROM find_nearby_sellers(
  14.7167,  -- Votre latitude
  -17.4677, -- Votre longitude
  50,       -- Rayon 50km
  20        -- Limite 20 résultats
);
```

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs de la console
2. Vérifiez que la migration SQL est bien exécutée
3. Testez les fonctions SQL directement dans Supabase
4. Vérifiez les permissions dans `app.json`
5. Redémarrez complètement l'app (pas juste fast refresh)

## ✨ Fonctionnalités testées

- [x] Permission de localisation
- [x] Récupération GPS
- [x] Géocodage inversé (GPS → Adresse)
- [x] Sauvegarde en BDD
- [x] Recherche vendeurs proches
- [x] Recherche produits proches
- [x] Priorisation premium
- [x] Calcul de distance
- [x] Formatage de distance
- [x] Gestion des erreurs
- [x] État de chargement
- [x] Affichage temps réel

Bonne chance avec vos tests ! 🚀
