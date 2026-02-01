import { applyAchievements } from './achievements';
import { GameResult, PlayerProfile } from './types';
import { defaultProfile } from './storage';

describe('Achievements System', () => {
  it('should unlock first-run achievement', () => {
    const profile: PlayerProfile = { ...defaultProfile(), totalRuns: 1 };
    const result: GameResult = { scoreSeconds: 5, hitsTaken: 1 };
    
    const updated = applyAchievements(profile, result);
    
    expect(updated.achievements['first-run']).toBeDefined();
  });

  it('should unlock survive-10 achievement', () => {
    const profile = defaultProfile();
    const result: GameResult = { scoreSeconds: 10, hitsTaken: 1 };
    
    const updated = applyAchievements(profile, result);
    
    expect(updated.achievements['survive-10']).toBeDefined();
  });

  it('should unlock survive-30 achievement', () => {
    const profile = defaultProfile();
    const result: GameResult = { scoreSeconds: 30, hitsTaken: 1 };
    
    const updated = applyAchievements(profile, result);
    
    expect(updated.achievements['survive-30']).toBeDefined();
  });

  it('should unlock survive-60 achievement', () => {
    const profile = defaultProfile();
    const result: GameResult = { scoreSeconds: 60, hitsTaken: 1 };
    
    const updated = applyAchievements(profile, result);
    
    expect(updated.achievements['survive-60']).toBeDefined();
  });

  it('should unlock no-hit-20 achievement', () => {
    const profile = defaultProfile();
    const result: GameResult = { scoreSeconds: 20, hitsTaken: 0 };
    
    const updated = applyAchievements(profile, result);
    
    expect(updated.achievements['no-hit-20']).toBeDefined();
  });

  it('should not unlock no-hit-20 if hit taken', () => {
    const profile = defaultProfile();
    const result: GameResult = { scoreSeconds: 20, hitsTaken: 1 };
    
    const updated = applyAchievements(profile, result);
    
    expect(updated.achievements['no-hit-20']).toBeUndefined();
  });

  it('should not unlock no-hit-20 if under 20 seconds', () => {
    const profile = defaultProfile();
    const result: GameResult = { scoreSeconds: 19, hitsTaken: 0 };
    
    const updated = applyAchievements(profile, result);
    
    expect(updated.achievements['no-hit-20']).toBeUndefined();
  });

  it('should unlock collector-2 achievement', () => {
    const profile: PlayerProfile = {
      ...defaultProfile(),
      ownedSkins: ['classic-blue', 'mint'],
    };
    const result: GameResult = { scoreSeconds: 5, hitsTaken: 0 };
    
    const updated = applyAchievements(profile, result);
    
    expect(updated.achievements['collector-2']).toBeDefined();
  });

  it('should not duplicate achievements', () => {
    const profile: PlayerProfile = {
      ...defaultProfile(),
      achievements: {
        'survive-10': { unlockedAt: 1000 },
      },
    };
    const result: GameResult = { scoreSeconds: 10, hitsTaken: 0 };
    
    const updated = applyAchievements(profile, result);
    
    expect(updated.achievements['survive-10'].unlockedAt).toBe(1000);
  });

  it('should unlock multiple achievements in one run', () => {
    const profile: PlayerProfile = { ...defaultProfile(), totalRuns: 1 };
    const result: GameResult = { scoreSeconds: 60, hitsTaken: 0 };
    
    const updated = applyAchievements(profile, result);
    
    expect(updated.achievements['first-run']).toBeDefined();
    expect(updated.achievements['survive-10']).toBeDefined();
    expect(updated.achievements['survive-30']).toBeDefined();
    expect(updated.achievements['survive-60']).toBeDefined();
  });
});
