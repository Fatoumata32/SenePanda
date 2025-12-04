# 🪣 Créer le Bucket Supabase Storage - Guide Rapide

## ⚠️ Erreur Actuelle

Si vous voyez cette erreur :
```
Échec du téléchargement de la preuve de paiement
Le bucket de stockage "subscriptions" n'existe pas encore.
```

C'est parce que le **bucket Supabase Storage** n'a pas encore été créé.

---

## 🚀 Solution (5 minutes)

### **Étape 1 : Ouvrir Supabase Dashboard**

1. Allez sur https://supabase.com
2. Connectez-vous
3. Sélectionnez votre projet **SenePanda**

---

### **Étape 2 : Créer le Bucket**

1. Dans le menu de gauche, cliquez sur **"Storage"** 📦
2. Cliquez sur le bouton **"New bucket"** (ou **"Create bucket"**)
3. Remplissez les informations :

   **Configuration du Bucket :**
   ```
   Nom du bucket : subscriptions
   Public bucket  : ✅ COCHÉ (très important !)
   File size limit: 5 MB (optionnel)
   Allowed MIME types: image/* (optionnel)
   ```

4. Cliquez sur **"Create bucket"** ou **"Save"**

---

### **Étape 3 : Configurer les Politiques (RLS)**

Une fois le bucket créé :

1. Cliquez sur le bucket **"subscriptions"**
2. Allez dans l'onglet **"Policies"**
3. Cliquez sur **"New Policy"**

#### **Politique 1 : Upload (INSERT)**

Créez une première politique pour permettre l'upload :

```
Nom : Users can upload payment proofs
Type : INSERT
Target roles : authenticated
```

**Policy definition :**
```sql
(bucket_id = 'subscriptions'::text)
AND (auth.uid() IS NOT NULL)
AND ((storage.foldername(name))[1] = 'payment-proofs'::text)
```

**Ou utilisez le template "Allow authenticated uploads"** et modifiez pour :
```sql
bucket_id = 'subscriptions' AND auth.role() = 'authenticated'
```

#### **Politique 2 : View (SELECT)**

Créez une deuxième politique pour permettre la visualisation :

```
Nom : Anyone can view payment proofs
Type : SELECT
Target roles : public (ou authenticated)
```

**Policy definition :**
```sql
bucket_id = 'subscriptions'::text
```

**Ou utilisez le template "Allow public read"**

---

### **Étape 4 : Vérifier**

1. Retournez dans l'application
2. Essayez à nouveau de télécharger une preuve de paiement
3. Vérifiez les logs dans la console

**Logs attendus :**
```
📤 Début du téléchargement de la preuve...
📁 Téléchargement vers: payment-proofs/payment-proof-abc123-1234567890.jpg
✅ Preuve téléchargée avec succès: https://...
```

---

## ✅ Configuration Alternative Rapide

Si vous voulez aller vite, voici une configuration simple :

### **Option Simple : Bucket Public Sans Restrictions**

1. Créez le bucket `subscriptions` en **PUBLIC**
2. Dans Policies, ajoutez **2 politiques simples** :

**Policy 1 (Upload) :**
```sql
-- Template: Allow authenticated uploads
CREATE POLICY "authenticated_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'subscriptions');
```

**Policy 2 (Read) :**
```sql
-- Template: Allow public read
CREATE POLICY "public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'subscriptions');
```

---

## 🔍 Vérifier dans Supabase SQL Editor

Pour vérifier que le bucket existe :

```sql
-- Vérifier les buckets
SELECT * FROM storage.buckets WHERE name = 'subscriptions';

-- Vérifier les politiques
SELECT * FROM storage.policies WHERE bucket_id = 'subscriptions';
```

**Résultat attendu :**
- 1 bucket avec `name = 'subscriptions'` et `public = true`
- Au moins 2 politiques (INSERT et SELECT)

---

## 📸 Structure des Fichiers

Une fois configuré, les preuves seront stockées ainsi :

```
subscriptions/
  └── payment-proofs/
      ├── payment-proof-user1-1234567890.jpg
      ├── payment-proof-user2-1234567891.jpg
      └── payment-proof-user3-1234567892.jpg
```

**URL publique exemple :**
```
https://votre-projet.supabase.co/storage/v1/object/public/subscriptions/payment-proofs/payment-proof-abc123-1234567890.jpg
```

---

## ⚠️ Erreurs Courantes

### **Erreur : "not found" ou 404**
→ Le bucket n'existe pas encore. Créez-le (Étape 2).

### **Erreur : "permission denied" ou "policy"**
→ Les politiques RLS ne sont pas configurées. Configurez-les (Étape 3).

### **Erreur : "Invalid bucket"**
→ Vérifiez le nom du bucket (doit être exactement `subscriptions`).

### **Erreur : "File too large"**
→ Augmentez la taille max du bucket ou compressez l'image.

---

## 🎯 Checklist Rapide

- [ ] Bucket `subscriptions` créé
- [ ] Bucket configuré en **PUBLIC**
- [ ] Politique INSERT ajoutée (authenticated users)
- [ ] Politique SELECT ajoutée (public read)
- [ ] Test d'upload réussi dans l'application

---

## 📞 Besoin d'Aide ?

Si vous avez toujours des erreurs après avoir suivi ces étapes :

1. Vérifiez les logs de la console pour voir le message d'erreur exact
2. Vérifiez que le bucket est bien **public**
3. Vérifiez que les politiques RLS sont bien créées
4. Consultez `VALIDATION_PREUVE_PAIEMENT.md` pour plus de détails

---

## 🎉 C'est Tout !

Une fois le bucket créé et configuré, le système de validation par preuve de paiement fonctionnera parfaitement ! 🚀

**Temps estimé : 5-10 minutes**
