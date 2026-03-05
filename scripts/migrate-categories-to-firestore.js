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

async function migrateCategories() {
    console.log('\n🔄 MIGRATION DES CATÉGORIES : Supabase → Firebase');
    console.log('==================================================\n');

    try {
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*');

        if (error) throw error;

        console.log(`📄 ${categories.length} catégories trouvées.`);

        const batch = db.batch();
        for (const cat of categories) {
            const docRef = db.collection('categories').doc(cat.id);
            batch.set(docRef, {
                ...cat,
                migrated_at: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }

        await batch.commit();
        console.log('✅ Migration des catégories terminée avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error.message);
    }
}

migrateCategories();
