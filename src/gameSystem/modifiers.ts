import gimmickBulletSkin from '../assets/icon-bullet-neon-blue.png';
import { GameplayModifierId } from './types';

export interface GameplayModifierDefinition {
  id: GameplayModifierId;
  name: string;
  description: string;
  weight: number; // e.g. 0.12 means +12%
  bulletSkin: string;
  effects: {
    crosslineSpawn?: boolean;
    playfieldScale?: number;
    trackingSpeedMultiplier?: number;
    startingLives?: number;
    criticalShotSpawn?: boolean;
    criticalShotSpeedMultiplier?: number;
  };
}

export const GAMEPLAY_MODIFIERS: GameplayModifierDefinition[] = [
  {
    id: 'crossline-40-80',
    name: '바둑판 난사',
    description:
      '정사각형 맵 가장자리(상/하/좌/우)에서 안쪽 직선 탄환이 발사되며, 최대 2개 십자 레인이 동시에 생성됩니다.',
    weight: 0.12,
    bulletSkin: gimmickBulletSkin,
    effects: {
      crosslineSpawn: true,
    },
  },
  {
    id: 'shrink-field-80',
    name: 'Shrink Field',
    description: '플레이 가능한 맵이 80%로 축소됩니다.',
    weight: 0.1,
    bulletSkin: gimmickBulletSkin,
    effects: {
      playfieldScale: 0.8,
    },
  },
  {
    id: 'haste-bullets-110',
    name: '스피드 포화',
    description: '기본 추적 탄환의 속도가 120%로 증가합니다.',
    weight: 0.08,
    bulletSkin: gimmickBulletSkin,
    effects: {
      trackingSpeedMultiplier: 1.2,
    },
  },
  {
    id: 'one-life',
    name: '인생은 한 방!',
    description: '목숨이 3개에서 1개로 줄어듭니다.',
    weight: 0.2,
    bulletSkin: gimmickBulletSkin,
    effects: {
      startingLives: 1,
    },
  },
  {
    id: 'critical-shot',
    name: '회심의 한 발',
    description: '주기적으로 플레이어를 정조준하는 200% 속도 회심 탄환이 추가로 발사됩니다.',
    weight: 0.1,
    bulletSkin: gimmickBulletSkin,
    effects: {
      criticalShotSpawn: true,
      criticalShotSpeedMultiplier: 2,
    },
  },
];

const MODIFIER_ID_SET = new Set<GameplayModifierId>(GAMEPLAY_MODIFIERS.map((modifier) => modifier.id));
const MODIFIER_BY_ID = new Map<GameplayModifierId, GameplayModifierDefinition>(
  GAMEPLAY_MODIFIERS.map((modifier) => [modifier.id, modifier])
);

export const MODIFIER_BULLET_SKIN = gimmickBulletSkin;

export function isGameplayModifierId(value: unknown): value is GameplayModifierId {
  return typeof value === 'string' && MODIFIER_ID_SET.has(value as GameplayModifierId);
}

export function normalizeGameplayModifierIds(
  values: unknown,
  fallback: GameplayModifierId[] = []
): GameplayModifierId[] {
  if (!Array.isArray(values)) return [...fallback];
  return Array.from(new Set(values.filter(isGameplayModifierId)));
}

export function getGameplayModifierDefinition(id: GameplayModifierId): GameplayModifierDefinition {
  const modifier = MODIFIER_BY_ID.get(id);
  if (!modifier) {
    throw new Error(`Unknown gameplay modifier: ${id}`);
  }
  return modifier;
}

export function getGameplayModifierDefinitions(
  ids: GameplayModifierId[]
): GameplayModifierDefinition[] {
  return ids.map(getGameplayModifierDefinition);
}

export interface ResolvedModifierEffects {
  hasAnyModifier: boolean;
  crosslineSpawn: boolean;
  playfieldScale: number;
  trackingSpeedMultiplier: number;
  startingLives: number;
  criticalShotSpawn: boolean;
  criticalShotSpeedMultiplier: number;
}

export function resolveModifierEffects(ids: GameplayModifierId[]): ResolvedModifierEffects {
  const definitions = getGameplayModifierDefinitions(ids);

  return definitions.reduce<ResolvedModifierEffects>(
    (acc, modifier) => ({
      hasAnyModifier: true,
      crosslineSpawn: acc.crosslineSpawn || Boolean(modifier.effects.crosslineSpawn),
      playfieldScale: Math.min(acc.playfieldScale, modifier.effects.playfieldScale ?? 1),
      trackingSpeedMultiplier: acc.trackingSpeedMultiplier * (modifier.effects.trackingSpeedMultiplier ?? 1),
      startingLives: Math.min(acc.startingLives, modifier.effects.startingLives ?? 3),
      criticalShotSpawn: acc.criticalShotSpawn || Boolean(modifier.effects.criticalShotSpawn),
      criticalShotSpeedMultiplier:
        acc.criticalShotSpeedMultiplier * (modifier.effects.criticalShotSpeedMultiplier ?? 1),
    }),
    {
      hasAnyModifier: false,
      crosslineSpawn: false,
      playfieldScale: 1,
      trackingSpeedMultiplier: 1,
      startingLives: 3,
      criticalShotSpawn: false,
      criticalShotSpeedMultiplier: 1,
    }
  );
}

export interface ScoreBreakdown {
  baseScore: number;
  adjustmentScore: number;
  finalScore: number;
}

export function calculateScoreBreakdown(
  baseScore: number,
  enabledModifierIds: GameplayModifierId[]
): ScoreBreakdown {
  const sanitizedBaseScore = Math.max(0, Math.floor(baseScore));
  const definitions = getGameplayModifierDefinitions(enabledModifierIds);
  const adjustmentRaw = definitions.reduce(
    (sum, modifier) => sum + sanitizedBaseScore * modifier.weight,
    0
  );
  const adjustmentScore = Math.floor(adjustmentRaw);
  return {
    baseScore: sanitizedBaseScore,
    adjustmentScore,
    finalScore: sanitizedBaseScore + adjustmentScore,
  };
}
