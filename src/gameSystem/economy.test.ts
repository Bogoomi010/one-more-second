import { calcRunRewardCoins, applyRunToProfile } from './economy';
import { GameResult, PlayerProfile } from './types';
import { defaultProfile } from './storage';

describe('Economy System', () => {
  describe('calcRunRewardCoins', () => {
    it('should give 1 coin per second survived', () => {
      const result: GameResult = { scoreSeconds: 10, hitsTaken: 1 };
      expect(calcRunRewardCoins(result)).toBe(10);
    });

    it('should give bonus for no-hit run over 10 seconds', () => {
      const result: GameResult = { scoreSeconds: 15, hitsTaken: 0 };
      expect(calcRunRewardCoins(result)).toBe(25); // 15 + 10 bonus
    });

    it('should not give any coins under 10 seconds', () => {
      const result: GameResult = { scoreSeconds: 9, hitsTaken: 0 };
      expect(calcRunRewardCoins(result)).toBe(0);
    });

    it('should not give any coins under 10 seconds even if hit taken', () => {
      const result: GameResult = { scoreSeconds: 9, hitsTaken: 1 };
      expect(calcRunRewardCoins(result)).toBe(0);
    });

    it('should not give bonus if hit taken', () => {
      const result: GameResult = { scoreSeconds: 20, hitsTaken: 1 };
      expect(calcRunRewardCoins(result)).toBe(20); // no bonus
    });

    it('should handle zero seconds', () => {
      const result: GameResult = { scoreSeconds: 0, hitsTaken: 0 };
      expect(calcRunRewardCoins(result)).toBe(0);
    });
  });

  describe('applyRunToProfile', () => {
    it('should update coins and stats', () => {
      const profile = defaultProfile();
      const result: GameResult = { scoreSeconds: 10, hitsTaken: 1 };
      
      const { profile: updated, runReward } = applyRunToProfile(profile, result);
      
      expect(runReward).toBe(10);
      expect(updated.coins).toBe(10);
      expect(updated.totalRuns).toBe(1);
      expect(updated.totalSecondsSurvived).toBe(10);
    });

    it('should update best score if higher', () => {
      const profile: PlayerProfile = { ...defaultProfile(), bestScore: 5 };
      const result: GameResult = { scoreSeconds: 10, hitsTaken: 0 };
      
      const { profile: updated } = applyRunToProfile(profile, result);
      
      expect(updated.bestScore).toBe(10);
    });

    it('should not update best score if lower', () => {
      const profile: PlayerProfile = { ...defaultProfile(), bestScore: 20 };
      const result: GameResult = { scoreSeconds: 10, hitsTaken: 0 };
      
      const { profile: updated } = applyRunToProfile(profile, result);
      
      expect(updated.bestScore).toBe(20);
    });

    it('should accumulate stats over multiple runs', () => {
      let profile = defaultProfile();
      
      const result1: GameResult = { scoreSeconds: 10, hitsTaken: 1 };
      const { profile: after1 } = applyRunToProfile(profile, result1);
      
      const result2: GameResult = { scoreSeconds: 15, hitsTaken: 0 };
      const { profile: after2 } = applyRunToProfile(after1, result2);
      
      expect(after2.totalRuns).toBe(2);
      expect(after2.totalSecondsSurvived).toBe(25);
      expect(after2.coins).toBe(35); // 10 + 15 + 10 bonus
    });
  });
});
