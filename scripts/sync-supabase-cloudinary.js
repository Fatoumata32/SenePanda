require('dotenv').config();
const path = require('path');
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

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
// 🚀 SYNC L'URL CLOUDINARY VERS SUPABASE
// ==========================================
async function syncBackToSupabase() {
    console.log('\n🔄 SYNC : Firestore Cloudinary URLs ➔ Supabase Database');
    console.log('========================================================\n');

    try {
        // 1. Récupérer les produits migrés depuis Firestore
        const snapshot = await db.collection('products')
            .where('migrated', '==', true)
            .where('source', '==', 'cloudinary')
            .get();

        if (snapshot.empty) {
            console.log('⚠️ Aucun produit migré trouvé dans Firestore.');
            return;
        }

        console.log(`📦 ${snapshot.size} produits migrés trouvés dans Firestore. Synchronisation...`);

        let successCount = 0;
        let errorCount = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const productId = doc.id;
            const cloudinaryUrl = data.media_url;

            if (!cloudinaryUrl) continue;

            console.log(`   ⏳ [${productId}] Mise à jour Supabase...`);

            // 2. Mettre à jour Supabase
            const { error } = await supabase
                .from('products')
                .update({
                    image_url: cloudinaryUrl,
                    images: [cloudinaryUrl] // Update the array too
                })
                .eq('id', productId);

            if (error) {
                console.error(`   ❌ [${productId}] Erreur Supabase:`, error.message);
                errorCount++;
            } else {
                console.log(`   ✅ [${productId}] Supabase à jour.`);
                successCount++;
            }
        }

        console.log('\n📊 ====== RÉSUMÉ SYNC ======');
        console.log(`Succès : ${successCount}`);
        console.log(`Échecs : ${errorCount}`);
        console.log('============================\n');

        if (successCount > 0) {
            console.log('🎉 L\'application actuelle devrait maintenant afficher les images Cloudinary !');
        }

    } catch (err) {
        console.error('\n❌ ERREUR FATALE:', err.message);
    }
}

syncBackToSupabase().catch(err => {
    console.error('\n❌ ERREUR:', err);
    process.exit(1);
});
