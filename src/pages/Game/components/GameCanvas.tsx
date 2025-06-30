import { useEffect, useRef, useState, useCallback } from "react";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;
const PLAYER_SPEED = 240; // 초당 240픽셀로 변경
const PLAYER_SIZE = 20;
const BULLET_RADIUS = 4;
const BULLET_SPEED = 180; // 초당 180픽셀로 변경
const INITIAL_SPAWN_INTERVAL = 500;
const INTERVAL_DECREASE = 50;
const MIN_SPAWN_INTERVAL = 100;
const DIFFICULTY_INTERVAL = 3000;

// 플레이어 시작 위치
const PLAYER_START_X = CANVAS_WIDTH / 2 - PLAYER_SIZE / 2;
const PLAYER_START_Y = CANVAS_HEIGHT / 2 - PLAYER_SIZE / 2;

interface GameCanvasProps {
  lives: number;
  setLives: (lives: number) => void;
  setSpawnIntervalStatus: (interval: number) => void;
  setScore: (score: number) => void;
  onGameOver: (finalScore: number) => void;
}

export default function GameCanvas({ lives, setLives, setSpawnIntervalStatus, setScore, onGameOver }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef({ ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false });
  const playerRef = useRef({ x: PLAYER_START_X, y: PLAYER_START_Y });
  const bulletsRef = useRef<any[]>([]);
  const startTimeRef = useRef(Date.now());
  const lastFrameTimeRef = useRef(0);
  const gameOverRef = useRef(false);
  const animationRef = useRef<number | undefined>(undefined);
  const spawnLoopRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const difficultyLoopRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const livesRef = useRef(lives);
  const isHitRef = useRef(false);
  const isTopSpawnRef = useRef(true);
  const [spawnInterval, setSpawnInterval] = useState(INITIAL_SPAWN_INTERVAL);

  function spawnSingleBullet() {
    // 화면 상단 또는 하단에서 랜덤한 X 좌표 선택
    const margin = BULLET_RADIUS * 2;
    const centerX = Math.random() * (CANVAS_WIDTH - margin * 2) + margin;
    
    // 현재 스폰 위치에 따라 Y 좌표와 각도 계산
    const centerY = isTopSpawnRef.current ? BULLET_RADIUS * 2 : CANVAS_HEIGHT - BULLET_RADIUS * 2;
    
    // 플레이어를 향해 발사되도록 각도 계산
    const targetAngle = Math.atan2(
      playerRef.current.y + PLAYER_SIZE / 2 - centerY,
      playerRef.current.x + PLAYER_SIZE / 2 - centerX
    );
    
    const bullet = {
      x: centerX,
      y: centerY,
      angle: targetAngle,
      speed: BULLET_SPEED
    };
    
    bulletsRef.current.push(bullet);
    
    // 다음 발사는 반대쪽에서 하도록 토글
    isTopSpawnRef.current = !isTopSpawnRef.current;
  }

  function checkCollision(px: number, py: number, bx: number, by: number, br: number) {
    const dx = px + PLAYER_SIZE / 2 - bx;
    const dy = py + PLAYER_SIZE / 2 - by;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < br + PLAYER_SIZE / 2;
  }

  function handleCollision() {
    isHitRef.current = true;
    setTimeout(() => {
      isHitRef.current = false;
    }, 150);
    
    if (livesRef.current > 1) {
      setLives(livesRef.current - 1);
    } else {
      gameOverRef.current = true;
      setLives(0);
      cancelAnimationFrame(animationRef.current!);
      clearInterval(spawnLoopRef.current);
      clearInterval(difficultyLoopRef.current);
      // 게임 오버 시 점수 전달
      const finalScore = Math.floor((Date.now() - startTimeRef.current) / 1000);
      onGameOver(finalScore);
    }
  }

  function update(deltaTime: number) {
    if (gameOverRef.current) return;

    const keys = keysRef.current;
    const moveDistance = PLAYER_SPEED * deltaTime;
    if (keys.ArrowLeft) playerRef.current.x -= moveDistance;
    if (keys.ArrowRight) playerRef.current.x += moveDistance;
    if (keys.ArrowUp) playerRef.current.y -= moveDistance;
    if (keys.ArrowDown) playerRef.current.y += moveDistance;

    playerRef.current.x = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_SIZE, playerRef.current.x));
    playerRef.current.y = Math.max(0, Math.min(CANVAS_HEIGHT - PLAYER_SIZE, playerRef.current.y));

    bulletsRef.current.forEach((b) => {
      const bulletDistance = BULLET_SPEED * deltaTime;
      b.x += Math.cos(b.angle) * bulletDistance;
      b.y += Math.sin(b.angle) * bulletDistance;
    });

    for (const b of bulletsRef.current) {
      if (checkCollision(playerRef.current.x, playerRef.current.y, b.x, b.y, BULLET_RADIUS)) {
        bulletsRef.current = bulletsRef.current.filter((bullet) => bullet !== b);
        handleCollision();
        return;
      }
    }

    bulletsRef.current = bulletsRef.current.filter((b) => b.x >= 0 && b.x <= CANVAS_WIDTH && b.y >= 0 && b.y <= CANVAS_HEIGHT);
  }

  function draw() {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    
    // 배경을 어두운색으로 채우기
    ctx.fillStyle = "#18181b";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 피격 시 붉은색 오버레이
    if (isHitRef.current) {
      ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 플레이어 그리기
    ctx.fillStyle = "#00f";
    ctx.fillRect(playerRef.current.x, playerRef.current.y, PLAYER_SIZE, PLAYER_SIZE);

    // 시간 업데이트
    const elapsedSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setScore(elapsedSec);

    // 총알 그리기
    ctx.fillStyle = "#f00";
    bulletsRef.current.forEach((b) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, BULLET_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });

    if (gameOverRef.current) {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 32px monospace";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.font = "bold 16px monospace";
      ctx.fillText("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 32);
      ctx.textAlign = "left";
    }
  }

  const gameLoop = useCallback((timestamp: number) => {
    if (!lastFrameTimeRef.current) {
      lastFrameTimeRef.current = timestamp;
    }
    
    const deltaTime = (timestamp - lastFrameTimeRef.current) / 1000;
    lastFrameTimeRef.current = timestamp;
    
    update(deltaTime);
    draw();
    
    if (!gameOverRef.current) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, []);

  const resetGame = useCallback(() => {
    gameOverRef.current = false;
    playerRef.current = { x: PLAYER_START_X, y: PLAYER_START_Y };
    bulletsRef.current = [];
    startTimeRef.current = Date.now();
    lastFrameTimeRef.current = 0;
    isHitRef.current = false;
    isTopSpawnRef.current = true;
    setSpawnInterval(INITIAL_SPAWN_INTERVAL);
    setLives(3);

    // 기존 인터벌 제거
    if (difficultyLoopRef.current) clearInterval(difficultyLoopRef.current);
    if (spawnLoopRef.current) clearInterval(spawnLoopRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    
    // 난이도 증가 인터벌 설정
    difficultyLoopRef.current = setInterval(() => {
      if (!gameOverRef.current) {
        setSpawnInterval(prev => Math.max(MIN_SPAWN_INTERVAL, prev - INTERVAL_DECREASE));
      }
    }, DIFFICULTY_INTERVAL);

    // 게임 루프 시작
    gameLoop(performance.now());
  }, [gameLoop, setLives]);

  // spawnInterval이 변경될 때마다 상태 업데이트
  useEffect(() => {
    setSpawnIntervalStatus(spawnInterval);
  }, [spawnInterval, setSpawnIntervalStatus]);

  // spawnInterval이 변경될 때마다 총알 생성 인터벌 재설정
  useEffect(() => {
    if (spawnLoopRef.current) {
      clearInterval(spawnLoopRef.current);
    }
    
    spawnLoopRef.current = setInterval(() => {
      if (!gameOverRef.current) {
        spawnSingleBullet();
      }
    }, spawnInterval);

    return () => {
      if (spawnLoopRef.current) {
        clearInterval(spawnLoopRef.current);
      }
    };
  }, [spawnInterval]);

  // lives 값이 변경될 때마다 ref 업데이트
  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  // 메인 게임 로직
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current[e.key as keyof typeof keysRef.current] = true;
      if (gameOverRef.current && (e.key === "r" || e.key === "ㄱ")) {
        resetGame();
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      keysRef.current[e.key as keyof typeof keysRef.current] = false;
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // 게임 시작 시 초기화
    resetGame();

    return () => {
      cancelAnimationFrame(animationRef.current!);
      clearInterval(spawnLoopRef.current);
      clearInterval(difficultyLoopRef.current);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
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
        height: 500
      }}
    />
  );
}