import Constants from "expo-constants";
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Firestore, getFirestore } from "firebase/firestore";

// Log config for debugging (masked)
const config = {
    apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
    authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
    projectId: Constants.expoConfig?.extra?.firebaseProjectId,
    storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
    messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
    appId: Constants.expoConfig?.extra?.firebaseAppId,
};

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

try {
    if (config.apiKey) {
        app = !getApps().length ? initializeApp(config) : getApp();
        db = getFirestore(app);
        console.log("Firebase initialized successfully");
    } else {
        console.warn("Firebase configuration missing. Check app.json/app.config.ts and .env");
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
}

export { app, db };

export const isFirebaseConfigured = () => {
    return !!app && !!db;
};
