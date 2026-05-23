import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth';
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
let auth: Auth | undefined;

try {
    if (config.apiKey) {
        app = !getApps().length ? initializeApp(config) : getApp();
        db = getFirestore(app);

        // Initialize Auth with persistence using AsyncStorage
        const currentApp = getApps().length ? getApp() : initializeApp(config);
        auth = initializeAuth(currentApp, {
            persistence: getReactNativePersistence(AsyncStorage)
        });

        if (__DEV__) console.log("Firebase initialized successfully");
    } else {
        if (__DEV__) console.warn("Firebase configuration missing.");
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
}

export { app, auth, db };

export const isFirebaseConfigured = () => {
    return !!app && !!db && !!auth;
};
