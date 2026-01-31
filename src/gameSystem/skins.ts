import { SkinDefinition, SkinId } from './types';

export const SKINS: SkinDefinition[] = [
  {
    id: 'classic-blue',
    name: 'Classic Blue',
    priceCoins: 0,
    playerColor: '#2563eb',
    bulletColor: '#ef4444',
  },
  {
    id: 'mint',
    name: 'Mint',
    priceCoins: 120,
    playerColor: '#34d399',
    bulletColor: '#f97316',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    priceCoins: 180,
    playerColor: '#fb7185',
    bulletColor: '#facc15',
  },
  {
    id: 'neon',
    name: 'Neon',
    priceCoins: 250,
    playerColor: '#a855f7',
    bulletColor: '#22d3ee',
  },
];

export function getSkin(id: SkinId): SkinDefinition {
  const skin = SKINS.find((s) => s.id === id);
  return skin ?? SKINS[0];
}
