export type LegacySkinId = 'classic-blue' | 'mint' | 'sunset' | 'neon';

export type PlayerSkinId =
  | 'player-default'
  | 'player-rabbit-girl'
  | 'player-rabbit'
  | 'player-warrior'
  | 'player-skeleton'
  | 'player-snowman'
  | 'player-fire'
  | 'player-demon'
  | 'player-bear'
  | 'player-whitebear'
  | 'player-cat'
  | 'player-ufo-green'
  | 'player-spaceship2';

export type BulletSkinId =
  | 'bullet-default'
  | 'bullet-gimic'
  | 'bullet-neon-blue'
  | 'bullet-jelly'
  | 'bullet-demon';

export type GameplayModifierId =
  | 'crossline-40-80'
  | 'shrink-field-80'
  | 'haste-bullets-110'
  | 'one-life'
  | 'critical-shot';

export interface PlayerProfile {
  version: 1;
  coins: number;
  totalRuns: number;
  totalSecondsSurvived: number;
  bestScore: number;
  totalBulletsSpawned: number;
  totalBulletsDodged: number;
  totalBulletsHit: number;
  totalDeaths: number;
  selectedPlayerSkinId: PlayerSkinId;
  selectedBulletSkinId: BulletSkinId;
  ownedPlayerSkins: PlayerSkinId[];
  ownedBulletSkins: BulletSkinId[];
  selectedSkinId?: LegacySkinId;
  ownedSkins?: LegacySkinId[];
  achievements: Record<string, { unlockedAt: number }>;
  dailyChallenge: {
    dateKey: string; // YYYY-MM-DD
    type: 'survival' | 'no-hit' | 'limited-hits';
    targetSeconds: number;
    targetHits?: number;
    rewardCoins: number;
    completed: boolean;
  };
}

export interface GameResult {
  scoreSeconds: number;
  hitsTaken: number;
  bulletsSpawned?: number;
  bulletsDodged?: number;
  bulletsHit?: number;
  deaths?: number;
  firstHitSeconds?: number | null;
  baseScore?: number;
  adjustmentScore?: number;
  finalScore?: number;
  usedGimmicks?: Array<{
    id: GameplayModifierId;
    name: string;
    weight: number;
  }>;
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
