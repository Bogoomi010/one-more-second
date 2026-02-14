import React, { useEffect, useRef } from 'react';
import { Application, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { sound } from '@pixi/sound';
import { GameResult } from '../../../gameSystem/types';
import { loadSettings } from '../../../gameSystem/settings';
import { audioManager } from '../../../gameSystem/audio';
import bgmFile from '../../../Sound/Sound_main.mp3';

const PLAYER_SPEED = 240;
const PLAYER_SIZE = 28;
const BULLET_SIZE = 12;
const BULLET_RADIUS = BULLET_SIZE / 2;
const BULLET_SPEED = 180;
const INITIAL_SPAWN_INTERVAL = 500;
const INTERVAL_DECREASE = 50;
const MIN_SPAWN_INTERVAL = 100;
const DIFFICULTY_INTERVAL = 3000;
const PIXI_BGM_ALIAS = 'oms-main-bgm';
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

interface GameCanvasProps {
  onGameOver: (result: GameResult) => void;
  onLivesChange: (lives: number) => void;
  onScoreChange: (score: number) => void;
  onSpawnIntervalChange: (interval: number) => void;
  playerImage: string;
  bulletImage: string;
  isModalOpen?: boolean;
}

type Bullet = {
  sprite: Sprite;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type GameState = {
  player: { x: number; y: number };
  bullets: Bullet[];
  keys: Record<string, boolean>;
  gameOver: boolean;
  elapsedMs: number;
  lastScoreSec: number;
  lives: number;
  hits: number;
  spawnInterval: number;
  spawnTimer: number;
  difficultyTimer: number;
  spawnFromTop: boolean;
  hitFlashRemainingMs: number;
  firstHitSeconds: number | null;
  viewportWidth: number;
  viewportHeight: number;
};

function resolveBgmVolume(): number {
  const settings = loadSettings();
  if (!settings.audio.bgmEnabled) return 0;
  return (settings.audio.bgmVolume / 100) * 0.4;
}

function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return Boolean(value && typeof (value as Promise<T>).then === 'function');
}

function GameCanvasComponent({
  onGameOver,
  onLivesChange,
  onScoreChange,
  onSpawnIntervalChange,
  playerImage,
  bulletImage,
  isModalOpen = false,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onGameOverRef = useRef(onGameOver);
  const onLivesChangeRef = useRef(onLivesChange);
  const onScoreChangeRef = useRef(onScoreChange);
  const onSpawnIntervalChangeRef = useRef(onSpawnIntervalChange);
  const isModalOpenRef = useRef(isModalOpen);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
    onLivesChangeRef.current = onLivesChange;
    onScoreChangeRef.current = onScoreChange;
    onSpawnIntervalChangeRef.current = onSpawnIntervalChange;
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen, onGameOver, onLivesChange, onScoreChange, onSpawnIntervalChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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

    const hitFlashLayer = new Graphics();
    stage.addChild(hitFlashLayer);

    const playerTexture = Texture.from(playerImage);
    const bulletTexture = Texture.from(bulletImage);

    const playerSprite = new Sprite(playerTexture);
    playerSprite.anchor.set(0.5);
    playerSprite.width = PLAYER_SIZE;
    playerSprite.height = PLAYER_SIZE;
    stage.addChild(playerSprite);

    const state: GameState = {
      player: { x: app.screen.width / 2, y: app.screen.height / 2 },
      bullets: [],
      keys: {},
      gameOver: false,
      elapsedMs: 0,
      lastScoreSec: 0,
      lives: 3,
      hits: 0,
      spawnInterval: INITIAL_SPAWN_INTERVAL,
      spawnTimer: 0,
      difficultyTimer: 0,
      spawnFromTop: true,
      hitFlashRemainingMs: 0,
      firstHitSeconds: null,
      viewportWidth: app.screen.width,
      viewportHeight: app.screen.height,
    };

    onLivesChangeRef.current(3);
    onScoreChangeRef.current(0);
    onSpawnIntervalChangeRef.current(INITIAL_SPAWN_INTERVAL);

    void audioManager.init();
    let destroyed = false;
    let bgmStarted = false;

    if (!sound.exists(PIXI_BGM_ALIAS)) {
      sound.add(PIXI_BGM_ALIAS, {
        url: bgmFile,
        loop: true,
        volume: resolveBgmVolume(),
      });
    } else {
      sound.volume(PIXI_BGM_ALIAS, resolveBgmVolume());
    }

    const ensureBgmPlayback = () => {
      if (destroyed || bgmStarted) return;
      const settings = loadSettings();
      if (!settings.audio.bgmEnabled) return;

      bgmStarted = true;
      try {
        const playback = sound.play(PIXI_BGM_ALIAS, {
          loop: true,
          singleInstance: true,
          volume: resolveBgmVolume(),
        });

        if (isPromise(playback)) {
          void playback.catch(() => {
            bgmStarted = false;
          });
        }
      } catch {
        bgmStarted = false;
      }
    };

    const stopBgm = () => {
      if (sound.exists(PIXI_BGM_ALIAS)) {
        sound.stop(PIXI_BGM_ALIAS);
      }
      bgmStarted = false;
    };

    const drawBackground = (width: number, height: number) => {
      backgroundLayer.clear();
      backgroundLayer.beginFill(0x18181b);
      backgroundLayer.drawRect(0, 0, width, height);
      backgroundLayer.endFill();

      hitFlashLayer.clear();
      hitFlashLayer.beginFill(0xff0000);
      hitFlashLayer.drawRect(0, 0, width, height);
      hitFlashLayer.endFill();
      hitFlashLayer.visible = false;

      stage.hitArea = new Rectangle(0, 0, width, height);
    };

    const clampPlayer = () => {
      const maxX = state.viewportWidth - PLAYER_SIZE / 2;
      const maxY = state.viewportHeight - PLAYER_SIZE / 2;
      const minX = PLAYER_SIZE / 2;
      const minY = PLAYER_SIZE / 2;
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
      drawBackground(width, height);
      clampPlayer();
    };

    const spawnBullet = () => {
      const margin = BULLET_RADIUS * 2;
      const x = Math.random() * (state.viewportWidth - margin * 2) + margin;
      const y = state.spawnFromTop ? margin : state.viewportHeight - margin;

      const dx = state.player.x - x;
      const dy = state.player.y - y;
      const distance = Math.hypot(dx, dy) || 1;
      const vx = (dx / distance) * BULLET_SPEED;
      const vy = (dy / distance) * BULLET_SPEED;

      const bulletSprite = new Sprite(bulletTexture);
      bulletSprite.anchor.set(0.5);
      bulletSprite.width = BULLET_SIZE;
      bulletSprite.height = BULLET_SIZE;
      bulletSprite.x = x;
      bulletSprite.y = y;
      stage.addChild(bulletSprite);

      state.bullets.push({
        sprite: bulletSprite,
        x,
        y,
        vx,
        vy,
      });
      state.spawnFromTop = !state.spawnFromTop;
    };

    const removeBulletAt = (index: number) => {
      const [removed] = state.bullets.splice(index, 1);
      if (!removed) return;
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
        const finalScore = Math.floor(state.elapsedMs / 1000);
        stopBgm();
        audioManager.playGameOverSound();
        onGameOverRef.current({
          scoreSeconds: finalScore,
          hitsTaken: state.hits,
          firstHitSeconds: state.firstHitSeconds,
        });
      }
    };

    const update = (deltaTimeSec: number) => {
      if (state.gameOver || isModalOpenRef.current) return;

      const deltaMs = deltaTimeSec * 1000;
      state.elapsedMs += deltaMs;
      state.hitFlashRemainingMs = Math.max(0, state.hitFlashRemainingMs - deltaMs);

      const moveDistance = PLAYER_SPEED * deltaTimeSec;
      if (state.keys.ArrowLeft || state.keys.KeyA) state.player.x -= moveDistance;
      if (state.keys.ArrowRight || state.keys.KeyD) state.player.x += moveDistance;
      if (state.keys.ArrowUp || state.keys.KeyW) state.player.y -= moveDistance;
      if (state.keys.ArrowDown || state.keys.KeyS) state.player.y += moveDistance;
      clampPlayer();

      for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
        const bullet = state.bullets[i];
        bullet.x += bullet.vx * deltaTimeSec;
        bullet.y += bullet.vy * deltaTimeSec;
        bullet.sprite.x = bullet.x;
        bullet.sprite.y = bullet.y;

        const distance = Math.hypot(state.player.x - bullet.x, state.player.y - bullet.y);
        if (distance < BULLET_RADIUS + PLAYER_SIZE / 2) {
          removeBulletAt(i);
          triggerHit();
          if (state.gameOver) return;
          continue;
        }

        const outOfBounds =
          bullet.x < -BULLET_SIZE ||
          bullet.x > state.viewportWidth + BULLET_SIZE ||
          bullet.y < -BULLET_SIZE ||
          bullet.y > state.viewportHeight + BULLET_SIZE;

        if (outOfBounds) {
          removeBulletAt(i);
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
        spawnBullet();
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
      audioManager.resume();
      ensureBgmPlayback();
      focusCanvas();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      audioManager.resume();
      ensureBgmPlayback();
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
    };

    const ticker = () => {
      syncViewport();
      const deltaTime = Math.min(app.ticker.deltaMS / 1000, 0.05);
      update(deltaTime);
      render();
    };

    drawBackground(state.viewportWidth, state.viewportHeight);
    app.ticker.add(ticker);
    stage.on('pointerdown', handlePointerDown);
    view.addEventListener('keydown', handleKeyDown);
    view.addEventListener('keyup', handleKeyUp);
    view.addEventListener('blur', handleBlur);

    focusCanvas();
    ensureBgmPlayback();

    return () => {
      destroyed = true;
      app.ticker.remove(ticker);
      stage.off('pointerdown', handlePointerDown);
      view.removeEventListener('keydown', handleKeyDown);
      view.removeEventListener('keyup', handleKeyUp);
      view.removeEventListener('blur', handleBlur);
      state.bullets.forEach((bullet) => bullet.sprite.destroy());
      stopBgm();
      app.destroy(true, true);
    };
  }, [bulletImage, playerImage]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[320px] sm:min-h-[422px] bg-zinc-900 border-2 border-zinc-800 rounded-xl overflow-hidden cursor-none"
    />
  );
}

export default React.memo(GameCanvasComponent, (prevProps, nextProps) => {
  return (
    prevProps.playerImage === nextProps.playerImage &&
    prevProps.bulletImage === nextProps.bulletImage &&
    prevProps.isModalOpen === nextProps.isModalOpen
  );
});
