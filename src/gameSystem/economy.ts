import { GameResult, PlayerProfile } from './types';

export function calcRunRewardCoins(result: GameResult): number {
  if (result.scoreSeconds < 10) {
    return 0;
  }

  // 기본: 생존 1초 = 1코인
  // 무피격 보너스: +10
  const base = Math.max(0, Math.floor(result.scoreSeconds));
  const noHitBonus = result.hitsTaken === 0 && result.scoreSeconds >= 10 ? 10 : 0;
  return base + noHitBonus;
}

function sanitizeRunMetric(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
}

export function applyRunToProfile(profile: PlayerProfile, result: GameResult): { profile: PlayerProfile; runReward: number } {
  const runReward = calcRunRewardCoins(result);
  const runBulletsSpawned = sanitizeRunMetric(result.bulletsSpawned);
  const runBulletsDodged = sanitizeRunMetric(result.bulletsDodged);
  const runBulletsHit = sanitizeRunMetric(result.bulletsHit ?? result.hitsTaken);
  const runDeaths = sanitizeRunMetric(result.deaths ?? 1);

  const bestScore = Math.max(profile.bestScore, result.scoreSeconds);

  return {
    runReward,
    profile: {
      ...profile,
      coins: profile.coins + runReward,
      totalRuns: profile.totalRuns + 1,
      totalSecondsSurvived: profile.totalSecondsSurvived + result.scoreSeconds,
      totalBulletsSpawned: profile.totalBulletsSpawned + runBulletsSpawned,
      totalBulletsDodged: profile.totalBulletsDodged + runBulletsDodged,
      totalBulletsHit: profile.totalBulletsHit + runBulletsHit,
      totalDeaths: profile.totalDeaths + runDeaths,
      bestScore,
    },
  };
}
