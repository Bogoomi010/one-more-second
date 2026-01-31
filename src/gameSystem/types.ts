export type SkinId = 'classic-blue' | 'mint' | 'sunset' | 'neon';

export interface PlayerProfile {
  version: 1;
  coins: number;
  totalRuns: number;
  totalSecondsSurvived: number;
  bestScore: number;
  selectedSkinId: SkinId;
  ownedSkins: SkinId[];
  achievements: Record<string, { unlockedAt: number }>;
  dailyChallenge: {
    dateKey: string; // YYYY-MM-DD
    targetSeconds: number;
    rewardCoins: number;
    completed: boolean;
  };
}

export interface GameResult {
  scoreSeconds: number;
  hitsTaken: number;
}

export interface SkinDefinition {
  id: SkinId;
  name: string;
  priceCoins: number;
  playerColor: string;
  bulletColor: string;
}
