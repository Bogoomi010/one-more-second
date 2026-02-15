const RANKING_STORAGE_KEY = 'oms.ranking.v1';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface RankingEntry {
  id: string;
  nickname: string;
  country: string;
  score: number;
  finalScore?: number;
  normalScore?: number;
  timestamp: number;
  dateKey: string;
}

export interface RankingData {
  version: 1;
  global: RankingEntry[];
  byCountry: Record<string, RankingEntry[]>;
  daily: Record<string, RankingEntry[]>;
}

function dateKey(d = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function defaultRankingData(): RankingData {
  return {
    version: 1,
    global: [],
    byCountry: {},
    daily: {},
  };
}

export function loadRankingData(): RankingData {
  try {
    const raw = localStorage.getItem(RANKING_STORAGE_KEY);
    if (!raw) return defaultRankingData();

    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return defaultRankingData();

    return {
      ...defaultRankingData(),
      ...parsed,
      byCountry: parsed.byCountry ?? {},
      daily: parsed.daily ?? {},
    };
  } catch {
    return defaultRankingData();
  }
}

export function saveRankingData(data: RankingData): void {
  localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(data));
}

function sortByScoreDesc(a: RankingEntry, b: RankingEntry): number {
  if (b.score !== a.score) return b.score - a.score;
  return b.timestamp - a.timestamp;
}

function nicknameKey(nickname: string): string {
  return nickname.trim().toLowerCase();
}

function upsertBestByNickname(
  list: RankingEntry[],
  entry: RankingEntry,
  maxLength: number
): RankingEntry[] {
  const key = nicknameKey(entry.nickname);
  const idx = list.findIndex((item) => nicknameKey(item.nickname) === key);

  if (idx === -1) {
    const next = [...list, entry].sort(sortByScoreDesc);
    return next.slice(0, maxLength);
  }

  const existing = list[idx];
  if (
    entry.score > existing.score ||
    (entry.score === existing.score && entry.timestamp > existing.timestamp)
  ) {
    const next = [...list];
    next[idx] = entry;
    next.sort(sortByScoreDesc);
    return next.slice(0, maxLength);
  }

  return [...list].sort(sortByScoreDesc).slice(0, maxLength);
}

export function addRankingEntry(
  nickname: string,
  country: string,
  score: number,
  options?: { finalScore?: number; normalScore?: number }
): RankingEntry {
  const data = loadRankingData();
  const today = dateKey();

  const entry: RankingEntry = {
    id: generateId(),
    nickname,
    country,
    score,
    finalScore: options?.finalScore ?? score,
    normalScore: options?.normalScore,
    timestamp: Date.now(),
    dateKey: today,
  };

  data.global = upsertBestByNickname(data.global, entry, 100);

  if (!data.byCountry[country]) {
    data.byCountry[country] = [];
  }
  data.byCountry[country] = upsertBestByNickname(data.byCountry[country], entry, 50);

  if (!data.daily[today]) {
    data.daily[today] = [];
  }
  data.daily[today] = upsertBestByNickname(data.daily[today], entry, 50);

  const allDates = Object.keys(data.daily).sort().reverse();
  if (allDates.length > 7) {
    const toDelete = allDates.slice(7);
    toDelete.forEach((date) => {
      delete data.daily[date];
    });
  }

  saveRankingData(data);
  return entry;
}

export function getGlobalRanking(limit = 100): RankingEntry[] {
  const data = loadRankingData();
  return data.global.slice(0, limit);
}

export function getCountryRanking(country: string, limit = 50): RankingEntry[] {
  const data = loadRankingData();
  return (data.byCountry[country] ?? []).slice(0, limit);
}

export function getDailyRanking(date?: string, limit = 50): RankingEntry[] {
  const data = loadRankingData();
  const key = date ?? dateKey();
  return (data.daily[key] ?? []).slice(0, limit);
}

export function getUserRank(
  entryId: string,
  type: 'global' | 'country' | 'daily',
  country?: string,
  date?: string
): number | null {
  const data = loadRankingData();

  let list: RankingEntry[];
  if (type === 'global') {
    list = data.global;
  } else if (type === 'country' && country) {
    list = data.byCountry[country] ?? [];
  } else if (type === 'daily') {
    const key = date ?? dateKey();
    list = data.daily[key] ?? [];
  } else {
    return null;
  }

  const index = list.findIndex((e) => e.id === entryId);
  return index >= 0 ? index + 1 : null;
}

export function clearRankingData(): void {
  saveRankingData(defaultRankingData());
}
