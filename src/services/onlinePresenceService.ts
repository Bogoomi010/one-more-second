import { onDisconnect, onValue, ref, remove, serverTimestamp, set } from 'firebase/database';
import { firebaseRealtimeDb } from '../lib/firebase';

const PRESENCE_ROOT_PATH = 'presence/sessions';
const SESSION_STORAGE_KEY = 'oms.presence.sessionId';

export const DEFAULT_ONLINE_USERS_FALLBACK = 1204;

function createSessionId(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${randomPart}`;
}

function getSessionId(): string {
  if (typeof window === 'undefined') {
    return createSessionId();
  }

  try {
    const savedId = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (savedId) return savedId;

    const nextId = createSessionId();
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, nextId);
    return nextId;
  } catch {
    return createSessionId();
  }
}

export function subscribeOnlineUsersCount(onCountChange: (count: number) => void): () => void {
  const database = firebaseRealtimeDb;
  if (!database) {
    onCountChange(DEFAULT_ONLINE_USERS_FALLBACK);
    return () => {};
  }

  const sessionId = getSessionId();
  const sessionsRef = ref(database, PRESENCE_ROOT_PATH);
  const sessionRef = ref(database, `${PRESENCE_ROOT_PATH}/${sessionId}`);
  const connectedRef = ref(database, '.info/connected');

  const unsubscribeCount = onValue(sessionsRef, (snapshot) => {
    const sessions = snapshot.val() as Record<string, unknown> | null;
    onCountChange(sessions ? Object.keys(sessions).length : 0);
  });

  const unsubscribeConnection = onValue(connectedRef, (snapshot) => {
    if (snapshot.val() !== true) return;

    void onDisconnect(sessionRef).remove().catch(() => {});
    void set(sessionRef, {
      connectedAt: serverTimestamp(),
    }).catch(() => {});
  });

  return () => {
    unsubscribeConnection();
    unsubscribeCount();
    void remove(sessionRef).catch(() => {});
  };
}
