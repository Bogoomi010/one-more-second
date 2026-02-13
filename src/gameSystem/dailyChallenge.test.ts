import { ensureDailyChallenge, applyDailyChallengeResult } from './dailyChallenge';
import { defaultProfile } from './storage';

const FIXED_DAY = new Date('2026-02-01');

describe('Daily Challenge System', () => {
  describe('ensureDailyChallenge', () => {
    it('should create new challenge for new day', () => {
      const profile = defaultProfile();
      const today = FIXED_DAY;
      
      const updated = ensureDailyChallenge(profile, today);
      
      expect(updated.dailyChallenge.dateKey).toBe('2026-02-01');
      expect(updated.dailyChallenge.targetSeconds).toBeGreaterThanOrEqual(15);
      expect(updated.dailyChallenge.targetSeconds).toBeLessThanOrEqual(45);
      expect(updated.dailyChallenge.completed).toBe(false);
    });

    it('should not change challenge for same day', () => {
      const profile = defaultProfile();
      const today = FIXED_DAY;
      
      const updated1 = ensureDailyChallenge(profile, today);
      const updated2 = ensureDailyChallenge(updated1, today);
      
      expect(updated2.dailyChallenge.targetSeconds).toBe(updated1.dailyChallenge.targetSeconds);
      expect(updated2.dailyChallenge.rewardCoins).toBe(updated1.dailyChallenge.rewardCoins);
    });

    it('should generate consistent challenge for same date', () => {
      const profile1 = defaultProfile();
      const profile2 = defaultProfile();
      const today = FIXED_DAY;
      
      const updated1 = ensureDailyChallenge(profile1, today);
      const updated2 = ensureDailyChallenge(profile2, today);
      
      expect(updated1.dailyChallenge.targetSeconds).toBe(updated2.dailyChallenge.targetSeconds);
      expect(updated1.dailyChallenge.rewardCoins).toBe(updated2.dailyChallenge.rewardCoins);
    });

    it('should reset completion status for new day', () => {
      const profile = {
        ...defaultProfile(),
        dailyChallenge: {
          dateKey: '2026-01-31',
          targetSeconds: 20,
          rewardCoins: 30,
          completed: true,
        },
      };
      const today = FIXED_DAY;
      
      const updated = ensureDailyChallenge(profile, today);
      
      expect(updated.dailyChallenge.completed).toBe(false);
      expect(updated.dailyChallenge.dateKey).toBe('2026-02-01');
    });
  });

  describe('applyDailyChallengeResult', () => {
    it('should reward coins when target is met', () => {
      const profile = {
        ...defaultProfile(),
        coins: 100,
        dailyChallenge: {
          dateKey: '2026-02-01',
          targetSeconds: 20,
          rewardCoins: 30,
          completed: false,
        },
      };
      
      const { profile: updated, rewarded } = applyDailyChallengeResult(profile, 20, FIXED_DAY);
      
      expect(rewarded).toBe(30);
      expect(updated.coins).toBe(130);
      expect(updated.dailyChallenge.completed).toBe(true);
    });

    it('should reward coins when target is exceeded', () => {
      const profile = {
        ...defaultProfile(),
        coins: 100,
        dailyChallenge: {
          dateKey: '2026-02-01',
          targetSeconds: 20,
          rewardCoins: 30,
          completed: false,
        },
      };
      
      const { profile: updated, rewarded } = applyDailyChallengeResult(profile, 25, FIXED_DAY);
      
      expect(rewarded).toBe(30);
      expect(updated.coins).toBe(130);
      expect(updated.dailyChallenge.completed).toBe(true);
    });

    it('should not reward if target not met', () => {
      const profile = {
        ...defaultProfile(),
        coins: 100,
        dailyChallenge: {
          dateKey: '2026-02-01',
          targetSeconds: 20,
          rewardCoins: 30,
          completed: false,
        },
      };
      
      const { profile: updated, rewarded } = applyDailyChallengeResult(profile, 19, FIXED_DAY);
      
      expect(rewarded).toBe(0);
      expect(updated.coins).toBe(100);
      expect(updated.dailyChallenge.completed).toBe(false);
    });

    it('should not reward if already completed', () => {
      const profile = {
        ...defaultProfile(),
        coins: 100,
        dailyChallenge: {
          dateKey: '2026-02-01',
          targetSeconds: 20,
          rewardCoins: 30,
          completed: true,
        },
      };
      
      const { profile: updated, rewarded } = applyDailyChallengeResult(profile, 25, FIXED_DAY);
      
      expect(rewarded).toBe(0);
      expect(updated.coins).toBe(100);
      expect(updated.dailyChallenge.completed).toBe(true);
    });
  });
});
