import { initializeApp } from "firebase/app";
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
    type User as FirebaseUser
} from "firebase/auth";
import {
    getFirestore,
    serverTimestamp,
    type Firestore
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * Usa variables de entorno VITE_*. Crea un .env.local con tus credenciales.
 * EJEMPLO en .env.local:
 * VITE_FIREBASE_API_KEY=...
 * VITE_FIREBASE_AUTH_DOMAIN=...
 * VITE_FIREBASE_PROJECT_ID=...
 * VITE_FIREBASE_STORAGE_BUCKET=...
 * VITE_FIREBASE_MESSAGING_SENDER_ID=...
 * VITE_FIREBASE_APP_ID=...
 */

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const signInAnon = async () => signInAnonymously(auth);

export const onAuthChange = (cb: (u: FirebaseUser | null) => void) =>
onAuthStateChanged(auth, cb);

export const SERVER_TIMESTAMP = serverTimestamp;
export const CHAT_COLLECTION = "global_chat";
