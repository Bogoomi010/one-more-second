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

function dateKey(d = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function mapDocsToRankingEntries(
  docs: QueryDocumentSnapshot<DocumentData>[]
): RankingEntry[] {
  return docs.map((snapshot) => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
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

export async function getGlobalRanking(limit = 100): Promise<RankingEntry[]> {
  if (!firebaseEnabled || !firebaseDb) return getLocalGlobalRanking(limit);

  try {
    const q = query(
      collection(firebaseDb, 'scoreSubmissions'),
      orderBy('score', 'desc'),
      limitFn(limit)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return getLocalGlobalRanking(limit);
    return mapDocsToRankingEntries(snapshot.docs);
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
    const q = query(
      collection(firebaseDb, 'scoreSubmissions'),
      where('country', '==', country),
      orderBy('score', 'desc'),
      limitFn(limit)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return getLocalCountryRanking(country, limit);
    return mapDocsToRankingEntries(snapshot.docs);
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
    const q = query(
      collection(firebaseDb, 'scoreSubmissions'),
      where('dateKey', '==', key),
      orderBy('score', 'desc'),
      limitFn(limit)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return getLocalDailyRanking(key, limit);
    return mapDocsToRankingEntries(snapshot.docs);
  } catch {
    return getLocalDailyRanking(key, limit);
  }
}
