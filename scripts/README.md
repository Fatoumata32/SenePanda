# 🛠️ Scripts Utiles

Ce dossier contient des scripts utiles pour tester et maintenir votre application.

## 📋 Scripts Disponibles

### 1. Test de Connexion Supabase

**Fichier**: `test-supabase-connection.js`

**Description**: Script de diagnostic complet pour vérifier votre connexion Supabase et l'état de votre base de données.

**Usage**:
```bash
node scripts/test-supabase-connection.js
```

**Ce que le script vérifie**:
- ✅ Variables d'environnement (.env)
- ✅ Connexion à Supabase
- ✅ Existence de la table `profiles`
- ✅ Existence des tables critiques (products, categories, orders, etc.)
- ✅ Colonne `seller_id` dans la table `products`
- ✅ Buckets de stockage
- ✅ Session d'authentification

**Résultat attendu**:
```
🎉 RÉSUMÉ DU TEST
═══════════════════════════════
✅ Connexion Supabase: OK
✅ Base de données: Accessible
✅ Configuration: Correcte
```

**En cas d'erreur**:

1. **Variables d'environnement manquantes**
   ```
   ❌ EXPO_PUBLIC_SUPABASE_URL est manquant
   ```
   **Solution**: Vérifiez votre fichier `.env` à la racine du projet

2. **Tables manquantes**
   ```
   ❌ products: Table not found
   ```
   **Solution**: Exécutez les migrations Supabase (voir `supabase/README_MIGRATIONS.md`)

3. **Erreur de connexion**
   ```
   ❌ ERREUR DE CONNEXION
   ```
   **Solution**:
   - Vérifiez que votre projet Supabase est actif
   - Vérifiez les credentials dans Supabase Dashboard → Settings → API

4. **Colonne seller_id manquante**
   ```
   ⚠️ La colonne seller_id n'existe peut-être pas
   ```
   **Solution**: Exécutez la migration `20251117000000_add_seller_id_to_products.sql`

5. **Buckets de stockage manquants**
   ```
   ⚠️ Aucun bucket trouvé
   ```
   **Solution**: Exécutez la migration `create_storage_buckets.sql`

## 🚀 Utilisation Recommandée

### Avant de lancer l'app

Exécutez toujours ce script pour vérifier que tout fonctionne:

```bash
# 1. Test de connexion
node scripts/test-supabase-connection.js

# 2. Si tout est OK, lancez l'app
npm start
```

### Après avoir appliqué des migrations

```bash
# 1. Appliquez vos migrations sur Supabase
# (via SQL Editor ou CLI)

# 2. Vérifiez que tout est OK
node scripts/test-supabase-connection.js

# 3. Lancez l'app
npm start
```

### En cas de problème

```bash
# 1. Test diagnostic
node scripts/test-supabase-connection.js

# 2. Lisez les messages d'erreur
# 3. Appliquez les corrections suggérées
# 4. Relancez le test
```

## 📚 Documentation Complémentaire

- **Migrations Supabase**: Voir `supabase/README_MIGRATIONS.md`
- **Configuration Env**: Voir `.env.example`
- **Guide Rapide**: Voir `supabase/QUICK_START.md`

## 🆘 Support

Si le script de test échoue et que vous ne comprenez pas pourquoi:

1. Consultez les logs détaillés du script
2. Vérifiez `supabase/README_MIGRATIONS.md`
3. Vérifiez votre Dashboard Supabase
4. Contactez le support

---

*Scripts v1.0.0*
*Dernière mise à jour: 2025-11-18*
