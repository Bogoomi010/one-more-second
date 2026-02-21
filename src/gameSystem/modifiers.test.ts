import {
  calculateScoreBreakdown,
  normalizeGameplayModifierIds,
  resolveModifierEffects,
} from './modifiers';

describe('modifiers', () => {
  it('normalizes modifier ids and removes invalid values', () => {
    const normalized = normalizeGameplayModifierIds([
      'crossline-40-80',
      'crossline-40-80',
      'invalid-modifier',
      'haste-bullets-110',
    ]);

    expect(normalized).toEqual(['crossline-40-80', 'haste-bullets-110']);
  });

  it('resolves combined effects correctly', () => {
    const effects = resolveModifierEffects([
      'crossline-40-80',
      'shrink-field-80',
      'haste-bullets-110',
    ]);

    expect(effects.crosslineSpawn).toBe(true);
    expect(effects.playfieldScale).toBeCloseTo(0.8);
    expect(effects.trackingSpeedMultiplier).toBeCloseTo(1.2);
    expect(effects.hasAnyModifier).toBe(true);
  });

  it('applies one-life and critical-shot effects', () => {
    const effects = resolveModifierEffects(['one-life', 'critical-shot']);

    expect(effects.startingLives).toBe(1);
    expect(effects.criticalShotSpawn).toBe(true);
    expect(effects.criticalShotSpeedMultiplier).toBeCloseTo(2);
  });

  it('calculates weighted score with additive rule', () => {
    const result = calculateScoreBreakdown(100, ['crossline-40-80', 'shrink-field-80']);

    expect(result.baseScore).toBe(100);
    expect(result.adjustmentScore).toBe(40);
    expect(result.finalScore).toBe(140);
  });
});
