# Guide de création des profils utilisateurs

Ce guide vous explique comment créer des profils de test pour votre marketplace.

## Méthode 1: Script automatique (Recommandé)

### Étape 1: Obtenir la clé Service Role

1. Allez sur votre dashboard Supabase:
   https://supabase.com/dashboard/project/inhzfdufjhuihtuykwmw/settings/api

2. Copiez la clé **service_role** (pas la clé anon!)

3. Ajoutez-la dans votre fichier `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role_ici
   ```

⚠️ **IMPORTANT**: La clé service_role est confidentielle. Ne la partagez jamais et ne la commitez pas dans Git!

### Étape 2: Exécuter le script

```bash
npm run db:create-users
```

Ce script va créer automatiquement:
- **3 clients** (Marie Kouassi, Jean Diop, Fatima Touré)
- **5 vendeurs** avec leurs boutiques

### Étape 3: Se connecter

Tous les comptes utilisent le mot de passe: `Test123!`

**Exemples de connexion:**
- Username: `marie_kouassi`
- Username: `amadou_diallo`
- Email: `aicha.ndiaye@example.com`

---

## Méthode 2: Création manuelle via Dashboard

### Option A: Via l'interface Supabase

1. Allez dans **Authentication > Users**:
   https://supabase.com/dashboard/project/inhzfdufjhuihtuykwmw/auth/users

2. Cliquez sur **"Add user"**

3. Remplissez:
   - Email: `exemple@test.com`
   - Password: `Test123!`
   - Auto Confirm User: ✅ (coché)

4. Copiez l'UUID généré

5. Allez dans **Table Editor > profiles**

6. Cliquez sur **"Insert row"**

7. Remplissez les champs:
   ```
   id: [L'UUID copié]
   username: nom_utilisateur_unique
   full_name: Nom Complet
   is_seller: false (ou true pour un vendeur)
   phone: +XXX XX XX XX XX
   country: Nom du pays
   ```

   Pour un vendeur, ajoutez aussi:
   ```
   shop_name: Nom de la boutique
   shop_description: Description de la boutique
   ```

### Option B: Via SQL

1. Allez dans **SQL Editor**:
   https://supabase.com/dashboard/project/inhzfdufjhuihtuykwmw/editor

2. Exécutez d'abord ce code pour créer un utilisateur:
   ```sql
   -- Créer un utilisateur
   SELECT auth.uid() -- Pour obtenir votre propre UUID si connecté
   ```

3. Ensuite, utilisez le fichier de migration:
   ```bash
   npm run db:migrations
   ```

4. Copiez le contenu de `20251012000200_create_sample_profiles.sql`

5. Remplacez les `gen_random_uuid()` par les UUIDs réels

6. Exécutez le SQL

---

## Liste des profils créés

### Clients (3)

| Nom | Username | Email | Pays |
|-----|----------|-------|------|
| Marie Kouassi | `marie_kouassi` | marie.kouassi@example.com | Côte d'Ivoire |
| Jean Diop | `jean_diop` | jean.diop@example.com | Sénégal |
| Fatima Touré | `fatima_toure` | fatima.toure@example.com | Mali |

### Vendeurs (5)

| Nom | Username | Boutique | Spécialité | Pays |
|-----|----------|----------|------------|------|
| Amadou Diallo | `amadou_diallo` | Artisanat Diallo | Artisanat traditionnel | Côte d'Ivoire |
| Aïcha Ndiaye | `aicha_ndiaye` | Boutique Aïcha Mode | Mode africaine | Sénégal |
| Kofi Mensah | `kofi_mensah` | Bijoux Kofi | Bijoux artisanaux | Ghana |
| Mariam Traoré | `mariam_traore` | Tissus Mariam | Tissus traditionnels | Mali |
| Youssef Ben Ali | `youssef_benali` | Déco Africaine | Décoration | Maroc |

**Mot de passe pour tous**: `Test123!`

---

## Vérification

Pour vérifier que les profils sont créés:

1. Allez dans **Table Editor > profiles**:
   https://supabase.com/dashboard/project/inhzfdufjhuihtuykwmw/editor

2. Vous devriez voir tous les profils avec leurs usernames

3. Testez la connexion dans l'application avec un username ou email

---

## Dépannage

### Erreur: "SUPABASE_SERVICE_ROLE_KEY manquante"
- Vérifiez que vous avez bien ajouté la clé dans le fichier `.env`
- Redémarrez votre terminal après avoir modifié `.env`

### Erreur: "User already registered"
- L'utilisateur existe déjà dans la base
- Vous pouvez vous connecter directement avec cet email

### Erreur: "Unique violation on username"
- Le username est déjà pris
- Choisissez un autre username unique

### Les profils n'apparaissent pas
- Vérifiez que les migrations ont été appliquées (`npm run db:migrations`)
- Vérifiez que la table `profiles` existe dans Supabase
- Vérifiez que le champ `username` a été ajouté à la table

---

## Commandes utiles

```bash
# Afficher les migrations SQL
npm run db:migrations

# Créer les utilisateurs de test
npm run db:create-users

# Lancer l'application
npm run dev
```
