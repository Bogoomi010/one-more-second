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
      expect(profile.selectedSkinId).toBe('classic-blue');
      expect(profile.ownedSkins).toContain('classic-blue');
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
    it('should fix invalid selectedSkinId', () => {
      const profile: PlayerProfile = {
        ...defaultProfile(),
        selectedSkinId: 'invalid-skin' as any,
        ownedSkins: ['classic-blue'] as any,
      };
      saveProfile(profile);
      
      const loaded = loadProfile();
      expect(loaded.selectedSkinId).toBe('classic-blue');
    });

    it('should merge missing fields with defaults', () => {
      const partial = {
        version: 1,
        coins: 100,
      };
      localStorage.setItem('oms.profile.v1', JSON.stringify(partial));
      
      const loaded = loadProfile();
      expect(loaded.totalRuns).toBe(0);
      expect(loaded.ownedSkins).toContain('classic-blue');
    });
  });
});
