import { GameResult, GameplayModifierId, PlayerProfile } from './types';
import { unlockAchievement } from './storage';

export type AchievementDefinition = { id: string; title: string; desc: string };

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'first-run', title: 'First Run', desc: 'Play the game once' },
  { id: 'survive-10', title: '10s Survivor', desc: 'Survive 10+ seconds in one run' },
  { id: 'survive-30', title: '30s Survivor', desc: 'Survive 30+ seconds in one run' },
  { id: 'survive-60', title: '1 Minute Survivor', desc: 'Survive 60+ seconds in one run' },
  { id: 'survive-90', title: '90s Survivor', desc: 'Survive 90+ seconds in one run' },
  { id: 'survive-120', title: '2 Minute Survivor', desc: 'Survive 120+ seconds in one run' },
  { id: 'survive-180', title: '3 Minute Survivor', desc: 'Survive 180+ seconds in one run' },
  { id: 'survive-300', title: '5 Minute Survivor', desc: 'Survive 300+ seconds in one run' },
  { id: 'no-hit-20', title: 'No-Hit 20', desc: 'Stay unharmed for 20+ seconds before first hit' },
  { id: 'no-hit-30', title: 'No-Hit 30', desc: 'Stay unharmed for 30+ seconds before first hit' },
  { id: 'no-hit-45', title: 'No-Hit 45', desc: 'Stay unharmed for 45+ seconds before first hit' },
  { id: 'runner-5', title: 'Warm-Up Runner', desc: 'Complete 5 total runs' },
  { id: 'runner-20', title: 'Marathon Mindset', desc: 'Complete 20 total runs' },
  { id: 'runner-50', title: 'Endurance Runner', desc: 'Complete 50 total runs' },
  { id: 'time-300', title: '5 Minute Total', desc: 'Accumulate 300+ total seconds survived' },
  { id: 'time-1800', title: '30 Minute Total', desc: 'Accumulate 1800+ total seconds survived' },
  { id: 'time-3600', title: '1 Hour Total', desc: 'Accumulate 3600+ total seconds survived' },
  { id: 'coins-100', title: 'Coin Stash', desc: 'Reach 100+ coins' },
  { id: 'coins-500', title: 'Coin Vault', desc: 'Reach 500+ coins' },
  { id: 'coins-1000', title: 'Coin Empire', desc: 'Reach 10000+ coins' },
  { id: 'collector-2', title: 'Collector I', desc: 'Own at least 2 skins (excluding default)' },
  { id: 'collector-5', title: 'Collector II', desc: 'Own at least 5 skins (excluding default)' },
  { id: 'collector-8', title: 'Collector III', desc: 'Own at least 8 skins (excluding default)' },
  { id: 'gimmick-any', title: 'Gimmick Debut', desc: 'Finish a run with at least 1 gimmick enabled' },
  { id: 'gimmick-duo', title: 'Double Trouble', desc: 'Finish a run with 2+ gimmicks enabled' },
  { id: 'gimmick-trio', title: 'Triple Threat', desc: 'Finish a run with 3+ gimmicks enabled' },
  { id: 'gimmick-full-house', title: 'Full House', desc: 'Finish a run with all 5 gimmicks enabled' },
  {
    id: 'gimmick-crossline-20',
    title: 'Crossline Specialist',
    desc: 'Survive 20+ seconds with Crossline Barrage enabled',
  },
  {
    id: 'gimmick-shrink-field-20',
    title: 'Tight Space Expert',
    desc: 'Survive 20+ seconds with Shrink Field enabled',
  },
  {
    id: 'gimmick-haste-20',
    title: 'Speed Reader',
    desc: 'Survive 20+ seconds with Haste Bullets enabled',
  },
  {
    id: 'gimmick-one-life-20',
    title: 'One-Life Wonder',
    desc: 'Survive 20+ seconds with One Life enabled',
  },
  {
    id: 'gimmick-critical-shot-20',
    title: 'Critical Dodger',
    desc: 'Survive 20+ seconds with Critical Shot enabled',
  },
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

function getUsedGimmickIds(result: GameResult): Set<GameplayModifierId> {
  return new Set((result.usedGimmicks ?? []).map((gimmick) => gimmick.id));
}

export function applyAchievements(profile: PlayerProfile, result: GameResult): PlayerProfile {
  let p = profile;

  const runSeconds = Math.max(0, Math.floor(result.scoreSeconds));
  const bestRunSeconds = Math.max(result.scoreSeconds, p.bestScore);
  const noHitSeconds = getNoHitSeconds(result);
  const totalOwnedSkinCount = getOwnedSkinCount(p);
  const usedGimmickIds = getUsedGimmickIds(result);
  const usedGimmickCount = usedGimmickIds.size;

  if (p.totalRuns >= 1) p = unlockAchievement(p, 'first-run');

  if (bestRunSeconds >= 10) p = unlockAchievement(p, 'survive-10');
  if (bestRunSeconds >= 30) p = unlockAchievement(p, 'survive-30');
  if (bestRunSeconds >= 60) p = unlockAchievement(p, 'survive-60');
  if (bestRunSeconds >= 90) p = unlockAchievement(p, 'survive-90');
  if (bestRunSeconds >= 120) p = unlockAchievement(p, 'survive-120');
  if (bestRunSeconds >= 180) p = unlockAchievement(p, 'survive-180');
  if (bestRunSeconds >= 300) p = unlockAchievement(p, 'survive-300');

  if (noHitSeconds >= 20) p = unlockAchievement(p, 'no-hit-20');
  if (noHitSeconds >= 30) p = unlockAchievement(p, 'no-hit-30');
  if (noHitSeconds >= 45) p = unlockAchievement(p, 'no-hit-45');

  if (p.totalRuns >= 5) p = unlockAchievement(p, 'runner-5');
  if (p.totalRuns >= 20) p = unlockAchievement(p, 'runner-20');
  if (p.totalRuns >= 50) p = unlockAchievement(p, 'runner-50');

  if (p.totalSecondsSurvived >= 300) p = unlockAchievement(p, 'time-300');
  if (p.totalSecondsSurvived >= 1800) p = unlockAchievement(p, 'time-1800');
  if (p.totalSecondsSurvived >= 3600) p = unlockAchievement(p, 'time-3600');

  if (p.coins >= 100) p = unlockAchievement(p, 'coins-100');
  if (p.coins >= 500) p = unlockAchievement(p, 'coins-500');
  if (p.coins >= 10000) p = unlockAchievement(p, 'coins-1000');

  if (totalOwnedSkinCount >= 2) p = unlockAchievement(p, 'collector-2');
  if (totalOwnedSkinCount >= 5) p = unlockAchievement(p, 'collector-5');
  if (totalOwnedSkinCount >= 8) p = unlockAchievement(p, 'collector-8');

  if (usedGimmickCount >= 1) p = unlockAchievement(p, 'gimmick-any');
  if (usedGimmickCount >= 2 && runSeconds >= 10) p = unlockAchievement(p, 'gimmick-duo');
  if (usedGimmickCount >= 3 && runSeconds >= 10) p = unlockAchievement(p, 'gimmick-trio');
  if (usedGimmickCount >= 5 && runSeconds >= 10) p = unlockAchievement(p, 'gimmick-full-house');

  if (runSeconds >= 20 && usedGimmickIds.has('crossline-40-80')) {
    p = unlockAchievement(p, 'gimmick-crossline-20');
  }
  if (runSeconds >= 20 && usedGimmickIds.has('shrink-field-80')) {
    p = unlockAchievement(p, 'gimmick-shrink-field-20');
  }
  if (runSeconds >= 20 && usedGimmickIds.has('haste-bullets-110')) {
    p = unlockAchievement(p, 'gimmick-haste-20');
  }
  if (runSeconds >= 20 && usedGimmickIds.has('one-life')) {
    p = unlockAchievement(p, 'gimmick-one-life-20');
  }
  if (runSeconds >= 20 && usedGimmickIds.has('critical-shot')) {
    p = unlockAchievement(p, 'gimmick-critical-shot-20');
  }

  return p;
}
