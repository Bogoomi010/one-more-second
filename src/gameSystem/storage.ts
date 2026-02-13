import { BulletSkinId, LegacySkinId, PlayerProfile, PlayerSkinId } from './types';
import {
  DEFAULT_BULLET_SKIN_ID,
  DEFAULT_PLAYER_SKIN_ID,
  getLegacySkinCombination,
  isBulletSkinId,
  isLegacySkinId,
  isPlayerSkinId,
  resolveLegacySkinState,
} from './skins';

const STORAGE_KEY = 'oms.profile.v1';

function now() {
  return Date.now();
}

function uniqueArray<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function sanitizePlayerSkinIds(raw: unknown): PlayerSkinId[] {
  if (!Array.isArray(raw)) return [];
  return uniqueArray(raw.filter(isPlayerSkinId));
}

function sanitizeBulletSkinIds(raw: unknown): BulletSkinId[] {
  if (!Array.isArray(raw)) return [];
  return uniqueArray(raw.filter(isBulletSkinId));
}

function expandLegacyOwnedSkins(raw: unknown): {
  ownedPlayerSkins: PlayerSkinId[];
  ownedBulletSkins: BulletSkinId[];
} {
  if (!Array.isArray(raw)) {
    return {
      ownedPlayerSkins: [DEFAULT_PLAYER_SKIN_ID],
      ownedBulletSkins: [DEFAULT_BULLET_SKIN_ID],
    };
  }

  const ownedLegacySkins = raw.filter(isLegacySkinId);
  const ownedPlayerSkins: PlayerSkinId[] = [DEFAULT_PLAYER_SKIN_ID];
  const ownedBulletSkins: BulletSkinId[] = [DEFAULT_BULLET_SKIN_ID];

  ownedLegacySkins.forEach((legacySkinId) => {
    const legacy = getLegacySkinCombination(legacySkinId);
    ownedPlayerSkins.push(legacy.playerSkinId);
    ownedBulletSkins.push(legacy.bulletSkinId);
  });

  return {
    ownedPlayerSkins: uniqueArray(ownedPlayerSkins),
    ownedBulletSkins: uniqueArray(ownedBulletSkins),
  };
}

function normalizeProfileSkins(profile: PlayerProfile): PlayerProfile {
  const normalizedOwnedPlayerSkins = uniqueArray([
    DEFAULT_PLAYER_SKIN_ID,
    ...profile.ownedPlayerSkins.filter(isPlayerSkinId),
  ]);
  const normalizedOwnedBulletSkins = uniqueArray([
    DEFAULT_BULLET_SKIN_ID,
    ...profile.ownedBulletSkins.filter(isBulletSkinId),
  ]);

  const selectedPlayerSkinId = normalizedOwnedPlayerSkins.includes(profile.selectedPlayerSkinId)
    ? profile.selectedPlayerSkinId
    : DEFAULT_PLAYER_SKIN_ID;
  const selectedBulletSkinId = normalizedOwnedBulletSkins.includes(profile.selectedBulletSkinId)
    ? profile.selectedBulletSkinId
    : DEFAULT_BULLET_SKIN_ID;

  const legacySkinState = resolveLegacySkinState(
    normalizedOwnedPlayerSkins,
    normalizedOwnedBulletSkins,
    selectedPlayerSkinId,
    selectedBulletSkinId
  );

  return {
    ...profile,
    selectedPlayerSkinId,
    selectedBulletSkinId,
    ownedPlayerSkins: normalizedOwnedPlayerSkins,
    ownedBulletSkins: normalizedOwnedBulletSkins,
    selectedSkinId: legacySkinState.selectedSkinId,
    ownedSkins: legacySkinState.ownedSkins,
  };
}

export function defaultProfile(): PlayerProfile {
  const baseProfile: PlayerProfile = {
    version: 1,
    coins: 0,
    totalRuns: 0,
    totalSecondsSurvived: 0,
    bestScore: 0,
    selectedPlayerSkinId: DEFAULT_PLAYER_SKIN_ID,
    selectedBulletSkinId: DEFAULT_BULLET_SKIN_ID,
    ownedPlayerSkins: [DEFAULT_PLAYER_SKIN_ID],
    ownedBulletSkins: [DEFAULT_BULLET_SKIN_ID],
    achievements: {},
    dailyChallenge: {
      dateKey: '',
      targetSeconds: 20,
      rewardCoins: 25,
      completed: false,
    },
  };

  return normalizeProfileSkins(baseProfile);
}

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProfile();

    const parsed = JSON.parse(raw) as Partial<PlayerProfile> & {
      selectedSkinId?: LegacySkinId;
      ownedSkins?: LegacySkinId[];
      selectedPlayerSkinId?: PlayerSkinId;
      selectedBulletSkinId?: BulletSkinId;
      ownedPlayerSkins?: PlayerSkinId[];
      ownedBulletSkins?: BulletSkinId[];
    };

    if (!parsed || parsed.version !== 1) return defaultProfile();

    const defaultP = defaultProfile();
    const legacySelectedSkinId = isLegacySkinId(parsed.selectedSkinId)
      ? parsed.selectedSkinId
      : 'classic-blue';
    const legacySelected = getLegacySkinCombination(legacySelectedSkinId);
    const legacyOwned = expandLegacyOwnedSkins(parsed.ownedSkins);

    const ownedPlayerSkins = uniqueArray([
      ...legacyOwned.ownedPlayerSkins,
      ...sanitizePlayerSkinIds(parsed.ownedPlayerSkins),
      DEFAULT_PLAYER_SKIN_ID,
    ]);

    const ownedBulletSkins = uniqueArray([
      ...legacyOwned.ownedBulletSkins,
      ...sanitizeBulletSkinIds(parsed.ownedBulletSkins),
      DEFAULT_BULLET_SKIN_ID,
    ]);

    const selectedPlayerSkinId = isPlayerSkinId(parsed.selectedPlayerSkinId)
      ? parsed.selectedPlayerSkinId
      : legacySelected.playerSkinId;

    const selectedBulletSkinId = isBulletSkinId(parsed.selectedBulletSkinId)
      ? parsed.selectedBulletSkinId
      : legacySelected.bulletSkinId;

    const merged: PlayerProfile = {
      ...defaultP,
      ...parsed,
      selectedPlayerSkinId,
      selectedBulletSkinId,
      ownedPlayerSkins,
      ownedBulletSkins,
      dailyChallenge: {
        ...defaultP.dailyChallenge,
        ...(parsed.dailyChallenge ?? {}),
      },
      achievements: parsed.achievements ?? {},
    };

    return normalizeProfileSkins(merged);
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(profile: PlayerProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeProfileSkins(profile)));
}

export function updateProfile(mutator: (p: PlayerProfile) => PlayerProfile): PlayerProfile {
  const p = loadProfile();
  const next = mutator(p);
  saveProfile(next);
  return next;
}

export function resetProfile(): PlayerProfile {
  const p = defaultProfile();
  saveProfile(p);
  return p;
}

export function unlockAchievement(profile: PlayerProfile, id: string): PlayerProfile {
  if (profile.achievements[id]) return profile;
  return {
    ...profile,
    achievements: {
      ...profile.achievements,
      [id]: { unlockedAt: now() },
    },
  };
}

