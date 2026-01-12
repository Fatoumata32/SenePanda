# 🔧 Fix: Row Level Security pour la Messagerie

## 🚨 Problème

```
Error creating conversation: {"code": "42501", "message": "new row violates row-level security policy for table \"conversations\""}
```

**Cause:** Les policies RLS (Row Level Security) de Supabase empêchent la création de conversations.

## ✅ Solution (Application Manuelle)

### Étape 1: Accéder au Dashboard Supabase

1. Allez sur **https://supabase.com/dashboard**
2. Sélectionnez votre projet: **inhzfdufjhuihtuykwmw**
3. Cliquez sur **"SQL Editor"** dans le menu de gauche

### Étape 2: Appliquer les Policies pour `conversations`

Copiez et exécutez ce SQL:

```sql
-- ===================================================================
-- FIX: Policies RLS pour la table conversations
-- ===================================================================

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Buyers can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Sellers can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Buyers can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update conversation read status" ON conversations;

-- Activer RLS sur la table conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Les acheteurs peuvent voir leurs conversations
CREATE POLICY "Buyers can view their conversations"
ON conversations
FOR SELECT
USING (auth.uid() = buyer_id);

-- Policy 2: Les vendeurs peuvent voir leurs conversations
CREATE POLICY "Sellers can view their conversations"
ON conversations
FOR SELECT
USING (auth.uid() = seller_id);

-- Policy 3: Les acheteurs peuvent créer des conversations
CREATE POLICY "Buyers can create conversations"
ON conversations
FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Policy 4: Les utilisateurs peuvent mettre à jour le compteur de non-lus
CREATE POLICY "Users can update conversation read status"
ON conversations
FOR UPDATE
USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
)
WITH CHECK (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);

-- Policy 5: Les utilisateurs peuvent supprimer leurs conversations
CREATE POLICY "Users can delete their conversations"
ON conversations
FOR DELETE
USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);
```

**Cliquez sur "Run" ou appuyez sur Ctrl+Enter**

### Étape 3: Appliquer les Policies pour `messages`

Dans le même SQL Editor, copiez et exécutez ce SQL:

```sql
-- ===================================================================
-- FIX: Policies RLS pour la table messages
-- ===================================================================

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- Activer RLS sur la table messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy 1: Les utilisateurs peuvent voir les messages de leurs conversations
CREATE POLICY "Users can view messages in their conversations"
ON messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
  )
);

-- Policy 2: Les utilisateurs peuvent envoyer des messages dans leurs conversations
CREATE POLICY "Users can send messages in their conversations"
ON messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
  )
  AND auth.uid() = sender_id
);

-- Policy 3: Les utilisateurs peuvent supprimer leurs propres messages
CREATE POLICY "Users can delete their own messages"
ON messages
FOR DELETE
USING (auth.uid() = sender_id);

-- Policy 4: Les utilisateurs peuvent mettre à jour leurs propres messages
CREATE POLICY "Users can update their own messages"
ON messages
FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);
```

**Cliquez sur "Run" ou appuyez sur Ctrl+Enter**

### Étape 4: Vérifier les Policies

Exécutez ce SQL pour vérifier que les policies sont actives:

```sql
-- Vérifier les policies de conversations
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'conversations';

-- Vérifier les policies de messages
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'messages';
```

**Résultat attendu:**
- 5 policies pour `conversations`
- 4 policies pour `messages`

## 🧪 Test après Application

1. **Redémarrez l'application Expo Go**
2. **Allez sur un produit**
3. **Cliquez sur "Contacter"**
4. **Vérifiez que la conversation se crée sans erreur**

## 📋 Checklist

- [ ] Accès au Dashboard Supabase
- [ ] SQL Editor ouvert
- [ ] Policies `conversations` appliquées
- [ ] Policies `messages` appliquées
- [ ] Vérification des policies réussie
- [ ] Test de création de conversation OK

## 🔍 Détails des Policies

### Conversations

| Policy | Action | Description |
|--------|--------|-------------|
| Buyers can view their conversations | SELECT | Les acheteurs voient leurs conversations |
| Sellers can view their conversations | SELECT | Les vendeurs voient leurs conversations |
| Buyers can create conversations | INSERT | Les acheteurs créent des conversations |
| Users can update conversation read status | UPDATE | Mise à jour des compteurs non-lus |
| Users can delete their conversations | DELETE | Suppression de conversations |

### Messages

| Policy | Action | Description |
|--------|--------|-------------|
| Users can view messages in their conversations | SELECT | Voir les messages de ses conversations |
| Users can send messages in their conversations | INSERT | Envoyer des messages |
| Users can delete their own messages | DELETE | Supprimer ses propres messages |
| Users can update their own messages | UPDATE | Modifier ses propres messages |

## 💡 Pourquoi RLS?

Row Level Security (RLS) protège vos données en s'assurant que:
- ✅ Les utilisateurs ne peuvent voir QUE leurs conversations
- ✅ Les utilisateurs ne peuvent créer des conversations qu'en tant qu'acheteur
- ✅ Les messages sont privés entre acheteur et vendeur
- ✅ Personne ne peut lire les messages des autres

## 🎉 Après l'Application

Une fois les policies appliquées, vous pourrez:
1. ✅ Créer des conversations depuis les produits
2. ✅ Envoyer des messages
3. ✅ Voir vos conversations dans l'onglet Messages
4. ✅ Recevoir des messages en temps réel

---

**Fichiers SQL créés:**
- [supabase/migrations/fix_conversations_rls_policies.sql](supabase/migrations/fix_conversations_rls_policies.sql)
- [supabase/migrations/fix_messages_rls_policies.sql](supabase/migrations/fix_messages_rls_policies.sql)

**Date:** 2026-01-12
**Erreur corrigée:** `42501 - new row violates row-level security policy`
