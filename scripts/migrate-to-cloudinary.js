require('dotenv').config();
const path = require('path');
const admin = require('firebase-admin');
const cloudinary = require('cloudinary').v2;
const { createClient } = require('@supabase/supabase-js');

// ==========================================
// ⚙️ CONFIGURATION CLOUDINARY
// ==========================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'di4dctosn',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// ==========================================
// ⚙️ CONFIGURATION SUPABASE
// ==========================================
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ==========================================
// 🔐 INITIALISATION FIREBASE ADMIN SDK
// ==========================================
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  ? path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
  : path.resolve(process.cwd(), 'types/senepanda-6f7c5-firebase-adminsdk-fbsvc-ef1e73831b.json');

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error(`\n❌ ERREUR : Fichier service account introuvable : ${serviceAccountPath}`);
  process.exit(1);
}

try {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (error) {
  // Déjà initialisé
}

const db = admin.firestore();

// ==========================================
// 🔧 HELPER : Upload vers Cloudinary
// ==========================================
async function uploadToCloudinary(url, type) {
  const result = await cloudinary.uploader.upload(url, {
    upload_preset: 'senepanda',
    folder: 'senepanda/products',
    resource_type: 'auto'
  });

  let thumbnail = null;
  if (type === 'video') {
    thumbnail = cloudinary.url(result.public_id, {
      resource_type: 'video',
      format: 'jpg'
    });
  }
  return { secure_url: result.secure_url, thumbnail };
}

// ==========================================
// 🚀 MIGRATION PRINCIPALE
// ==========================================
async function migrateAll() {
  console.log('\n🚀 DÉBUT MIGRATION COMPLÈTE : Supabase → Firebase + Cloudinary');
  console.log('==================================================================\n');

  let page = 0;
  const PAGE_SIZE = 100;
  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let hasMore = true;

  while (hasMore) {
    // Récupérer les produits depuis Supabase par pages
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) {
      console.error('❌ Erreur Supabase:', error.message);
      break;
    }

    if (!products || products.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`📄 Page ${page + 1} — ${products.length} produits récupérés depuis Supabase`);

    const batch = db.batch();
    let batchCount = 0;

    for (const product of products) {
      const docRef = db.collection('products').doc(product.id);

      // Vérifier si déjà migré dans Firestore
      const existing = await docRef.get();
      if (existing.exists && existing.data()?.migrated === true) {
        totalSkipped++;
        console.log(`   ⏭️  [${product.id}] Déjà migré, ignoré.`);
        continue;
      }

      // Préparer les données de base du document
      const firestoreData = {
        ...product,
        migrated: false,
        source: 'supabase',
        migrated_at: null
      };

      // Traiter l'image/video principale
      const mediaUrl = product.media_url || product.image_url || (product.images && product.images[0]);

      if (mediaUrl && (mediaUrl.includes('supabase') || !mediaUrl.includes('cloudinary'))) {
        try {
          console.log(`   ⏳ [${product.id}] Upload vers Cloudinary...`);
          const { secure_url, thumbnail } = await uploadToCloudinary(mediaUrl, product.type || 'image');

          firestoreData.media_url = secure_url;
          firestoreData.migrated = true;
          firestoreData.source = 'cloudinary';
          firestoreData.migrated_at = admin.firestore.FieldValue.serverTimestamp();

          if (thumbnail) {
            firestoreData.thumbnail = thumbnail;
          }
          // Aussi mettre à jour image_url si le champ existe
          if (product.image_url) {
            firestoreData.image_url = secure_url;
          }

          console.log(`   ✅ [${product.id}] Cloudinary OK → ${secure_url.substring(0, 60)}...`);
          totalMigrated++;
        } catch (uploadErr) {
          console.error(`   ❌ [${product.id}] Erreur upload Cloudinary: ${uploadErr.message}`);
          // On sauvegarde quand même dans Firestore avec l'URL Supabase
          firestoreData.migrated = false;
          firestoreData.source = 'supabase';
          totalErrors++;
        }
      } else if (mediaUrl && mediaUrl.includes('cloudinary')) {
        // URL déjà sur Cloudinary
        firestoreData.migrated = true;
        firestoreData.source = 'cloudinary';
        firestoreData.migrated_at = admin.firestore.FieldValue.serverTimestamp();
        console.log(`   ✅ [${product.id}] URL déjà Cloudinary, sauvegarde Firestore.`);
        totalMigrated++;
      } else {
        console.log(`   ⚠️  [${product.id}] Pas de media_url, sauvegarde sans media.`);
      }

      batch.set(docRef, firestoreData, { merge: true });
      batchCount++;

      // Firestore limite à 500 opérations par batch
      if (batchCount >= 400) {
        await batch.commit();
        console.log(`\n   💾 Batch de ${batchCount} documents sauvegardé dans Firestore.\n`);
        batchCount = 0;
      }
    }

    // Commit du dernier batch
    if (batchCount > 0) {
      await batch.commit();
      console.log(`\n   💾 Batch final de ${batchCount} documents sauvegardé dans Firestore.\n`);
    }

    hasMore = products.length === PAGE_SIZE;
    page++;
  }

  // ==========================================
  // 📊 RÉSUMÉ FINAL
  // ==========================================
  console.log('\n📊 ====== RÉSUMÉ FINAL ======');
  console.log(`Produits migrés (Cloudinary) : ${totalMigrated}`);
  console.log(`Produits ignorés (déjà fait) : ${totalSkipped}`);
  console.log(`Erreurs upload Cloudinary    : ${totalErrors}`);
  console.log('================================');

  if (totalErrors > 0) {
    console.log('\n⚠️  Relancez le script pour réessayer les erreurs.');
  } else if (totalMigrated + totalSkipped > 0) {
    console.log('\n🎉 MIGRATION TERMINÉE AVEC SUCCÈS !');
    console.log('   ✅ Données dans Firebase Firestore (collection "products")');
    console.log('   ✅ Médias sur Cloudinary (senepanda/products)');
  } else {
    console.log('\n⚠️  Aucun produit trouvé dans Supabase (table "products").');
    console.log('   Vérifiez le nom de la table dans votre base Supabase.');
  }
}

migrateAll().catch(err => {
  console.error('\n❌ ERREUR FATALE:', err.message);
  process.exit(1);
});
