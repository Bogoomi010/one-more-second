import { initializeApp } from 'firebase/app';
import { getFunctions } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const hasRequiredConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

const app = hasRequiredConfig ? initializeApp(firebaseConfig) : null;
const appCheckSiteKey = process.env.REACT_APP_FIREBASE_APPCHECK_SITE_KEY;
const appCheckDebugToken = process.env.REACT_APP_FIREBASE_APPCHECK_DEBUG_TOKEN;
const functionsRegion = process.env.REACT_APP_FIREBASE_FUNCTIONS_REGION;
const defaultFunctionsRegion = 'asia-northeast3';

if (app && typeof window !== 'undefined') {
  if (appCheckDebugToken && process.env.NODE_ENV !== 'production') {
    const globalWindow = window as typeof window & {
      FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean;
    };
    const tokenValue =
      appCheckDebugToken.trim().toLowerCase() === 'true'
        ? true
        : appCheckDebugToken.trim();
    globalWindow.FIREBASE_APPCHECK_DEBUG_TOKEN = tokenValue;
  }

  if (appCheckSiteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
}

export const firebaseEnabled = hasRequiredConfig;
export const firebaseAuth = app ? getAuth(app) : null;
export const firebaseDb = app ? getFirestore(app) : null;
export const firebaseFunctions = app
  ? getFunctions(app, functionsRegion || defaultFunctionsRegion)
  : null;
