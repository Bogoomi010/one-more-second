import { GameResult, PlayerProfile } from './types';

export function calcRunRewardCoins(result: GameResult): number {
  // 기본: 생존 1초 = 1코인
  // 무피격 보너스: +10
  const base = Math.max(0, Math.floor(result.scoreSeconds));
  const noHitBonus = result.hitsTaken === 0 && result.scoreSeconds >= 10 ? 10 : 0;
  return base + noHitBonus;
}

export function applyRunToProfile(profile: PlayerProfile, result: GameResult): { profile: PlayerProfile; runReward: number } {
  const runReward = calcRunRewardCoins(result);

  const bestScore = Math.max(profile.bestScore, result.scoreSeconds);

  return {
    runReward,
    profile: {
      ...profile,
      coins: profile.coins + runReward,
      totalRuns: profile.totalRuns + 1,
      totalSecondsSurvived: profile.totalSecondsSurvived + result.scoreSeconds,
      bestScore,
    },
  };
}
