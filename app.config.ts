import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
    return {
        ...config,
        name: "islamicquiz-mobile",
        slug: "islamicquiz-mobile",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "islamicquiz",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        splash: {
            image: "./assets/images/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        ios: {
            supportsTablet: true
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            package: "com.islamicquiz.mobile"
        },
        web: {
            bundler: "metro",
            output: "static",
            favicon: "./assets/images/favicon.png"
        },
        plugins: [
            "expo-router"
        ],
        experiments: {
            typedRoutes: true
        },
        extra: {
            firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
            firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
            firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
            firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
            firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
        }
    };
};
