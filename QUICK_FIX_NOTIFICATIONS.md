# 🔔 Guide Rapide - Fix Notifications Badge

## ✅ Étapes à suivre:

### 1. Exécuter le script SQL (IMPORTANT!)

Vous DEVEZ d'abord créer les notifications dans la base de données:

1. Allez sur **Supabase Dashboard**: https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** (dans le menu gauche)
4. Cliquez sur **New Query**
5. Copiez-collez le contenu COMPLET du fichier:
   ```
   scripts/fix-notifications-final.sql
   ```
6. Cliquez sur **Run** (ou Ctrl+Enter)

### 2. Vérifier que ça a marché

Le script devrait afficher à la fin:
```
========================================
✅ Configuration terminée!
========================================
👥 Utilisateurs: 1 (ou plus)
🔔 Total notifications: 3 (ou plus)
📊 Notifications par utilisateur: ~3
========================================
🚀 Rechargez votre application pour voir le badge!
```

Si vous voyez des erreurs, copiez-les et dites-le moi.

### 3. Redémarrer l'application

Une fois le script SQL exécuté avec succès:

```bash
# Arrêter Expo (Ctrl+C dans le terminal)
# Puis redémarrer
npx expo start
```

Ou simplement **recharger l'app** sur votre téléphone/émulateur (secouez et "Reload").

### 4. Vérifier le badge

Sur la page d'accueil, vous devriez voir:
- 🔔 L'icône Bell (notifications)
- **Un badge rouge avec le chiffre 3** (ou plus)
- En mode DEV: un petit texte rouge sous l'icône qui affiche le nombre

## 🐛 Débogage

### Si le badge ne s'affiche toujours pas:

1. **Vérifiez les logs console** (dans votre terminal Expo):
   - Cherchez: `"🔍 Fetching notifications for user:"`
   - Cherchez: `"✅ Total notifications count:"`

2. **Vérifiez dans Supabase**:
   - Allez dans **Table Editor**
   - Sélectionnez la table `deal_notifications`
   - Vous devriez voir 3+ lignes avec votre `user_id`

3. **Vérifiez les RLS (Row Level Security)**:
   - Dans Table Editor > deal_notifications
   - Cliquez sur l'icône 🔒 (à côté du nom de la table)
   - Vérifiez que les policies sont bien activées

## 📊 Structure actuelle du code

Le code dans `app/(tabs)/home.tsx` fait:

1. ✅ Récupère l'utilisateur connecté
2. ✅ Compte les notifications dans `deal_notifications`
3. ✅ Affiche le badge si count > 0
4. ✅ Met à jour en temps réel
5. ✅ Logs détaillés pour debug

Le problème vient juste du fait que **les notifications n'existent pas encore** dans la base de données!

## 📝 Notes importantes

- Le badge affiche le **nombre TOTAL** de notifications (lues + non lues)
- Si > 99 notifications, affiche "99+"
- Le badge est rouge (#EF4444)
- Fonctionne en mode clair et sombre

## ❓ Besoin d'aide?

Si après avoir suivi ces étapes le badge ne s'affiche toujours pas, vérifiez:

1. Le script SQL s'est-il exécuté sans erreur?
2. Voyez-vous les logs console avec le compteur?
3. Quelle valeur affiche le texte rouge de debug?

Envoyez-moi ces informations!
