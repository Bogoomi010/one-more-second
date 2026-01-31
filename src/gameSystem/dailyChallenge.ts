import { PlayerProfile } from './types';

function dateKey(d = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// 날짜 기반으로 고정된 pseudo-random (클라이언트만으로도 매일 고정되는 챌린지)
function seededInt(seedStr: string, min: number, max: number) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const t = (h >>> 0) / 4294967295;
  return Math.floor(min + t * (max - min + 1));
}

export function ensureDailyChallenge(profile: PlayerProfile, now = new Date()): PlayerProfile {
  const key = dateKey(now);
  if (profile.dailyChallenge.dateKey === key) return profile;

  const targetSeconds = seededInt(key, 15, 45);
  const rewardCoins = Math.max(20, Math.round(targetSeconds * 1.5));

  return {
    ...profile,
    dailyChallenge: {
      dateKey: key,
      targetSeconds,
      rewardCoins,
      completed: false,
    },
  };
}

export function applyDailyChallengeResult(profile: PlayerProfile, scoreSeconds: number): { profile: PlayerProfile; rewarded: number } {
  const p = ensureDailyChallenge(profile);
  if (p.dailyChallenge.completed) return { profile: p, rewarded: 0 };

  if (scoreSeconds >= p.dailyChallenge.targetSeconds) {
    const rewarded = p.dailyChallenge.rewardCoins;
    return {
      profile: {
        ...p,
        coins: p.coins + rewarded,
        dailyChallenge: { ...p.dailyChallenge, completed: true },
      },
      rewarded,
    };
  }

  return { profile: p, rewarded: 0 };
}
