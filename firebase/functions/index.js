const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');

initializeApp();

const db = getFirestore();

const ALLOWED_ORIGINS = [
  'https://onemoresecond.site',
  'https://www.onemoresecond.site',
  'https://one-more-sencond-web.firebaseapp.com',
  'https://one-more-sencond-web.web.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function isAllowedOrigin(origin) {
  if (typeof origin !== 'string' || !origin.trim()) {
    return false;
  }
  const normalized = origin.toLowerCase().trim().replace(/\/$/, '');
  return ALLOWED_ORIGINS.map((allowed) => allowed.toLowerCase()).includes(normalized);
}

function getAllowedOrigin(origin) {
  if (!origin) return undefined;
  return isAllowedOrigin(origin) ? origin.toLowerCase().trim().replace(/\/$/, '') : undefined;
}

function setCorsHeaders(res, origin) {
  const allowedOrigin = getAllowedOrigin(origin);
  if (allowedOrigin) {
    res.set('Access-Control-Allow-Origin', allowedOrigin);
    res.set('Vary', 'Origin');
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Firebase-AppCheck');
  res.set('Access-Control-Allow-Credentials', 'true');
}

function normalizeScore(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return fallback;
  }
  return Math.floor(num);
}

function parseAuthHeader(headers) {
  const authHeader = headers?.authorization ?? headers?.Authorization;
  if (typeof authHeader !== 'string') {
    return undefined;
  }
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

function normalizePayload(rawData) {
  if (!rawData || typeof rawData !== 'object') {
    return null;
  }
  const score = normalizeScore(rawData.score);
  const finalScore = normalizeScore(rawData.finalScore, score);
  const normalScore = normalizeScore(rawData.normalScore, score);
  if (score <= 0) {
    return null;
  }
  return {
    nickname: String(rawData.nickname || '').trim().slice(0, 40),
    country: String(rawData.country || '').trim().slice(0, 8),
    score,
    finalScore,
    normalScore,
    clientTimestamp: Number(rawData.clientTimestamp) || Date.now(),
  };
}

async function submitScoreInternal(uid, data) {
  const safeData = normalizePayload(data);
  if (!safeData) {
    throw new HttpsError('invalid-argument', 'Invalid payload format.');
  }

  const safePayload = {
    uid,
    nickname: safeData.nickname,
    country: safeData.country,
    score: safeData.score,
    finalScore: safeData.finalScore,
    normalScore: safeData.normalScore,
    clientTimestamp: safeData.clientTimestamp,
    createdAt: Timestamp.now(),
  };

  await db.collection('scoreSubmissions').add(safePayload);

  return {
    success: true,
    cloudSynced: true,
    message: 'Score submitted and synced.',
  };
}

exports.submitScore = onRequest(
  {
    region: 'asia-northeast3',
    cors: ALLOWED_ORIGINS,
  },
  async (req, res) => {
    const origin = req.headers.origin;
    const allowedOrigin = getAllowedOrigin(origin);
    setCorsHeaders(res, allowedOrigin);

    if (req.method === 'OPTIONS') {
      if (!allowedOrigin) {
        res.status(403).send('Origin is not allowed.');
        return;
      }
      res.status(204).send('');
      return;
    }

    if (!allowedOrigin) {
      res.status(403).json({
        success: false,
        cloudSynced: false,
        message: 'Origin is not allowed.',
      });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({
        success: false,
        cloudSynced: false,
        message: 'Only POST is allowed for submitScore.',
      });
      return;
    }

    const token = parseAuthHeader(req.headers);
    if (!token) {
      res.status(401).json({
        success: false,
        cloudSynced: false,
        message: 'Authentication token is required.',
      });
      return;
    }

    try {
      const decoded = await getAuth().verifyIdToken(token);
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const payload = body.data && typeof body.data === 'object' ? body.data : body;
      const result = await submitScoreInternal(decoded.uid, payload);
      res.status(200).json(result);
    } catch (error) {
      console.error('[submitScore] http submit failed', error);
      const status =
        error && typeof error === 'object' && 'code' in error ? 401 : 500;
      const message = error instanceof Error ? error.message : 'Failed to submit score.';
      res.status(status).json({
        success: false,
        cloudSynced: false,
        message,
      });
    }
  }
);

exports.submitScoreCallable = onCall(
  {
    region: 'asia-northeast3',
    cors: ALLOWED_ORIGINS,
  },
  async (request) => {
    const { auth, data } = request;

    if (!auth || !auth.uid) {
      throw new HttpsError('unauthenticated', 'Sign in is required to submit a score.');
    }

    const result = await submitScoreInternal(auth.uid, data);
    return result;
  }
);
