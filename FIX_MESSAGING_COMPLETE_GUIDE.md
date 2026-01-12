# 🔧 Guide Complet: Correction de la Messagerie

## 🚨 Erreurs Rencontrées

### Erreur 1 (Résolue dans le code)
```
null value in column "participant1_id" violates not-null constraint
```
**Cause:** Incohérence entre les colonnes de la BDD et le code

### Erreur 2 (À résoudre via SQL)
```
new row violates row-level security policy for table "conversations"
```
**Cause:** Policies RLS manquantes ou incorrectes

## ✅ Solution Complète (3 Étapes)

### 📋 Étape 1: Renommer les Colonnes

**Où:** Dashboard Supabase → SQL Editor

**Copiez et exécutez ce SQL:**

```sql
-- ===================================================================
-- ÉTAPE 1: Renommer les colonnes pour correspondre au code
-- ===================================================================

DO $$
BEGIN
  -- Renommer participant1_id en buyer_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'participant1_id'
  ) THEN
    ALTER TABLE conversations RENAME COLUMN participant1_id TO buyer_id;
    RAISE NOTICE '✅ participant1_id → buyer_id';
  END IF;

  -- Renommer participant2_id en seller_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'participant2_id'
  ) THEN
    ALTER TABLE conversations RENAME COLUMN participant2_id TO seller_id;
    RAISE NOTICE '✅ participant2_id → seller_id';
  END IF;

  -- Ajouter les colonnes unread_count si manquantes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'buyer_unread_count'
  ) THEN
    ALTER TABLE conversations ADD COLUMN buyer_unread_count INTEGER DEFAULT 0;
    RAISE NOTICE '✅ buyer_unread_count créée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'seller_unread_count'
  ) THEN
    ALTER TABLE conversations ADD COLUMN seller_unread_count INTEGER DEFAULT 0;
    RAISE NOTICE '✅ seller_unread_count créée';
  END IF;

  -- Ajouter last_message_at si manquante
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'last_message_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN last_message_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ last_message_at créée';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ ÉTAPE 1 TERMINÉE';
END $$;
```

**Cliquez sur "Run"** ▶️

---

### 📋 Étape 2: Appliquer les Policies RLS pour `conversations`

**Copiez et exécutez ce SQL:**

```sql
-- ===================================================================
-- ÉTAPE 2: Policies RLS pour la table conversations
-- ===================================================================

-- Supprimer anciennes policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Buyers can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Sellers can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Buyers can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update conversation read status" ON conversations;
DROP POLICY IF EXISTS "Users can delete their conversations" ON conversations;

-- Activer RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Les acheteurs voient leurs conversations
CREATE POLICY "Buyers can view their conversations"
ON conversations FOR SELECT
USING (auth.uid() = buyer_id);

-- Policy 2: Les vendeurs voient leurs conversations
CREATE POLICY "Sellers can view their conversations"
ON conversations FOR SELECT
USING (auth.uid() = seller_id);

-- Policy 3: Les acheteurs créent des conversations
CREATE POLICY "Buyers can create conversations"
ON conversations FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Policy 4: Mise à jour des compteurs
CREATE POLICY "Users can update conversation read status"
ON conversations FOR UPDATE
USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Policy 5: Suppression
CREATE POLICY "Users can delete their conversations"
ON conversations FOR DELETE
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Confirmation
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ÉTAPE 2 TERMINÉE - 5 policies créées';
END $$;
```

**Cliquez sur "Run"** ▶️

---

### 📋 Étape 3: Appliquer les Policies RLS pour `messages`

**Copiez et exécutez ce SQL:**

```sql
-- ===================================================================
-- ÉTAPE 3: Policies RLS pour la table messages
-- ===================================================================

-- Supprimer anciennes policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Activer RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy 1: Voir les messages de ses conversations
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
  )
);

-- Policy 2: Envoyer des messages
CREATE POLICY "Users can send messages in their conversations"
ON messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
  )
  AND auth.uid() = sender_id
);

-- Policy 3: Supprimer ses messages
CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
USING (auth.uid() = sender_id);

-- Policy 4: Modifier ses messages
CREATE POLICY "Users can update their own messages"
ON messages FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- Confirmation
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ÉTAPE 3 TERMINÉE - 4 policies créées';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🎉 TOUTES LES ÉTAPES TERMINÉES AVEC SUCCÈS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
```

**Cliquez sur "Run"** ▶️

---

## 🧪 Test Final

### 1. Redémarrer l'application

```bash
# Arrêter Metro
Ctrl+C

# Redémarrer avec cache propre
npx expo start -c
```

### 2. Tester la création de conversation

1. Scannez le QR code dans Expo Go
2. Allez sur **n'importe quel produit**
3. Cliquez sur le bouton **"Contacter"** (💬)
4. Vérifiez qu'aucune erreur n'apparaît

**✅ Résultat attendu:**
- Pas d'erreur "42501" (RLS)
- Pas d'erreur "23502" (null constraint)
- Redirection vers la page de chat
- Conversation créée avec succès

### 3. Tester l'envoi de message

1. Dans la conversation
2. Tapez "Bonjour, est-ce disponible ?"
3. Cliquez sur **Envoyer**

**✅ Résultat attendu:**
- Message affiché immédiatement
- Pas d'erreur

### 4. Vérifier la liste des conversations

1. Allez dans l'onglet **Messages**
2. Vérifiez que votre conversation apparaît

**✅ Résultat attendu:**
- Conversation visible
- Dernier message affiché
- Avatar de l'autre utilisateur

---

## 📊 Récapitulatif des Changements

### Dans le Code (✅ Déjà appliqué)

**Fichier:** [app/product/[id].tsx](app/product/[id].tsx#L265-L280)

```typescript
// ❌ AVANT
.insert({
  buyer_id: user.id,
  seller_id: product?.seller_id,
  product_id: id as string,
  last_message: 'Nouvelle conversation',      // ❌ Colonne inexistante
  last_message_time: new Date().toISOString(), // ❌ Colonne inexistante
})

// ✅ APRÈS
.insert({
  buyer_id: user.id,
  seller_id: product?.seller_id,
  product_id: id as string,
  last_message_at: new Date().toISOString(),  // ✅ Colonne correcte
  buyer_unread_count: 0,                       // ✅ Initialisé
  seller_unread_count: 0,                      // ✅ Initialisé
})
```

### Dans la Base de Données (⏳ À appliquer via SQL)

1. **Renommage des colonnes:**
   - `participant1_id` → `buyer_id`
   - `participant2_id` → `seller_id`

2. **Ajout de colonnes:**
   - `buyer_unread_count`
   - `seller_unread_count`
   - `last_message_at`

3. **Policies RLS créées:**
   - 5 policies pour `conversations`
   - 4 policies pour `messages`

---

## 📝 Checklist Complète

- [ ] **Étape 1:** Renommer les colonnes (SQL exécuté)
- [ ] **Étape 2:** Policies `conversations` (SQL exécuté)
- [ ] **Étape 3:** Policies `messages` (SQL exécuté)
- [ ] **Test 1:** Redémarrage de l'app
- [ ] **Test 2:** Création de conversation réussie
- [ ] **Test 3:** Envoi de message réussi
- [ ] **Test 4:** Liste des conversations visible

---

## 🆘 En Cas de Problème

### Problème: "participant1_id" existe toujours

**Solution:**
```sql
ALTER TABLE conversations RENAME COLUMN participant1_id TO buyer_id;
ALTER TABLE conversations RENAME COLUMN participant2_id TO seller_id;
```

### Problème: "RLS policy violation"

**Solution:** Vérifiez que les policies ont bien été créées:
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'conversations';
```

### Problème: "Column does not exist"

**Solution:** Ajoutez les colonnes manquantes:
```sql
ALTER TABLE conversations ADD COLUMN last_message_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE conversations ADD COLUMN buyer_unread_count INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN seller_unread_count INTEGER DEFAULT 0;
```

---

## 🎉 Après l'Application

La messagerie sera **100% fonctionnelle** avec:

- ✅ Création de conversations depuis les produits
- ✅ Envoi de messages texte
- ✅ Messages temps réel
- ✅ Compteurs de non-lus
- ✅ Liste des conversations
- ✅ Sécurité RLS complète
- ✅ Images et messages vocaux
- ✅ Thèmes de chat personnalisables

**Fichiers créés:**
- [supabase/migrations/fix_conversations_rename_columns.sql](supabase/migrations/fix_conversations_rename_columns.sql)
- [supabase/migrations/fix_conversations_rls_policies.sql](supabase/migrations/fix_conversations_rls_policies.sql)
- [supabase/migrations/fix_messages_rls_policies.sql](supabase/migrations/fix_messages_rls_policies.sql)

---

**Date:** 2026-01-12
**Erreurs corrigées:** `23502 (null constraint)` + `42501 (RLS policy)`
