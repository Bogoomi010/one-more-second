import { loadProfile, saveProfile, defaultProfile, resetProfile, unlockAchievement } from './storage';
import { PlayerProfile } from './types';

describe('Storage System', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('defaultProfile', () => {
    it('should return profile with correct defaults', () => {
      const profile = defaultProfile();
      
      expect(profile.version).toBe(1);
      expect(profile.coins).toBe(0);
      expect(profile.totalRuns).toBe(0);
      expect(profile.bestScore).toBe(0);
      expect(profile.selectedPlayerSkinId).toBe('player-default');
      expect(profile.selectedBulletSkinId).toBe('bullet-default');
      expect(profile.ownedPlayerSkins).toContain('player-default');
      expect(profile.ownedBulletSkins).toContain('bullet-default');
    });
  });

  describe('saveProfile and loadProfile', () => {
    it('should save and load profile correctly', () => {
      const profile = {
        ...defaultProfile(),
        coins: 100,
        totalRuns: 5,
        bestScore: 50,
      };
      
      saveProfile(profile);
      const loaded = loadProfile();
      
      expect(loaded.coins).toBe(100);
      expect(loaded.totalRuns).toBe(5);
      expect(loaded.bestScore).toBe(50);
    });

    it('should return default profile if none exists', () => {
      const loaded = loadProfile();
      expect(loaded).toEqual(defaultProfile());
    });

    it('should return default profile for invalid data', () => {
      localStorage.setItem('oms.profile.v1', 'invalid json');
      const loaded = loadProfile();
      expect(loaded).toEqual(defaultProfile());
    });

    it('should return default profile for wrong version', () => {
      const wrongVersion = { ...defaultProfile(), version: 2 };
      localStorage.setItem('oms.profile.v1', JSON.stringify(wrongVersion));
      
      const loaded = loadProfile();
      expect(loaded.version).toBe(1);
    });
  });

  describe('resetProfile', () => {
    it('should reset profile to defaults', () => {
      const profile = {
        ...defaultProfile(),
        coins: 100,
        totalRuns: 5,
      };
      saveProfile(profile);
      
      const reset = resetProfile();
      
      expect(reset.coins).toBe(0);
      expect(reset.totalRuns).toBe(0);
    });
  });

  describe('unlockAchievement', () => {
    it('should unlock new achievement', () => {
      const profile = defaultProfile();
      const updated = unlockAchievement(profile, 'test-achievement');
      
      expect(updated.achievements['test-achievement']).toBeDefined();
      expect(updated.achievements['test-achievement'].unlockedAt).toBeGreaterThan(0);
    });

    it('should not overwrite existing achievement', () => {
      const profile = {
        ...defaultProfile(),
        achievements: {
          'test-achievement': { unlockedAt: 1000 },
        },
      };
      
      const updated = unlockAchievement(profile, 'test-achievement');
      
      expect(updated.achievements['test-achievement'].unlockedAt).toBe(1000);
    });

    it('should preserve other achievements', () => {
      const profile = {
        ...defaultProfile(),
        achievements: {
          'existing': { unlockedAt: 1000 },
        },
      };
      
      const updated = unlockAchievement(profile, 'new');
      
      expect(updated.achievements['existing']).toBeDefined();
      expect(updated.achievements['new']).toBeDefined();
    });
  });

  describe('profile validation', () => {
    it('should fix invalid selected player and bullet skins', () => {
      const profile: PlayerProfile = {
        ...defaultProfile(),
        selectedPlayerSkinId: 'invalid-player-skin' as any,
        selectedBulletSkinId: 'invalid-bullet-skin' as any,
        ownedPlayerSkins: ['player-default'] as any,
        ownedBulletSkins: ['bullet-default'] as any,
      };
      saveProfile(profile);
      
      const loaded = loadProfile();
      expect(loaded.selectedPlayerSkinId).toBe('player-default');
      expect(loaded.selectedBulletSkinId).toBe('bullet-default');
    });

    it('should merge missing fields with defaults', () => {
      const partial = {
        version: 1,
        coins: 100,
      };
      localStorage.setItem('oms.profile.v1', JSON.stringify(partial));
      
      const loaded = loadProfile();
      expect(loaded.totalRuns).toBe(0);
      expect(loaded.ownedPlayerSkins).toContain('player-default');
      expect(loaded.ownedBulletSkins).toContain('bullet-default');
    });

    it('should migrate legacy skin fields to split skin fields', () => {
      const legacyProfile: Record<string, unknown> = {
        ...defaultProfile(),
        selectedSkinId: 'mint',
        ownedSkins: ['classic-blue', 'mint'],
      };
      delete legacyProfile.selectedPlayerSkinId;
      delete legacyProfile.selectedBulletSkinId;
      delete legacyProfile.ownedPlayerSkins;
      delete legacyProfile.ownedBulletSkins;
      localStorage.setItem('oms.profile.v1', JSON.stringify(legacyProfile));

      const loaded = loadProfile();
      expect(loaded.selectedPlayerSkinId).toBe('player-rabbit-girl');
      expect(loaded.selectedBulletSkinId).toBe('bullet-gimic');
      expect(loaded.ownedPlayerSkins).toContain('player-rabbit-girl');
      expect(loaded.ownedBulletSkins).toContain('bullet-gimic');
    });
  });
});
