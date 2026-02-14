import {
  BulletSkinDefinition,
  BulletSkinId,
  LegacySkinId,
  PlayerSkinDefinition,
  PlayerSkinId,
} from './types';
import playerDefaultImage from '../assets/icon-player-default.png';
import playerGirlImage from '../assets/icon-player-girl.png';
import playerRabbitImage from '../assets/icon-player-rabbit.png';
import playerWarriorImage from '../assets/icon-player-warrior.png';
import playerSkeletonImage from '../assets/icon-player-skeleton.png';
import playerSnowmanImage from '../assets/icon-player-snowman.png';
import playerFireImage from '../assets/icon-player-fire.png';
import playerDemonImage from '../assets/icon-player-demon.png';
import bulletDefaultImage from '../assets/icon-bullet-default.png';
import bulletGimmicImage from '../assets/icon-bullet-gimic.png';
import bulletNeonImage from '../assets/icon-bullet-neon-blue.png';
import bulletJellyImage from '../assets/icon-bullet-jelly.png';
import bulletDemonImage from '../assets/icon-bullet-demon.png';

export const DEFAULT_PLAYER_SKIN_ID: PlayerSkinId = 'player-default';
export const DEFAULT_BULLET_SKIN_ID: BulletSkinId = 'bullet-default';

const LEGACY_SKIN_TO_COMBINATION: Record<
  LegacySkinId,
  {
    playerSkinId: PlayerSkinId;
    bulletSkinId: BulletSkinId;
  }
> = {
  'classic-blue': {
    playerSkinId: 'player-default',
    bulletSkinId: 'bullet-default',
  },
  mint: {
    playerSkinId: 'player-rabbit-girl',
    bulletSkinId: 'bullet-gimic',
  },
  sunset: {
    playerSkinId: 'player-default',
    bulletSkinId: 'bullet-neon-blue',
  },
  neon: {
    playerSkinId: 'player-rabbit-girl',
    bulletSkinId: 'bullet-neon-blue',
  },
};

const COMBINATION_TO_LEGACY_SKIN: Record<string, LegacySkinId> = Object.entries(
  LEGACY_SKIN_TO_COMBINATION
).reduce((acc, [legacySkinId, combination]) => {
  const key = `${combination.playerSkinId}::${combination.bulletSkinId}`;
  acc[key] = legacySkinId as LegacySkinId;
  return acc;
}, {} as Record<string, LegacySkinId>);

export const PLAYER_SKINS: PlayerSkinDefinition[] = [
  {
    id: 'player-default',
    name: 'Default',
    priceCoins: 0,
    image: playerDefaultImage,
  },
  {
    id: 'player-rabbit-girl',
    name: 'Rabbit Girl',
    priceCoins: 120,
    image: playerGirlImage,
  },
  {
    id: 'player-rabbit',
    name: 'Rabbit',
    priceCoins: 180,
    image: playerRabbitImage,
  },
  {
    id: 'player-warrior',
    name: 'Warrior',
    priceCoins: 230,
    image: playerWarriorImage,
  },
  {
    id: 'player-skeleton',
    name: 'Skeleton',
    priceCoins: 260,
    image: playerSkeletonImage,
  },
  {
    id: 'player-snowman',
    name: 'Snowman',
    priceCoins: 300,
    image: playerSnowmanImage,
  },
  {
    id: 'player-fire',
    name: 'Fire',
    priceCoins: 340,
    image: playerFireImage,
  },
  {
    id: 'player-demon',
    name: 'Demon',
    priceCoins: 420,
    image: playerDemonImage,
  },
];

export const BULLET_SKINS: BulletSkinDefinition[] = [
  {
    id: 'bullet-default',
    name: 'Default',
    priceCoins: 0,
    image: bulletDefaultImage,
  },
  {
    id: 'bullet-gimic',
    name: 'Gimic',
    priceCoins: 90,
    image: bulletGimmicImage,
  },
  {
    id: 'bullet-neon-blue',
    name: 'Neon Blue',
    priceCoins: 140,
    image: bulletNeonImage,
  },
  {
    id: 'bullet-jelly',
    name: 'Jelly',
    priceCoins: 180,
    image: bulletJellyImage,
  },
  {
    id: 'bullet-demon',
    name: 'Demon',
    priceCoins: 250,
    image: bulletDemonImage,
  },
];

const PLAYER_SKIN_ID_SET = new Set<PlayerSkinId>(PLAYER_SKINS.map((skin) => skin.id));
const BULLET_SKIN_ID_SET = new Set<BulletSkinId>(BULLET_SKINS.map((skin) => skin.id));
const LEGACY_SKIN_ID_SET = new Set<LegacySkinId>(
  Object.keys(LEGACY_SKIN_TO_COMBINATION) as LegacySkinId[]
);

export function isPlayerSkinId(value: unknown): value is PlayerSkinId {
  return typeof value === 'string' && PLAYER_SKIN_ID_SET.has(value as PlayerSkinId);
}

export function isBulletSkinId(value: unknown): value is BulletSkinId {
  return typeof value === 'string' && BULLET_SKIN_ID_SET.has(value as BulletSkinId);
}

export function isLegacySkinId(value: unknown): value is LegacySkinId {
  return typeof value === 'string' && LEGACY_SKIN_ID_SET.has(value as LegacySkinId);
}

export function getPlayerSkin(id: PlayerSkinId): PlayerSkinDefinition {
  const skin = PLAYER_SKINS.find((item) => item.id === id);
  return skin ?? PLAYER_SKINS[0];
}

export function getBulletSkin(id: BulletSkinId): BulletSkinDefinition {
  const skin = BULLET_SKINS.find((item) => item.id === id);
  return skin ?? BULLET_SKINS[0];
}

export function getLegacySkinCombination(id: LegacySkinId): {
  playerSkinId: PlayerSkinId;
  bulletSkinId: BulletSkinId;
} {
  return LEGACY_SKIN_TO_COMBINATION[id];
}

function uniqueIds<T extends string>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function resolveLegacySkinState(
  ownedPlayerSkins: PlayerSkinId[],
  ownedBulletSkins: BulletSkinId[],
  selectedPlayerSkinId: PlayerSkinId,
  selectedBulletSkinId: BulletSkinId
): {
  selectedSkinId: LegacySkinId;
  ownedSkins: LegacySkinId[];
} {
  const ownedLegacySkins = (Object.keys(LEGACY_SKIN_TO_COMBINATION) as LegacySkinId[]).filter(
    (legacyId) => {
      const combination = LEGACY_SKIN_TO_COMBINATION[legacyId];
      return (
        ownedPlayerSkins.includes(combination.playerSkinId) &&
        ownedBulletSkins.includes(combination.bulletSkinId)
      );
    }
  );

  const selectedKey = `${selectedPlayerSkinId}::${selectedBulletSkinId}`;
  const selectedLegacySkinId = COMBINATION_TO_LEGACY_SKIN[selectedKey] ?? 'classic-blue';

  return {
    selectedSkinId: selectedLegacySkinId,
    ownedSkins: uniqueIds(
      ownedLegacySkins.length > 0 ? ownedLegacySkins : (['classic-blue'] as LegacySkinId[])
    ),
  };
}
