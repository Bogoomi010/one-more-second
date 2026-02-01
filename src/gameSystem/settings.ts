const SETTINGS_STORAGE_KEY = 'oms.settings.v1';

export interface GameSettings {
  version: 1;
  graphics: {
    particles: boolean;
    hitFlashIntensity: number; // 0-100
    fpsLimit: 30 | 60 | 0; // 0 = unlimited
  };
  audio: {
    bgmVolume: number; // 0-100
    sfxVolume: number; // 0-100
    bgmEnabled: boolean;
    sfxEnabled: boolean;
  };
}

export function defaultSettings(): GameSettings {
  return {
    version: 1,
    graphics: {
      particles: true,
      hitFlashIntensity: 50,
      fpsLimit: 60,
    },
    audio: {
      bgmVolume: 70,
      sfxVolume: 80,
      bgmEnabled: true,
      sfxEnabled: true,
    },
  };
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaultSettings();

    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return defaultSettings();

    return {
      ...defaultSettings(),
      ...parsed,
      graphics: {
        ...defaultSettings().graphics,
        ...(parsed.graphics ?? {}),
      },
      audio: {
        ...defaultSettings().audio,
        ...(parsed.audio ?? {}),
      },
    };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
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
