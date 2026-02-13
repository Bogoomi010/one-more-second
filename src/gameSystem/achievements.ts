import { GameResult, PlayerProfile } from './types';
import { unlockAchievement } from './storage';

export type AchievementDefinition = { id: string; title: string; desc: string };

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'first-run', title: 'First Run', desc: 'Play the game once' },
  { id: 'survive-10', title: '10s Survivor', desc: 'Survive 10+ seconds in one run' },
  { id: 'survive-30', title: '30s Survivor', desc: 'Survive 30+ seconds in one run' },
  { id: 'survive-60', title: '1 Minute Survivor', desc: 'Survive 60+ seconds in one run' },
  { id: 'survive-90', title: '90s Survivor', desc: 'Survive 90+ seconds in one run' },
  { id: 'survive-120', title: '2 Minute Survivor', desc: 'Survive 120+ seconds in one run' },
  { id: 'no-hit-20', title: 'No-Hit 20', desc: 'Stay unharmed for 20+ seconds before first hit' },
  { id: 'no-hit-30', title: 'No-Hit 30', desc: 'Stay unharmed for 30+ seconds before first hit' },
  { id: 'runner-5', title: 'Warm-Up Runner', desc: 'Complete 5 total runs' },
  { id: 'runner-20', title: 'Marathon Mindset', desc: 'Complete 20 total runs' },
  { id: 'time-300', title: '5 Minute Total', desc: 'Accumulate 300+ total seconds survived' },
  { id: 'time-1800', title: '30 Minute Total', desc: 'Accumulate 1800+ total seconds survived' },
  { id: 'coins-100', title: 'Coin Stash', desc: 'Reach 100+ coins' },
  { id: 'coins-500', title: 'Coin Vault', desc: 'Reach 500+ coins' },
  { id: 'collector-2', title: 'Collector I', desc: 'Own at least 2 skins (excluding default)' },
  { id: 'collector-5', title: 'Collector II', desc: 'Own at least 5 skins (excluding default)' },
];

function getOwnedSkinCount(profile: PlayerProfile): number {
  const playerSkinCount = profile.ownedPlayerSkins?.length ?? 0;
  const bulletSkinCount = profile.ownedBulletSkins?.length ?? 0;
  return Math.max(1, playerSkinCount + bulletSkinCount - 1);
}

function getNoHitSeconds(result: GameResult): number {
  if (typeof result.firstHitSeconds === 'number') {
    return result.firstHitSeconds;
  }

  // Backward compatibility with old callers/tests that only send hitsTaken.
  if (result.hitsTaken === 0) {
    return result.scoreSeconds;
  }

  return 0;
}

export function applyAchievements(profile: PlayerProfile, result: GameResult): PlayerProfile {
  let p = profile;

  const bestRunSeconds = Math.max(result.scoreSeconds, p.bestScore);
  const noHitSeconds = getNoHitSeconds(result);
  const totalOwnedSkinCount = getOwnedSkinCount(p);

  if (p.totalRuns >= 1) p = unlockAchievement(p, 'first-run');

  if (bestRunSeconds >= 10) p = unlockAchievement(p, 'survive-10');
  if (bestRunSeconds >= 30) p = unlockAchievement(p, 'survive-30');
  if (bestRunSeconds >= 60) p = unlockAchievement(p, 'survive-60');
  if (bestRunSeconds >= 90) p = unlockAchievement(p, 'survive-90');
  if (bestRunSeconds >= 120) p = unlockAchievement(p, 'survive-120');

  if (noHitSeconds >= 20) p = unlockAchievement(p, 'no-hit-20');
  if (noHitSeconds >= 30) p = unlockAchievement(p, 'no-hit-30');

  if (p.totalRuns >= 5) p = unlockAchievement(p, 'runner-5');
  if (p.totalRuns >= 20) p = unlockAchievement(p, 'runner-20');

  if (p.totalSecondsSurvived >= 300) p = unlockAchievement(p, 'time-300');
  if (p.totalSecondsSurvived >= 1800) p = unlockAchievement(p, 'time-1800');

  if (p.coins >= 100) p = unlockAchievement(p, 'coins-100');
  if (p.coins >= 500) p = unlockAchievement(p, 'coins-500');

  if (totalOwnedSkinCount >= 2) p = unlockAchievement(p, 'collector-2');
  if (totalOwnedSkinCount >= 5) p = unlockAchievement(p, 'collector-5');

  return p;
}
