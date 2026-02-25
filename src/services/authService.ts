import {
  GoogleAuthProvider,
  User,
  type Auth,
  onAuthStateChanged,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { firebaseAuth, firebaseEnabled } from '../lib/firebase';

const provider = new GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');

const GOOGLE_REDIRECT_LOGIN_PENDING_KEY = 'one-more-second-google-redirect-login';

function getBrowserAuth(): Auth | null {
  return firebaseAuth;
}

function setRedirectLoginPending(pending: boolean) {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  if (pending) {
    window.sessionStorage.setItem(GOOGLE_REDIRECT_LOGIN_PENDING_KEY, '1');
    return;
  }

  window.sessionStorage.removeItem(GOOGLE_REDIRECT_LOGIN_PENDING_KEY);
}

export function markGoogleRedirectLoginPending() {
  setRedirectLoginPending(true);
}

export function consumeGoogleRedirectLoginPending(): boolean {
  if (typeof window === 'undefined' || !window.sessionStorage) return false;

  const isPending = window.sessionStorage.getItem(GOOGLE_REDIRECT_LOGIN_PENDING_KEY);
  if (isPending !== '1') return false;

  setRedirectLoginPending(false);
  return true;
}

export function clearGoogleRedirectLoginPending() {
  setRedirectLoginPending(false);
}

export function isAuthAvailable(): boolean {
  return Boolean(firebaseEnabled && firebaseAuth);
}

export function getCurrentUser(): User | null {
  const auth = getBrowserAuth();
  if (!auth) return null;
  return auth.currentUser;
}

export async function signInWithGoogleRedirect(): Promise<User | null> {
  const auth = getBrowserAuth();
  if (!auth) {
    const error = new Error('Firebase Authentication is not configured.');
    (error as { code?: string }).code = 'auth/not-configured';
    throw error;
  }

  try {
    await signInWithRedirect(auth, provider);
    return null;
  } catch (error) {
    console.error('[authService] signInWithRedirect failed.', error);
    throw error;
  }
}

export async function signOutCurrentUser(): Promise<void> {
  const auth = getBrowserAuth();
  if (!auth) return;
  await signOut(auth);
}

export function subscribeAuthState(callback: (user: User | null) => void): () => void {
  const auth = getBrowserAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
