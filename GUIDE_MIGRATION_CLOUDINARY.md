# 🚀 Guide de Migration : Supabase vers Cloudinary

Ce guide explique comment utiliser le script automatisé pour migrer les médias (images et vidéos) hébergés sur Supabase vers Cloudinary, et mettre à jour la base de données Firebase Firestore.

## 📋 Prérequis

1. **Node.js** doit être installé sur votre machine.
2. Vous devez avoir des clés d'API **Cloudinary**.
3. Vous devez avoir une clé de service **Firebase Admin** (`serviceAccountKey.json`).

## ⚙️ Étape 1 : Installer les dépendances

Assurez-vous que les paquets requis sont installés à la racine du projet. Ouvrez un terminal à la racine (`c:\Users\PC\Downloads\project-bolt-sb1-qw6kprzq\project`) et exécutez :

```bash
npm install firebase-admin cloudinary dotenv
```

*(Si `cloudinary` et `dotenv` sont déjà présents, seul `firebase-admin` sera ajouté).*

## 🔐 Étape 2 : Configurer les Identifiants

### A) Firebase (Service Account Key)
Le script utilise le **Firebase Admin SDK** pour accéder directement à Firestore avec les droits complets.
1. Allez sur la [Console Firebase](https://console.firebase.google.com/).
2. Ouvrez les **Paramètres du projet** (l'icône engrenage ⚙️).
3. Allez dans l'onglet **Comptes de service**.
4. Cliquez sur le bouton **Générer une nouvelle clé privée**.
5. Un fichier JSON sera téléchargé. Placez-le à la racine de votre projet et renommez-le : `serviceAccountKey.json`.

*(Le fichier est ignoré par Git par défaut ou devrait l'être, ne le commitez jamais !)*

### B) Variables d'environnement
Créez ou modifiez le fichier `.env` à la racine de votre projet et ajoutez vos clés Cloudinary :

```env
CLOUDINARY_CLOUD_NAME=di4dctosn
CLOUDINARY_API_KEY=votre_api_key_ici
CLOUDINARY_API_SECRET=votre_api_secret_ici
```

*(Assurez-vous d'avoir remplacé `votre_api_key_ici` et `votre_api_secret_ici` par les vraies valeurs disponibles sur le [dashboard Cloudinary](https://cloudinary.com/console).)*

## 🏃 Étape 3 : Lancer la migration

Une fois la configuration prête, vous pouvez lancer le script avec :

```bash
node scripts/migrate-to-cloudinary.js
```

### 💡 Comportement du script :

- **Automatique :** Il parcourt la collection `products`.
- **Intelligent :** Il ignore les documents qui ne proviennent pas de `supabase`, ou ceux qui ont déjà `migrated: true`.
- **Sécurisé :** Les erreurs de téléchargement (image supprimée sur Supabase, etc.) n'arrêtent pas l'exécution. Vous pouvez relancer le script pour les cas en erreur.
- **Vidéos & Bonus :** Pour les vidéos, le script génère automatiquement une version `.jpg` de l'URL (`thumbnail`) hébergée sur Cloudinary et ajoute le champ `migrated_at`.

## 🧹 Étape 4 (Optionnelle) : Nettoyage

Une fois la migration terminée avec succès (vérifiez sur votre application que toutes les images et vidéos s'affichent correctement depuis Cloudinary) :
1. Vous pouvez envisager de supprimer le bucket de stockage Supabase pour économiser de l'espace.
2. Vous pouvez supprimer le fichier `serviceAccountKey.json` de votre machine locale si vous n'en avez plus besoin.

**Félicitations, vous avez centralisé tous vos fichiers sur Cloudinary ! 🎉**
