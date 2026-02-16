import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { firebaseAuth, firebaseEnabled } from '../lib/firebase';

const provider = new GoogleAuthProvider();

export function isAuthAvailable(): boolean {
  return Boolean(firebaseEnabled && firebaseAuth);
}

export function getCurrentUser(): User | null {
  if (!firebaseAuth) return null;
  return firebaseAuth.currentUser;
}

export async function signInWithGooglePopup(): Promise<User | null> {
  if (!firebaseAuth) {
    const error = new Error('Firebase Authentication is not configured.');
    (error as { code?: string }).code = 'auth/not-configured';
    throw error;
  }
  const result = await signInWithPopup(firebaseAuth, provider);
  return result.user;
}

export async function signOutCurrentUser(): Promise<void> {
  if (!firebaseAuth) return;
  await signOut(firebaseAuth);
}

export function subscribeAuthState(callback: (user: User | null) => void): () => void {
  if (!firebaseAuth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(firebaseAuth, callback);
}
