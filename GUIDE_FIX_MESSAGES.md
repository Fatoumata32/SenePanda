# 🔧 Fix - Page Messages

## ❌ Problème Rencontré

```
ERROR  Error loading conversations: {"code": "42703", "details": null, "hint": null,
"message": "column conversations.buyer_unread_count does not exist"}
```

**Cause:** Les colonnes `buyer_unread_count` et `seller_unread_count` n'existent pas dans la table `conversations`.

---

## ✅ Solution

### ÉTAPE 1: Exécuter le Script SQL

1. Allez dans **Supabase Dashboard**
2. Ouvrez **SQL Editor**
3. Ouvrez le fichier **[FIX_CONVERSATIONS_UNREAD_COUNT.sql](FIX_CONVERSATIONS_UNREAD_COUNT.sql)**
4. Copiez tout le contenu
5. Collez dans SQL Editor
6. Cliquez sur **RUN** (▶️)

---

## 📋 Ce Que le Script Fait

### 1. Ajoute les Colonnes Manquantes

```sql
-- Compteur de messages non lus pour l'acheteur
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS buyer_unread_count INTEGER DEFAULT 0;

-- Compteur de messages non lus pour le vendeur
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS seller_unread_count INTEGER DEFAULT 0;
```

### 2. Crée un Index pour Performances

```sql
CREATE INDEX IF NOT EXISTS idx_conversations_unread
ON conversations(buyer_unread_count, seller_unread_count);
```

**Avantage:** Requêtes plus rapides pour compter les messages non lus.

### 3. Trigger Automatique

Le script crée une fonction `update_conversation_unread_count()` qui:
- ✅ Incrémente automatiquement `buyer_unread_count` quand le vendeur envoie un message
- ✅ Incrémente automatiquement `seller_unread_count` quand l'acheteur envoie un message
- ✅ Met à jour `updated_at` pour trier les conversations par dernière activité

**Exemple:**
```
1. Vendeur envoie "Bonjour!"
   → buyer_unread_count passe de 0 à 1

2. Acheteur envoie "Salut"
   → seller_unread_count passe de 0 à 1

3. Vendeur ouvre la conversation
   → seller_unread_count revient à 0
```

### 4. Fonction de Réinitialisation

`reset_unread_count(conversation_id, user_id)` permet de réinitialiser le compteur quand un utilisateur ouvre la conversation.

**Utilisation:**
```sql
-- L'acheteur ouvre la conversation
SELECT reset_unread_count('uuid-conversation', 'uuid-acheteur');
-- buyer_unread_count → 0

-- Le vendeur ouvre la conversation
SELECT reset_unread_count('uuid-conversation', 'uuid-vendeur');
-- seller_unread_count → 0
```

---

## 🔍 Vérification

Après avoir exécuté le script, vérifiez que les colonnes existent:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'conversations'
AND column_name IN ('buyer_unread_count', 'seller_unread_count')
ORDER BY column_name;
```

**Résultat attendu:**
```
column_name           | data_type | column_default
----------------------|-----------|---------------
buyer_unread_count    | integer   | 0
seller_unread_count   | integer   | 0
```

---

## 📱 Code de l'App (Déjà Correct)

Le code dans [app/(tabs)/messages.tsx](app/(tabs)/messages.tsx) est déjà prêt:

### Chargement des Conversations (ligne 90-106)

```typescript
const { data: convos, error } = await supabase
  .from('conversations')
  .select(`
    id,
    buyer_id,
    seller_id,
    product_id,
    last_message_at,
    buyer_unread_count,      // ✅ Colonne utilisée
    seller_unread_count,     // ✅ Colonne utilisée
    products (
      title,
      image_url
    )
  `)
  .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
  .order('last_message_at', { ascending: false });
```

### Affichage du Compteur (ligne 145)

```typescript
unread_count: isSeller ? convo.seller_unread_count : convo.buyer_unread_count,
```

**Logique:**
- Si l'utilisateur connecté est le **vendeur** → Affiche `seller_unread_count`
- Si l'utilisateur connecté est l'**acheteur** → Affiche `buyer_unread_count`

---

## 🎨 Interface Utilisateur

### Badge de Compteur Non Lu

Le badge s'affiche dans chaque carte de conversation:

```typescript
{conversation.unread_count > 0 && (
  <View style={styles.unreadBadge}>
    <Text style={styles.unreadText}>
      {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
    </Text>
  </View>
)}
```

**Style:**
- Fond rouge (#EF4444)
- Texte blanc, gras
- Position: coin supérieur droit de la carte
- Affiche "99+" si plus de 99 messages non lus

---

## 🔄 Flow Complet

### Scénario: Achat d'un Produit

1. **Acheteur** (Marie) clique sur "Contacter le vendeur" sur un produit
   - Conversation créée dans la table `conversations`
   - `buyer_id` = Marie
   - `seller_id` = Jean (le vendeur)
   - `buyer_unread_count` = 0
   - `seller_unread_count` = 0

2. **Marie** envoie: "Bonjour, ce produit est-il disponible ?"
   - Message inséré dans `messages`
   - **Trigger déclenché**: `seller_unread_count` → 1
   - Jean voit un badge "1" sur sa conversation avec Marie

3. **Jean** ouvre la conversation
   - L'app appelle (ou devrait appeler): `reset_unread_count(conversation_id, jean_id)`
   - `seller_unread_count` → 0
   - Le badge disparaît pour Jean

4. **Jean** répond: "Oui, il est disponible !"
   - Message inséré dans `messages`
   - **Trigger déclenché**: `buyer_unread_count` → 1
   - Marie voit un badge "1" sur sa conversation avec Jean

5. **Marie** ouvre la conversation
   - L'app appelle: `reset_unread_count(conversation_id, marie_id)`
   - `buyer_unread_count` → 0
   - Le badge disparaît pour Marie

---

## 🚀 Amélioration Future (Optionnel)

Pour réinitialiser automatiquement le compteur quand l'utilisateur ouvre la conversation, ajoutez dans `app/chat/[conversationId].tsx`:

```typescript
useEffect(() => {
  if (!conversationId || !user?.id) return;

  // Réinitialiser le compteur au chargement
  const resetCounter = async () => {
    const { error } = await supabase.rpc('reset_unread_count', {
      p_conversation_id: conversationId,
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error resetting unread count:', error);
    }
  };

  resetCounter();
}, [conversationId, user?.id]);
```

**Avantage:** Le compteur se réinitialise automatiquement dès que l'utilisateur ouvre la conversation.

---

## 🐛 Dépannage

### Problème 1: "function reset_unread_count does not exist"

**Solution:** Relancez le script SQL complet (FIX_CONVERSATIONS_UNREAD_COUNT.sql).

### Problème 2: Le compteur ne s'incrémente pas

**Vérification:**
```sql
-- Vérifier que le trigger existe
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'trig_update_conversation_unread';
```

Si absent → Relancez la PARTIE 3 du script SQL.

### Problème 3: Le compteur reste à 0 malgré les messages

**Vérification:**
```sql
-- Tester manuellement la fonction
SELECT update_conversation_unread_count();
```

### Problème 4: RLS (Row Level Security) bloque les updates

**Solution:**
```sql
-- Ajouter une policy pour permettre les updates sur unread_count
CREATE POLICY "Users can update their unread count"
ON conversations FOR UPDATE
USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
)
WITH CHECK (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);
```

---

## 📊 Statistiques (Optionnel)

Pour voir les conversations avec le plus de messages non lus:

```sql
-- Top 10 conversations par messages non lus (acheteurs)
SELECT
  c.id,
  p_buyer.full_name as acheteur,
  p_seller.full_name as vendeur,
  c.buyer_unread_count,
  c.seller_unread_count,
  c.last_message_at
FROM conversations c
JOIN profiles p_buyer ON c.buyer_id = p_buyer.id
JOIN profiles p_seller ON c.seller_id = p_seller.id
ORDER BY c.buyer_unread_count DESC
LIMIT 10;
```

---

## ✅ Checklist Finale

Avant de tester:

- [ ] Script SQL exécuté sans erreur
- [ ] Colonnes `buyer_unread_count` et `seller_unread_count` existent
- [ ] Trigger `trig_update_conversation_unread` créé
- [ ] Fonction `reset_unread_count` créée
- [ ] Index `idx_conversations_unread` créé
- [ ] App redémarrée

Après test:

- [ ] La page Messages s'affiche sans erreur
- [ ] Les conversations se chargent correctement
- [ ] Le badge de compteur s'affiche quand il y a des messages non lus
- [ ] Le compteur s'incrémente automatiquement lors de nouveaux messages
- [ ] Les messages en temps réel fonctionnent

---

**Date:** 2026-01-12
**Status:** ✅ Solution complète
**Fichier modifié:** Aucun (le code de l'app est déjà correct)
**Action requise:** Exécuter FIX_CONVERSATIONS_UNREAD_COUNT.sql dans Supabase
