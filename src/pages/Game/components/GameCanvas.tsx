import React, { useEffect, useRef } from 'react';
import { GameResult } from '../../../gameSystem/types';
import { loadSettings } from '../../../gameSystem/settings';
import { audioManager } from '../../../gameSystem/audio';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;
const PLAYER_SPEED = 240;
const PLAYER_SIZE = 20;
const BULLET_RADIUS = 4;
const BULLET_SPEED = 180;
const INITIAL_SPAWN_INTERVAL = 500;
const INTERVAL_DECREASE = 50;
const MIN_SPAWN_INTERVAL = 100;
const DIFFICULTY_INTERVAL = 3000;

interface GameCanvasProps {
  onGameOver: (result: GameResult) => void;
  onLivesChange: (lives: number) => void;
  onScoreChange: (score: number) => void;
  onSpawnIntervalChange: (interval: number) => void;
  playerColor: string;
  bulletColor: string;
  isModalOpen?: boolean;
}

type Bullet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type GameState = {
  player: { x: number; y: number };
  bullets: Bullet[];
  keys: { [key: string]: boolean };
  gameStarted: boolean;
  gameOver: boolean;
  startTime: number;
  lastScoreSec: number;
  lives: number;
  hits: number;
  spawnInterval: number;
  spawnTimer: number;
  difficultyTimer: number;
  isHit: boolean;
  spawnFromTop: boolean;
};

function GameCanvasComponent({
  onGameOver,
  onLivesChange,
  onScoreChange,
  onSpawnIntervalChange,
  playerColor,
  bulletColor,
  isModalOpen = false,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 콜백을 ref로 저장하여 의존성 문제 해결
  const onGameOverRef = useRef(onGameOver);
  const onLivesChangeRef = useRef(onLivesChange);
  const onScoreChangeRef = useRef(onScoreChange);
  const onSpawnIntervalChangeRef = useRef(onSpawnIntervalChange);
  
  // 최신 콜백으로 업데이트
  useEffect(() => {
    onGameOverRef.current = onGameOver;
    onLivesChangeRef.current = onLivesChange;
    onScoreChangeRef.current = onScoreChange;
    onSpawnIntervalChangeRef.current = onSpawnIntervalChange;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('⚠️ Canvas not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('⚠️ Context not found');
      return;
    }

    console.log('🎮 Game initialized');

    // 게임 상태
    const state: GameState = {
      player: { x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2, y: CANVAS_HEIGHT / 2 - PLAYER_SIZE / 2 },
      bullets: [],
      keys: {},
      gameStarted: false,
      gameOver: false,
      startTime: Date.now(),
      lastScoreSec: 0,
      lives: 3,
      hits: 0,
      spawnInterval: INITIAL_SPAWN_INTERVAL,
      spawnTimer: 0,
      difficultyTimer: 0,
      isHit: false,
      spawnFromTop: true,
    };

    let lastFrameTime = 0;
    let animationId = 0;
    let frameCount = 0;
    let lastLogTime = Date.now();

    // 오디오 초기화
    audioManager.init();

    // 게임 초기화
    const resetGame = () => {
      state.player = { x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2, y: CANVAS_HEIGHT / 2 - PLAYER_SIZE / 2 };
      state.bullets = [];
      state.keys = {};
      state.gameStarted = false;
      state.gameOver = false;
      state.startTime = Date.now();
      state.lastScoreSec = 0;
      state.lives = 3;
      state.hits = 0;
      state.spawnInterval = INITIAL_SPAWN_INTERVAL;
      state.spawnTimer = 0;
      state.difficultyTimer = 0;
      state.isHit = false;
      state.spawnFromTop = true;
      
      onLivesChangeRef.current(3);
      onScoreChangeRef.current(0);
      onSpawnIntervalChangeRef.current(INITIAL_SPAWN_INTERVAL);
    };

    // 총알 생성
    const spawnBullet = () => {
      const margin = BULLET_RADIUS * 2;
      const x = Math.random() * (CANVAS_WIDTH - margin * 2) + margin;
      const y = state.spawnFromTop ? BULLET_RADIUS * 2 : CANVAS_HEIGHT - BULLET_RADIUS * 2;

      const dx = state.player.x + PLAYER_SIZE / 2 - x;
      const dy = state.player.y + PLAYER_SIZE / 2 - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const vx = (dx / distance) * BULLET_SPEED;
      const vy = (dy / distance) * BULLET_SPEED;

      state.bullets.push({ x, y, vx, vy });
      state.spawnFromTop = !state.spawnFromTop;
      
      console.log(`🔴 Bullet spawned! Total: ${state.bullets.length}`);
    };

    // 충돌 체크
    const checkCollision = (px: number, py: number, bx: number, by: number): boolean => {
      const dx = px + PLAYER_SIZE / 2 - bx;
      const dy = py + PLAYER_SIZE / 2 - by;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < BULLET_RADIUS + PLAYER_SIZE / 2;
    };

    // 충돌 처리
    const handleCollision = () => {
      state.hits++;
      state.lives--;
      console.log(`💥 Hit! Lives remaining: ${state.lives}`);
      onLivesChangeRef.current(state.lives);

      audioManager.playHitSound();

      const settings = loadSettings();
      const flashDuration = 150 * (settings.graphics.hitFlashIntensity / 100);
      state.isHit = true;
      setTimeout(() => {
        state.isHit = false;
      }, flashDuration);

      if (state.lives <= 0) {
        state.gameOver = true;
        const finalScore = Math.floor((Date.now() - state.startTime) / 1000);
        console.log(`☠️ Game Over! Score: ${finalScore}s, Hits: ${state.hits}`);
        audioManager.stopBGM(); // BGM 중지
        audioManager.playGameOverSound();
        onGameOverRef.current({ scoreSeconds: finalScore, hitsTaken: state.hits });
      }
    };

    // 업데이트
    const update = (deltaTime: number) => {
      if (!state.gameStarted || state.gameOver) return;

      const deltaMs = deltaTime * 1000;

      // 플레이어 이동
      const moveDistance = PLAYER_SPEED * deltaTime;
      if (state.keys['ArrowLeft']) state.player.x -= moveDistance;
      if (state.keys['ArrowRight']) state.player.x += moveDistance;
      if (state.keys['ArrowUp']) state.player.y -= moveDistance;
      if (state.keys['ArrowDown']) state.player.y += moveDistance;

      state.player.x = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_SIZE, state.player.x));
      state.player.y = Math.max(0, Math.min(CANVAS_HEIGHT - PLAYER_SIZE, state.player.y));

      // 총알 이동
      state.bullets.forEach(bullet => {
        bullet.x += bullet.vx * deltaTime;
        bullet.y += bullet.vy * deltaTime;
      });

      // 충돌 체크
      for (let i = state.bullets.length - 1; i >= 0; i--) {
        const bullet = state.bullets[i];
        if (checkCollision(state.player.x, state.player.y, bullet.x, bullet.y)) {
          state.bullets.splice(i, 1);
          handleCollision();
          if (state.gameOver) return;
        }
      }

      // 화면 밖 총알 제거
      state.bullets = state.bullets.filter(
        b => b.x >= 0 && b.x <= CANVAS_WIDTH && b.y >= 0 && b.y <= CANVAS_HEIGHT
      );

      // 점수 업데이트
      const elapsedSec = Math.floor((Date.now() - state.startTime) / 1000);
      if (elapsedSec !== state.lastScoreSec) {
        state.lastScoreSec = elapsedSec;
        console.log(`⏱️ Score: ${elapsedSec}s`);
        onScoreChangeRef.current(elapsedSec);
        // TODO: 10초 또는 20초 돌파 시 효과음 추가 예정
      }

      // 난이도 증가
      state.difficultyTimer += deltaMs;
      if (state.difficultyTimer >= DIFFICULTY_INTERVAL) {
        state.difficultyTimer -= DIFFICULTY_INTERVAL;
        state.spawnInterval = Math.max(MIN_SPAWN_INTERVAL, state.spawnInterval - INTERVAL_DECREASE);
        console.log(`📈 Difficulty increased! Spawn interval: ${state.spawnInterval}ms`);
        onSpawnIntervalChangeRef.current(state.spawnInterval);
      }

      // 총알 생성
      state.spawnTimer += deltaMs;
      while (state.spawnTimer >= state.spawnInterval) {
        state.spawnTimer -= state.spawnInterval;
        spawnBullet();
      }
    };

    // 그리기
    const draw = () => {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (state.isHit) {
        const settings = loadSettings();
        const opacity = 0.5 * (settings.graphics.hitFlashIntensity / 100);
        ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      ctx.fillStyle = playerColor;
      ctx.fillRect(state.player.x, state.player.y, PLAYER_SIZE, PLAYER_SIZE);

      ctx.fillStyle = bulletColor;
      state.bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, BULLET_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!state.gameStarted && !state.gameOver) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Press ENTER to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.textAlign = 'left';
      }

      if (state.gameOver) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.font = 'bold 16px monospace';
        ctx.fillText('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 32);
        ctx.textAlign = 'left';
      }
    };

    // 게임 루프
    const gameLoop = (timestamp: number) => {
      if (!lastFrameTime) {
        lastFrameTime = timestamp;
        console.log('🎮 Game loop started');
      }

      const deltaTime = Math.min((timestamp - lastFrameTime) / 1000, 0.05);
      lastFrameTime = timestamp;

      // 업데이트 및 그리기
      update(deltaTime);
      draw();

      // FPS 로깅 (1초마다)
      frameCount++;
      const now = Date.now();
      if (now - lastLogTime >= 1000) {
        console.log(`🎮 FPS: ${frameCount} | Bullets: ${state.bullets.length} | Started: ${state.gameStarted} | GameOver: ${state.gameOver} | Lives: ${state.lives}`);
        frameCount = 0;
        lastLogTime = now;
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    // 키보드 이벤트
    const handleKeyDown = (e: KeyboardEvent) => {
      audioManager.resume();
      
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
      
      state.keys[e.key] = true;

      // 모달이 열려있을 때는 게임 시작/재시작 키를 무시
      if (isModalOpen) {
        return;
      }

      if (!state.gameStarted && !state.gameOver && e.key === 'Enter') {
        console.log('🎮 Game started!');
        state.gameStarted = true;
        state.startTime = Date.now();
        // 게임 시작 시 BGM 재생
        audioManager.playBGM();
      }

      if (state.gameOver && (e.key === 'r' || e.key === 'R' || e.key === 'ㄱ')) {
        console.log('🎮 Game reset!');
        resetGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      state.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 게임 루프 시작
    console.log('🚀 Starting game loop...');
    animationId = requestAnimationFrame(gameLoop);

    // 클린업
    return () => {
      console.log('🛑 Game cleanup');
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playerColor, bulletColor, isModalOpen]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="block mx-auto bg-zinc-900 border-2 border-zinc-800 max-w-[400px] h-[500px]"
    />
  );
}

// React.memo로 감싸서 props가 변경되지 않으면 리렌더링 방지
export default React.memo(GameCanvasComponent, (prevProps, nextProps) => {
  // playerColor와 bulletColor만 비교 (콜백 함수는 비교하지 않음)
  return prevProps.playerColor === nextProps.playerColor && 
         prevProps.bulletColor === nextProps.bulletColor;
});
