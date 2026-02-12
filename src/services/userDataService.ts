import { User } from 'firebase/auth';
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as limitFn,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { PlayerProfile } from '../gameSystem/types';
import { firebaseDb, firebaseEnabled } from '../lib/firebase';
import { getCurrentUser } from './authService';
import { ScoreRecord, ScoreSubmitResponse } from '../types/score';

export interface ScoreSubmitResult extends ScoreSubmitResponse {
  savedToCloud: boolean;
}

export interface UserIdentityProfile {
  nickname: string;
  country: string;
}

type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh-CN';
const LANGUAGE_STORAGE_KEY = 'oms.language';

function normalizeLanguage(language?: string | null): SupportedLanguage {
  if (!language) return 'en';
  if (language.startsWith('zh')) return 'zh-CN';
  if (language.startsWith('ja')) return 'ja';
  if (language.startsWith('ko')) return 'ko';
  if (language.startsWith('en')) return 'en';
  return 'en';
}

function getStoredLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'en';
  return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
}

function todayDateKey(d = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function normalizedNickname(value: string): string {
  return value.trim().toLowerCase();
}

interface ExistingScoreDoc {
  id: string;
  score: number;
  timestamp: number;
}

export async function appendScoreSubmissionForUser(
  user: User,
  scoreData: ScoreRecord
): Promise<void> {
  const db = firebaseDb;
  if (!firebaseEnabled || !db) return;

  const createdAtDate = new Date();
  await addDoc(collection(db, 'scoreSubmissions'), {
    uid: user.uid,
    nickname: scoreData.nickname,
    country: scoreData.country,
    score: scoreData.score,
    dateKey: todayDateKey(createdAtDate),
    createdAt: serverTimestamp(),
    clientTimestamp: createdAtDate.getTime(),
    clientVersion: 'v1',
    source: 'web-cra',
  });
}

async function getExistingDocsForIdentity(
  user: User,
  nickname: string
): Promise<ExistingScoreDoc[]> {
  const db = firebaseDb;
  if (!firebaseEnabled || !db) return [];

  const nicknameKey = normalizedNickname(nickname);
  if (!nicknameKey) return [];

  const q = query(collection(db, 'scoreSubmissions'), where('uid', '==', user.uid));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return [];

  return snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data() as {
        nickname?: string;
        score?: number;
        clientTimestamp?: number;
      };

      if (normalizedNickname(String(data.nickname ?? '')) !== nicknameKey) {
        return null;
      }

      return {
        id: docSnap.id,
        score: Number(data.score ?? 0),
        timestamp: Number(data.clientTimestamp ?? 0),
      } satisfies ExistingScoreDoc;
    })
    .filter((item): item is ExistingScoreDoc => item !== null);
}

function pickBestDoc(docs: ExistingScoreDoc[]): ExistingScoreDoc | null {
  if (docs.length === 0) return null;

  return [...docs].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.timestamp - a.timestamp;
  })[0];
}

async function deleteScoreDocsByIds(ids: string[]): Promise<void> {
  const db = firebaseDb;
  if (!firebaseEnabled || !db || ids.length === 0) return;
  await Promise.all(ids.map((id) => deleteDoc(doc(db, 'scoreSubmissions', id))));
}

export async function submitScoreToCloudIfSignedIn(
  scoreData: ScoreRecord
): Promise<ScoreSubmitResult> {
  const user = getCurrentUser();
  if (!user || !firebaseEnabled || !firebaseDb) {
    return {
      success: true,
      message: '로컬 기록만 저장되었습니다. 로그인 후 클라우드 동기화가 가능합니다.',
      savedToCloud: false,
    };
  }

  try {
    const existingDocs = await getExistingDocsForIdentity(user, scoreData.nickname);
    const bestExisting = pickBestDoc(existingDocs);

    if (bestExisting && bestExisting.score >= scoreData.score) {
      const duplicateIds = existingDocs
        .filter((docItem) => docItem.id !== bestExisting.id)
        .map((docItem) => docItem.id);
      await deleteScoreDocsByIds(duplicateIds);

      return {
        success: true,
        message: '동일 닉네임의 더 높은 기존 기록이 있어 클라우드 전송을 생략했습니다.',
        savedToCloud: false,
      };
    }

    await appendScoreSubmissionForUser(user, scoreData);
    await deleteScoreDocsByIds(existingDocs.map((docItem) => docItem.id));

    return {
      success: true,
      message: '점수가 클라우드에 저장되었습니다.',
      savedToCloud: true,
    };
  } catch (error) {
    console.error('Cloud score submit failed:', error);
    return {
      success: false,
      message: '클라우드 저장에 실패했습니다. 로컬 기록은 유지됩니다.',
      savedToCloud: false,
    };
  }
}

export async function upsertUserProfile(
  uid: string,
  profile: PlayerProfile,
  language?: string
): Promise<void> {
  const db = firebaseDb;
  if (!firebaseEnabled || !db) return;

  await setDoc(
    doc(db, 'users', uid),
    {
      version: profile.version,
      coins: profile.coins,
      totalRuns: profile.totalRuns,
      totalSecondsSurvived: profile.totalSecondsSurvived,
      bestScore: profile.bestScore,
      selectedSkinId: profile.selectedSkinId,
      ownedSkins: profile.ownedSkins,
      preferences: {
        language: normalizeLanguage(language ?? getStoredLanguage()),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await Promise.all(
    Object.entries(profile.achievements).map(([achievementId, value]) =>
      setDoc(
        doc(db, 'users', uid, 'achievements', achievementId),
        {
          unlockedAt: Timestamp.fromMillis(value.unlockedAt),
        },
        { merge: true }
      )
    )
  );

  await setDoc(
    doc(db, 'users', uid, 'daily', profile.dailyChallenge.dateKey || todayDateKey()),
    {
      ...profile.dailyChallenge,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function syncLocalProfileToCloud(profile: PlayerProfile): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;
  try {
    await upsertUserProfile(user.uid, profile, getStoredLanguage());
  } catch (error) {
    console.error('Profile sync failed:', error);
  }
}

export async function getUserIdentityProfile(
  uid: string
): Promise<UserIdentityProfile | null> {
  const db = firebaseDb;
  if (!firebaseEnabled || !db) return null;

  try {
    const snapshot = await getDoc(doc(db, 'users', uid));
    if (!snapshot.exists()) return null;

    const data = snapshot.data() as {
      nickname?: string;
      country?: string;
    };

    const nickname = data.nickname?.trim();
    const country = data.country?.trim();
    if (!nickname || !country) return null;

    return { nickname, country };
  } catch (error) {
    console.error('Fetch identity profile failed:', error);
    return null;
  }
}

export async function upsertUserIdentityProfile(
  uid: string,
  identity: UserIdentityProfile
): Promise<void> {
  const db = firebaseDb;
  if (!firebaseEnabled || !db) return;

  await setDoc(
    doc(db, 'users', uid),
    {
      nickname: identity.nickname,
      country: identity.country,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function isNicknameAvailable(
  nickname: string,
  currentUid?: string
): Promise<boolean> {
  const db = firebaseDb;
  if (!firebaseEnabled || !db) return true;

  const trimmed = nickname.trim();
  if (!trimmed) return false;

  try {
    const q = query(
      collection(db, 'scoreSubmissions'),
      where('nickname', '==', trimmed),
      limitFn(20)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return true;

    return snapshot.docs.every((docSnap) => {
      const data = docSnap.data() as { uid?: string };
      return Boolean(currentUid && data.uid === currentUid);
    });
  } catch (error) {
    console.error('Nickname availability check failed:', error);
    return true;
  }
}

export async function syncLanguagePreferenceToCloud(language: string): Promise<void> {
  const user = getCurrentUser();
  const db = firebaseDb;
  if (!user || !firebaseEnabled || !db) return;

  try {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        preferences: {
          language: normalizeLanguage(language),
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Language preference sync failed:', error);
  }
}

export async function getUserLanguagePreference(
  uid: string
): Promise<SupportedLanguage | null> {
  const db = firebaseDb;
  if (!firebaseEnabled || !db) return null;

  try {
    const snapshot = await getDoc(doc(db, 'users', uid));
    if (!snapshot.exists()) return null;

    const data = snapshot.data() as {
      preferences?: {
        language?: string;
      };
    };

    if (!data.preferences?.language) return null;
    return normalizeLanguage(data.preferences.language);
  } catch (error) {
    console.error('Fetch language preference failed:', error);
    return null;
  }
}
