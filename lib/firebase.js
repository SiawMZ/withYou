// To get your Firebase configuration, go to your Firebase project console,
// click the gear icon > Project settings, then scroll down to "Your apps"
// and select the web app you created.

// /lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBFqvVrBr5sSQAxgbnsxTS_0zm5xf8JPQk",
  authDomain: "withyou-e9335.firebaseapp.com",
  projectId: "withyou-e9335",
  storageBucket: "withyou-e9335.firebasestorage.app",
  messagingSenderId: "349804085030",
  appId: "1:349804085030:web:96fc170bfc81f230174be7",
  measurementId: "G-EF8W015HZR"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const googleProvider = new GoogleAuthProvider();


