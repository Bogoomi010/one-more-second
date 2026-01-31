import { GameResult, PlayerProfile } from './types';
import { unlockAchievement } from './storage';

export const ACHIEVEMENTS: { id: string; title: string; desc: string }[] = [
  { id: 'first-run', title: '첫 판', desc: '게임을 1번 플레이' },
  { id: 'survive-10', title: '10초 생존', desc: '한 판에서 10초 이상 생존' },
  { id: 'survive-30', title: '30초 생존', desc: '한 판에서 30초 이상 생존' },
  { id: 'survive-60', title: '1분 생존', desc: '한 판에서 60초 이상 생존' },
  { id: 'no-hit-20', title: '무피격 20초', desc: '한 판에서 20초 이상 생존 + 피격 0회' },
  { id: 'collector-2', title: '수집가', desc: '스킨을 2개 보유' },
];

export function applyAchievements(profile: PlayerProfile, result: GameResult): PlayerProfile {
  let p = profile;

  if (p.totalRuns >= 1) p = unlockAchievement(p, 'first-run');

  if (result.scoreSeconds >= 10) p = unlockAchievement(p, 'survive-10');
  if (result.scoreSeconds >= 30) p = unlockAchievement(p, 'survive-30');
  if (result.scoreSeconds >= 60) p = unlockAchievement(p, 'survive-60');

  if (result.scoreSeconds >= 20 && result.hitsTaken === 0) {
    p = unlockAchievement(p, 'no-hit-20');
  }

  if ((p.ownedSkins?.length ?? 0) >= 2) {
    p = unlockAchievement(p, 'collector-2');
  }

  return p;
}
