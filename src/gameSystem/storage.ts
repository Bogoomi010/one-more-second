import { PlayerProfile } from './types';

const STORAGE_KEY = 'oms.profile.v1';

function now() {
  return Date.now();
}

export function defaultProfile(): PlayerProfile {
  // 기본 스킨은 무료 + 보유
  return {
    version: 1,
    coins: 0,
    totalRuns: 0,
    totalSecondsSurvived: 0,
    bestScore: 0,
    selectedSkinId: 'classic-blue',
    ownedSkins: ['classic-blue'],
    achievements: {},
    dailyChallenge: {
      dateKey: '',
      targetSeconds: 20,
      rewardCoins: 25,
      completed: false,
    },
  };
}

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProfile();

    const parsed = JSON.parse(raw);
    // 가벼운 런타임 검증
    if (!parsed || parsed.version !== 1) return defaultProfile();

    const merged: PlayerProfile = {
      ...defaultProfile(),
      ...parsed,
      dailyChallenge: {
        ...defaultProfile().dailyChallenge,
        ...(parsed.dailyChallenge ?? {}),
      },
      achievements: parsed.achievements ?? {},
      ownedSkins: parsed.ownedSkins ?? ['classic-blue'],
    };

    // selectedSkinId가 소유 목록에 없으면 기본으로
    if (!merged.ownedSkins.includes(merged.selectedSkinId)) {
      merged.selectedSkinId = 'classic-blue';
    }

    return merged;
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(profile: PlayerProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
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
