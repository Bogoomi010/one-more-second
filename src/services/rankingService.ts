import {
  collection,
  documentId,
  getDocs,
  limit as limitFn,
  orderBy,
  query,
  QueryDocumentSnapshot,
  DocumentData,
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
const USERS_IN_QUERY_LIMIT = 30;
const USER_PUBLIC_PROFILES_COLLECTION = 'userPublicProfiles';

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
  docs: QueryDocumentSnapshot<DocumentData>[],
  options?: { defaultDateKey?: string }
): CloudRankingEntry[] {
  return docs.map((snapshot) => {
    const data = snapshot.data();
    const uid = String(data.uid ?? snapshot.id);
    const timestampFromUpdatedAt =
      typeof data.updatedAt?.toMillis === 'function' ? data.updatedAt.toMillis() : null;
    const timestampFromCreatedAt =
      typeof data.createdAt?.toMillis === 'function' ? data.createdAt.toMillis() : null;
    const finalScore = Number(data.finalScore ?? data.score ?? 0);
    const normalScore =
      data.normalScore === undefined || data.normalScore === null
        ? undefined
        : Number(data.normalScore);

    return {
      id: snapshot.id,
      uid,
      nickname: String(data.nickname ?? ''),
      country: String(data.country ?? 'KR'),
      score: finalScore,
      finalScore,
      normalScore,
      timestamp:
        timestampFromUpdatedAt ??
        timestampFromCreatedAt ??
        Number(data.clientTimestamp ?? Date.now()),
      dateKey: String(data.dateKey ?? options?.defaultDateKey ?? dateKey()),
    };
  });
}

function sortByScoreAndRecent(a: RankingEntry, b: RankingEntry): number {
  if (b.score !== a.score) return b.score - a.score;
  return b.timestamp - a.timestamp;
}

function dedupeByUid(entries: CloudRankingEntry[], limit: number): CloudRankingEntry[] {
  const byIdentity = new Map<string, CloudRankingEntry>();

  entries.forEach((entry) => {
    const key = entry.uid || entry.id;
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
    .slice(0, limit);
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function getUserIdentityMap(
  uids: string[]
): Promise<Map<string, { nickname: string; country: string }>> {
  const map = new Map<string, { nickname: string; country: string }>();
  if (!firebaseEnabled || !firebaseDb) return map;

  const uniqueUids = Array.from(new Set(uids.filter(Boolean)));
  if (uniqueUids.length === 0) return map;

  const uidChunks = chunk(uniqueUids, USERS_IN_QUERY_LIMIT);
  for (const uidChunk of uidChunks) {
    try {
      const usersQuery = query(
        collection(firebaseDb, USER_PUBLIC_PROFILES_COLLECTION),
        where(documentId(), 'in', uidChunk)
      );
      const userSnapshot = await getDocs(usersQuery);
      userSnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as { nickname?: string; country?: string };
        const nickname = String(data.nickname ?? '').trim();
        const country = String(data.country ?? '').trim();
        if (!nickname) return;
        map.set(docSnap.id, {
          nickname,
          country: country || 'KR',
        });
      });
    } catch {
      // Keep ranking data usable even if public profile lookup fails.
      continue;
    }
  }

  return map;
}

async function applyProfileIdentity(entries: CloudRankingEntry[]): Promise<RankingEntry[]> {
  const identityMap = await getUserIdentityMap(entries.map((entry) => entry.uid));

  return entries.map(({ uid, ...entry }) => {
    const identity = identityMap.get(uid);
    return {
      ...entry,
      nickname: identity?.nickname ?? (entry.nickname || 'UNKNOWN'),
      country: identity?.country ?? (entry.country || 'KR'),
    };
  });
}

async function readLeaderboardEntries(
  path: [string, string, string],
  limit: number,
  options?: { defaultDateKey?: string }
): Promise<RankingEntry[]> {
  if (!firebaseEnabled || !firebaseDb) return [];

  try {
    const entriesQuery = query(
      collection(firebaseDb, path[0], path[1], path[2]),
      orderBy('score', 'desc'),
      limitFn(limit)
    );
    const snapshot = await getDocs(entriesQuery);
    if (snapshot.empty) return [];

    const mappedEntries = mapDocsToRankingEntries(snapshot.docs, options);
    return applyProfileIdentity(mappedEntries);
  } catch {
    return [];
  }
}

async function readLegacyScoreSubmissions(
  constraints: Array<{ field: string; value: string }> | null,
  limit: number,
  fallbackDateKey?: string
): Promise<RankingEntry[]> {
  if (!firebaseEnabled || !firebaseDb) return [];

  try {
    const fetchLimit = Math.min(limit * FETCH_MULTIPLIER, MAX_FETCH_LIMIT);
    const whereClauses = (constraints ?? []).map((constraint) =>
      where(constraint.field, '==', constraint.value)
    );

    const submissionsQuery = query(
      collection(firebaseDb, 'scoreSubmissions'),
      ...whereClauses,
      orderBy('score', 'desc'),
      limitFn(fetchLimit)
    );

    const snapshot = await getDocs(submissionsQuery);
    if (snapshot.empty) return [];

    const mappedEntries = mapDocsToRankingEntries(snapshot.docs, {
      defaultDateKey: fallbackDateKey,
    });
    const deduped = dedupeByUid(mappedEntries, limit);
    return applyProfileIdentity(deduped);
  } catch {
    return [];
  }
}

export async function getGlobalRanking(limit = 100): Promise<RankingEntry[]> {
  const leaderboardEntries = await readLeaderboardEntries(
    ['leaderboardsGlobal', 'all', 'entries'],
    limit
  );
  if (leaderboardEntries.length > 0) return leaderboardEntries;

  const legacyEntries = await readLegacyScoreSubmissions(null, limit);
  if (legacyEntries.length > 0) return legacyEntries;

  return getLocalGlobalRanking(limit);
}

export async function getCountryRanking(
  country: string,
  limit = 50
): Promise<RankingEntry[]> {
  const leaderboardEntries = await readLeaderboardEntries(
    ['leaderboardsCountry', country, 'entries'],
    limit
  );
  if (leaderboardEntries.length > 0) return leaderboardEntries;

  const legacyEntries = await readLegacyScoreSubmissions(
    [{ field: 'country', value: country }],
    limit
  );
  if (legacyEntries.length > 0) return legacyEntries;

  return getLocalCountryRanking(country, limit);
}

export async function getDailyRanking(
  date?: string,
  limit = 50
): Promise<RankingEntry[]> {
  const key = date ?? dateKey();

  const leaderboardEntries = await readLeaderboardEntries(
    ['leaderboardsDaily', key, 'entries'],
    limit,
    { defaultDateKey: key }
  );
  if (leaderboardEntries.length > 0) return leaderboardEntries;

  const legacyEntries = await readLegacyScoreSubmissions(
    [{ field: 'dateKey', value: key }],
    limit,
    key
  );
  if (legacyEntries.length > 0) return legacyEntries;

  return getLocalDailyRanking(key, limit);
}
