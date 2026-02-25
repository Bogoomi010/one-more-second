const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const functions = require('firebase-functions');

initializeApp();

const db = getFirestore();

function normalizeScore(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return fallback;
  }
  return Math.floor(num);
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

exports.submitScore = functions
  .region('asia-northeast3')
  .https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Sign in is required to submit a score.');
    }

    const result = await submitScoreInternal(context.auth.uid, data);
    return result;
  });
