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
provider.setCustomParameters({ prompt: 'select_account' });

function shouldUseRedirectAuth(): boolean {
  if (typeof window === 'undefined') return false;

  const host = window.location.hostname;
  const shouldRedirect = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.localhost');

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[authService] shouldUseRedirectAuth', {
      host,
      shouldUseRedirectAuth: shouldRedirect,
      userAgent: navigator.userAgent,
    });
  }

  return shouldRedirect;
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
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[authService] signInWithGooglePopup:start', {
      hasFirebaseAuth: Boolean(firebaseAuth),
      host: typeof window !== 'undefined' ? window.location.host : 'server',
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'server',
      hasGoogleProviderScopes: provider.getScopes(),
      isLocalEnv: shouldUseRedirectAuth(),
    });
  }

  if (!firebaseAuth) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[authService] Firebase Auth is unavailable', {
        firebaseEnabled,
      });
    }
    const error = new Error('Firebase Authentication is not configured.');
    (error as { code?: string }).code = 'auth/not-configured';
    throw error;
  }

  if (shouldUseRedirectAuth()) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[authService] using redirect auth path');
    }
    return signInWithRedirectFallback();
  }

  try {
    const result = await signInWithPopup(firebaseAuth, provider);
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[authService] signInWithPopup success', {
        uid: result.user?.uid,
        email: result.user?.email,
        providerId: result.providerId,
      });
    }
    return result.user;
  } catch (error) {
    const authError = error as {
      code?: string;
      message?: string;
      name?: string;
      stack?: string;
      customData?: {
        _tokenResponse?: unknown;
        [key: string]: unknown;
      };
    };

    console.warn('[authService] signInWithPopup failed, fallback to redirect.', {
      code: authError?.code,
      message: authError?.message,
      name: authError?.name,
      customData: authError?.customData,
    });

    try {
      const redirectResult = await signInWithRedirectFallback();
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[authService] signInWithRedirectFallback finished');
      }
      return redirectResult;
    } catch (redirectError) {
      const redirectAuthError = redirectError as {
        code?: string;
        message?: string;
        name?: string;
      };

      console.error('[authService] signInWithRedirect failed.', {
        code: redirectAuthError?.code,
        message: redirectAuthError?.message,
        name: redirectAuthError?.name,
      });

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
