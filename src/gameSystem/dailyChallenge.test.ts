import { ensureDailyChallenge, applyDailyChallengeResult } from './dailyChallenge';
import { defaultProfile } from './storage';
import { PlayerProfile } from './types';

const FIXED_DAY = new Date('2026-02-01');

describe('Daily Challenge System', () => {
  describe('ensureDailyChallenge', () => {
    it('should create new challenge for new day', () => {
      const profile = defaultProfile();
      const today = FIXED_DAY;
      
      const updated = ensureDailyChallenge(profile, today);
      
      expect(updated.dailyChallenge.dateKey).toBe('2026-02-01');
      expect(updated.dailyChallenge.rewardCoins).toBe(500);
      expect(updated.dailyChallenge.targetSeconds).toBeGreaterThanOrEqual(15);
      expect(updated.dailyChallenge.targetSeconds).toBeLessThanOrEqual(60);
      expect(updated.dailyChallenge.completed).toBe(false);
      expect(['survival', 'no-hit', 'limited-hits']).toContain(updated.dailyChallenge.type);
    });

    it('should not change challenge for same day', () => {
      const profile = defaultProfile();
      const today = FIXED_DAY;
      
      const updated1 = ensureDailyChallenge(profile, today);
      const updated2 = ensureDailyChallenge(updated1, today);
      
      expect(updated2.dailyChallenge.targetSeconds).toBe(updated1.dailyChallenge.targetSeconds);
      expect(updated2.dailyChallenge.rewardCoins).toBe(updated1.dailyChallenge.rewardCoins);
      expect(updated2.dailyChallenge.type).toBe(updated1.dailyChallenge.type);
    });

    it('should generate consistent challenge for same date', () => {
      const profile1 = defaultProfile();
      const profile2 = defaultProfile();
      const today = FIXED_DAY;
      
      const updated1 = ensureDailyChallenge(profile1, today);
      const updated2 = ensureDailyChallenge(profile2, today);
      
      expect(updated1.dailyChallenge.targetSeconds).toBe(updated2.dailyChallenge.targetSeconds);
      expect(updated1.dailyChallenge.rewardCoins).toBe(updated2.dailyChallenge.rewardCoins);
      expect(updated1.dailyChallenge.type).toBe(updated2.dailyChallenge.type);
    });

    it('should reset completion status for new day', () => {
      const profile: PlayerProfile = {
        ...defaultProfile(),
        dailyChallenge: {
          ...defaultProfile().dailyChallenge,
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
    it('should reward coins when survival target is met', () => {
      const profile: PlayerProfile = {
        ...defaultProfile(),
        coins: 100,
        dailyChallenge: {
          ...defaultProfile().dailyChallenge,
          dateKey: '2026-02-01',
          type: 'survival',
          targetSeconds: 20,
          rewardCoins: 500,
          completed: false,
        },
      };
      
      const { profile: updated, rewarded } = applyDailyChallengeResult(profile, { scoreSeconds: 20, hitsTaken: 1 }, FIXED_DAY);
      
      expect(rewarded).toBe(500);
      expect(updated.coins).toBe(600);
      expect(updated.dailyChallenge.completed).toBe(true);
    });

    it('should reward coins for no-hit challenge when hits are 0', () => {
      const profile: PlayerProfile = {
        ...defaultProfile(),
        coins: 100,
        dailyChallenge: {
          ...defaultProfile().dailyChallenge,
          dateKey: '2026-02-01',
          type: 'no-hit',
          targetSeconds: 20,
          targetHits: 0,
          rewardCoins: 500,
          completed: false,
        },
      };
      
      const { profile: updated, rewarded } = applyDailyChallengeResult(profile, { scoreSeconds: 20, hitsTaken: 0 }, FIXED_DAY);
      
      expect(rewarded).toBe(500);
      expect(updated.coins).toBe(600);
      expect(updated.dailyChallenge.completed).toBe(true);
    });

    it('should not reward no-hit challenge when hits are taken', () => {
      const profile: PlayerProfile = {
        ...defaultProfile(),
        coins: 100,
        dailyChallenge: {
          ...defaultProfile().dailyChallenge,
          dateKey: '2026-02-01',
          type: 'no-hit',
          targetSeconds: 20,
          targetHits: 0,
          rewardCoins: 500,
          completed: false,
        },
      };
      
      const { profile: updated, rewarded } = applyDailyChallengeResult(profile, { scoreSeconds: 20, hitsTaken: 1 }, FIXED_DAY);
      
      expect(rewarded).toBe(0);
      expect(updated.coins).toBe(100);
      expect(updated.dailyChallenge.completed).toBe(false);
    });

    it('should reward coins for limited-hits challenge', () => {
      const profile: PlayerProfile = {
        ...defaultProfile(),
        coins: 100,
        dailyChallenge: {
          ...defaultProfile().dailyChallenge,
          dateKey: '2026-02-01',
          type: 'limited-hits',
          targetSeconds: 20,
          targetHits: 1,
          rewardCoins: 500,
          completed: false,
        },
      };
      
      const { profile: updated, rewarded } = applyDailyChallengeResult(profile, { scoreSeconds: 20, hitsTaken: 1 }, FIXED_DAY);
      
      expect(rewarded).toBe(500);
      expect(updated.coins).toBe(600);
      expect(updated.dailyChallenge.completed).toBe(true);
    });

    it('should not reward if already completed', () => {
      const profile: PlayerProfile = {
        ...defaultProfile(),
        coins: 100,
        dailyChallenge: {
          ...defaultProfile().dailyChallenge,
          dateKey: '2026-02-01',
          type: 'survival',
          targetSeconds: 20,
          rewardCoins: 500,
          completed: true,
        },
      };
      
      const { profile: updated, rewarded } = applyDailyChallengeResult(profile, { scoreSeconds: 25, hitsTaken: 0 }, FIXED_DAY);
      
      expect(rewarded).toBe(0);
      expect(updated.coins).toBe(100);
      expect(updated.dailyChallenge.completed).toBe(true);
    });
  });
});
