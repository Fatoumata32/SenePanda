# Politique des Codes PIN - SenePanda

## 📌 Règle Principale

**TOUS les codes PIN doivent faire EXACTEMENT 4 chiffres numériques.**

---

## ✅ Codes PIN Valides

| Code PIN | Description | Valide |
|----------|-------------|--------|
| `1234` | 4 chiffres | ✅ OUI |
| `0000` | 4 chiffres | ✅ OUI |
| `9999` | 4 chiffres | ✅ OUI |
| `5678` | 4 chiffres | ✅ OUI |

---

## ❌ Codes PIN Invalides

| Code PIN | Raison | Valide |
|----------|--------|--------|
| `123` | Trop court (3 chiffres) | ❌ NON |
| `12345` | Trop long (5 chiffres) | ❌ NON |
| `123456` | Trop long (6 chiffres) | ❌ NON |
| `abcd` | Non numérique | ❌ NON |
| `12ab` | Contient des lettres | ❌ NON |
| `12.34` | Contient un symbole | ❌ NON |
| `12 34` | Contient un espace | ❌ NON |
| ` ` (vide) | Pas de chiffres | ❌ NON |

---

## 🔒 Implémentation Technique

### Dans l'Application (React Native)

```tsx
// Champ de saisie du code PIN
<TextInput
  value={password}
  onChangeText={setPassword}
  placeholder="••••"
  keyboardType="number-pad"      // ✅ Numérique uniquement
  secureTextEntry={true}          // ✅ Masqué
  maxLength={4}                   // ✅ Maximum 4 caractères
  placeholderTextColor={Colors.textMuted}
/>
```

### Validation Avant Soumission

```typescript
// Vérification stricte
if (password.length < 4) {
  Alert.alert('Erreur', 'Le code PIN doit contenir au moins 4 chiffres');
  return;
}

// Vérification du format numérique
if (!/^\d{4}$/.test(password)) {
  Alert.alert('Erreur', 'Le code PIN doit contenir exactement 4 chiffres');
  return;
}
```

### Padding pour Supabase

```typescript
// Fonction de padding automatique
const padPinCode = (pin: string): string => {
  // Si le PIN a moins de 6 caractères, ajouter des zéros au début
  return pin.length < 6 ? pin.padStart(6, '0') : pin;
};

// Utilisation
const paddedPassword = padPinCode('1234'); // → '001234'
await supabase.auth.signInWithPassword({
  email,
  password: paddedPassword, // Envoi de '001234' à Supabase
});
```

---

## 📊 Stockage

### Dans l'Application
- **Saisie utilisateur** : `1234` (4 chiffres)
- **Affichage** : `••••` (masqué)
- **Validation** : Exactement 4 chiffres

### Dans Supabase Auth
- **Stockage** : `001234` (6 caractères avec padding)
- **Raison** : Politique minimum 6 caractères de Supabase
- **Hashage** : bcrypt (automatique par Supabase)

### Schéma de Conversion

```
Utilisateur tape → Application valide → Padding ajouté → Supabase stocke
     1234       →   length === 4 ✓   →     001234     →   hash(001234)
     5678       →   length === 4 ✓   →     005678     →   hash(005678)
     123        →   length < 4 ✗     →       -        →       -
     12345      →   length > 4 ✗     →       -        →       -
```

---

## 💬 Messages Utilisateur

### Lors de l'Inscription
```
"Créer un code PIN (4 chiffres)"
"Choisissez un code PIN facile à retenir (ex: 1234)"
```

### Lors de la Connexion
```
"Code PIN (4 chiffres)"
"Entrez votre code PIN de 4 chiffres"
```

### Messages d'Erreur
```
❌ "Le code PIN doit contenir au moins 4 chiffres"
❌ "Le code PIN doit contenir exactement 4 chiffres"
❌ "Le code PIN doit être numérique uniquement"
```

---

## 🎯 Expérience Utilisateur

### Interface de Saisie

```
┌─────────────────────────────────┐
│ Code PIN (4 chiffres)           │
├─────────────────────────────────┤
│ [•] [•] [•] [•]                 │
│                           👁️    │
└─────────────────────────────────┘
  Entrez votre code PIN de 4 chiffres
```

### Comportement

1. **Focus sur le champ** : Clavier numérique s'ouvre automatiquement
2. **Saisie** : Maximum 4 caractères acceptés
3. **Affichage** : Chaque chiffre apparaît masqué (••••)
4. **Bouton œil** : Toggle pour afficher/masquer temporairement
5. **Validation** : Vérification en temps réel (optionnel) ou à la soumission

---

## 🔐 Sécurité

### Pourquoi 4 chiffres ?

✅ **Avantages** :
- Facile à mémoriser
- Rapide à saisir
- Similaire aux PIN de carte bancaire (familier)
- Suffisant pour un usage mobile avec autres mesures de sécurité

⚠️ **Mesures Complémentaires** :
- Limitation des tentatives (3 max)
- Délai après échecs multiples (30 secondes)
- Biométrie optionnelle (Face ID, Touch ID)
- Déconnexion automatique après inactivité
- Notification par SMS des connexions

### Nombre de Combinaisons

- **Total de combinaisons** : 10,000 (10^4)
- **Avec limitation à 3 tentatives** : Sécurité renforcée
- **Avec délai après échec** : Force brute impraticable

---

## 📝 Pour les Développeurs

### Checklist d'Implémentation

- [x] `maxLength={4}` sur tous les champs de code PIN
- [x] `keyboardType="number-pad"` pour numérique uniquement
- [x] Validation : `password.length === 4`
- [x] Validation : `!/^\d{4}$/.test(password)`
- [x] Fonction `padPinCode()` pour conversion
- [x] Messages d'erreur clairs
- [x] Placeholder : `"••••"`
- [x] Label : `"Code PIN (4 chiffres)"`

### Tests à Effectuer

```typescript
// Test 1: Code PIN valide
testPinValidation('1234') // ✅ Doit passer

// Test 2: Code PIN trop court
testPinValidation('123') // ❌ Doit échouer

// Test 3: Code PIN trop long
testPinValidation('12345') // ❌ Doit échouer

// Test 4: Code PIN non numérique
testPinValidation('abcd') // ❌ Doit échouer

// Test 5: Padding
padPinCode('1234') === '001234' // ✅ Doit être égal
```

---

## 📱 Guide Utilisateur

### Comment Créer un Code PIN

1. **Choisir 4 chiffres** faciles à retenir
2. **Éviter** les codes évidents (`0000`, `1111`, date de naissance)
3. **Mémoriser** ou noter dans un endroit sûr
4. **Ne jamais partager** avec personne

### Code PIN Oublié

1. Cliquer sur **"Code PIN oublié ?"**
2. Entrer votre numéro de téléphone
3. Créer un **nouveau code PIN de 4 chiffres**
4. Se connecter avec le nouveau code

---

## 🆘 FAQ

### Q: Puis-je utiliser un code PIN de 6 chiffres ?
**R:** Non, l'application limite strictement à 4 chiffres pour une meilleure expérience utilisateur.

### Q: Pourquoi 4 chiffres et pas 6 ?
**R:** 4 chiffres offrent un bon équilibre entre sécurité et facilité d'utilisation, similaire aux cartes bancaires.

### Q: Le code PIN est-il sécurisé ?
**R:** Oui, combiné avec la limitation des tentatives, le délai après échec, et le hashage bcrypt.

### Q: Puis-je utiliser des lettres ?
**R:** Non, uniquement des chiffres (0-9) sont acceptés.

### Q: Comment changer mon code PIN ?
**R:** Dans l'application : Profil > Paramètres > Sécurité > Modifier le code PIN

---

## 📊 Statistiques

### Distribution Recommandée

| Type de Code | Sécurité | Recommandation |
|--------------|----------|----------------|
| `0000-1111` | Faible | ❌ À éviter |
| `1234-4321` | Faible | ❌ À éviter |
| Date (jjmm) | Faible | ❌ À éviter |
| Aléatoire | Forte | ✅ Recommandé |

### Bonnes Pratiques

✅ **Faire** :
- Utiliser des chiffres aléatoires
- Choisir un code unique pour chaque service
- Changer régulièrement (tous les 3 mois)
- Activer la biométrie si disponible

❌ **Ne pas faire** :
- Utiliser `0000`, `1111`, `1234`
- Utiliser sa date de naissance
- Partager son code PIN
- Écrire son code PIN en clair
- Utiliser le même code partout

---

## 🔄 Historique des Changements

| Date | Version | Changement |
|------|---------|------------|
| 2025-11-29 | 1.0 | Code PIN limité à 4 chiffres |
| 2025-11-29 | 1.1 | Ajout du padding automatique |
| 2025-11-29 | 1.2 | Documentation complète |

---

**Dernière mise à jour** : 29 Novembre 2025

**Version** : 1.2

**Auteur** : Équipe SenePanda
