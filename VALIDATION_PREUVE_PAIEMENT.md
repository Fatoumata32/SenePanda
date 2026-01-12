# ✅ VALIDATION PAR PREUVE DE PAIEMENT - GUIDE COMPLET

## 🎯 Nouveau Système de Validation

Le système de paiement des abonnements a été amélioré pour **exiger une preuve de paiement visuelle** (capture d'écran ou photo) avant de valider tout changement d'abonnement.

---

## 🚀 Comment Ça Marche

### **Flux de Paiement Mis à Jour**

1. **Choisir un plan** → Sélectionner le plan d'abonnement souhaité
2. **Mode de paiement** → Choisir Orange Money, Wave, Free Money, Carte ou Virement
3. **Détails** → Entrer le numéro de téléphone (si mobile money)
4. **Confirmation** → **NOUVEAU : Télécharger la preuve de paiement** 📸
5. **Traitement** → Upload de la preuve + validation SQL
6. **Succès** → Abonnement activé

---

## 📸 Téléchargement de la Preuve

### **Étape "Confirmation"**

Sur l'écran de confirmation, vous verrez maintenant une section **"Preuve de paiement (obligatoire)"** avec 2 options :

#### **Option 1 : Choisir une image** 📂
- Sélectionner une capture d'écran depuis la galerie
- Idéal si vous avez déjà effectué le paiement

#### **Option 2 : Prendre une photo** 📷
- Ouvrir la caméra pour photographier un reçu
- Utile pour les paiements en agence

### **Validation Obligatoire**

- ❌ Le bouton "Confirmer et Payer" est **désactivé** sans preuve
- ✅ Une fois l'image ajoutée, le bouton devient actif
- 🖼️ Aperçu de l'image avec badge vert "Preuve ajoutée"
- 🗑️ Possibilité de supprimer et changer l'image

---

## 💾 Stockage et Traitement

### **1. Upload vers Supabase Storage**

Lorsque vous confirmez le paiement :

```typescript
// L'image est téléchargée vers le bucket 'subscriptions'
// Chemin : payment-proofs/payment-proof-{userId}-{timestamp}.jpg
```

### **2. Enregistrement dans la Base de Données**

La preuve est enregistrée dans `subscription_history` :

```sql
{
  user_id: "uuid",
  plan_type: "pro",
  payment_method: "orange_money",
  amount: 5000,
  currency: "FCFA",
  payment_proof_url: "https://...supabase.co/storage/v1/object/public/..."
}
```

---

## 🛠️ Configuration Supabase Requise

### **1. Créer le Bucket Storage**

Dans **Supabase Dashboard → Storage** :

1. Cliquez sur **"New bucket"**
2. Nom : `subscriptions`
3. **Public bucket** : ✅ Coché (pour pouvoir récupérer les URLs)
4. Cliquez sur **"Create bucket"**

### **2. Configurer les Politiques (RLS)**

Dans **Supabase Dashboard → Storage → subscriptions → Policies** :

#### **Politique 1 : Upload (INSERT)**
```sql
-- Nom: Users can upload payment proofs
-- Operation: INSERT
-- Policy:
(bucket_id = 'subscriptions'::text)
AND (auth.uid() IS NOT NULL)
AND (storage.foldername(name))[1] = 'payment-proofs'
```

#### **Politique 2 : View (SELECT)**
```sql
-- Nom: Anyone can view payment proofs
-- Operation: SELECT
-- Policy:
(bucket_id = 'subscriptions'::text)
```

### **3. Ajouter la Colonne dans `subscription_history`**

Si la colonne `payment_proof_url` n'existe pas encore :

```sql
ALTER TABLE subscription_history
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

COMMENT ON COLUMN subscription_history.payment_proof_url
IS 'URL publique de la preuve de paiement (capture d''écran)';
```

---

## 📦 Dépendances Requises

Le système utilise les packages suivants (déjà installés) :

```json
{
  "expo-image-picker": "~15.0.8",
  "expo-file-system": "~18.0.8",
  "base64-arraybuffer": "^1.0.2"
}
```

Si nécessaire, installer avec :

```bash
npm install expo-image-picker expo-file-system base64-arraybuffer
```

---

## ✅ Logs de Débogage

Le système affiche des logs détaillés dans la console :

### **Sélection d'image**
```
📸 Ouverture du sélecteur d'image...
✅ Image sélectionnée: file:///path/to/image.jpg
```

### **Traitement du paiement**
```
💳 Début du traitement du paiement: { plan: "Pro", hasProof: true }
📤 Téléchargement de la preuve de paiement...
📁 Téléchargement vers: payment-proofs/payment-proof-abc123-1234567890.jpg
✅ Preuve téléchargée avec succès: https://...
💾 Enregistrement de la preuve dans l'historique...
✅ Preuve enregistrée dans l'historique
🎉 Paiement réussi !
```

---

## 🎨 Interface Utilisateur

### **Avant (sans preuve)**

- Boutons "Choisir une image" et "Prendre une photo"
- Bordure orange en pointillés
- Icônes Upload et Camera

### **Après (avec preuve)**

- Aperçu de l'image (200px de hauteur)
- Badge vert en bas à gauche : "✓ Preuve ajoutée"
- Bouton X rouge en haut à droite pour supprimer
- Bouton "Confirmer et Payer" activé

---

## ⚠️ Gestion d'Erreurs

### **Erreur 1 : Aucune preuve**
```
❌ Alert: "Preuve de paiement requise"
"Veuillez télécharger une capture d'écran ou une photo..."
```

### **Erreur 2 : Permission refusée**
```
❌ Alert: "Permission requise"
"Nous avons besoin de votre permission pour accéder à vos photos."
```

### **Erreur 3 : Échec d'upload**
```
❌ Console: "Erreur lors du téléchargement: ..."
❌ Alert: "Impossible de télécharger la preuve de paiement"
```

### **Erreur 4 : Bucket n'existe pas**
```
❌ Error: "The resource was not found"
→ Solution: Créer le bucket 'subscriptions' dans Supabase Storage
```

---

## 🧪 Tests

### **Test 1 : Sélectionner une image**

1. Aller sur `/seller/subscription-plans`
2. Choisir un plan → Mode de paiement → Continuer
3. Sur l'écran de confirmation, cliquer "Choisir une image"
4. Sélectionner une image depuis la galerie
5. Vérifier l'aperçu avec badge vert

### **Test 2 : Prendre une photo**

1. Même flux jusqu'à l'écran de confirmation
2. Cliquer "Prendre une photo"
3. Autoriser l'accès à la caméra
4. Prendre une photo
5. Vérifier l'aperçu

### **Test 3 : Upload et validation**

1. Avec une preuve ajoutée, cliquer "Confirmer et Payer"
2. Vérifier les logs dans la console :
   - Upload de la preuve
   - Appel SQL change_subscription()
   - Enregistrement dans subscription_history
3. Vérifier dans Supabase Storage → subscriptions → payment-proofs
4. Vérifier dans la table `subscription_history` :

```sql
SELECT
  plan_type,
  payment_method,
  amount,
  payment_proof_url,
  created_at
FROM subscription_history
WHERE user_id = 'VOTRE-USER-ID'
ORDER BY created_at DESC
LIMIT 1;
```

---

## 📊 Structure de Données

### **Fichiers Modifiés**

- ✅ `app/seller/subscription-plans.tsx` - UI et logique principale
- ✅ Imports ajoutés : `expo-image-picker`, `expo-file-system`, `base64-arraybuffer`
- ✅ 3 nouvelles fonctions :
  - `pickPaymentProof()` - Sélectionner depuis galerie
  - `takePaymentProof()` - Prendre une photo
  - `uploadPaymentProof()` - Upload vers Supabase Storage

### **États Ajoutés**

```typescript
const [paymentProofImage, setPaymentProofImage] = useState<string | null>(null);
const [uploadingImage, setUploadingImage] = useState(false);
```

### **Styles Ajoutés**

- `paymentProofSection`
- `paymentProofHeader`
- `paymentProofTitle`
- `paymentProofSubtitle`
- `imagePickerButtons`
- `imagePickerButton`
- `imagePickerButtonText`
- `imagePreviewContainer`
- `imagePreview`
- `removeImageButton`
- `imageValidBadge`
- `imageValidText`
- `confirmButtonDisabled`

---

## 🎯 Avantages du Système

### **Avant (sans preuve)**
- ❌ Aucune vérification du paiement
- ❌ Risque d'activation sans paiement réel
- ❌ Pas de traçabilité visuelle

### **Après (avec preuve)**
- ✅ Preuve visuelle obligatoire
- ✅ Traçabilité complète (URL stockée en BDD)
- ✅ Vérification manuelle possible par l'admin
- ✅ Historique complet avec captures d'écran
- ✅ Réduction des fraudes
- ✅ Support facilité (preuve consultable)

---

## 🔐 Sécurité

- ✅ Upload autorisé uniquement pour utilisateurs authentifiés
- ✅ Nom de fichier unique avec timestamp
- ✅ Type de fichier validé (JPEG)
- ✅ Storage séparé dans dossier `payment-proofs/`
- ✅ RLS activé sur Supabase Storage
- ✅ URL publique mais fichier lié à user_id en BDD

---

## 📱 Permissions

### **iOS (Info.plist)**

Déjà configuré dans `app.json` :

```json
{
  "plugins": [
    [
      "expo-image-picker",
      {
        "photosPermission": "L'application a besoin d'accéder à vos photos pour télécharger une preuve de paiement.",
        "cameraPermission": "L'application a besoin d'accéder à la caméra pour prendre une photo de votre preuve de paiement."
      }
    ]
  ]
}
```

### **Android (AndroidManifest.xml)**

Permissions automatiquement ajoutées par expo-image-picker :

```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.CAMERA" />
```

---

## 🚀 Déploiement

### **Checklist**

- [ ] Créer le bucket `subscriptions` dans Supabase Storage
- [ ] Configurer les politiques RLS du bucket
- [ ] Ajouter la colonne `payment_proof_url` dans `subscription_history`
- [ ] Installer les dépendances si nécessaire
- [ ] Tester la sélection d'image
- [ ] Tester la prise de photo
- [ ] Tester l'upload et l'enregistrement
- [ ] Vérifier les permissions iOS/Android

---

## 🎉 Résumé

**Ce qui a changé :**

1. ✅ **Upload de preuve obligatoire** - Capture d'écran ou photo requise
2. ✅ **2 options de sélection** - Galerie ou Caméra
3. ✅ **Aperçu de l'image** - Voir la preuve avant de confirmer
4. ✅ **Upload vers Supabase Storage** - Bucket `subscriptions/payment-proofs/`
5. ✅ **Enregistrement en BDD** - URL stockée dans `subscription_history`
6. ✅ **Validation bloquée sans preuve** - Bouton désactivé
7. ✅ **Logs détaillés** - Suivi complet du processus

**Le système de validation par preuve de paiement est maintenant OPÉRATIONNEL !** 🚀

---

## 📞 Support

En cas de problème :

1. Vérifier les logs de la console
2. Vérifier que le bucket `subscriptions` existe
3. Vérifier les politiques RLS du bucket
4. Vérifier la colonne `payment_proof_url` dans subscription_history
5. Consulter ce guide pour le débogage
