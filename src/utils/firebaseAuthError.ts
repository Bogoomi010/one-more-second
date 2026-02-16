interface FirebaseAuthLikeError {
  code?: string;
  message?: string;
}

function getErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  const maybe = error as FirebaseAuthLikeError;
  return typeof maybe.code === 'string' ? maybe.code : '';
}

function getCurrentHost(): string {
  if (typeof window === 'undefined') return 'current host';
  return window.location.hostname || 'current host';
}

export function getFirebaseAuthErrorMessage(error: unknown): string {
  const code = getErrorCode(error);

  if (code === 'auth/unauthorized-domain') {
    return `Unauthorized domain: ${getCurrentHost()}. Add it in Firebase Console > Authentication > Settings > Authorized domains.`;
  }

  if (code === 'auth/not-configured') {
    return 'Firebase Authentication is not configured. Set REACT_APP_FIREBASE_* environment variables and try again.';
  }

  if (code === 'auth/configuration-not-found') {
    return 'Firebase Authentication is not configured. Enable Google sign-in and check Authorized domains in Firebase Console.';
  }

  if (code === 'auth/popup-closed-by-user') {
    return 'Sign-in popup was closed before completion.';
  }

  if (code === 'auth/network-request-failed') {
    return 'Network error during sign-in. Check your connection and try again.';
  }

  return 'Sign-in failed. Check Firebase Authentication settings and try again.';
}
