import { auth, firestore, googleProvider } from './firebase';

// Import functions from the Firebase SDK
import {
    signInWithPopup,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export const signInWithGoogle = async () => {
    try {
        googleProvider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if user document exists in Firestore
        const userRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        // If user document doesn't exist, create a minimal one
        // The user will be redirected to onboarding to complete their profile
        // If user document doesn't exist, create a minimal one
        // The user will be redirected to onboarding to complete their profile
        // We use merge: true to handle "ghost" documents that might exist due to subcollection writes
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            photoURL: user.photoURL,
            // Only set createdAt if it doesn't exist (handled by merge, but good to be explicit if we were using update)
            // For setDoc with merge, it will overwrite createdAt if we pass it, so we should check existence first
            // actually, for a new sign in, we might want to preserve original createdAt if it exists.
            // But here we are inside !userDoc.exists() check... wait, the original code had !userDoc.exists()
            // The issue is that getDoc might return false for exists() but there might be subcollections? 
            // No, getDoc().exists() is false if the document itself doesn't exist, even if subcollections do.
            // But writing to it will "bring it to life".
            // If we want to be safe and ensure we don't overwrite if it SOMEHOW exists or if we want to just ensure fields are there:
            // Let's remove the !userDoc.exists() check and just always set with merge: true, 
            // but we need to be careful not to overwrite existing data like username if it was there.

            // Actually, the plan said: "Update signInWithGoogle to use setDoc with { merge: true }."
            // And "This ensures that if a "ghost document" exists... it is properly updated".

            // So we should remove the if (!userDoc.exists()) check? 
            // If we remove it, we might overwrite 'createdAt' on every login.
            // Let's keep the check but use setDoc with merge inside, OR better:
            // Always update auth info (email, photo) but only set createdAt if missing.

        }, { merge: true });

        // Wait, if I remove the check, I need to handle createdAt.
        // If I keep the check !userDoc.exists(), then for a ghost doc, exists() is FALSE.
        // So we enter the block.
        // Then we do setDoc(..., { merge: true }). 
        // This will create the document. If there were subcollections, they remain.
        // This seems correct for the "ghost doc" case.

        // However, the user reported "user id is recorded, but upon selecting the ID, the field inside is empty".
        // This implies the document existed but was empty? Or maybe it was created empty?
        // If `setDoc` was called without fields, it would be empty.

        // Let's stick to the plan: use merge: true. 
        // And I will remove the `if (!userDoc.exists())` check to ensure we ALWAYS ensure the user doc has the basic auth fields,
        // just in case it was created empty or is missing fields.
        // To avoid overwriting createdAt, I will check it specifically or just not write it if it exists?
        // Simpler: Just use the original logic but with merge: true inside the check, 
        // AND add an else block to update email/photo if they changed?
        // No, let's just do what the plan said primarily: fix the creation.

        if (!userDoc.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
            }, { merge: true });
        } else {
            // If it exists, we might still want to ensure email/photo are up to date
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                photoURL: user.photoURL,
            }, { merge: true });
        }

        return result;
    } catch (error) {
        console.error("Error signing in with Google: ", error);
        throw error;
    }
};

export const logOut = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out: ", error);
        throw error;
    }
};

export const signUpWithEmail = async (email: string, pass: string, username: string) => {
    try {
        // Step 1: Create the user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        // You can still update the Auth profile if you want, it's good practice
        await updateProfile(user, {
            displayName: username
        });

        // --- ADDED LOGIC ---
        // Step 2: Create the user document in your 'users' collection in Firestore
        await setDoc(doc(firestore, "users", user.uid), {
            uid: user.uid,
            username: username,
            email: user.email,
            photoURL: null, // User can add a photo later
            createdAt: serverTimestamp(),
        });
        // --- END OF ADDED LOGIC ---

        return userCredential;
    } catch (error) {
        console.error("Error signing up with email: ", error);
        throw error;
    }
};

export const signInWithEmail = async (email: string, pass: string) => {
    try {
        return await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        console.error("Error signing in with email: ", error);
        throw error;
    }
};
