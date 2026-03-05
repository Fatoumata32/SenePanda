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

async function syncProducts() {
    console.log('\n🚀 SYNC PRODUITS : Supabase → Firestore (avec détails Vendeur)');
    console.log('================================================================\n');

    let page = 0;
    const PAGE_SIZE = 100;
    let hasMore = true;
    let totalSynced = 0;

    while (hasMore) {
        const { data: products, error } = await supabase
            .from('products')
            .select(`
        *,
        seller:profiles!seller_id(
          id,
          shop_name,
          shop_logo_url,
          verified_seller
        )
      `)
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) {
            console.error('❌ Erreur Supabase:', error.message);
            break;
        }

        if (!products || products.length === 0) {
            hasMore = false;
            break;
        }

        console.log(`📄 Page ${page + 1} : ${products.length} produits...`);

        const batch = db.batch();
        for (const product of products) {
            const docRef = db.collection('products').doc(product.id);

            // On aplatit ou on garde la structure 'seller' pour Firestore
            batch.set(docRef, {
                ...product,
                synced_at: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }

        await batch.commit();
        totalSynced += products.length;
        hasMore = products.length === PAGE_SIZE;
        page++;
    }

    console.log(`\n✅ Terminé ! ${totalSynced} produits synchronisés dans Firestore.`);
}

syncProducts();
