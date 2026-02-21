const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');

initializeApp();

const db = getFirestore();

const ALLOWED_ORIGINS = [
  'https://onemoresecond.site',
  'https://www.onemoresecond.site',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function normalizeScore(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return fallback;
  }
  return Math.floor(num);
}

exports.submitScore = onCall(
  {
    region: 'asia-northeast3',
    cors: ALLOWED_ORIGINS,
  },
  async (request) => {
    const { auth, data } = request;

    if (!auth || !auth.uid) {
      throw new HttpsError('unauthenticated', 'Sign in is required to submit a score.');
    }

    if (!data || typeof data !== 'object') {
      throw new HttpsError('invalid-argument', 'Invalid payload format.');
    }

    const score = normalizeScore(data.score);
    const finalScore = normalizeScore(data.finalScore, score);
    const normalScore = normalizeScore(data.normalScore, score);

    if (score <= 0) {
      throw new HttpsError('invalid-argument', 'Score must be a positive number.');
    }

    const safePayload = {
      uid: auth.uid,
      nickname: String(data.nickname || '').trim().slice(0, 40),
      country: String(data.country || '').trim().slice(0, 8),
      score,
      finalScore,
      normalScore,
      clientTimestamp: Number(data.clientTimestamp) || Date.now(),
      createdAt: Timestamp.now(),
    };

    await db.collection('scoreSubmissions').add(safePayload);

    return {
      success: true,
      cloudSynced: true,
      message: 'Score submitted and synced.',
    };
  }
);
