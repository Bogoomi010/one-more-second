const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const functions = require('firebase-functions');

const FN_NAME = 'submitScore';
const REGION = 'asia-northeast3';
const COLLECTION_NAME = 'scoreSubmissions';

const app = initializeApp();
const db = getFirestore();
const projectId =
  app?.options?.projectId ||
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.FIREBASE_CONFIG &&
  (() => {
    try {
      return JSON.parse(process.env.FIREBASE_CONFIG || '{}')?.projectId;
    } catch (_e) {
      return undefined;
    }
  })();

function getRequestContext(context) {
  const rawRequest = context && context.rawRequest ? context.rawRequest : null;
  const requestHeaders = rawRequest && typeof rawRequest.headers === 'object' ? rawRequest.headers : null;
  return {
    requestId: context && context.rawRequest ? context.rawRequest?.headers?.['x-cloud-trace-context'] : null,
    rawAuthType: context?.auth ? typeof context.auth === 'object' : false,
    ip: rawRequest?.ip || requestHeaders?.['x-forwarded-for'] || null,
    host: rawRequest?.host || requestHeaders?.host || null,
    userAgent: requestHeaders?.['user-agent'] || null,
    method: rawRequest?.method || null,
    url: rawRequest?.url || null,
  };
}

function logDebug(level, stage, details) {
  const logPayload = {
    function: FN_NAME,
    region: REGION,
    ...details,
  };
  if (level === 'error') {
    console.error(`[submitScore] ${stage}`, logPayload);
    return;
  }
  if (level === 'warn') {
    console.warn(`[submitScore] ${stage}`, logPayload);
    return;
  }
  console.log(`[submitScore] ${stage}`, logPayload);
}

function normalizeString(value, maxLen = 0) {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  return maxLen > 0 ? trimmed.slice(0, maxLen) : trimmed;
}

function normalizeScore(value, fallback = null) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    if (fallback === null) {
      return null;
    }
    return Number(fallback);
  }
  return Math.floor(num);
}

function normalizePayload(rawData) {
  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
    return null;
  }

  const score = normalizeScore(rawData.score, null);
  const finalScore = normalizeScore(rawData.finalScore, score);
  const normalScore = normalizeScore(rawData.normalScore, score);

  if (score === null || score <= 0 || finalScore === null || normalScore === null) {
    return null;
  }

  const clientTimestamp = normalizeScore(rawData.clientTimestamp, Date.now());
  const country = normalizeString(rawData.country, 8);
  const nickname = normalizeString(rawData.nickname, 40);

  return {
    nickname,
    country,
    score,
    finalScore,
    normalScore,
    clientTimestamp,
  };
}

function toHttpsError(error, fallbackCode, fallbackMessage, fallbackDetails) {
  if (error && typeof error === 'object' && typeof error.code === 'string') {
    return error;
  }
  return new functions.https.HttpsError(fallbackCode, fallbackMessage, fallbackDetails);
}

function sanitizeNumericContext(context) {
  return {
    uidType: typeof context?.auth?.uid,
    hasAuth: Boolean(context?.auth),
    hasAuthUid: Boolean(context?.auth?.uid),
    tokenType: typeof context?.auth?.token,
    requestHost: context?.rawRequest?.host || null,
  };
}

async function submitScoreInternal(uid, data) {
  const safeData = normalizePayload(data);
  if (!safeData) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid payload format.');
  }

  if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
    throw new functions.https.HttpsError('unauthenticated', 'Missing or invalid authenticated user.');
  }

  const safePayload = {
    ...safeData,
    uid,
    createdBy: 'submitScore callable',
    createdAt: Timestamp.now(),
  };

  const expectedUrl = projectId
    ? `https://${REGION}-${projectId}.cloudfunctions.net/${FN_NAME}`
    : null;
  logDebug('log', 'write.request', {
    uid,
    expectedFunctionUrl: expectedUrl,
  });

  try {
    const docRef = await db.collection(COLLECTION_NAME).add(safePayload);
    logDebug('log', 'write.success', {
      uid,
      docId: docRef.id,
      score: safePayload.score,
      finalScore: safePayload.finalScore,
      normalScore: safePayload.normalScore,
    });
    return {
      success: true,
      cloudSynced: true,
      message: 'Score submitted and synced.',
      docId: docRef.id,
    };
  } catch (error) {
    logDebug('error', 'write.failed', {
      uid,
      collection: COLLECTION_NAME,
      code: error?.code || 'unknown',
      message: error?.message || String(error),
      projectId,
    });
    throw toHttpsError(
      error,
      'internal',
      'Failed to write score to Firestore.',
      {
        collection: COLLECTION_NAME,
      }
    );
  }
}

function validateAuth(context) {
  if (!context || typeof context !== 'object' || !context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in is required to submit a score.');
  }
  if (typeof context.auth.uid !== 'string') {
    throw new functions.https.HttpsError('unauthenticated', 'User ID is invalid.');
  }
}

async function submitScoreHandler(data, context) {
  const uid = String(context.auth.uid);
  const requestContext = getRequestContext(context);
  logDebug('log', 'request.start', {
    uid,
    stage: 'start',
    hasContext: Boolean(context),
    requestContext,
    expectedFunctionUrl: projectId
      ? `https://${REGION}-${projectId}.cloudfunctions.net/${FN_NAME}`
      : null,
    regionInRequestHost: requestContext.host ? requestContext.host.includes(REGION) : null,
    sanitizeNumericContext: sanitizeNumericContext(context),
  });

  if (!uid || uid.length === 0) {
    throw new functions.https.HttpsError('unauthenticated', 'Authenticated user ID is empty.');
  }

  return submitScoreInternal(uid, data);
}

function summarizePayloadForLog(data) {
  if (!data || typeof data !== 'object') {
    return {
      payloadType: typeof data,
    };
  }
  return {
    hasNickname: typeof data.nickname === 'string',
    hasCountry: typeof data.country === 'string',
    hasScore: 'score' in data,
    hasFinalScore: 'finalScore' in data,
    hasNormalScore: 'normalScore' in data,
    hasClientTimestamp: 'clientTimestamp' in data,
    dataKeys: Object.keys(data),
  };
}

exports.submitScore = functions
  .region(REGION)
  .https.onCall(async (data, context) => {
    const requestContext = getRequestContext(context);
  logDebug('log', 'call.invoked', {
    expectedRegion: REGION,
    requestContext,
    payloadSummary: summarizePayloadForLog(data),
  });

    if (requestContext.host && !requestContext.host.includes(REGION)) {
      logDebug('warn', 'region.mismatch.suspected', {
        expectedRegion: REGION,
        requestHost: requestContext.host,
        requestUrl: requestContext.url,
      });
    }

  try {
    validateAuth(context);
    const result = await submitScoreHandler(data, context);
    logDebug('log', 'call.success', {
      uid: context?.auth?.uid,
      result,
    });
    return result;
  } catch (error) {
    const safeError = toHttpsError(
      error,
      'internal',
      'submitScore processing failed.',
      {
        requestRegion: REGION,
        expectedRegion: REGION,
        requestHost: requestContext.host,
      }
    );

    const code =
      safeError?.code || error?.code || 'internal';
    const message =
      safeError?.message ||
      error?.message ||
      'submitScore processing failed.';

    logDebug('error', 'call.error', {
      code,
      message,
      uid: context?.auth?.uid,
      requestRegion: REGION,
      requestHost: requestContext.host,
      payloadSummary: summarizePayloadForLog(data),
      authSummary: sanitizeNumericContext(context),
      details: safeError?.details || null,
    });

    throw safeError;
  }
});
