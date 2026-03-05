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

async function syncProfiles() {
    console.log('\n🏪 SYNC BOUTIQUES : Supabase → Firestore');
    console.log('==========================================\n');

    let page = 0;
    const PAGE_SIZE = 100;
    let hasMore = true;
    let totalSynced = 0;

    while (hasMore) {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_seller', true)
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) {
            console.error('❌ Erreur Supabase:', error.message);
            break;
        }

        if (!profiles || profiles.length === 0) {
            hasMore = false;
            break;
        }

        console.log(`📄 Page ${page + 1} : ${profiles.length} boutiques...`);

        const batch = db.batch();
        for (const profile of profiles) {
            const docRef = db.collection('profiles').doc(profile.id);
            batch.set(docRef, {
                ...profile,
                synced_at: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }

        await batch.commit();
        totalSynced += profiles.length;
        hasMore = profiles.length === PAGE_SIZE;
        page++;
    }

    console.log(`\n✅ Terminé ! ${totalSynced} boutiques synchronisées dans Firestore.`);
}

syncProfiles();
