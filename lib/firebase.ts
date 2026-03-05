import { getApp, getApps, initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import functions from '@react-native-firebase/functions';
import messaging from '@react-native-firebase/messaging';
import analytics from '@react-native-firebase/analytics';

// Configuration Firebase (déjà dans google-services.json pour Android)
const firebaseConfig = {
  apiKey: "AIzaSyA2xLNyY_3A1yvdv9810G_hj6dRkeeQ4ts",
  projectId: "senepanda-6f7c5",
  storageBucket: "senepanda-6f7c5.firebasestorage.app",
  messagingSenderId: "887438718563",
  appId: "1:887438718563:android:cd59a83312bae11c5faa56",
};

// Initialiser Firebase (si pas déjà fait)
if (getApps().length === 0) {
  initializeApp(firebaseConfig);
  console.log('✅ [Firebase] Application initialisée');
} else {
  getApp();
  console.log('✅ [Firebase] Application déjà initialisée');
}

// Exports des services Firebase
export {
  auth,
  firestore,
  storage,
  functions,
  messaging,
  analytics,
};

// Helper: Obtenir l'utilisateur actuel
export const getCurrentUser = () => auth().currentUser;

// Helper: Vérifier si l'utilisateur est connecté
export const isAuthenticated = () => !!auth().currentUser;

console.log('✅ [Firebase] Services exportés avec succès');
