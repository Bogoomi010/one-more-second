import { GameResult, PlayerProfile } from './types';

const DAILY_CHALLENGE_REWARD_COINS = 500;

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

function buildDailyChallenge(seed: string): Pick<
  PlayerProfile['dailyChallenge'],
  'type' | 'targetSeconds' | 'targetHits'
> {
  const typeIndex = seededInt(`${seed}:type`, 0, 2);

  if (typeIndex === 0) {
    return {
      type: 'survival',
      targetSeconds: seededInt(`${seed}:survival`, 15, 45),
    };
  }

  if (typeIndex === 1) {
    return {
      type: 'no-hit',
      targetSeconds: seededInt(`${seed}:no-hit`, 20, 60),
      targetHits: 0,
    };
  }

  return {
    type: 'limited-hits',
    targetSeconds: seededInt(`${seed}:limited-hits`, 25, 55),
    targetHits: 1,
  };
}

function isDailyChallengeMet(profile: PlayerProfile, result: GameResult): boolean {
  const challenge = profile.dailyChallenge;
  const scoreSeconds = Math.max(0, result.scoreSeconds);
  const hitsTaken = Math.max(0, Math.floor(result.hitsTaken ?? 0));

  if (challenge.type === 'survival') {
    return scoreSeconds >= challenge.targetSeconds;
  }

  if (challenge.type === 'no-hit') {
    return scoreSeconds >= challenge.targetSeconds && hitsTaken === (challenge.targetHits ?? 0);
  }

  return scoreSeconds >= challenge.targetSeconds && hitsTaken <= (challenge.targetHits ?? 1);
}

export function ensureDailyChallenge(profile: PlayerProfile, now = new Date()): PlayerProfile {
  const key = dateKey(now);
  if (profile.dailyChallenge.dateKey === key) return profile;

  const generated = buildDailyChallenge(key);

  return {
    ...profile,
    dailyChallenge: {
      dateKey: key,
      ...generated,
      rewardCoins: DAILY_CHALLENGE_REWARD_COINS,
      completed: false,
    },
  };
}

export function applyDailyChallengeResult(
  profile: PlayerProfile,
  result: GameResult,
  now = new Date()
): { profile: PlayerProfile; rewarded: number } {
  const p = ensureDailyChallenge(profile, now);
  if (p.dailyChallenge.completed) return { profile: p, rewarded: 0 };

  if (isDailyChallengeMet(p, result)) {
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
