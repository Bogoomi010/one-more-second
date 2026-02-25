import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { firebaseAuth, firebaseEnabled } from '../lib/firebase';

const provider = new GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');

function shouldUseRedirectAuth(): boolean {
  if (typeof window === 'undefined') return false;

  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.localhost');
}

async function signInWithRedirectFallback(): Promise<null> {
  if (!firebaseAuth) return null;

  await signInWithRedirect(firebaseAuth, provider);
  return null;
}

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

  if (shouldUseRedirectAuth()) {
    return signInWithRedirectFallback();
  }

  try {
    const result = await signInWithPopup(firebaseAuth, provider);
    return result.user;
  } catch (error) {
    console.warn('[authService] signInWithPopup failed, fallback to redirect.', error);
    try {
      return await signInWithRedirectFallback();
    } catch (redirectError) {
      console.error('[authService] signInWithRedirect failed.', redirectError);
      throw redirectError;
    }
  }
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
