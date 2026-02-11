import { User } from 'firebase/auth';
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { PlayerProfile } from '../gameSystem/types';
import { firebaseDb, firebaseEnabled } from '../lib/firebase';
import { getCurrentUser } from './authService';
import { ScoreRecord, ScoreSubmitResponse } from '../types/score';

export interface ScoreSubmitResult extends ScoreSubmitResponse {
  savedToCloud: boolean;
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

export async function appendScoreSubmissionForUser(
  user: User,
  scoreData: ScoreRecord
): Promise<void> {
  const db = firebaseDb;
  if (!firebaseEnabled || !db) return;

  await addDoc(collection(db, 'scoreSubmissions'), {
    uid: user.uid,
    nickname: scoreData.nickname,
    country: scoreData.country,
    score: scoreData.score,
    createdAt: serverTimestamp(),
    clientVersion: 'v1',
    source: 'web-cra',
  });

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
    await appendScoreSubmissionForUser(user, scoreData);
    return {
      success: true,
      message: '스코어가 클라우드에 저장되었습니다.',
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
      nickname: null,
      country: null,
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
