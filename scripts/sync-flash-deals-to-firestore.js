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

async function syncFlashDeals() {
    console.log('\n⚡ SYNC FLASH DEALS : Supabase → Firestore');
    console.log('============================================\n');

    try {
        // Note: get_active_deals est une fonction RPC, mais on peut aussi lire la table directement
        const { data: deals, error } = await supabase
            .from('flash_deals')
            .select(`
        *,
        product:products(
          id,
          title,
          image_url,
          price,
          seller:profiles!seller_id(
            shop_name
          )
        )
      `)
            .gt('ends_at', new Date().toISOString())
            .gt('remaining_stock', 0);

        if (error) throw error;

        console.log(`📄 ${deals.length} deals flash trouvés.`);

        const batch = db.batch();
        for (const deal of deals) {
            const docRef = db.collection('flash_deals').doc(deal.id);

            // Aplatir pour le composant FlashDeals.tsx
            const mappedDeal = {
                deal_id: deal.id,
                product_id: deal.product_id,
                product_title: deal.product?.title,
                product_image: deal.product?.image_url,
                seller_name: deal.product?.seller?.shop_name || 'Vendeur',
                original_price: deal.product?.price,
                deal_price: deal.deal_price,
                discount_percentage: deal.discount_percentage,
                ends_at: deal.ends_at,
                total_stock: deal.total_stock,
                remaining_stock: deal.remaining_stock,
                is_featured: deal.is_featured,
                badge_text: deal.badge_text,
                badge_color: deal.badge_color,
                synced_at: admin.firestore.FieldValue.serverTimestamp()
            };

            batch.set(docRef, mappedDeal, { merge: true });
        }

        await batch.commit();
        console.log('✅ Migration des flash deals terminée !');

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error.message);
    }
}

syncFlashDeals();
