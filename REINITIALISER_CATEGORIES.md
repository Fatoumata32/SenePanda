# 🔄 Réinitialiser les Catégories

## 📋 Deux Méthodes Disponibles

### Méthode 1 : Via Supabase Dashboard (Recommandé) ⭐

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://supabase.com
   - Sélectionner votre projet

2. **Ouvrir SQL Editor**
   - Dans le menu de gauche : **SQL Editor**
   - Cliquer sur **+ New query**

3. **Copier-Coller le SQL**
   - Ouvrir le fichier : `supabase/migrations/reinitialize_categories.sql`
   - Copier tout le contenu
   - Coller dans l'éditeur SQL

4. **Exécuter**
   - Cliquer sur **Run** (ou Ctrl+Enter)
   - Attendre la confirmation

5. **Vérifier**
   - Vous devriez voir un tableau avec toutes les catégories
   - 36 catégories au total

---

### Méthode 2 : Via Script Node.js

1. **Exécuter le script**
   ```bash
   node scripts/reinitialize-categories.js
   ```

2. **Résultat attendu**
   ```
   🔄 Réinitialisation des catégories...

   🗑️  Suppression des anciennes catégories...
   ✅ Anciennes catégories supprimées

   ➕ Insertion des nouvelles catégories...
   ✅ 36 catégories insérées avec succès

   📋 Liste des catégories :
   ────────────────────────────────────────────────────────────────────────────────
    1. Vêtements Homme              | shirt-outline                | #3B82F6
    2. Vêtements Femme              | woman-outline                | #EC4899
    3. Chaussures                   | footsteps-outline            | #8B5CF6
   ...
   ────────────────────────────────────────────────────────────────────────────────

   🎉 Total : 36 catégories

   ✅ Réinitialisation terminée avec succès !
   ```

---

## 📂 Catégories Créées (36 au total)

### 👔 Mode & Accessoires (5)
1. Vêtements Homme
2. Vêtements Femme
3. Chaussures
4. Sacs & Accessoires
5. Bijoux & Montres

### 📱 Électronique & High-Tech (5)
6. Téléphones & Tablettes
7. Ordinateurs & Laptops
8. TV & Audio
9. Électroménager
10. Appareils Photo

### 🏠 Maison & Jardin (5)
11. Meubles
12. Décoration
13. Cuisine & Vaisselle
14. Jardin & Extérieur
15. Bricolage & Outils

### 💄 Beauté & Santé (4)
16. Produits de Beauté
17. Soins Cheveux
18. Santé & Bien-être
19. Sport & Fitness

### 👶 Enfants & Bébés (4)
20. Vêtements Enfants
21. Jouets & Jeux
22. Bébé & Puériculture
23. Fournitures Scolaires

### 🍕 Alimentation & Boissons (3)
24. Alimentation
25. Boissons
26. Pâtisserie

### 📚 Livres, Musique & Films (3)
27. Livres
28. Musique & Instruments
29. Films & DVD

### 🚗 Auto & Moto (3)
30. Pièces Auto
31. Accessoires Auto
32. Motos & Scooters

### 🔧 Services (2)
33. Services Professionnels
34. Événements

### 🐾 Animaux (1)
35. Animaux de Compagnie

### ⚙️ Autres (1)
36. Autres

---

## ✅ Vérification

### Dans l'Application

1. **Ouvrir l'app**
2. **Aller sur "Ajouter un produit"** (si vendeur)
3. **Vérifier la liste des catégories**
   - Vous devriez voir les 36 catégories
   - Avec leurs icônes et couleurs

### Dans Supabase

1. **Aller dans Table Editor**
2. **Ouvrir la table `categories`**
3. **Vérifier** :
   - 36 lignes
   - Colonnes : id, name, description, icon, color, display_order, is_active, created_at

---

## 🔍 Détails des Colonnes

Chaque catégorie contient :

```javascript
{
  id: 1,                                    // Auto-généré
  name: 'Vêtements Homme',                  // Nom affiché
  description: 'Chemises, pantalons...',    // Description
  icon: 'shirt-outline',                    // Icône Ionicons
  color: '#3B82F6',                         // Couleur (hex)
  display_order: 1,                         // Ordre d'affichage
  is_active: true,                          // Catégorie active
  created_at: '2026-01-11T...'             // Date de création
}
```

---

## 🎨 Couleurs des Catégories

Les catégories utilisent des couleurs variées pour une meilleure distinction visuelle :

- **Bleu** (#3B82F6) - Vêtements Homme
- **Rose** (#EC4899) - Vêtements Femme
- **Violet** (#8B5CF6) - Chaussures
- **Orange** (#F59E0B) - Sacs & Accessoires
- **Rouge** (#EF4444) - Bijoux & Montres
- **Vert** (#10B981) - Téléphones & Tablettes
- etc.

---

## 🚨 En Cas d'Erreur

### Erreur : "duplicate key value"

**Cause :** Des catégories existent déjà

**Solution :** Le script SQL utilise `TRUNCATE` qui supprime tout avant insertion.

Si ça ne fonctionne pas :
```sql
-- Supprimer manuellement
DELETE FROM categories;

-- Puis réexécuter le script
```

### Erreur : "permission denied"

**Cause :** Permissions insuffisantes

**Solution :**
1. Vérifier que vous utilisez la clé **service_role** (pas anon)
2. Ou exécuter directement dans Supabase Dashboard (recommandé)

---

## 📝 Personnalisation

Pour ajouter vos propres catégories, éditez le fichier SQL ou JavaScript :

```sql
-- Ajouter une nouvelle catégorie
INSERT INTO categories (name, description, icon, color, display_order, is_active, created_at)
VALUES ('Ma Catégorie', 'Description', 'icon-name', '#HEXCOLOR', 37, true, NOW());
```

**Icônes disponibles :** https://ionic.io/ionicons

---

## ✅ Checklist

- [ ] Fichier SQL créé : `supabase/migrations/reinitialize_categories.sql`
- [ ] Script Node.js créé : `scripts/reinitialize-categories.js`
- [ ] Exécution du script (méthode 1 ou 2)
- [ ] Vérification dans Supabase Dashboard
- [ ] Vérification dans l'application
- [ ] 36 catégories visibles

---

**Dernière mise à jour :** 2026-01-11
