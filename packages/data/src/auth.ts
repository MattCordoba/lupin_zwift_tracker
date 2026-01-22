import {
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut,
  type User
} from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
  type DocumentData,
  type Timestamp
} from "firebase/firestore";
import type { UserPreferences, UserProfile } from "@lupin/types";
import { firebaseAuth, firebaseDb, isFirebaseConfigured } from "./firebase";

const defaultPreferences: UserPreferences = {
  units: "metric",
  timeBudgetMinutes: 60
};

const fallbackDate = () => new Date().toISOString();

const toIsoString = (value?: string | Timestamp) => {
  if (!value) {
    return fallbackDate();
  }
  if (typeof value === "string") {
    return value;
  }
  return value.toDate().toISOString();
};

const normalizeProfile = (uid: string, data: DocumentData): UserProfile => {
  return {
    id: uid,
    displayName: data.displayName ?? "Lupin Rider",
    email: data.email ?? null,
    photoUrl: data.photoUrl ?? null,
    preferences: {
      units: data.preferences?.units ?? defaultPreferences.units,
      timeBudgetMinutes:
        data.preferences?.timeBudgetMinutes ?? defaultPreferences.timeBudgetMinutes
    },
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt)
  };
};

export const observeAuthState = (handler: (user: User | null) => void) => {
  if (!isFirebaseConfigured || !firebaseAuth) {
    handler(null);
    return () => undefined;
  }
  return onAuthStateChanged(firebaseAuth, handler);
};

export const subscribeToUserProfile = (
  uid: string,
  handler: (profile: UserProfile) => void
): Unsubscribe => {
  if (!firebaseDb) {
    return () => undefined;
  }
  const ref = doc(firebaseDb, "users", uid);
  return onSnapshot(ref, (snapshot) => {
    if (!snapshot.exists()) {
      return;
    }
    handler(normalizeProfile(uid, snapshot.data()));
  });
};

export const ensureUserProfile = async (user: User): Promise<UserProfile> => {
  if (!firebaseDb) {
    throw new Error("Firebase is not configured.");
  }
  const ref = doc(firebaseDb, "users", user.uid);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) {
    return normalizeProfile(user.uid, snapshot.data());
  }

  const profile: UserProfile = {
    id: user.uid,
    displayName: user.displayName ?? "Lupin Rider",
    email: user.email ?? null,
    photoUrl: user.photoURL ?? null,
    preferences: defaultPreferences,
    createdAt: fallbackDate(),
    updatedAt: fallbackDate()
  };

  await setDoc(ref, {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return profile;
};

export const updateUserPreferences = async (
  uid: string,
  preferences: UserPreferences
): Promise<void> => {
  if (!firebaseDb) {
    throw new Error("Firebase is not configured.");
  }
  const ref = doc(firebaseDb, "users", uid);
  await updateDoc(ref, {
    preferences,
    updatedAt: serverTimestamp()
  });
};

export const signInWithGoogleWeb = () => {
  if (!isFirebaseConfigured || !firebaseAuth) {
    throw new Error("Firebase is not configured for Google auth.");
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(firebaseAuth, provider);
};

export const signInWithGoogleCredential = (idToken?: string, accessToken?: string) => {
  if (!isFirebaseConfigured || !firebaseAuth) {
    throw new Error("Firebase is not configured for Google auth.");
  }
  const credential = GoogleAuthProvider.credential(idToken || undefined, accessToken);
  return signInWithCredential(firebaseAuth, credential);
};

export const signInWithAppleCredential = (idToken: string, nonce?: string) => {
  if (!isFirebaseConfigured || !firebaseAuth) {
    throw new Error("Firebase is not configured for Apple auth.");
  }
  const provider = new OAuthProvider("apple.com");
  const credential = provider.credential({
    idToken,
    rawNonce: nonce
  });
  return signInWithCredential(firebaseAuth, credential);
};

export const signOutUser = () => (firebaseAuth ? signOut(firebaseAuth) : Promise.resolve());
