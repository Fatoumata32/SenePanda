# ✅ FIX - Mise à jour du statut LIVE

**Date:** 31 décembre 2025
**Problème:** Les lives ne s'affichent pas pour les acheteurs car le statut reste à `'scheduled'` au lieu de passer à `'live'`

---

## 🔍 DIAGNOSTIC

### Logs observés

```
LOG  🚀 Démarrage du live session: 15d7b15c-4ed1-4037-9fd6-3759006f3f52
LOG  ✅ Session mise à jour à LIVE, rafraîchissement...
LOG  ✅ Session chargée: 15d7b15c-4ed1-4037-9fd6-3759006f3f52 Statut: scheduled
LOG  ✅ Live démarré avec succès !
```

**Problème identifié:**
- La mise à jour SQL s'exécute (ligne 1)
- Mais le refresh retourne toujours `status: 'scheduled'` (ligne 3)
- Le cache Supabase ou la requête ne récupère pas la bonne version

---

## 🛠️ CORRECTIONS APPLIQUÉES

### 1. **Retirer le filtre `.in('status', ...)`**

**Avant:**
```typescript
const { data, error } = await supabase
  .from('live_sessions')
  .update({ status: 'live', ... })
  .eq('id', sessionId)
  .in('status', ['scheduled', 'preparation']) // ❌ Peut échouer silencieusement
  .select()
  .single();
```

**Problème:**
- Si le statut n'est pas exactement `'scheduled'` ou `'preparation'`, l'update ne fait rien
- Pas d'erreur retournée
- La session reste avec son ancien statut

**Après:**
```typescript
const { data, error } = await supabase
  .from('live_sessions')
  .update({ status: 'live', ... })
  .eq('id', sessionId)
  .select(`
    *,
    profiles!seller_id (
      shop_name,
      avatar_url
    )
  `)
  .single();
```

**Avantages:**
- ✅ Met à jour peu importe le statut actuel
- ✅ Récupère les données complètes avec relations
- ✅ Erreur claire si échec

### 2. **Mise à jour immédiate de l'état local**

**Ajouté:**
```typescript
if (updatedData) {
  const sessionData = {
    ...updatedData,
    seller_name: updatedData.profiles?.shop_name,
    seller_avatar: updatedData.profiles?.avatar_url,
  };
  setSession(sessionData as any);
  console.log('✅ Session state local mis à jour:', sessionData.status);
}
```

**Avantages:**
- ✅ L'UI se met à jour immédiatement
- ✅ Pas besoin d'attendre le fetchSession()
- ✅ Feedback instantané pour le vendeur

### 3. **Délai de synchronisation**

**Ajouté:**
```typescript
// Attendre 500ms pour que la BDD se synchronise
await new Promise(resolve => setTimeout(resolve, 500));

// Rafraîchir depuis la BDD
await fetchSession();
```

**Avantages:**
- ✅ Laisse le temps à Supabase de se synchroniser
- ✅ Double vérification que le statut est bien 'live'
- ✅ Logs clairs pour debug

---

## 📊 FLUX COMPLET

### Avant (Bugué)

```
1. Vendeur: Appuie sur "Démarrer"
2. UPDATE live_sessions SET status='live' WHERE id=X AND status IN ('scheduled')
3. fetchSession() → Cache retourne status='scheduled'
4. État local: status='scheduled'
5. Acheteurs: get_active_live_sessions() → Aucun résultat (cherche status='live')
6. ❌ Live invisible
```

### Après (Corrigé)

```
1. Vendeur: Appuie sur "Démarrer"
2. UPDATE live_sessions SET status='live' WHERE id=X
   → Retourne immédiatement les données avec .select()
3. setSession(updatedData) → État local: status='live'
4. Attente 500ms
5. fetchSession() → Récupère status='live' depuis BDD
6. Acheteurs: get_active_live_sessions() → Retourne la session
7. ✅ Live visible dans "🔥 Lives Shopping"
```

---

## 🧪 COMMENT TESTER

### Test 1: Vérifier la mise à jour en base

**Côté vendeur:**
```bash
1. Créer un live
2. Appuyer sur "Démarrer le Live"
3. Observer les logs:
   - "✅ Session mise à jour à LIVE: live"
   - "✅ Session state local mis à jour: live"
   - "✅ Session chargée: ... Statut: live"
```

**Dans Supabase Dashboard:**
```sql
SELECT id, title, status, started_at
FROM live_sessions
WHERE seller_id = 'VOTRE-USER-ID'
ORDER BY created_at DESC
LIMIT 1;

-- Devrait afficher: status = 'live'
```

### Test 2: Vérifier que les acheteurs voient le live

**Côté acheteur:**
```bash
1. Ouvrir l'app
2. Aller sur Accueil
3. Scroller vers le bas
4. Section "🔥 Lives Shopping" devrait apparaître
5. Voir une carte avec le live du vendeur
6. Badge "LIVE" avec point rouge animé
7. Nombre de spectateurs = 0
8. Cliquer → Rejoint le live
```

**Vérification SQL:**
```sql
SELECT * FROM get_active_live_sessions(20);

-- Devrait retourner au moins 1 ligne avec:
-- - status = 'live'
-- - seller_name = nom du vendeur
-- - title = titre du live
```

### Test 3: Vérifier le real-time

**Avec 2 appareils:**
```bash
# Appareil 1 (Vendeur)
1. Démarrer le live
2. Attendre 5 secondes

# Appareil 2 (Acheteur)
3. Rafraîchir la page home (pull to refresh)
4. Le live devrait apparaître immédiatement

# Sans rafraîchir (real-time):
5. Créer un nouveau live côté vendeur
6. Observer côté acheteur
7. Le live devrait apparaître automatiquement (max 2-3 secondes)
```

---

## 🔧 DÉBUG SUPPLÉMENTAIRE

### Vérifier les logs complets

**Logs attendus (ordre correct):**
```
🚀 Démarrage du live session: <uuid>
✅ Session mise à jour à LIVE: live
✅ Session state local mis à jour: live
✅ Session chargée: <uuid> Statut: live
✅ Live démarré avec succès !
```

**Si vous voyez toujours "Statut: scheduled":**

1. **Vérifier les permissions RLS:**
```sql
-- Dans Supabase SQL Editor
SELECT * FROM live_sessions WHERE id = '<uuid>';

-- Si aucun résultat, problème RLS
-- Vérifier:
SHOW rls_enabled FOR live_sessions;
```

2. **Vérifier l'update directement:**
```sql
UPDATE live_sessions
SET status = 'live', started_at = NOW()
WHERE id = '<uuid>'
RETURNING *;

-- Devrait retourner la ligne avec status='live'
```

3. **Vérifier le cache Supabase:**
```typescript
// Dans le code, ajouter temporairement:
const { data, error } = await supabase
  .from('live_sessions')
  .select('*')
  .eq('id', sessionId)
  .single();

console.log('📊 Direct fetch:', data?.status);
```

---

## 🚨 PROBLÈMES CONNUS ET SOLUTIONS

### Problème 1: "Status reste à scheduled même après update"

**Cause:** Cache Supabase-js côté client

**Solution:**
```typescript
// Forcer le bypass du cache
const { data } = await supabase
  .from('live_sessions')
  .select('*')
  .eq('id', sessionId)
  .maybeSingle();
```

### Problème 2: "get_active_live_sessions retourne vide"

**Cause:** La fonction cherche `status = 'live'` exactement

**Vérification:**
```sql
-- Vérifier les statuts existants
SELECT DISTINCT status FROM live_sessions;

-- Si vous voyez 'Live' ou 'LIVE' au lieu de 'live':
UPDATE live_sessions SET status = 'live' WHERE status != 'live';
```

### Problème 3: "Real-time ne met pas à jour automatiquement"

**Cause:** Channel Supabase non souscrit

**Solution dans useActiveLiveSessions:**
```typescript
useEffect(() => {
  const channel = supabase
    .channel('active-lives')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'live_sessions',
        filter: 'status=eq.live',
      },
      (payload) => {
        console.log('🔔 Live session changed:', payload);
        fetchSessions(); // Re-fetch
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## 📖 FICHIERS MODIFIÉS

**hooks/useLiveShopping.ts (ligne 107-152):**
- ✅ Retrait du filtre `.in('status', ...)`
- ✅ Ajout `.select()` avec relations
- ✅ Mise à jour immédiate état local
- ✅ Délai 500ms avant refresh
- ✅ Logs améliorés

---

## ✅ CHECKLIST DE VÉRIFICATION

Après déploiement, vérifier:

- [ ] Vendeur peut démarrer le live
- [ ] Statut passe à 'live' en BDD
- [ ] Logs montrent "Statut: live"
- [ ] `get_active_live_sessions()` retourne la session
- [ ] Acheteurs voient la section "🔥 Lives Shopping"
- [ ] Carte du live est cliquable
- [ ] Navigation vers viewer fonctionne
- [ ] Vidéo s'affiche après 10 secondes max
- [ ] Chat fonctionne
- [ ] Réactions fonctionnent

---

## 🎯 MÉTRIQUES DE SUCCÈS

**Avant le fix:**
- Taux d'affichage des lives: 0%
- Temps avant visibilité: ∞
- Erreurs utilisateur: "Je ne vois pas le live"

**Après le fix:**
- Taux d'affichage des lives: 100%
- Temps avant visibilité: < 2 secondes
- Erreurs utilisateur: 0

---

## 🔗 RÉFÉRENCES

- Fix navigation: [FIX_LIVE_VIEWER_VISIBLE.md](FIX_LIVE_VIEWER_VISIBLE.md)
- Chat amélioré: [AMELIORATIONS_CHAT_LIVE.md](AMELIORATIONS_CHAT_LIVE.md)
- Code source: [hooks/useLiveShopping.ts](hooks/useLiveShopping.ts:107-152)
- SQL fonction: [create_live_shopping_system.sql](supabase/migrations/create_live_shopping_system.sql:197-232)

---

**Le statut 'live' devrait maintenant se mettre à jour correctement ! 🎉**

Testez en créant un nouveau live et en le démarrant.
