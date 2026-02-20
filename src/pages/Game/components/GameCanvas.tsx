import React, { useEffect, useRef, useState } from 'react';
import { Application, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { sound } from '@pixi/sound';
import { GameResult, GameplayModifierId } from '../../../gameSystem/types';
import { loadSettings, SETTINGS_UPDATED_EVENT } from '../../../gameSystem/settings';
import { audioManager } from '../../../gameSystem/audio';
import countdownOneImage from '../../../assets/icon-countdown-one.png';
import countdownThreeImage from '../../../assets/icon-countdown-three.png';
import countdownTwoImage from '../../../assets/icon-countdown-two.png';
import {
  MODIFIER_BULLET_SKIN,
  calculateScoreBreakdown,
  getGameplayModifierDefinitions,
  normalizeGameplayModifierIds,
  resolveModifierEffects,
} from '../../../gameSystem/modifiers';
import bgmFile from '../../../Sound/Sound_main.mp3';

const PLAYER_SPEED = 240;
const PLAYER_SIZE = 28;
const BULLET_SIZE = 12;
const BULLET_RADIUS = BULLET_SIZE / 2;
const BULLET_SPEED = 180;
const CROSSLINE_FIRE_INTERVAL_MS = 3000;
const CRITICAL_SHOT_FIRE_INTERVAL_MS = 4500;
const CROSSLINE_MAX_LANES = 2;
const CROSSLINE_LANE_RATIOS = [0.2, 0.35, 0.5, 0.65, 0.8] as const;
const PLAYER_BOUNDS_MARGIN = 6;
const INITIAL_SPAWN_INTERVAL = 500;
const INTERVAL_DECREASE = 50;
const MIN_SPAWN_INTERVAL = 100;
const DIFFICULTY_INTERVAL = 3000;
const AI_DANGER_DISTANCE = 220;
const AI_MOVE_SPEED_MULTIPLIER = 0.82;
const AI_SIDE_SWITCH_MS = 920;
const AI_WALL_EVASION_PADDING = 26;
const AI_CENTER_PULL_STRENGTH = 0.62;
const AI_IDLE_ORBIT_STRENGTH = 0.18;
export const PIXI_BGM_ALIAS = 'oms-main-bgm';
const DESKTOP_CANVAS_ASPECT_RATIO = 1;
const MOBILE_CANVAS_BREAKPOINT_PX = 768;
const MOVEMENT_CODES = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
]);

const CANVAS_ASPECT_CLASS_BY_RATIO: Record<string, string> = {
  '0.6': 'aspect-[0.6]',
  '0.7': 'aspect-[0.7]',
  '0.8': 'aspect-[0.8]',
  '0.9': 'aspect-[0.9]',
  '1.0': 'aspect-[1]',
  '1.1': 'aspect-[1.1]',
  '1.2': 'aspect-[1.2]',
  '1.3': 'aspect-[1.3]',
  '1.4': 'aspect-[1.4]',
  '1.5': 'aspect-[1.5]',
  '1.6': 'aspect-[1.6]',
  '1.7': 'aspect-[1.7]',
  '1.8': 'aspect-[1.8]',
  '1.9': 'aspect-[1.9]',
  '2.0': 'aspect-[2]',
  '2.1': 'aspect-[2.1]',
  '2.2': 'aspect-[2.2]',
};

function getCanvasAspectClass(ratio: number): string {
  const clamped = Math.max(0.6, Math.min(2.2, ratio));
  const rounded = (Math.round(clamped * 10) / 10).toFixed(1);
  return CANVAS_ASPECT_CLASS_BY_RATIO[rounded] ?? CANVAS_ASPECT_CLASS_BY_RATIO['1.0'];
}

interface GameCanvasProps {
  onGameOver: (result: GameResult) => void;
  onLivesChange: (lives: number) => void;
  onScoreChange: (score: number) => void;
  onSpawnIntervalChange: (interval: number) => void;
  playerImage: string;
  bulletImage: string;
  isModalOpen?: boolean;
  joystickVectorRef?: React.MutableRefObject<{ x: number; y: number }>;
  activeModifiers?: GameplayModifierId[];
  countdown?: number | null;
  isAiMode?: boolean;
}

type Bullet = {
  sprite: Sprite;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type Playfield = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

type SpawnRequest = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  useGimmickSkin: boolean;
};

type GameState = {
  player: { x: number; y: number };
  bullets: Bullet[];
  keys: Record<string, boolean>;
  gameOver: boolean;
  elapsedMs: number;
  lastScoreSec: number;
  bulletsSpawned: number;
  bulletsDodged: number;
  bulletsHit: number;
  lives: number;
  hits: number;
  spawnInterval: number;
  spawnTimer: number;
  difficultyTimer: number;
  crosslineTimer: number;
  criticalShotTimer: number;
  spawnFromTop: boolean;
  hitFlashRemainingMs: number;
  firstHitSeconds: number | null;
  viewportWidth: number;
  viewportHeight: number;
  playfield: Playfield;
  spawnArea: Playfield;
};

function resolveBgmVolume(): number {
  const settings = loadSettings();
  if (!settings.audio.bgmEnabled) return 0;
  return (settings.audio.bgmVolume / 100) * 0.4;
}

function resolveTouchControls() {
  const settings = loadSettings();
  const speedMultiplier = settings.graphics.touchMoveSpeed / 100;
  const normalizedSpeed = (Math.max(0.5, Math.min(2, speedMultiplier)) - 0.5) / 1.5;

  return {
    speedMultiplier: Math.max(0.5, Math.min(2, speedMultiplier)),
    responseAlphaActive: 0.2 + normalizedSpeed * 0.28,
    responseAlphaRelease: 0.16 + normalizedSpeed * 0.2,
  };
}

function isMobileCanvasViewport(): boolean {
  if (typeof window === 'undefined') return false;
  const isNarrowScreen = window.innerWidth <= MOBILE_CANVAS_BREAKPOINT_PX;
  const isCoarsePointer =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  return isNarrowScreen || isCoarsePointer;
}

function resolveCanvasAspectRatio(): number {
  if (!isMobileCanvasViewport()) return DESKTOP_CANVAS_ASPECT_RATIO;

  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  const viewportRatio = width / height;
  return Math.max(0.6, Math.min(2.2, viewportRatio));
}

function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return Boolean(value && typeof (value as Promise<T>).then === 'function');
}

function createPlayfield(width: number, height: number, scale: number): Playfield {
  const clampedScale = Math.max(0.5, Math.min(1, scale));
  const playfieldWidth = width * clampedScale;
  const playfieldHeight = height * clampedScale;
  const left = (width - playfieldWidth) / 2;
  const top = (height - playfieldHeight) / 2;
  const right = left + playfieldWidth;
  const bottom = top + playfieldHeight;

  return {
    left,
    top,
    right,
    bottom,
    width: playfieldWidth,
    height: playfieldHeight,
  };
}

function GameCanvasComponent({
  onGameOver,
  onLivesChange,
  onScoreChange,
  onSpawnIntervalChange,
  playerImage,
  bulletImage,
  isModalOpen = false,
  joystickVectorRef,
  activeModifiers = [],
  countdown = null,
  isAiMode = false,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onGameOverRef = useRef(onGameOver);
  const onLivesChangeRef = useRef(onLivesChange);
  const onScoreChangeRef = useRef(onScoreChange);
  const onSpawnIntervalChangeRef = useRef(onSpawnIntervalChange);
  const isModalOpenRef = useRef(isModalOpen);
  const joystickVectorSourceRef = useRef(joystickVectorRef);
  const fpsLimitRef = useRef<number>(0);
  const frameAccumulatorRef = useRef(0);
  const countdownRef = useRef<number | null>(null);
  const [canvasAspectRatio, setCanvasAspectRatio] = useState(resolveCanvasAspectRatio);

  useEffect(() => {
    const updateAspectRatio = () => {
      setCanvasAspectRatio(resolveCanvasAspectRatio());
    };

    updateAspectRatio();
    window.addEventListener('resize', updateAspectRatio);
    window.addEventListener('orientationchange', updateAspectRatio);

    return () => {
      window.removeEventListener('resize', updateAspectRatio);
      window.removeEventListener('orientationchange', updateAspectRatio);
    };
  }, []);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
    onLivesChangeRef.current = onLivesChange;
    onScoreChangeRef.current = onScoreChange;
    onSpawnIntervalChangeRef.current = onSpawnIntervalChange;
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen, onGameOver, onLivesChange, onScoreChange, onSpawnIntervalChange]);

  useEffect(() => {
    joystickVectorSourceRef.current = joystickVectorRef;
  }, [joystickVectorRef]);

  useEffect(() => {
    countdownRef.current = countdown ?? null;
  }, [countdown]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const enabledModifierIds = normalizeGameplayModifierIds(activeModifiers);
    const enabledModifiers = getGameplayModifierDefinitions(enabledModifierIds);
    const modifierEffects = resolveModifierEffects(enabledModifierIds);

    const app = new Application<HTMLCanvasElement>({
      antialias: true,
      backgroundColor: 0x18181b,
      autoDensity: true,
      resizeTo: container,
    });

    const view = app.view as HTMLCanvasElement;
    view.tabIndex = 0;
    view.style.outline = 'none';
    container.appendChild(view);

    const stage: any = app.stage;
    stage.eventMode = 'static';

    const backgroundLayer = new Graphics();
    stage.addChild(backgroundLayer);

    const playfieldLayer = new Graphics();
    stage.addChild(playfieldLayer);

    const hitFlashLayer = new Graphics();
    stage.addChild(hitFlashLayer);

    const playerTexture = Texture.from(playerImage);
    const bulletTexture = Texture.from(bulletImage);
    const gimmickBulletTexture = Texture.from(MODIFIER_BULLET_SKIN);
    const countdownTextures: Record<number, Texture> = {
      1: Texture.from(countdownOneImage),
      2: Texture.from(countdownTwoImage),
      3: Texture.from(countdownThreeImage),
    };

    const playerSprite = new Sprite(playerTexture);
    playerSprite.anchor.set(0.5);
    playerSprite.width = PLAYER_SIZE;
    playerSprite.height = PLAYER_SIZE;
    stage.addChild(playerSprite);

    const countdownSprite = new Sprite();
    countdownSprite.anchor.set(0.5);
    countdownSprite.visible = false;
    stage.addChild(countdownSprite);

    const initialPlayfield = createPlayfield(
      app.screen.width,
      app.screen.height,
      modifierEffects.playfieldScale
    );
    const initialSpawnArea = createPlayfield(app.screen.width, app.screen.height, 1);

    const state: GameState = {
      player: {
        x: (initialPlayfield.left + initialPlayfield.right) / 2,
        y: (initialPlayfield.top + initialPlayfield.bottom) / 2,
      },
      bullets: [],
      keys: {},
      gameOver: false,
      elapsedMs: 0,
      lastScoreSec: 0,
      bulletsSpawned: 0,
      bulletsDodged: 0,
      bulletsHit: 0,
      lives: modifierEffects.startingLives,
      hits: 0,
      spawnInterval: INITIAL_SPAWN_INTERVAL,
      spawnTimer: 0,
      difficultyTimer: 0,
      crosslineTimer: 0,
      criticalShotTimer: 0,
      spawnFromTop: true,
      hitFlashRemainingMs: 0,
      firstHitSeconds: null,
      viewportWidth: app.screen.width,
      viewportHeight: app.screen.height,
      playfield: initialPlayfield,
      spawnArea: initialSpawnArea,
    };

    const touchControls = {
      speedMultiplier: 1,
      responseAlphaActive: 0.3,
      responseAlphaRelease: 0.24,
    };
    const joystickMotion = { x: 0, y: 0 };

    const syncTouchControls = () => {
      const next = resolveTouchControls();
      touchControls.speedMultiplier = next.speedMultiplier;
      touchControls.responseAlphaActive = next.responseAlphaActive;
      touchControls.responseAlphaRelease = next.responseAlphaRelease;
    };

    const syncFpsLimit = () => {
      const settings = loadSettings();
      fpsLimitRef.current = settings.graphics.fpsLimit;
      frameAccumulatorRef.current = 0;
    };

    const syncCanvasSettings = () => {
      syncTouchControls();
      syncFpsLimit();
    };

    onLivesChangeRef.current(modifierEffects.startingLives);
    onScoreChangeRef.current(0);
    onSpawnIntervalChangeRef.current(INITIAL_SPAWN_INTERVAL);
    syncCanvasSettings();

    void audioManager.init();
    let destroyed = false;

    if (!sound.exists(PIXI_BGM_ALIAS)) {
      sound.add(PIXI_BGM_ALIAS, {
        url: bgmFile,
        loop: true,
        volume: resolveBgmVolume(),
      });
    } else {
      sound.volume(PIXI_BGM_ALIAS, resolveBgmVolume());
    }

    const resumeAllAudioContexts = () => {
      if (!audioManager.canPlayAudioNow()) return;

      audioManager.resume();
      const pixiAudioContext = sound.context?.audioContext;
      if (pixiAudioContext && pixiAudioContext.state === 'suspended') {
        void pixiAudioContext.resume().catch(() => {
          // Browser can reject before user activation.
        });
      }
      sound.resumeAll();
    };

    const ensureBgmPlayback = () => {
      if (destroyed || state.gameOver) return;
      const settings = loadSettings();
      if (!settings.audio.bgmEnabled) return;
      if (!sound.exists(PIXI_BGM_ALIAS)) return;
      if (sound.find(PIXI_BGM_ALIAS).isPlaying) return;

      try {
        const playback = sound.play(PIXI_BGM_ALIAS, {
          loop: true,
          singleInstance: true,
          volume: resolveBgmVolume(),
        });

        if (isPromise(playback)) {
          void playback.catch(() => {
            // Autoplay lock can reject; retry on next gesture.
          });
        }
      } catch {
        // Autoplay lock can throw; retry on next gesture.
      }
    };

    const unlockAndPlayAudio = () => {
      if (state.gameOver) return;
      audioManager.markUserInteraction();
      void audioManager.init();
      resumeAllAudioContexts();
      ensureBgmPlayback();
    };

    const stopBgm = () => {
      if (sound.exists(PIXI_BGM_ALIAS)) {
        try {
          sound.stop(PIXI_BGM_ALIAS);
        } catch (error) {
          console.warn('Failed to stop BGM:', error);
        }
      }
      audioManager.stopBGM();
    };

    const drawBackground = (width: number, height: number) => {
      backgroundLayer.clear();
      backgroundLayer.beginFill(0x18181b);
      backgroundLayer.drawRect(0, 0, width, height);
      backgroundLayer.endFill();

      playfieldLayer.clear();
      const hasShrunkPlayfield =
        Math.abs(state.playfield.width - width) > 0.5 || Math.abs(state.playfield.height - height) > 0.5;
      if (hasShrunkPlayfield) {
        playfieldLayer.lineStyle(2, 0x3f3f46, 1);
        playfieldLayer.drawRect(
          state.playfield.left,
          state.playfield.top,
          state.playfield.width,
          state.playfield.height
        );
      }

      hitFlashLayer.clear();
      hitFlashLayer.beginFill(0xff0000);
      hitFlashLayer.drawRect(0, 0, width, height);
      hitFlashLayer.endFill();
      hitFlashLayer.visible = false;

      stage.hitArea = new Rectangle(0, 0, width, height);
    };

    const clampPlayer = () => {
      const halfSize = PLAYER_SIZE / 2;
      const maxX = state.playfield.right - halfSize - PLAYER_BOUNDS_MARGIN;
      const maxY = state.playfield.bottom - halfSize - PLAYER_BOUNDS_MARGIN;
      const minX = state.playfield.left + halfSize + PLAYER_BOUNDS_MARGIN;
      const minY = state.playfield.top + halfSize + PLAYER_BOUNDS_MARGIN;
      state.player.x = Math.max(minX, Math.min(maxX, state.player.x));
      state.player.y = Math.max(minY, Math.min(maxY, state.player.y));
    };

    const syncViewport = () => {
      const width = app.screen.width;
      const height = app.screen.height;
      if (width === state.viewportWidth && height === state.viewportHeight) {
        return;
      }

      state.viewportWidth = width;
      state.viewportHeight = height;
      state.playfield = createPlayfield(width, height, modifierEffects.playfieldScale);
      state.spawnArea = createPlayfield(width, height, 1);
      drawBackground(width, height);
      clampPlayer();
    };

    const appendBullet = (request: SpawnRequest) => {
      const bulletSprite = new Sprite(request.useGimmickSkin ? gimmickBulletTexture : bulletTexture);
      bulletSprite.anchor.set(0.5);
      bulletSprite.width = BULLET_SIZE;
      bulletSprite.height = BULLET_SIZE;
      bulletSprite.x = request.x;
      bulletSprite.y = request.y;
      stage.addChild(bulletSprite);
      state.bulletsSpawned += 1;

      state.bullets.push({
        sprite: bulletSprite,
        x: request.x,
        y: request.y,
        vx: request.vx,
        vy: request.vy,
      });
    };

    const buildTrackingBulletRequest = (): SpawnRequest => {
      const margin = BULLET_RADIUS * 2;
      const x =
        Math.random() * (state.spawnArea.width - margin * 2) + (state.spawnArea.left + margin);
      const y = state.spawnFromTop
        ? state.spawnArea.top + margin
        : state.spawnArea.bottom - margin;

      const dx = state.player.x - x;
      const dy = state.player.y - y;
      const distance = Math.hypot(dx, dy) || 1;
      const bulletSpeed = BULLET_SPEED * modifierEffects.trackingSpeedMultiplier;
      const request: SpawnRequest = {
        x,
        y,
        vx: (dx / distance) * bulletSpeed,
        vy: (dy / distance) * bulletSpeed,
        useGimmickSkin: false,
      };
      state.spawnFromTop = !state.spawnFromTop;

      return request;
    };

    const buildCriticalShotRequest = (): SpawnRequest => {
      const margin = BULLET_RADIUS * 2;
      const side = Math.floor(Math.random() * 4);
      let x = state.spawnArea.left;
      let y = state.spawnArea.top;

      if (side === 0) {
        x =
          Math.random() * (state.spawnArea.width - margin * 2) + (state.spawnArea.left + margin);
        y = state.spawnArea.top - BULLET_RADIUS;
      } else if (side === 1) {
        x =
          Math.random() * (state.spawnArea.width - margin * 2) + (state.spawnArea.left + margin);
        y = state.spawnArea.bottom + BULLET_RADIUS;
      } else if (side === 2) {
        x = state.spawnArea.left - BULLET_RADIUS;
        y = Math.random() * (state.spawnArea.height - margin * 2) + (state.spawnArea.top + margin);
      } else {
        x = state.spawnArea.right + BULLET_RADIUS;
        y = Math.random() * (state.spawnArea.height - margin * 2) + (state.spawnArea.top + margin);
      }

      const dx = state.player.x - x;
      const dy = state.player.y - y;
      const distance = Math.hypot(dx, dy) || 1;
      const bulletSpeed = BULLET_SPEED * modifierEffects.criticalShotSpeedMultiplier;

      return {
        x,
        y,
        vx: (dx / distance) * bulletSpeed,
        vy: (dy / distance) * bulletSpeed,
        useGimmickSkin: true,
      };
    };

    const buildCrosslineRequests = (): SpawnRequest[] => {
      if (!modifierEffects.crosslineSpawn) return [];

      const mapLeft = state.spawnArea.left;
      const mapTop = state.spawnArea.top;
      const mapRight = state.spawnArea.right;
      const mapBottom = state.spawnArea.bottom;
      const mapWidth = state.spawnArea.width;
      const mapHeight = state.spawnArea.height;

      const lanePool = [...CROSSLINE_LANE_RATIOS];
      for (let i = lanePool.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [lanePool[i], lanePool[j]] = [lanePool[j], lanePool[i]];
      }

      const laneCount = Math.min(
        CROSSLINE_MAX_LANES,
        lanePool.length,
        1 + Math.floor(Math.random() * CROSSLINE_MAX_LANES)
      );
      const selectedLanes = lanePool.slice(0, laneCount);

      return selectedLanes.flatMap((ratio) => {
        const laneX = mapLeft + mapWidth * ratio;
        const laneY = mapTop + mapHeight * ratio;

        return [
          // top -> down
          { x: laneX, y: mapTop - BULLET_RADIUS, vx: 0, vy: BULLET_SPEED, useGimmickSkin: true },
          // bottom -> up
          { x: laneX, y: mapBottom + BULLET_RADIUS, vx: 0, vy: -BULLET_SPEED, useGimmickSkin: true },
          // left -> right
          { x: mapLeft - BULLET_RADIUS, y: laneY, vx: BULLET_SPEED, vy: 0, useGimmickSkin: true },
          // right -> left
          { x: mapRight + BULLET_RADIUS, y: laneY, vx: -BULLET_SPEED, vy: 0, useGimmickSkin: true },
        ];
      });
    };

    const spawnTrackingBullet = () => {
      appendBullet(buildTrackingBulletRequest());
    };

    const spawnCrosslineBullets = () => {
      buildCrosslineRequests().forEach(appendBullet);
    };

    const spawnCriticalShot = () => {
      appendBullet(buildCriticalShotRequest());
    };

    const resolveAiMovement = () => {
      if (!isAiMode) {
        return { x: 0, y: 0 };
      }

      const dangerLimitSq = AI_DANGER_DISTANCE * AI_DANGER_DISTANCE;
      let steerX = 0;
      let steerY = 0;
      let threatCount = 0;
      const centerX = (state.playfield.left + state.playfield.right) / 2;
      const centerY = (state.playfield.top + state.playfield.bottom) / 2;
      const playfieldWidth = state.playfield.right - state.playfield.left;
      const playfieldHeight = state.playfield.bottom - state.playfield.top;
      const centerPullX = ((centerX - state.player.x) / Math.max(1, playfieldWidth)) * AI_CENTER_PULL_STRENGTH;
      const centerPullY = ((centerY - state.player.y) / Math.max(1, playfieldHeight)) * AI_CENTER_PULL_STRENGTH;

      steerX += centerPullX;
      steerY += centerPullY;

      for (let i = 0; i < state.bullets.length; i += 1) {
        const bullet = state.bullets[i];
        const dx = state.player.x - bullet.x;
        const dy = state.player.y - bullet.y;
        const distanceSq = dx * dx + dy * dy;

        if (distanceSq > dangerLimitSq) continue;

        const distance = Math.sqrt(distanceSq) || 1;
        const urgency = 1 - Math.min(1, distance / AI_DANGER_DISTANCE);
        const avoidWeight = 0.25 + urgency * 1.0;
        const awayX = dx / distance;
        const awayY = dy / distance;

        steerX += awayX * avoidWeight;
        steerY += awayY * avoidWeight;

        const perpX = -awayY;
        const perpY = awayX;
        const perpLen = Math.max(1, Math.hypot(perpX, perpY));
        const sideSign = Math.sin(state.elapsedMs / AI_SIDE_SWITCH_MS) >= 0 ? 1 : -1;

        steerX += (perpX / perpLen) * (0.35 + urgency * 0.8) * sideSign;
        steerY += (perpY / perpLen) * (0.35 + urgency * 0.8) * sideSign;
        threatCount += 1;
      }

      const leftWall = state.playfield.left + AI_WALL_EVASION_PADDING;
      const rightWall = state.playfield.right - AI_WALL_EVASION_PADDING;
      const topWall = state.playfield.top + AI_WALL_EVASION_PADDING;
      const bottomWall = state.playfield.bottom - AI_WALL_EVASION_PADDING;
      const wallRepelStrength = 0.95;
      const wallRepelRange = AI_WALL_EVASION_PADDING * 1.35;

      if (state.player.x < leftWall) {
        const proximity = Math.min(1, (leftWall - state.player.x) / wallRepelRange);
        steerX += wallRepelStrength * (0.2 + 0.8 * proximity);
      }
      if (state.player.x > rightWall) {
        const proximity = Math.min(1, (state.player.x - rightWall) / wallRepelRange);
        steerX -= wallRepelStrength * (0.2 + 0.8 * proximity);
      }
      if (state.player.y < topWall) {
        const proximity = Math.min(1, (topWall - state.player.y) / wallRepelRange);
        steerY += wallRepelStrength * (0.2 + 0.8 * proximity);
      }
      if (state.player.y > bottomWall) {
        const proximity = Math.min(1, (state.player.y - bottomWall) / wallRepelRange);
        steerY -= wallRepelStrength * (0.2 + 0.8 * proximity);
      }

      if (threatCount === 0) {
        const angle = state.elapsedMs / 1400;
        steerX += Math.cos(angle) * AI_IDLE_ORBIT_STRENGTH;
        steerY += Math.sin(angle * 0.92) * AI_IDLE_ORBIT_STRENGTH;
      }

      const magnitude = Math.hypot(steerX, steerY);
      if (magnitude > 0.0001) {
        return {
          x: steerX / magnitude,
          y: steerY / magnitude,
        };
      }

      return {
        x: 1,
        y: 0,
      };
    };

    const removeBulletAt = (
      index: number,
      reason: 'hit' | 'dodged'
    ) => {
      const [removed] = state.bullets.splice(index, 1);
      if (!removed) return;
      if (reason === 'hit') {
        state.bulletsHit += 1;
      } else if (reason === 'dodged') {
        state.bulletsDodged += 1;
      }
      stage.removeChild(removed.sprite);
      removed.sprite.destroy();
    };

    const triggerHit = () => {
      if (state.firstHitSeconds === null) {
        state.firstHitSeconds = state.elapsedMs / 1000;
      }

      state.hits += 1;
      state.lives -= 1;
      onLivesChangeRef.current(state.lives);
      audioManager.playHitSound();

      const settings = loadSettings();
      state.hitFlashRemainingMs = 150 * (settings.graphics.hitFlashIntensity / 100);

      if (state.lives <= 0) {
        state.gameOver = true;
        const elapsedSeconds = Math.floor(state.elapsedMs / 1000);
        const scoreBreakdown = calculateScoreBreakdown(elapsedSeconds, enabledModifierIds);
        stopBgm();
        audioManager.playGameOverSound();
        onGameOverRef.current({
          scoreSeconds: elapsedSeconds,
          hitsTaken: state.hits,
          bulletsSpawned: state.bulletsSpawned,
          bulletsDodged: state.bulletsDodged,
          bulletsHit: state.bulletsHit,
          deaths: 1,
          firstHitSeconds: state.firstHitSeconds,
          ...scoreBreakdown,
          usedGimmicks: enabledModifiers.map((modifier) => ({
            id: modifier.id,
            name: modifier.name,
            weight: modifier.weight,
          })),
        });
      }
    };

    const updateCountdownSprite = () => {
      const countdownValue = countdownRef.current;
      if (countdownValue === null) {
        countdownSprite.visible = false;
        return;
      }

      const countdownTexture = countdownTextures[countdownValue];
      if (!countdownTexture) {
        countdownSprite.visible = false;
        return;
      }

      const baseSize = Math.min(app.screen.width, app.screen.height) * 0.35;
      const hasTextureDimensions =
        countdownTexture.width > 0 && countdownTexture.height > 0;

      if (hasTextureDimensions) {
        const ratio = countdownTexture.height / countdownTexture.width;
        countdownSprite.width = baseSize;
        countdownSprite.height = baseSize * ratio;
      } else {
        countdownSprite.width = baseSize;
        countdownSprite.height = baseSize;
      }

      countdownSprite.texture = countdownTexture;
      countdownSprite.x = app.screen.width / 2;
      countdownSprite.y = app.screen.height / 2;
      countdownSprite.visible = true;
    };

    const update = (deltaTimeSec: number) => {
      if (state.gameOver || isModalOpenRef.current) return;
      if (countdownRef.current !== null) return;

      const deltaMs = deltaTimeSec * 1000;
      state.elapsedMs += deltaMs;
      state.hitFlashRemainingMs = Math.max(0, state.hitFlashRemainingMs - deltaMs);

      const moveDistance = PLAYER_SPEED * deltaTimeSec;
      if (isAiMode) {
        const aiMovement = resolveAiMovement();
        const aiLength = Math.hypot(aiMovement.x, aiMovement.y);
        if (aiLength > 0.0001) {
          state.player.x +=
            (aiMovement.x / aiLength) * moveDistance * AI_MOVE_SPEED_MULTIPLIER;
          state.player.y +=
            (aiMovement.y / aiLength) * moveDistance * AI_MOVE_SPEED_MULTIPLIER;
        }
      } else if (joystickVectorSourceRef.current) {
        const joystickVector = joystickVectorSourceRef.current.current;
        const targetX = joystickVector?.x ?? 0;
        const targetY = joystickVector?.y ?? 0;
        const hasJoystickInput = Math.abs(targetX) > 0.001 || Math.abs(targetY) > 0.001;
        const responseAlpha = hasJoystickInput
          ? touchControls.responseAlphaActive
          : touchControls.responseAlphaRelease;

        joystickMotion.x += (targetX - joystickMotion.x) * responseAlpha;
        joystickMotion.y += (targetY - joystickMotion.y) * responseAlpha;

        if (Math.abs(joystickMotion.x) < 0.0005) joystickMotion.x = 0;
        if (Math.abs(joystickMotion.y) < 0.0005) joystickMotion.y = 0;

        const adjustedMoveDistance = moveDistance * touchControls.speedMultiplier;
        state.player.x += joystickMotion.x * adjustedMoveDistance;
        state.player.y += joystickMotion.y * adjustedMoveDistance;
      } else {
        if (state.keys.ArrowLeft || state.keys.KeyA) state.player.x -= moveDistance;
        if (state.keys.ArrowRight || state.keys.KeyD) state.player.x += moveDistance;
        if (state.keys.ArrowUp || state.keys.KeyW) state.player.y -= moveDistance;
        if (state.keys.ArrowDown || state.keys.KeyS) state.player.y += moveDistance;
      }
      clampPlayer();

      for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
        const bullet = state.bullets[i];
        bullet.x += bullet.vx * deltaTimeSec;
        bullet.y += bullet.vy * deltaTimeSec;
        bullet.sprite.x = bullet.x;
        bullet.sprite.y = bullet.y;

        const distance = Math.hypot(state.player.x - bullet.x, state.player.y - bullet.y);
        if (distance < BULLET_RADIUS + PLAYER_SIZE / 2) {
          removeBulletAt(i, 'hit');
          triggerHit();
          if (state.gameOver) return;
          continue;
        }

        const outOfBounds =
          bullet.x < state.spawnArea.left - BULLET_SIZE ||
          bullet.x > state.spawnArea.right + BULLET_SIZE ||
          bullet.y < state.spawnArea.top - BULLET_SIZE ||
          bullet.y > state.spawnArea.bottom + BULLET_SIZE;

        if (outOfBounds) {
          removeBulletAt(i, 'dodged');
        }
      }

      const elapsedSec = Math.floor(state.elapsedMs / 1000);
      if (elapsedSec !== state.lastScoreSec) {
        state.lastScoreSec = elapsedSec;
        onScoreChangeRef.current(elapsedSec);
      }

      state.difficultyTimer += deltaMs;
      if (state.difficultyTimer >= DIFFICULTY_INTERVAL) {
        state.difficultyTimer -= DIFFICULTY_INTERVAL;
        state.spawnInterval = Math.max(MIN_SPAWN_INTERVAL, state.spawnInterval - INTERVAL_DECREASE);
        onSpawnIntervalChangeRef.current(state.spawnInterval);
      }

      state.spawnTimer += deltaMs;
      while (state.spawnTimer >= state.spawnInterval) {
        state.spawnTimer -= state.spawnInterval;
        spawnTrackingBullet();
      }

      if (modifierEffects.crosslineSpawn) {
        state.crosslineTimer += deltaMs;
        while (state.crosslineTimer >= CROSSLINE_FIRE_INTERVAL_MS) {
          state.crosslineTimer -= CROSSLINE_FIRE_INTERVAL_MS;
          spawnCrosslineBullets();
        }
      }

      if (modifierEffects.criticalShotSpawn) {
        state.criticalShotTimer += deltaMs;
        while (state.criticalShotTimer >= CRITICAL_SHOT_FIRE_INTERVAL_MS) {
          state.criticalShotTimer -= CRITICAL_SHOT_FIRE_INTERVAL_MS;
          spawnCriticalShot();
        }
      }
    };

    const render = () => {
      playerSprite.x = state.player.x;
      playerSprite.y = state.player.y;

      if (state.hitFlashRemainingMs > 0) {
        const settings = loadSettings();
        hitFlashLayer.alpha = 0.5 * (settings.graphics.hitFlashIntensity / 100);
        hitFlashLayer.visible = true;
      } else {
        hitFlashLayer.visible = false;
      }
    };

    const focusCanvas = () => {
      try {
        view.focus({ preventScroll: true });
      } catch {
        view.focus();
      }
    };

    const handlePointerDown = () => {
      unlockAndPlayAudio();
      focusCanvas();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      unlockAndPlayAudio();
      if (MOVEMENT_CODES.has(event.code)) {
        event.preventDefault();
      }
      state.keys[event.code] = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      state.keys[event.code] = false;
    };

    const handleBlur = () => {
      state.keys = {};
      joystickMotion.x = 0;
      joystickMotion.y = 0;
    };

    const ticker = () => {
      syncViewport();
      const clampedDeltaMs = Math.min(app.ticker.deltaMS, 50);
      updateCountdownSprite();

      if (fpsLimitRef.current > 0) {
        frameAccumulatorRef.current += clampedDeltaMs;
        const targetFrameMs = 1000 / fpsLimitRef.current;
        if (frameAccumulatorRef.current < targetFrameMs) return;
        frameAccumulatorRef.current -= targetFrameMs;
        update(targetFrameMs / 1000);
      } else {
        frameAccumulatorRef.current = 0;
        update(clampedDeltaMs / 1000);
      }
      render();
    };

    drawBackground(state.viewportWidth, state.viewportHeight);
    // Try auto-resume only if user interaction was already confirmed for audio playback.
    if (audioManager.canPlayAudioNow()) {
      resumeAllAudioContexts();
      ensureBgmPlayback();
    }
    app.ticker.add(ticker);
    view.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerdown', unlockAndPlayAudio);
    window.addEventListener('touchstart', unlockAndPlayAudio, { passive: true });
    window.addEventListener('mousedown', unlockAndPlayAudio);
    window.addEventListener('keydown', unlockAndPlayAudio);
    view.addEventListener('keydown', handleKeyDown);
    view.addEventListener('keyup', handleKeyUp);
    view.addEventListener('blur', handleBlur);
    window.addEventListener(SETTINGS_UPDATED_EVENT, syncCanvasSettings as EventListener);

    focusCanvas();

    return () => {
      destroyed = true;
      app.ticker.remove(ticker);
      view.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerdown', unlockAndPlayAudio);
      window.removeEventListener('touchstart', unlockAndPlayAudio);
      window.removeEventListener('mousedown', unlockAndPlayAudio);
      window.removeEventListener('keydown', unlockAndPlayAudio);
      view.removeEventListener('keydown', handleKeyDown);
      view.removeEventListener('keyup', handleKeyUp);
      view.removeEventListener('blur', handleBlur);
      window.removeEventListener(SETTINGS_UPDATED_EVENT, syncCanvasSettings as EventListener);
      state.bullets.forEach((bullet) => bullet.sprite.destroy());
      stopBgm();
      app.destroy(true, true);
    };
  }, [activeModifiers, bulletImage, playerImage, isAiMode]);

  const handleCanvasDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleCanvasContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-auto max-h-full max-w-full bg-zinc-900 border-2 border-zinc-800 rounded-xl overflow-hidden cursor-none select-none touch-manipulation ${getCanvasAspectClass(
        canvasAspectRatio
      )} [-webkit-tap-highlight-color:transparent] [-webkit-user-select:none] [-webkit-touch-callout:none]`}
      onDoubleClick={handleCanvasDoubleClick}
      onContextMenu={handleCanvasContextMenu}
    />
  );
}

export default React.memo(GameCanvasComponent, (prevProps, nextProps) => {
  return (
    prevProps.playerImage === nextProps.playerImage &&
    prevProps.bulletImage === nextProps.bulletImage &&
    prevProps.isModalOpen === nextProps.isModalOpen &&
    prevProps.isAiMode === nextProps.isAiMode &&
    prevProps.joystickVectorRef === nextProps.joystickVectorRef &&
    prevProps.countdown === nextProps.countdown
  );
});
