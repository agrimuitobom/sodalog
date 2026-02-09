import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

function getApp(): FirebaseApp {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp(firebaseConfig);
}

let _auth: Auth | undefined;
let _db: Firestore | undefined;
let _storage: FirebaseStorage | undefined;

export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(getApp());
  return _auth;
}

export function getFirebaseDb(): Firestore {
  if (!_db) _db = getFirestore(getApp());
  return _db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!_storage) _storage = getStorage(getApp());
  return _storage;
}

// Lazy exports for convenience - only access on client side
export const auth = typeof window !== "undefined" ? getFirebaseAuth() : (undefined as unknown as Auth);
export const db = typeof window !== "undefined" ? getFirebaseDb() : (undefined as unknown as Firestore);
export const storage = typeof window !== "undefined" ? getFirebaseStorage() : (undefined as unknown as FirebaseStorage);
