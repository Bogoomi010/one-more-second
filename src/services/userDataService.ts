import { User } from 'firebase/auth';
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as limitFn,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { PlayerProfile } from '../gameSystem/types';
import { resolveLegacySkinState } from '../gameSystem/skins';
import { firebaseDb, firebaseEnabled } from '../lib/firebase';
import { getCurrentUser } from './authService';
import { ScoreRecord, ScoreSubmitResponse } from '../types/score';

export interface ScoreSubmitResult extends ScoreSubmitResponse {}

export interface UserIdentityProfile {
  nickname: string;
  country: string;
}

type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh-CN';
const LANGUAGE_STORAGE_KEY = 'oms.language';
const USER_PUBLIC_PROFILES_COLLECTION = 'userPublicProfiles';

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

async function upsertPublicIdentityProfile(
  uid: string,
  identity: UserIdentityProfile
): Promise<void> {
  const db = firebaseDb;
  if (!firebaseEnabled || !db) return;

  await setDoc(
    doc(db, USER_PUBLIC_PROFILES_COLLECTION, uid),
    {
      uid,
      nickname: identity.nickname,
      normalizedNickname: normalizedNickname(identity.nickname),
      country: identity.country,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
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
    score: scoreData.finalScore,
    finalScore: scoreData.finalScore,
    normalScore: scoreData.normalScore,
    dateKey: todayDateKey(createdAtDate),
    createdAt: serverTimestamp(),
    clientTimestamp: createdAtDate.getTime(),
    clientVersion: 'v1',
    source: 'web-cra',
  });
}

async function resolveRankingIdentity(
  user: User,
  fallback: ScoreRecord
): Promise<{ nickname: string; country: string }> {
  const profileIdentity = await getUserIdentityProfile(user.uid);
  return {
    nickname: profileIdentity?.nickname ?? fallback.nickname,
    country: profileIdentity?.country ?? fallback.country,
  };
}

async function upsertLeaderboardEntry(
  path: [string, string, string],
  uid: string,
  nickname: string,
  scoreData: Pick<ScoreRecord, 'score' | 'finalScore' | 'normalScore'>,
  country: string,
  dateKey?: string
): Promise<void> {
  const db = firebaseDb;
  if (!firebaseEnabled || !db) return;

  const entryRef = doc(db, path[0], path[1], path[2], uid);
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(entryRef);
    const existingScore = Number(existing.data()?.score ?? 0);
    const bestScore = Math.max(existingScore, scoreData.score);

    transaction.set(
      entryRef,
      {
        uid,
        nickname,
        country,
        score: bestScore,
        finalScore: bestScore,
        lastSubmittedScore: scoreData.score,
        lastSubmittedFinalScore: scoreData.finalScore,
        lastSubmittedNormalScore: scoreData.normalScore,
        dateKey: dateKey ?? null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}

async function upsertAllLeaderboardEntries(
  uid: string,
  nickname: string,
  scoreData: Pick<ScoreRecord, 'score' | 'finalScore' | 'normalScore'>,
  country: string,
  dateKey: string
): Promise<void> {
  await Promise.all([
    upsertLeaderboardEntry(
      ['leaderboardsGlobal', 'all', 'entries'],
      uid,
      nickname,
      scoreData,
      country
    ),
    upsertLeaderboardEntry(
      ['leaderboardsCountry', country, 'entries'],
      uid,
      nickname,
      scoreData,
      country
    ),
    upsertLeaderboardEntry(
      ['leaderboardsDaily', dateKey, 'entries'],
      uid,
      nickname,
      scoreData,
      country,
      dateKey
    ),
  ]);
}

export async function submitScoreToCloudIfSignedIn(
  scoreData: ScoreRecord
): Promise<ScoreSubmitResult> {
  const user = getCurrentUser();
  if (!user || !firebaseEnabled || !firebaseDb) {
    return {
      success: false,
      cloudSynced: false,
      message: 'Sign in and Firebase are required for cloud ranking.',
    };
  }

  try {
    const identity = await resolveRankingIdentity(user, scoreData);
    try {
      await upsertPublicIdentityProfile(user.uid, identity);
    } catch (profileError) {
      console.warn('Public identity profile sync failed:', profileError);
    }

    const normalizedScoreData: ScoreRecord = {
      nickname: identity.nickname,
      country: identity.country,
      score: scoreData.finalScore,
      finalScore: scoreData.finalScore,
      normalScore: scoreData.normalScore,
    };
    const today = todayDateKey();

    await upsertAllLeaderboardEntries(
      user.uid,
      normalizedScoreData.nickname,
      {
        score: normalizedScoreData.score,
        finalScore: normalizedScoreData.finalScore,
        normalScore: normalizedScoreData.normalScore,
      },
      normalizedScoreData.country,
      today
    );

    try {
      await appendScoreSubmissionForUser(user, normalizedScoreData);
    } catch (legacyError) {
      console.warn('Legacy scoreSubmissions append failed:', legacyError);
    }

    return {
      success: true,
      cloudSynced: true,
      message: 'Score synced to leaderboard.',
    };
  } catch (error) {
    console.error('Cloud score submit failed:', error);
    return {
      success: false,
      cloudSynced: false,
      message: 'Cloud leaderboard sync failed.',
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

  const legacySkinState = resolveLegacySkinState(
    profile.ownedPlayerSkins,
    profile.ownedBulletSkins,
    profile.selectedPlayerSkinId,
    profile.selectedBulletSkinId
  );

  await setDoc(
    doc(db, 'users', uid),
    {
      version: profile.version,
      coins: profile.coins,
      totalRuns: profile.totalRuns,
      totalSecondsSurvived: profile.totalSecondsSurvived,
      bestScore: profile.bestScore,
      selectedPlayerSkinId: profile.selectedPlayerSkinId,
      selectedBulletSkinId: profile.selectedBulletSkinId,
      ownedPlayerSkins: profile.ownedPlayerSkins,
      ownedBulletSkins: profile.ownedBulletSkins,
      selectedSkinId: legacySkinState.selectedSkinId,
      ownedSkins: legacySkinState.ownedSkins,
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

  await upsertPublicIdentityProfile(uid, identity);
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
    const normalized = normalizedNickname(trimmed);
    const q = query(
      collection(db, USER_PUBLIC_PROFILES_COLLECTION),
      where('normalizedNickname', '==', normalized),
      limitFn(20)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return true;

    return snapshot.docs.every((docSnap) => Boolean(currentUid && docSnap.id === currentUid));
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
