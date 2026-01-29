import { signInAnonymously, User } from "firebase/auth";
import { Alert } from "react-native";
import { auth } from "./firebase";

export const ensureAnonymousAuth = async (): Promise<User | null> => {
    if (!auth) {
        console.warn("Auth not initialized, skipping sign-in.");
        return null;
    }

    try {
        // If already signed in, return current user
        if (auth.currentUser) {
            console.log("User already signed in:", auth.currentUser.uid);
            return auth.currentUser;
        }

        // Otherwise, sign in anonymously
        console.log("Signing in anonymously...");
        const result = await signInAnonymously(auth);
        console.log("Signed in as:", result.user.uid);
        return result.user;
    } catch (error: any) {
        console.error("Anonymous auth failed:", error);

        if (error.code === 'auth/admin-restricted-operation') {
            Alert.alert(
                "Firebase Auth Error",
                "Anonymous sign-in is disabled in Firebase Console.\n\nPlease enable it in Authentication → Sign-in method.",
                [{ text: "OK" }]
            );
        } else if (error.code === 'auth/network-request-failed') {
            // Optional: Silent warning for offline
            console.warn("Network unavailable for auth.");
        }

        // We return null but don't crash. App might work in public read mode if rules allow,
        // or fail gracefully later.
        return null;
    }
};
