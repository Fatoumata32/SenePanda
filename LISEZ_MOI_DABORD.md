# 👋 LISEZ-MOI D'ABORD !

## 🎯 Vous Êtes Ici Parce Que...

Vous avez des **erreurs SQL** quand vous essayez d'activer la synchronisation automatique des abonnements.

**Bonne nouvelle :** J'ai créé des scripts qui corrigent automatiquement votre base de données !

---

## ⚡ Solution Rapide (5 minutes)

### Étape 1 : Ouvrir Supabase
https://supabase.com → Votre projet → **SQL Editor**

### Étape 2 : Exécuter 3 Scripts dans l'Ordre

**A. Corriger subscription_plans**
```
Fichier : supabase/FIX_SUBSCRIPTION_PLANS.sql
```
→ Copier/coller → RUN → Attendre "✅ SUBSCRIPTION_PLANS CORRIGÉ"

**B. Créer user_subscriptions**
```
Fichier : supabase/FIX_USER_SUBSCRIPTIONS.sql
```
→ Nouvelle requête → Copier/coller → RUN → Attendre "✅ USER_SUBSCRIPTIONS PRÊT"

**C. Activer Realtime**
```
Fichier : supabase/ENABLE_REALTIME_SUBSCRIPTIONS.sql
```
→ Nouvelle requête → Copier/coller → RUN → Attendre "✅ REALTIME CONFIGURÉ"

### Étape 3 : Redémarrer l'App
```bash
npx expo start --clear
```

---

## ✅ C'est Tout !

**Résultat :**
- Admin valide → Vendeur notifié (< 1 sec)
- Badge vert automatique
- Sans rafraîchir l'app

---

## 📚 Guides Disponibles

| Fichier | Quand l'Utiliser |
|---------|------------------|
| **SOLUTION_FINALE.md** | Guide complet avec tests |
| **ETAPES_EXACTES.md** | Pas-à-pas numéroté |
| **INSTALLATION_SIMPLE.md** | Instructions détaillées |

---

## 🆘 Erreur ?

**Envoyez-moi :**
1. Le numéro du script (A, B ou C)
2. Le message d'erreur complet

**Je vous aide immédiatement !**

---

**Temps :** 5 min
**Difficulté :** ⭐ Facile

🐼 **Commencez maintenant !**
