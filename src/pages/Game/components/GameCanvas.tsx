import { useCallback, useEffect, useRef } from 'react';
import { GameResult } from '../../../gameSystem/types';

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

const PLAYER_START_X = CANVAS_WIDTH / 2 - PLAYER_SIZE / 2;
const PLAYER_START_Y = CANVAS_HEIGHT / 2 - PLAYER_SIZE / 2;

interface GameCanvasProps {
  lives: number;
  setLives: (lives: number) => void;
  setSpawnIntervalStatus: (interval: number) => void;
  setScore: (score: number) => void;
  onGameOver: (result: GameResult) => void;
  playerColor: string;
  bulletColor: string;
}

type Bullet = {
  x: number;
  y: number;
  angle: number;
  speed: number;
};

export default function GameCanvas({
  lives,
  setLives,
  setSpawnIntervalStatus,
  setScore,
  onGameOver,
  playerColor,
  bulletColor,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const keysRef = useRef({ ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false });
  const playerRef = useRef({ x: PLAYER_START_X, y: PLAYER_START_Y });
  const bulletsRef = useRef<Bullet[]>([]);

  const startTimeRef = useRef(Date.now());
  const lastFrameTimeRef = useRef(0);
  const lastScoreSecRef = useRef<number>(0);

  const gameOverRef = useRef(false);
  const animationRef = useRef<number | undefined>(undefined);

  const livesRef = useRef(lives);
  const hitsRef = useRef(0);

  const isHitRef = useRef(false);
  const isTopSpawnRef = useRef(true);

  // 색상/콜백은 부모 rerender에 의해 identity가 바뀌어도 루프가 리셋되지 않도록 ref로 보관
  const playerColorRef = useRef(playerColor);
  const bulletColorRef = useRef(bulletColor);
  const onGameOverRef = useRef(onGameOver);
  const setLivesRef = useRef(setLives);
  const setScoreRef = useRef(setScore);
  const setSpawnIntervalStatusRef = useRef(setSpawnIntervalStatus);

  useEffect(() => {
    playerColorRef.current = playerColor;
  }, [playerColor]);
  useEffect(() => {
    bulletColorRef.current = bulletColor;
  }, [bulletColor]);
  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);
  useEffect(() => {
    setLivesRef.current = setLives;
  }, [setLives]);
  useEffect(() => {
    setScoreRef.current = setScore;
  }, [setScore]);
  useEffect(() => {
    setSpawnIntervalStatusRef.current = setSpawnIntervalStatus;
  }, [setSpawnIntervalStatus]);

  // 스폰/난이도는 setInterval 대신 rAF 기반 누적 시간으로 처리 → 모니터 주사율/프레임 드랍에 덜 민감
  const spawnIntervalMsRef = useRef(INITIAL_SPAWN_INTERVAL);
  const spawnAccMsRef = useRef(0);
  const difficultyAccMsRef = useRef(0);

  function spawnSingleBullet() {
    const margin = BULLET_RADIUS * 2;
    const centerX = Math.random() * (CANVAS_WIDTH - margin * 2) + margin;

    const centerY = isTopSpawnRef.current ? BULLET_RADIUS * 2 : CANVAS_HEIGHT - BULLET_RADIUS * 2;

    const targetAngle = Math.atan2(
      playerRef.current.y + PLAYER_SIZE / 2 - centerY,
      playerRef.current.x + PLAYER_SIZE / 2 - centerX
    );

    const bullet: Bullet = {
      x: centerX,
      y: centerY,
      angle: targetAngle,
      speed: BULLET_SPEED,
    };

    bulletsRef.current.push(bullet);
    isTopSpawnRef.current = !isTopSpawnRef.current;
  }

  function checkCollision(px: number, py: number, bx: number, by: number, br: number) {
    const dx = px + PLAYER_SIZE / 2 - bx;
    const dy = py + PLAYER_SIZE / 2 - by;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < br + PLAYER_SIZE / 2;
  }

  function handleCollision() {
    hitsRef.current += 1;

    isHitRef.current = true;
    setTimeout(() => {
      isHitRef.current = false;
    }, 150);

    if (livesRef.current > 1) {
      setLivesRef.current(livesRef.current - 1);
      return;
    }

    // game over
    gameOverRef.current = true;
    setLivesRef.current(0);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    const finalScore = Math.floor((Date.now() - startTimeRef.current) / 1000);
    onGameOverRef.current({ scoreSeconds: finalScore, hitsTaken: hitsRef.current });
  }

  const update = useCallback((deltaTimeSec: number) => {
    if (gameOverRef.current) return;

    // movement
    const keys = keysRef.current;
    const moveDistance = PLAYER_SPEED * deltaTimeSec;
    if (keys.ArrowLeft) playerRef.current.x -= moveDistance;
    if (keys.ArrowRight) playerRef.current.x += moveDistance;
    if (keys.ArrowUp) playerRef.current.y -= moveDistance;
    if (keys.ArrowDown) playerRef.current.y += moveDistance;

    playerRef.current.x = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_SIZE, playerRef.current.x));
    playerRef.current.y = Math.max(0, Math.min(CANVAS_HEIGHT - PLAYER_SIZE, playerRef.current.y));

    // bullets update
    bulletsRef.current.forEach((b) => {
      const bulletDistance = b.speed * deltaTimeSec;
      b.x += Math.cos(b.angle) * bulletDistance;
      b.y += Math.sin(b.angle) * bulletDistance;
    });

    // collision
    for (const b of bulletsRef.current) {
      if (checkCollision(playerRef.current.x, playerRef.current.y, b.x, b.y, BULLET_RADIUS)) {
        bulletsRef.current = bulletsRef.current.filter((bullet) => bullet !== b);
        handleCollision();
        return;
      }
    }

    // cull
    bulletsRef.current = bulletsRef.current.filter(
      (b) => b.x >= 0 && b.x <= CANVAS_WIDTH && b.y >= 0 && b.y <= CANVAS_HEIGHT
    );

    // score (초 단위로만 state 업데이트해서 불필요한 rerender 방지)
    const elapsedSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
    if (elapsedSec !== lastScoreSecRef.current) {
      lastScoreSecRef.current = elapsedSec;
      setScoreRef.current(elapsedSec);
    }

    // difficulty + spawn (time-based)
    const deltaMs = deltaTimeSec * 1000;
    spawnAccMsRef.current += deltaMs;
    difficultyAccMsRef.current += deltaMs;

    while (difficultyAccMsRef.current >= DIFFICULTY_INTERVAL) {
      difficultyAccMsRef.current -= DIFFICULTY_INTERVAL;
      spawnIntervalMsRef.current = Math.max(MIN_SPAWN_INTERVAL, spawnIntervalMsRef.current - INTERVAL_DECREASE);
      const nextInterval = spawnIntervalMsRef.current;
      setSpawnIntervalStatusRef.current(nextInterval);
    }

    while (spawnAccMsRef.current >= spawnIntervalMsRef.current) {
      spawnAccMsRef.current -= spawnIntervalMsRef.current;
      spawnSingleBullet();
    }
  }, []);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // background
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // hit overlay
    if (isHitRef.current) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // player
    ctx.fillStyle = playerColorRef.current;
    ctx.fillRect(playerRef.current.x, playerRef.current.y, PLAYER_SIZE, PLAYER_SIZE);

    // bullets
    ctx.fillStyle = bulletColorRef.current;
    bulletsRef.current.forEach((b) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, BULLET_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });

    if (gameOverRef.current) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.font = 'bold 16px monospace';
      ctx.fillText('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 32);
      ctx.textAlign = 'left';
    }
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    if (!lastFrameTimeRef.current) {
      lastFrameTimeRef.current = timestamp;
    }

    const deltaTimeSec = (timestamp - lastFrameTimeRef.current) / 1000;
    lastFrameTimeRef.current = timestamp;

    // 탭 전환 등으로 delta가 너무 커졌을 때 폭주 방지
    const clampedDelta = Math.min(deltaTimeSec, 0.05);

    update(clampedDelta);
    draw();

    if (!gameOverRef.current) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [draw, update]);

  const resetGame = useCallback(() => {
    gameOverRef.current = false;
    playerRef.current = { x: PLAYER_START_X, y: PLAYER_START_Y };
    bulletsRef.current = [];

    startTimeRef.current = Date.now();
    lastFrameTimeRef.current = 0;
    lastScoreSecRef.current = 0;

    isHitRef.current = false;
    isTopSpawnRef.current = true;

    hitsRef.current = 0;
    spawnIntervalMsRef.current = INITIAL_SPAWN_INTERVAL;
    spawnAccMsRef.current = 0;
    difficultyAccMsRef.current = 0;
    setSpawnIntervalStatusRef.current(INITIAL_SPAWN_INTERVAL);

    setLivesRef.current(3);

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current[e.key as keyof typeof keysRef.current] = true;
      if (gameOverRef.current && (e.key === 'r' || e.key === 'ㄱ')) {
        resetGame();
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      keysRef.current[e.key as keyof typeof keysRef.current] = false;
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    resetGame();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetGame]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        display: 'block',
        margin: '0 auto',
        background: '#18181b',
        border: '2px solid #222',
        maxWidth: 400,
        height: 500,
      }}
    />
  );
}
