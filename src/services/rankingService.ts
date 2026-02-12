import {
  collection,
  QueryDocumentSnapshot,
  DocumentData,
  getDocs,
  limit as limitFn,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import {
  RankingEntry,
  getCountryRanking as getLocalCountryRanking,
  getDailyRanking as getLocalDailyRanking,
  getGlobalRanking as getLocalGlobalRanking,
} from '../gameSystem/ranking';
import { firebaseDb, firebaseEnabled } from '../lib/firebase';
const FETCH_MULTIPLIER = 5;
const MAX_FETCH_LIMIT = 500;
interface CloudRankingEntry extends RankingEntry {
  uid: string;
}

function dateKey(d = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function mapDocsToRankingEntries(
  docs: QueryDocumentSnapshot<DocumentData>[]
): CloudRankingEntry[] {
  return docs.map((snapshot) => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      uid: String(data.uid ?? ''),
      nickname: String(data.nickname ?? 'UNKNOWN'),
      country: String(data.country ?? 'KR'),
      score: Number(data.score ?? 0),
      timestamp:
        typeof data.createdAt?.toMillis === 'function'
          ? data.createdAt.toMillis()
          : Date.now(),
      dateKey: String(data.dateKey ?? dateKey()),
    };
  });
}

function sortByScoreAndRecent(a: RankingEntry, b: RankingEntry): number {
  if (b.score !== a.score) return b.score - a.score;
  return b.timestamp - a.timestamp;
}

function dedupeByUidNickname(
  entries: CloudRankingEntry[],
  limit: number
): RankingEntry[] {
  const byIdentity = new Map<string, CloudRankingEntry>();

  entries.forEach((entry) => {
    const key = `${entry.uid}::${entry.nickname.trim().toLowerCase()}`;
    const existing = byIdentity.get(key);
    if (!existing) {
      byIdentity.set(key, entry);
      return;
    }

    if (
      entry.score > existing.score ||
      (entry.score === existing.score && entry.timestamp > existing.timestamp)
    ) {
      byIdentity.set(key, entry);
    }
  });

  return Array.from(byIdentity.values())
    .sort(sortByScoreAndRecent)
    .slice(0, limit)
    .map(({ uid: _uid, ...entry }) => entry);
}

export async function getGlobalRanking(limit = 100): Promise<RankingEntry[]> {
  if (!firebaseEnabled || !firebaseDb) return getLocalGlobalRanking(limit);

  try {
    const fetchLimit = Math.min(limit * FETCH_MULTIPLIER, MAX_FETCH_LIMIT);
    const q = query(
      collection(firebaseDb, 'scoreSubmissions'),
      orderBy('score', 'desc'),
      limitFn(fetchLimit)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return getLocalGlobalRanking(limit);
    return dedupeByUidNickname(mapDocsToRankingEntries(snapshot.docs), limit);
  } catch {
    return getLocalGlobalRanking(limit);
  }
}

export async function getCountryRanking(
  country: string,
  limit = 50
): Promise<RankingEntry[]> {
  if (!firebaseEnabled || !firebaseDb) return getLocalCountryRanking(country, limit);

  try {
    const fetchLimit = Math.min(limit * FETCH_MULTIPLIER, MAX_FETCH_LIMIT);
    const q = query(
      collection(firebaseDb, 'scoreSubmissions'),
      where('country', '==', country),
      orderBy('score', 'desc'),
      limitFn(fetchLimit)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return getLocalCountryRanking(country, limit);
    return dedupeByUidNickname(mapDocsToRankingEntries(snapshot.docs), limit);
  } catch {
    return getLocalCountryRanking(country, limit);
  }
}

export async function getDailyRanking(
  date?: string,
  limit = 50
): Promise<RankingEntry[]> {
  const key = date ?? dateKey();
  if (!firebaseEnabled || !firebaseDb) return getLocalDailyRanking(key, limit);

  try {
    const fetchLimit = Math.min(limit * FETCH_MULTIPLIER, MAX_FETCH_LIMIT);
    const q = query(
      collection(firebaseDb, 'scoreSubmissions'),
      where('dateKey', '==', key),
      orderBy('score', 'desc'),
      limitFn(fetchLimit)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return getLocalDailyRanking(key, limit);
    return dedupeByUidNickname(mapDocsToRankingEntries(snapshot.docs), limit);
  } catch {
    return getLocalDailyRanking(key, limit);
  }
}
