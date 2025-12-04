# 💰 Mise à jour des prix d'abonnement

## Nouveaux prix (décembre 2025)

| Plan      | Mensuel   | Annuel     | Économie |
|-----------|-----------|------------|----------|
| **Free**  | 0 FCFA    | 0 FCFA     | -        |
| **Starter** | 3000 FCFA | 30000 FCFA | 6000 FCFA (17%) |
| **Pro**   | 7000 FCFA | 70000 FCFA | 14000 FCFA (17%) |
| **Premium** | 15000 FCFA | 150000 FCFA | 30000 FCFA (17%) |

## 🎯 Changements

### Anciens prix → Nouveaux prix

- **Starter**: 2500 FCFA → **3000 FCFA** (+500 FCFA)
- **Pro**: 5000 FCFA → **7000 FCFA** (+2000 FCFA)
- **Premium**: 10000 FCFA → **15000 FCFA** (+5000 FCFA)

## 🚀 Comment appliquer les nouveaux prix

### Option 1: Via le Dashboard Supabase (Recommandé)

1. Ouvrez votre projet Supabase
2. Allez dans **SQL Editor**
3. Copiez et exécutez le contenu du fichier:
   ```
   supabase/UPDATE_SUBSCRIPTION_PRICES.sql
   ```
4. Cliquez sur **Run**
5. Vérifiez les messages de confirmation

### Option 2: Via le fichier de migration

Le fichier suivant a déjà été mis à jour:
```
supabase/migrations/insert_default_subscription_plans.sql
```

Si vous recréez la base de données, les nouveaux prix seront automatiquement appliqués.

## ✅ Vérification

Après avoir appliqué les changements, vérifiez dans l'app:

1. Allez dans **Profil → Abonnement**
2. Vérifiez que les prix affichés sont corrects:
   - Starter: 3000 FCFA/mois
   - Pro: 7000 FCFA/mois
   - Premium: 15000 FCFA/mois

## 📝 Notes importantes

- Les utilisateurs avec des abonnements existants conservent leur prix actuel jusqu'au renouvellement
- Les nouveaux prix s'appliquent uniquement aux nouveaux abonnements
- Les prix annuels incluent une réduction de ~17%

## 🎨 Badge d'abonnement

Le nouveau badge premium sur l'avatar du profil s'affiche automatiquement pour:
- **Starter**: Badge bleu
- **Pro**: Badge violet
- **Premium**: Badge or

Le badge remplace l'icône de caméra pour les utilisateurs avec un abonnement payant.

---

**Date de mise à jour**: 3 décembre 2025
**Fichiers modifiés**:
- `supabase/migrations/insert_default_subscription_plans.sql`
- `supabase/UPDATE_SUBSCRIPTION_PRICES.sql` (nouveau)
