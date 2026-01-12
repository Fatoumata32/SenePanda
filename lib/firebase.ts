import { getApp, getApps, initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import functions from '@react-native-firebase/functions';
import messaging from '@react-native-firebase/messaging';
import analytics from '@react-native-firebase/analytics';

// Configuration Firebase (déjà dans google-services.json pour Android)
const firebaseConfig = {
  apiKey: "AIzaSyCabVD_zdKtJXP1mCECDbHc8iJ5LGFN_mk",
  projectId: "educ-app-ea92d",
  storageBucket: "educ-app-ea92d.firebasestorage.app",
  messagingSenderId: "683631459302",
  appId: "1:683631459302:android:3a3ea067cfa14c3058b427",
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
