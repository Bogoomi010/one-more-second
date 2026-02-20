import { User } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
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
import { firebaseDb, firebaseEnabled, firebaseFunctions } from '../lib/firebase';
import { getCurrentUser } from './authService';
import { ScoreRecord, ScoreSubmitResponse } from '../types/score';
import {
  normalizeCountryCode,
  normalizeNickname,
  sanitizeScoreRecord,
} from '../utils/validation';

export interface ScoreSubmitResult extends ScoreSubmitResponse {}

export interface ProfileSyncOptions {
  unlockedAchievementIds?: string[];
}

export interface UserIdentityProfile {
  nickname: string;
  country: string;
}

const SCORE_SUBMIT_FUNCTION_NAME = 'submitScore';
const DISABLE_SCORE_FUNCTION_CALL = process.env.REACT_APP_DISABLE_SCORE_FUNCTION_CALL === 'true';

type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh-CN';
const LANGUAGE_STORAGE_KEY = 'oms.language';
const USER_PUBLIC_PROFILES_COLLECTION = 'userPublicProfiles';

let canUseCallableScoreSubmit = !DISABLE_SCORE_FUNCTION_CALL;

function disableCallableScoreSubmitForSession(error: unknown): void {
  if (!canUseCallableScoreSubmit) return;
  console.warn('Cloud Function score submit is disabled for this session and will use Firestore fallback.', error);
  canUseCallableScoreSubmit = false;
}

function getFirebaseErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return 'Unknown error';
}

function getFirebaseErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string' && code.trim()) {
      return code;
    }
  }
  return undefined;
}

function formatScoreSubmitError(error: unknown): string {
  const code = getFirebaseErrorCode(error);
  const message = getFirebaseErrorMessage(error);
  return code ? `${code}: ${message}` : message;
}

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

function sanitizeIdentityProfile(value: UserIdentityProfile): UserIdentityProfile {
  return {
    nickname: normalizeNickname(value.nickname),
    country: normalizeCountryCode(value.country),
  };
}

async function upsertPublicIdentityProfile(
  uid: string,
  identity: UserIdentityProfile
): Promise<void> {
  const normalizedIdentity = sanitizeIdentityProfile(identity);
  const db = firebaseDb;
  if (!firebaseEnabled || !db) return;

  await setDoc(
    doc(db, USER_PUBLIC_PROFILES_COLLECTION, uid),
    {
      uid,
      nickname: normalizedIdentity.nickname,
      normalizedNickname: normalizeNickname(normalizedIdentity.nickname),
      country: normalizedIdentity.country,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

async function appendScoreSubmissionForUser(
  user: User,
  scoreData: ScoreRecord
): Promise<void> {
  const db = firebaseDb;
  if (!firebaseEnabled || !db) return;
  const safeScoreData = sanitizeScoreRecord(scoreData);

  const createdAtDate = new Date();
  await addDoc(collection(db, 'scoreSubmissions'), {
    uid: user.uid,
    nickname: safeScoreData.nickname,
    country: safeScoreData.country,
    score: safeScoreData.score,
    finalScore: safeScoreData.finalScore,
    normalScore: safeScoreData.normalScore,
    dateKey: todayDateKey(createdAtDate),
    createdAt: serverTimestamp(),
    clientTimestamp: createdAtDate.getTime(),
    clientVersion: 'v1',
    source: 'web-cra',
  });
}

async function submitScoreViaCallable(scoreData: ScoreRecord): Promise<ScoreSubmitResult | null> {
  if (!firebaseFunctions) return null;

  const call = httpsCallable(firebaseFunctions, SCORE_SUBMIT_FUNCTION_NAME);
  const response = await call(scoreData);
  const data = response.data as ScoreSubmitResult;
  if (!data || typeof data.success !== 'boolean') {
    throw new Error('Cloud Function response format is invalid.');
  }

  if (!data.success) {
    throw new Error(data.message ?? 'Cloud Function score submit rejected.');
  }

  return data;
}

async function submitScoreViaLegacyWrites(
  user: User,
  scoreData: ScoreRecord
): Promise<void> {
  const safeScoreData = sanitizeScoreRecord(scoreData);
  const identity: UserIdentityProfile = {
    nickname: safeScoreData.nickname,
    country: safeScoreData.country,
  };

  try {
    await upsertPublicIdentityProfile(user.uid, identity);
  } catch (profileError) {
    console.warn('Public identity profile sync failed:', profileError);
  }

  await upsertAllLeaderboardEntries(
    user.uid,
    identity.nickname,
    {
      score: safeScoreData.score,
      finalScore: safeScoreData.finalScore,
      normalScore: safeScoreData.normalScore,
    },
    identity.country,
    todayDateKey()
  );

  try {
    await appendScoreSubmissionForUser(user, safeScoreData);
  } catch (legacyError) {
    console.warn('Legacy scoreSubmissions append failed:', legacyError);
  }
}

async function resolveRankingIdentity(
  user: User,
  fallback: ScoreRecord
): Promise<{ nickname: string; country: string }> {
  const profileIdentity = await getUserIdentityProfile(user.uid);
  const safeFallback = sanitizeIdentityProfile({
    nickname: fallback.nickname,
    country: fallback.country,
  });

  if (!profileIdentity) return safeFallback;
  try {
    return sanitizeIdentityProfile(profileIdentity);
  } catch {
    return safeFallback;
  }
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
    const safeScoreData = sanitizeScoreRecord(scoreData);
    const identity = await resolveRankingIdentity(user, safeScoreData);
    const sanitizedPayload: ScoreRecord = {
      ...safeScoreData,
      nickname: identity.nickname,
      country: identity.country,
    };

    let functionError: unknown;
    if (canUseCallableScoreSubmit) {
      try {
        const functionResult = await submitScoreViaCallable(sanitizedPayload);
        if (functionResult?.success) {
          if (functionResult.cloudSynced === false) {
            console.warn(
              'Cloud Function reported success without syncing leaderboard data:',
              functionResult
            );
          } else {
            return functionResult;
          }
        }
      } catch (callableError) {
        functionError = callableError;
        console.warn('Cloud Function score submit failed, fallback to direct writes.', callableError);
        disableCallableScoreSubmitForSession(callableError);
      }
    }

    try {
      await submitScoreViaLegacyWrites(user, sanitizedPayload);
    } catch (legacyError) {
      console.error('Legacy score submit failed:', legacyError);
      const functionFailureMessage =
        functionError != null
          ? ` | Cloud Function failed: ${formatScoreSubmitError(functionError)}`
          : '';

      return {
        success: false,
        cloudSynced: false,
        message: `Firestore fallback failed: ${formatScoreSubmitError(legacyError)}${functionFailureMessage}`,
      };
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
      message: `Score sync failed: ${formatScoreSubmitError(error)}`,
    };
  }
}

export async function upsertUserProfile(
  uid: string,
  profile: PlayerProfile,
  language?: string,
  options?: ProfileSyncOptions
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
      totalBulletsSpawned: profile.totalBulletsSpawned,
      totalBulletsDodged: profile.totalBulletsDodged,
      totalBulletsHit: profile.totalBulletsHit,
      totalDeaths: profile.totalDeaths,
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

  const achievementIds =
    options?.unlockedAchievementIds === undefined
      ? Object.keys(profile.achievements)
      : Array.from(new Set(options.unlockedAchievementIds));

  await Promise.all(
    achievementIds
      .filter((achievementId) => Boolean(profile.achievements[achievementId]))
      .map((achievementId) => {
        const value = profile.achievements[achievementId];
        return setDoc(
          doc(db, 'users', uid, 'achievements', achievementId),
          {
            unlockedAt: Timestamp.fromMillis(value?.unlockedAt ?? Date.now()),
          },
          { merge: true }
        );
      })
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

export async function syncLocalProfileToCloud(
  profile: PlayerProfile,
  options?: ProfileSyncOptions
): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;
  try {
    await upsertUserProfile(user.uid, profile, getStoredLanguage(), options);
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
    const publicProfileSnap = await getDoc(doc(db, USER_PUBLIC_PROFILES_COLLECTION, uid));

    const profileSource =
      publicProfileSnap.exists()
        ? publicProfileSnap
        : await getDoc(doc(db, 'users', uid));

    if (!profileSource.exists()) return null;

    const data = profileSource.data() as {
      nickname?: string;
      country?: string;
    };

    try {
      return sanitizeIdentityProfile({
        nickname: data.nickname ?? '',
        country: data.country ?? '',
      });
    } catch {
      return null;
    }
  } catch (error) {
    console.error('Fetch identity profile failed:', error);
    return null;
  }
}

export async function upsertUserIdentityProfile(
  uid: string,
  identity: UserIdentityProfile
): Promise<void> {
  const normalizedIdentity = sanitizeIdentityProfile(identity);
  const db = firebaseDb;
  if (!firebaseEnabled || !db) return;

  await setDoc(
    doc(db, 'users', uid),
    {
      nickname: normalizedIdentity.nickname,
      country: normalizedIdentity.country,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await upsertPublicIdentityProfile(uid, normalizedIdentity);
}

export async function isNicknameAvailable(
  nickname: string,
  currentUid?: string
): Promise<boolean> {
  const db = firebaseDb;
  if (!firebaseEnabled || !db) return true;

  let normalized: string;
  try {
    normalized = normalizeNickname(nickname);
  } catch {
    return false;
  }

  try {
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
