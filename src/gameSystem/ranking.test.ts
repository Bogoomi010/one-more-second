import { addRankingEntry, getGlobalRanking, getCountryRanking, getDailyRanking, getUserRank, clearRankingData } from './ranking';

describe('Ranking System', () => {
  beforeEach(() => {
    clearRankingData();
  });

  describe('addRankingEntry', () => {
    it('should add entry to global ranking', () => {
      addRankingEntry('Player1', 'KR', 100);
      
      const ranking = getGlobalRanking();
      expect(ranking).toHaveLength(1);
      expect(ranking[0].nickname).toBe('Player1');
      expect(ranking[0].score).toBe(100);
    });

    it('should sort by score descending', () => {
      addRankingEntry('Player1', 'KR', 50);
      addRankingEntry('Player2', 'KR', 100);
      addRankingEntry('Player3', 'KR', 75);
      
      const ranking = getGlobalRanking();
      expect(ranking[0].score).toBe(100);
      expect(ranking[1].score).toBe(75);
      expect(ranking[2].score).toBe(50);
    });

    it('should limit global ranking to 100 entries', () => {
      for (let i = 0; i < 150; i++) {
        addRankingEntry(`Player${i}`, 'KR', i);
      }
      
      const ranking = getGlobalRanking();
      expect(ranking).toHaveLength(100);
      expect(ranking[0].score).toBe(149);
    });

    it('should add entry to country ranking', () => {
      addRankingEntry('Player1', 'KR', 100);
      addRankingEntry('Player2', 'US', 90);
      
      const krRanking = getCountryRanking('KR');
      const usRanking = getCountryRanking('US');
      
      expect(krRanking).toHaveLength(1);
      expect(usRanking).toHaveLength(1);
      expect(krRanking[0].nickname).toBe('Player1');
      expect(usRanking[0].nickname).toBe('Player2');
    });

    it('should limit country ranking to 50 entries', () => {
      for (let i = 0; i < 70; i++) {
        addRankingEntry(`Player${i}`, 'KR', i);
      }
      
      const ranking = getCountryRanking('KR');
      expect(ranking).toHaveLength(50);
    });

    it('should add entry to daily ranking', () => {
      const entry = addRankingEntry('Player1', 'KR', 100);
      
      const dailyRanking = getDailyRanking();
      expect(dailyRanking).toHaveLength(1);
      expect(dailyRanking[0].id).toBe(entry.id);
    });
  });

  describe('getUserRank', () => {
    it('should return global rank', () => {
      addRankingEntry('Player1', 'KR', 50);
      addRankingEntry('Player2', 'KR', 100);
      const entry3 = addRankingEntry('Player3', 'KR', 75);
      
      const rank = getUserRank(entry3.id, 'global');
      expect(rank).toBe(2); // 100, 75, 50
    });

    it('should return country rank', () => {
      addRankingEntry('Player1', 'KR', 50);
      const entry2 = addRankingEntry('Player2', 'KR', 100);
      addRankingEntry('Player3', 'US', 200);
      
      const rank = getUserRank(entry2.id, 'country', 'KR');
      expect(rank).toBe(1);
    });

    it('should return daily rank', () => {
      addRankingEntry('Player1', 'KR', 50);
      const entry2 = addRankingEntry('Player2', 'KR', 100);
      
      const rank = getUserRank(entry2.id, 'daily');
      expect(rank).toBe(1);
    });

    it('should return null if entry not found', () => {
      const rank = getUserRank('nonexistent', 'global');
      expect(rank).toBeNull();
    });
  });

  describe('getCountryRanking', () => {
    it('should return empty array for country with no entries', () => {
      const ranking = getCountryRanking('JP');
      expect(ranking).toEqual([]);
    });
  });

  describe('getDailyRanking', () => {
    it('should return empty array for date with no entries', () => {
      const ranking = getDailyRanking('2025-01-01');
      expect(ranking).toEqual([]);
    });
  });

  describe('timestamp sorting', () => {
    it('should rank earlier timestamp higher for same score', () => {
      const entry1 = addRankingEntry('Player1', 'KR', 100);
      // Small delay to ensure different timestamp
      const entry2 = addRankingEntry('Player2', 'KR', 100);
      
      const ranking = getGlobalRanking();
      expect(ranking[0].id).toBe(entry1.id);
      expect(ranking[1].id).toBe(entry2.id);
    });
  });
});
