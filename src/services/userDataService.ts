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

interface UserIdentityProfileForWrite extends UserIdentityProfile {
  normalizedNickname: string;
}

const SCORE_SUBMIT_FUNCTION_NAME = 'submitScore';
const DISABLE_SCORE_FUNCTION_CALL = process.env.REACT_APP_DISABLE_SCORE_FUNCTION_CALL === 'true';
const USER_DOCUMENT_ID = 'users';
const USER_PUBLIC_PROFILES_COLLECTION = 'userPublicProfiles';
const NORMALIZED_NICKNAME_MAX_LENGTH = 20;
const PUBLIC_NICKNAME_VALIDATOR = /^[a-z0-9._-]+( [a-z0-9._-]+)*$/;

type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh-CN';
const LANGUAGE_STORAGE_KEY = 'oms.language';

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

function getCallableErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const customData = (error as { customData?: unknown }).customData;
  if (!customData || typeof customData !== 'object') {
    return undefined;
  }

  const status = (customData as { httpStatus?: unknown }).httpStatus;
  if (typeof status === 'number') {
    return status;
  }

  const rawStatus = (customData as { status?: unknown }).status;
  if (typeof rawStatus === 'number') {
    return rawStatus;
  }
  if (typeof rawStatus === 'string') {
    const parsed = Number(rawStatus);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
}

function getCallableErrorStatusText(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const customData = (error as { customData?: unknown }).customData;
  if (!customData || typeof customData !== 'object') {
    return undefined;
  }

  const statusText =
    (customData as { statusText?: unknown }).statusText ??
    (customData as { httpStatusText?: unknown }).httpStatusText;
  if (typeof statusText === 'string' && statusText.trim()) {
    return statusText;
  }

  return undefined;
}

function getCallableErrorResponseText(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const customData = (error as { customData?: unknown }).customData;
  if (!customData || typeof customData !== 'object') {
    return undefined;
  }

  const rawText =
    (customData as { body?: unknown }).body ??
    (customData as { responseText?: unknown }).responseText ??
    (customData as { text?: unknown }).text ??
    (error as { details?: unknown }).details;

  if (typeof rawText === 'string') {
    return rawText;
  }
  if (rawText !== undefined && rawText !== null) {
    try {
      return JSON.stringify(rawText);
    } catch {
      return String(rawText);
    }
  }

  return undefined;
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

function sanitizeIdentityProfileForWrite(value: UserIdentityProfile): UserIdentityProfileForWrite {
  const normalizedIdentity = sanitizeIdentityProfile(value);
  const normalizedNickname = normalizePublicNickname(normalizedIdentity.nickname);

  return {
    ...normalizedIdentity,
    normalizedNickname,
  };
}

function normalizePublicNickname(value: string): string {
  const normalizedNickname = value
    .toLowerCase()
    .replace(/[^a-z0-9._-\s]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NORMALIZED_NICKNAME_MAX_LENGTH);

  if (!normalizedNickname || !PUBLIC_NICKNAME_VALIDATOR.test(normalizedNickname)) {
    throw new Error(
      '닉네임은 영문 소문자, 숫자, 점, 하이픈, 언더스코어, 공백만 사용할 수 있습니다.'
    );
  }

  return normalizedNickname;
}

function ensureSignedInIdentityWrite(uid: string, operation: string): void {
  const currentUser = getCurrentUser();
  console.debug(`[userDataService] ${operation} auth check`, {
    uid,
    currentUid: currentUser?.uid,
    isSignedIn: Boolean(currentUser),
  });

  if (!currentUser) {
    const error = new Error('로그인이 필요합니다.');
    (error as { code?: string }).code = 'auth/no-current-user';
    throw error;
  }

  if (currentUser.uid !== uid) {
    const error = new Error('요청한 사용자 UID와 로그인 사용자 UID가 일치하지 않습니다.');
    (error as { code?: string }).code = 'permission-denied';
    throw error;
  }
}

function logFirestoreWriteFailure(
  operation: string,
  documentPath: string,
  payload: Record<string, unknown>,
  error: unknown
): void {
  const code = getFirebaseErrorCode(error);
  const message = getFirebaseErrorMessage(error);

  if (code === 'permission-denied') {
    console.error(`[userDataService] ${operation} blocked`, {
      code,
      message,
      documentPath,
      payload,
    });
    return;
  }

  console.error(`[userDataService] ${operation} failed`, {
    code,
    message,
    documentPath,
    payload,
  });
}

async function upsertPublicIdentityProfile(
  uid: string,
  identity: UserIdentityProfile
): Promise<void> {
  ensureSignedInIdentityWrite(uid, 'upsertPublicIdentityProfile');
  const normalizedIdentity = sanitizeIdentityProfileForWrite(identity);
  const db = firebaseDb;
  if (!firebaseEnabled || !db) return;

  const publicProfileRef = doc(db, USER_PUBLIC_PROFILES_COLLECTION, uid);
  const publicProfile = {
    uid,
    nickname: normalizedIdentity.nickname,
    normalizedNickname: normalizedIdentity.normalizedNickname,
    country: normalizedIdentity.country,
    updatedAt: serverTimestamp(),
  };

  console.debug('[userDataService] upsertPublicIdentityProfile start', {
    uid,
    documentPath: publicProfileRef.path,
    normalizedIdentity,
  });
  try {
    await setDoc(publicProfileRef, publicProfile, { merge: true });
    console.debug('[userDataService] upsertPublicIdentityProfile success', { uid });
  } catch (error) {
    logFirestoreWriteFailure(
      'upsertPublicIdentityProfile',
      publicProfileRef.path,
      {
        uid: publicProfile.uid,
        nickname: publicProfile.nickname,
        normalizedNickname: publicProfile.normalizedNickname,
        country: publicProfile.country,
      },
      error
    );
    throw error;
  }
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

  console.debug('[userDataService] submitScoreViaCallable start', {
    functionName: SCORE_SUBMIT_FUNCTION_NAME,
    payload: {
      nickname: scoreData.nickname,
      country: scoreData.country,
    },
    region: 'asia-northeast3',
  });
  try {
    const call = httpsCallable(firebaseFunctions, SCORE_SUBMIT_FUNCTION_NAME);
    const response = await call(scoreData);
    const data = response.data as ScoreSubmitResult;
    if (!data || typeof data.success !== 'boolean') {
      throw new Error('Cloud Function response format is invalid.');
    }

    if (!data.success) {
      throw new Error(data.message ?? 'Cloud Function score submit rejected.');
    }
    console.debug('[userDataService] submitScoreViaCallable success', {
      success: data.success,
      cloudSynced: data.cloudSynced,
    });
    return data;
  } catch (error) {
    const status = getCallableErrorStatus(error);
    const statusText = getCallableErrorStatusText(error);
    const responseText = getCallableErrorResponseText(error);
    console.error('[userDataService] submitScoreViaCallable failed', {
      code: getFirebaseErrorCode(error),
      message: getFirebaseErrorMessage(error),
      status,
      statusText,
      responseText,
      functionName: SCORE_SUBMIT_FUNCTION_NAME,
      region: 'asia-northeast3',
      payload: {
        nickname: scoreData.nickname,
        country: scoreData.country,
      },
    });
    throw error;
  }
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

  const dailyChallengeDateKey = profile.dailyChallenge.dateKey || todayDateKey();
  await setDoc(
    doc(db, 'users', uid, 'daily', dailyChallengeDateKey),
    {
      targetSeconds: profile.dailyChallenge.targetSeconds,
      rewardCoins: profile.dailyChallenge.rewardCoins,
      completed: profile.dailyChallenge.completed,
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
  ensureSignedInIdentityWrite(uid, 'upsertUserIdentityProfile');
  const normalizedIdentity = sanitizeIdentityProfileForWrite(identity);
  const db = firebaseDb;
  if (!firebaseEnabled || !db) {
    console.debug('[userDataService] upsertUserIdentityProfile skipped (firebase disabled)', {
      uid,
    });
    return;
  }

  console.debug('[userDataService] upsertUserIdentityProfile start', {
    uid,
    normalizedIdentity,
  });
  const userRef = doc(db, USER_DOCUMENT_ID, uid);
  const userPayload = {
    nickname: normalizedIdentity.nickname,
    country: normalizedIdentity.country,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(userRef, userPayload, { merge: true });
    console.debug('[userDataService] upsertUserIdentityProfile wrote users doc', {
      uid,
      documentPath: userRef.path,
    });

    await upsertPublicIdentityProfile(uid, normalizedIdentity);
    console.debug('[userDataService] upsertUserIdentityProfile wrote public profile', { uid });
  } catch (error) {
    const publicProfileRef = doc(db, USER_PUBLIC_PROFILES_COLLECTION, uid);
    logFirestoreWriteFailure(
      'upsertUserIdentityProfile',
      userRef.path,
      {
        uid,
        nickname: userPayload.nickname,
        country: userPayload.country,
      },
      error
    );
    logFirestoreWriteFailure(
      'upsertUserIdentityProfile',
      publicProfileRef.path,
      {
        uid,
        nickname: normalizedIdentity.nickname,
        normalizedNickname: normalizedIdentity.normalizedNickname,
        country: normalizedIdentity.country,
      },
      error
    );
    throw error;
  }
}

export async function isNicknameAvailable(
  nickname: string,
  currentUid?: string
): Promise<boolean> {
  const db = firebaseDb;
  if (!firebaseEnabled || !db) return true;

  let normalized: string;
  try {
    normalized = normalizePublicNickname(normalizeNickname(nickname));
  } catch {
    return false;
  }

  try {
    console.debug('[userDataService] isNicknameAvailable query', {
      normalized,
      currentUid,
    });
    const q = query(
      collection(db, USER_PUBLIC_PROFILES_COLLECTION),
      where('normalizedNickname', '==', normalized),
      limitFn(20)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return true;

    const result = snapshot.docs.every((docSnap) => Boolean(currentUid && docSnap.id === currentUid));
    console.debug('[userDataService] isNicknameAvailable result', {
      normalized,
      currentUid,
      snapshotSize: snapshot.size,
      result,
    });
    return result;
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
