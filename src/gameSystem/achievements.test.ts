import { ACHIEVEMENT_REWARD_COINS, applyAchievements } from './achievements';
import { applyRunToProfile } from './economy';
import { GameResult, PlayerProfile } from './types';
import { defaultProfile } from './storage';

describe('Achievements System', () => {
  it('should unlock first-run achievement', () => {
    const profile: PlayerProfile = { ...defaultProfile(), totalRuns: 1 };
    const result: GameResult = { scoreSeconds: 5, hitsTaken: 3, firstHitSeconds: 2 };

    const updated = applyAchievements(profile, result);

    expect(updated.achievements['first-run']).toBeDefined();
  });

  it('should unlock survive-60 achievement from current run score', () => {
    const profile = defaultProfile();
    const result: GameResult = { scoreSeconds: 60, hitsTaken: 3, firstHitSeconds: 10 };

    const updated = applyAchievements(profile, result);

    expect(updated.achievements['survive-60']).toBeDefined();
  });

  it('should unlock survive-60 achievement from best score fallback', () => {
    const profile: PlayerProfile = { ...defaultProfile(), bestScore: 60 };
    const result: GameResult = { scoreSeconds: 12, hitsTaken: 3, firstHitSeconds: 3 };

    const updated = applyAchievements(profile, result);

    expect(updated.achievements['survive-60']).toBeDefined();
  });

  it('should unlock no-hit-20 based on firstHitSeconds', () => {
    const profile = defaultProfile();
    const result: GameResult = { scoreSeconds: 28, hitsTaken: 3, firstHitSeconds: 20 };

    const updated = applyAchievements(profile, result);

    expect(updated.achievements['no-hit-20']).toBeDefined();
  });

  it('should not unlock no-hit-20 when first hit is before 20 seconds', () => {
    const profile = defaultProfile();
    const result: GameResult = { scoreSeconds: 28, hitsTaken: 3, firstHitSeconds: 19.99 };

    const updated = applyAchievements(profile, result);

    expect(updated.achievements['no-hit-20']).toBeUndefined();
  });

  it('should unlock no-hit-30 based on firstHitSeconds', () => {
    const profile = defaultProfile();
    const result: GameResult = { scoreSeconds: 40, hitsTaken: 3, firstHitSeconds: 30 };

    const updated = applyAchievements(profile, result);

    expect(updated.achievements['no-hit-30']).toBeDefined();
  });

  it('should keep backward compatibility for old no-hit payloads', () => {
    const profile = defaultProfile();
    const result: GameResult = { scoreSeconds: 20, hitsTaken: 0 };

    const updated = applyAchievements(profile, result);

    expect(updated.achievements['no-hit-20']).toBeDefined();
  });

  it('should unlock collector achievements', () => {
    const profile: PlayerProfile = {
      ...defaultProfile(),
      ownedPlayerSkins: ['player-default', 'player-rabbit-girl', 'player-rabbit'],
      ownedBulletSkins: ['bullet-default', 'bullet-jelly', 'bullet-neon-blue'],
    };
    const result: GameResult = { scoreSeconds: 5, hitsTaken: 3, firstHitSeconds: 1 };

    const updated = applyAchievements(profile, result);

    expect(updated.achievements['collector-2']).toBeDefined();
    expect(updated.achievements['collector-5']).toBeDefined();
  });

  it('should unlock progression achievements from profile stats', () => {
    const profile: PlayerProfile = {
      ...defaultProfile(),
      totalRuns: 20,
      totalSecondsSurvived: 1800,
      coins: 500,
    };
    const result: GameResult = { scoreSeconds: 120, hitsTaken: 3, firstHitSeconds: 31 };

    const updated = applyAchievements(profile, result);

    expect(updated.achievements['runner-5']).toBeDefined();
    expect(updated.achievements['runner-20']).toBeDefined();
    expect(updated.achievements['time-300']).toBeDefined();
    expect(updated.achievements['time-1800']).toBeDefined();
    expect(updated.achievements['coins-100']).toBeDefined();
    expect(updated.achievements['coins-500']).toBeDefined();
    expect(updated.achievements['survive-90']).toBeDefined();
    expect(updated.achievements['survive-120']).toBeDefined();
  });

  it('should not duplicate achievements', () => {
    const profile: PlayerProfile = {
      ...defaultProfile(),
      achievements: {
        'survive-10': { unlockedAt: 1000 },
      },
    };
    const result: GameResult = { scoreSeconds: 10, hitsTaken: 3, firstHitSeconds: 2 };

    const updated = applyAchievements(profile, result);

    expect(updated.achievements['survive-10'].unlockedAt).toBe(1000);
  });

  it('should grant 100 coins per newly unlocked achievement', () => {
    const profile: PlayerProfile = { ...defaultProfile(), totalRuns: 1, coins: 0 };
    const result: GameResult = { scoreSeconds: 30, hitsTaken: 2, firstHitSeconds: 3 };

    const updated = applyAchievements(profile, result);

    expect(updated.coins).toBe(ACHIEVEMENT_REWARD_COINS * 3);
    expect(updated.achievements['first-run']).toBeDefined();
    expect(updated.achievements['survive-10']).toBeDefined();
    expect(updated.achievements['survive-30']).toBeDefined();
  });

  it('should evaluate coin achievements against final coin value and avoid chain-trigger unlocks', () => {
    const profile: PlayerProfile = {
      ...defaultProfile(),
      coins: 900,
      totalRuns: 1,
      achievements: { 'first-run': { unlockedAt: Date.now() } },
    };
    const result: GameResult = { scoreSeconds: 50, hitsTaken: 1 };

    const afterRun = applyRunToProfile(profile, result).profile;
    const updated = applyAchievements(afterRun, result, afterRun.coins);

    expect(updated.achievements['coins-100']).toBeDefined();
    expect(updated.achievements['coins-500']).toBeDefined();
    expect(updated.achievements['coins-1000']).toBeUndefined();
    expect(updated.coins - afterRun.coins).toBe(ACHIEVEMENT_REWARD_COINS * 2);
  });

  it('should not unlock coin achievements from achievement reward coins alone', () => {
    const profile: PlayerProfile = { ...defaultProfile(), totalRuns: 1, coins: 0 };
    const result: GameResult = { scoreSeconds: 5, hitsTaken: 1, firstHitSeconds: 1 };

    const updated = applyAchievements(profile, result);

    expect(updated.achievements['first-run']).toBeDefined();
    expect(updated.achievements['coins-100']).toBeUndefined();
    expect(updated.coins).toBe(ACHIEVEMENT_REWARD_COINS);
  });

  it('should unlock multiple achievements in one run', () => {
    const profile: PlayerProfile = { ...defaultProfile(), totalRuns: 5 };
    const result: GameResult = { scoreSeconds: 120, hitsTaken: 3, firstHitSeconds: 30 };

    const updated = applyAchievements(profile, result);

    expect(updated.achievements['first-run']).toBeDefined();
    expect(updated.achievements['survive-10']).toBeDefined();
    expect(updated.achievements['survive-30']).toBeDefined();
    expect(updated.achievements['survive-60']).toBeDefined();
    expect(updated.achievements['survive-90']).toBeDefined();
    expect(updated.achievements['survive-120']).toBeDefined();
    expect(updated.achievements['no-hit-20']).toBeDefined();
    expect(updated.achievements['no-hit-30']).toBeDefined();
    expect(updated.achievements['runner-5']).toBeDefined();
  });

  it('should unlock advanced progression achievements', () => {
    const profile: PlayerProfile = {
      ...defaultProfile(),
      totalRuns: 50,
      totalSecondsSurvived: 3600,
      coins: 10000,
      ownedPlayerSkins: [
        'player-default',
        'player-rabbit-girl',
        'player-rabbit',
        'player-warrior',
        'player-skeleton',
        'player-fire',
      ],
      ownedBulletSkins: ['bullet-default', 'bullet-gimic', 'bullet-neon-blue'],
    };
    const result: GameResult = { scoreSeconds: 300, hitsTaken: 3, firstHitSeconds: 45 };

    const updated = applyAchievements(profile, result);

    expect(updated.achievements['survive-180']).toBeDefined();
    expect(updated.achievements['survive-300']).toBeDefined();
    expect(updated.achievements['no-hit-45']).toBeDefined();
    expect(updated.achievements['runner-50']).toBeDefined();
    expect(updated.achievements['time-3600']).toBeDefined();
    expect(updated.achievements['coins-1000']).toBeDefined();
    expect(updated.achievements['collector-8']).toBeDefined();
  });

  it('should unlock gimmick achievements', () => {
    const profile = defaultProfile();
    const result: GameResult = {
      scoreSeconds: 25,
      hitsTaken: 2,
      firstHitSeconds: 12,
      usedGimmicks: [
        { id: 'crossline-40-80', name: 'Crossline', weight: 0.12 },
        { id: 'shrink-field-80', name: 'Shrink Field', weight: 0.1 },
        { id: 'haste-bullets-110', name: 'Haste Bullets', weight: 0.08 },
        { id: 'one-life', name: 'One Life', weight: 0.2 },
        { id: 'critical-shot', name: 'Critical Shot', weight: 0.1 },
      ],
    };

    const updated = applyAchievements(profile, result);

    expect(updated.achievements['gimmick-any']).toBeDefined();
    expect(updated.achievements['gimmick-duo']).toBeDefined();
    expect(updated.achievements['gimmick-trio']).toBeDefined();
    expect(updated.achievements['gimmick-full-house']).toBeDefined();
    expect(updated.achievements['gimmick-crossline-20']).toBeDefined();
    expect(updated.achievements['gimmick-shrink-field-20']).toBeDefined();
    expect(updated.achievements['gimmick-haste-20']).toBeDefined();
    expect(updated.achievements['gimmick-one-life-20']).toBeDefined();
    expect(updated.achievements['gimmick-critical-shot-20']).toBeDefined();
  });
});
