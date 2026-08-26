import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { JournalInteraction, UserProfile } from './types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore with specific databaseId if provided
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Sanitizes payloads to ensure no undefined values are passed to Firestore.
 */
export function cleanPayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanPayload(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanPayload(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Google Sign In via Firebase Auth
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      // User closed popup or cancelled request; return null cleanly without logging fatal error
      return null;
    }
    if (error?.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
    }
    if (error?.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized in Firebase Auth. Please verify authorized domains in your Firebase Console.');
    }
    if (error?.code === 'auth/network-request-failed') {
      throw new Error('Network error during authentication. Please check your internet connection and try again.');
    }
    throw error;
  }
}

/**
 * Sign Out from Firebase Auth
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Transform Firebase User to UserProfile
 */
export function formatUserProfile(user: User | null): UserProfile | null {
  if (!user) return null;
  return {
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    email: user.email,
    photoURL: user.photoURL,
  };
}

/**
 * Real-time subscription to user-isolated interactions
 * Path: /users/{userId}/interactions
 */
export function subscribeToUserInteractions(
  userId: string,
  onUpdate: (interactions: JournalInteraction[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const interactionsRef = collection(db, 'users', userId, 'interactions');
  const q = query(interactionsRef, orderBy('updatedAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items: JournalInteraction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId || userId,
          title: data.title || 'Untitled Reflection',
          mode: data.mode || 'reflection',
          initialPrompt: data.initialPrompt || '',
          latestResponse: data.latestResponse || '',
          messages: Array.isArray(data.messages) ? data.messages : [],
          tags: Array.isArray(data.tags) ? data.tags : [],
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          wordCount: typeof data.wordCount === 'number' ? data.wordCount : 0,
          modelUsed: data.modelUsed || 'gemini-3.6-flash',
          moodRating: data.moodRating,
          isFavorite: data.isFavorite || false,
        });
      });
      onUpdate(items);
    },
    (error) => {
      console.error(`[Firestore Subscription Error for user ${userId}]:`, error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Guaranteed Persistence Verification
 * Saves or updates a user-isolated interaction document in Firestore
 */
export async function saveUserInteraction(
  userId: string,
  interaction: JournalInteraction
): Promise<void> {
  if (!userId) throw new Error('User ID is required for saving interactions.');
  if (!interaction.id) throw new Error('Interaction ID is required.');

  const docRef = doc(db, 'users', userId, 'interactions', interaction.id);
  const payload = cleanPayload({
    ...interaction,
    userId,
    updatedAt: new Date().toISOString(),
    _serverTimestamp: serverTimestamp(),
  });

  await setDoc(docRef, payload, { merge: true });
}

/**
 * Delete a user-isolated interaction from Firestore
 */
export async function deleteUserInteraction(
  userId: string,
  interactionId: string
): Promise<void> {
  if (!userId || !interactionId) throw new Error('Missing userId or interactionId.');
  const docRef = doc(db, 'users', userId, 'interactions', interactionId);
  await deleteDoc(docRef);
}
