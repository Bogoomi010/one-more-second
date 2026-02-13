export type LegacySkinId = 'classic-blue' | 'mint' | 'sunset' | 'neon';

export type PlayerSkinId =
  | 'player-default'
  | 'player-girl'
  | 'player-rabbit'
  | 'player-warrior'
  | 'player-skeleton'
  | 'player-snowman'
  | 'player-fire'
  | 'player-demon';

export type BulletSkinId =
  | 'bullet-default'
  | 'bullet-gimic'
  | 'bullet-neon-blue'
  | 'bullet-jelly'
  | 'bullet-demon';

export interface PlayerProfile {
  version: 1;
  coins: number;
  totalRuns: number;
  totalSecondsSurvived: number;
  bestScore: number;
  selectedPlayerSkinId: PlayerSkinId;
  selectedBulletSkinId: BulletSkinId;
  ownedPlayerSkins: PlayerSkinId[];
  ownedBulletSkins: BulletSkinId[];
  selectedSkinId?: LegacySkinId;
  ownedSkins?: LegacySkinId[];
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

export interface PlayerSkinDefinition {
  id: PlayerSkinId;
  name: string;
  priceCoins: number;
  image: string;
}

export interface BulletSkinDefinition {
  id: BulletSkinId;
  name: string;
  priceCoins: number;
  image: string;
}
