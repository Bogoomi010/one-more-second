import { GameplayModifierId } from './types';
import { normalizeGameplayModifierIds } from './modifiers';

const SETTINGS_STORAGE_KEY = 'oms.settings.v1';
export const SETTINGS_UPDATED_EVENT = 'oms.settings.updated';

export interface GameSettings {
  version: 1;
  graphics: {
    particles: boolean;
    hitFlashIntensity: number; // 0-100
    fpsLimit: 30 | 60 | 0; // 0 = unlimited
    touchMoveSpeed: number; // 50-200 (%)
    touchDeadzone: number; // 0-80 (px)
  };
  audio: {
    bgmVolume: number; // 0-100
    sfxVolume: number; // 0-100
    bgmEnabled: boolean;
    sfxEnabled: boolean;
  };
  gameplay: {
    enabledModifiers: GameplayModifierId[];
  };
}

export function defaultSettings(): GameSettings {
  return {
    version: 1,
    graphics: {
      particles: true,
      hitFlashIntensity: 50,
      fpsLimit: 60,
      touchMoveSpeed: 100,
      touchDeadzone: 8,
    },
    audio: {
      bgmVolume: 70,
      sfxVolume: 80,
      bgmEnabled: true,
      sfxEnabled: true,
    },
    gameplay: {
      enabledModifiers: [],
    },
  };
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return clampNumber(value, min, max);
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaultSettings();

    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return defaultSettings();

    const defaults = defaultSettings();

    const merged = {
      ...defaultSettings(),
      ...parsed,
      graphics: {
        ...defaults.graphics,
        ...(parsed.graphics ?? {}),
      },
      audio: {
        ...defaults.audio,
        ...(parsed.audio ?? {}),
      },
      gameplay: {
        ...defaults.gameplay,
        ...(parsed.gameplay ?? {}),
      },
    };

    const fpsLimitRaw = merged.graphics.fpsLimit;
    const fpsLimit: 30 | 60 | 0 =
      fpsLimitRaw === 30 || fpsLimitRaw === 60 || fpsLimitRaw === 0
        ? fpsLimitRaw
        : defaults.graphics.fpsLimit;

    return {
      ...merged,
      graphics: {
        ...merged.graphics,
        hitFlashIntensity: normalizeNumber(
          merged.graphics.hitFlashIntensity,
          defaults.graphics.hitFlashIntensity,
          0,
          100
        ),
        fpsLimit,
        touchMoveSpeed: normalizeNumber(
          merged.graphics.touchMoveSpeed,
          defaults.graphics.touchMoveSpeed,
          50,
          200
        ),
        touchDeadzone: normalizeNumber(
          merged.graphics.touchDeadzone,
          defaults.graphics.touchDeadzone,
          0,
          80
        ),
      },
      audio: {
        ...merged.audio,
        bgmVolume: normalizeNumber(merged.audio.bgmVolume, defaults.audio.bgmVolume, 0, 100),
        sfxVolume: normalizeNumber(merged.audio.sfxVolume, defaults.audio.sfxVolume, 0, 100),
      },
      gameplay: {
        ...merged.gameplay,
        enabledModifiers: normalizeGameplayModifierIds(
          merged.gameplay.enabledModifiers,
          defaults.gameplay.enabledModifiers
        ),
      },
    };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<GameSettings>(SETTINGS_UPDATED_EVENT, { detail: settings }));
  }
}

export function updateSettings(mutator: (s: GameSettings) => GameSettings): GameSettings {
  const s = loadSettings();
  const next = mutator(s);
  saveSettings(next);
  return next;
}

export function resetSettings(): GameSettings {
  const s = defaultSettings();
  saveSettings(s);
  return s;
}
