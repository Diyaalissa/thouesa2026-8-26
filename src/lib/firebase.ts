import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0469971247",
  appId: "1:252840846647:web:69b857574bba3855e126b2",
  apiKey: "AIzaSyD1hRb17_SaifgUVtBA1WN39-dytt78cu4",
  authDomain: "gen-lang-client-0469971247.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-thouesap2plogist-c94437d6-2523-497b-8c35-9a03ab85e9b5",
  storageBucket: "gen-lang-client-0469971247.firebasestorage.app",
  messagingSenderId: "252840846647",
  measurementId: ""
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-thouesap2plogist-c94437d6-2523-497b-8c35-9a03ab85e9b5");
import { GoogleAuthProvider } from 'firebase/auth';
export const googleProvider = new GoogleAuthProvider();
