# Scripts d'Administration SenePanda

## Guide Complet de Réinitialisation

Voir le guide complet : [ADMIN_RESET_GUIDE.md](../ADMIN_RESET_GUIDE.md)

## Utilisation Rapide

### Installation
```bash
npm install @supabase/supabase-js dotenv
cp .env.local.example .env.local
# Éditer .env.local avec vos clés Supabase
```

### Exécution
```bash
node scripts/reset-all-passwords.js
```

### Résultat
Tous les utilisateurs pourront se connecter avec le code PIN : **1234**

Pour plus de détails, consultez [ADMIN_RESET_GUIDE.md](../ADMIN_RESET_GUIDE.md)
