import React, { useCallback, useEffect, useRef, useState } from 'react';
import { sound } from '@pixi/sound';
import { useTranslation } from 'react-i18next';
import GameCanvas from './GameCanvas';
import MobileJoystick from './MobileJoystick';
import { audioManager } from '../../../gameSystem/audio';
import { GameResult, GameplayModifierId, PlayerProfile } from '../../../gameSystem/types';
import lifeIcon from '../../../assets/icon_life.png';

interface NewGamePanelProps {
  profile: PlayerProfile;
  playerImage: string;
  bulletImage: string;
  onGameOver: (result: GameResult) => void;
  isModalOpen?: boolean;
  activeModifiers?: GameplayModifierId[];
  onDifficultyClick?: () => void;
  isCompactGameLayout?: boolean;
}

function resolveJoystickSize(viewportWidth: number, isTouchInput: boolean): number {
  let baseSize = 186;
  if (viewportWidth <= 360) baseSize = 132;
  else if (viewportWidth <= 420) baseSize = 146;
  else if (viewportWidth <= 520) baseSize = 160;
  else if (viewportWidth <= 680) baseSize = 174;

  return isTouchInput ? Math.round(baseSize * 1.2) : baseSize;
}

const COUNTDOWN_SECONDS = 3;
const COUNTDOWN_STEP_MS = 1000;

function primeAudioContexts() {
  const hasWebAudioSupport =
    typeof window !== 'undefined' &&
    (typeof window.AudioContext === 'function' ||
      typeof (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext === 'function');
  if (!hasWebAudioSupport || sound.useLegacy) {
    sound.resumeAll();
    return;
  }

  void audioManager.init();
  audioManager.markUserInteraction();
  const pixiAudioContext = sound.context?.audioContext;
  if (pixiAudioContext && pixiAudioContext.state === 'suspended') {
    void pixiAudioContext.resume().catch(() => {
      // Browser can reject before a valid user gesture.
    });
  }
  sound.resumeAll();
}

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

export default function NewGamePanel({
  profile,
  playerImage,
  bulletImage,
  onGameOver,
  isModalOpen = false,
  activeModifiers = [],
  onDifficultyClick,
  isCompactGameLayout = false,
}: NewGamePanelProps) {
  const { t } = useTranslation();
  const startPromptText = 'PRESS';
  const startActionText = 'ENTER';
  const [score, setScore] = useState(0);
  const [spawnInterval, setSpawnInterval] = useState(500);
  const [lives, setLives] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isTouchInput, setIsTouchInput] = useState(false);
  const [isDifficultyHovered, setIsDifficultyHovered] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(
    () => (typeof window !== 'undefined' ? window.innerWidth : 1280)
  );
  const joystickVectorRef = useRef({ x: 0, y: 0 });
  const lastTouchEndAtRef = useRef(0);
  const isCountingDown = countdown !== null;

  const handleStartRequest = useCallback(() => {
    if (gameStarted || isModalOpen || isCountingDown) return;
    joystickVectorRef.current = { x: 0, y: 0 };
    primeAudioContexts();
    setCountdown(COUNTDOWN_SECONDS);
  }, [gameStarted, isCountingDown, isModalOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat) return;
      if (gameStarted || isModalOpen || isCountingDown) return;
      event.preventDefault();
      handleStartRequest();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, handleStartRequest, isCountingDown, isModalOpen]);

  useEffect(() => {
    if (countdown === null) return;
    const timerId = window.setTimeout(() => {
      if (countdown <= 1) {
        setCountdown(null);
        setGameStarted(true);
        return;
      }
      setCountdown((prev) => (prev === null ? null : prev - 1));
    }, COUNTDOWN_STEP_MS);

    return () => window.clearTimeout(timerId);
  }, [countdown]);

  useEffect(() => {
    const detectTouchInput = () => {
      const coarsePointer =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(pointer: coarse)').matches;
      const touchPoints = typeof navigator !== 'undefined' ? navigator.maxTouchPoints > 0 : false;
      setIsTouchInput(coarsePointer || touchPoints);
      setViewportWidth(window.innerWidth);
    };

    detectTouchInput();
    window.addEventListener('resize', detectTouchInput);
    return () => window.removeEventListener('resize', detectTouchInput);
  }, []);

  const joystickSize = resolveJoystickSize(viewportWidth, isTouchInput);
  const joystickInset = viewportWidth <= 400 ? 8 : 12;

  const handleGameOver = (result: GameResult) => {
    setGameStarted(false);
    setCountdown(null);
    setScore(0);
    setSpawnInterval(500);
    joystickVectorRef.current = { x: 0, y: 0 };
    onGameOver(result);
  };

  const handleScoreChange = (newScore: number) => {
    setScore(newScore);
  };

  const handleSpawnIntervalChange = (interval: number) => {
    setSpawnInterval(interval);
  };

  const handleLivesChange = (nextLives: number) => {
    setLives(nextLives);
  };

  const handlePanelDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!gameStarted) return;
    event.preventDefault();
    event.stopPropagation();
  };

  const handlePanelTouchEndCapture = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!gameStarted) return;
    const now = Date.now();
    if (now - lastTouchEndAtRef.current < 300) {
      event.preventDefault();
      event.stopPropagation();
    }
    lastTouchEndAtRef.current = now;
  };

  const handlePanelContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!gameStarted) return;
    event.preventDefault();
  };

  const isGameRunning = gameStarted || isCountingDown;

  const containerClassName = isCompactGameLayout
    ? 'w-full h-full min-w-0 min-h-0 bg-bg-secondary border border-border-primary rounded-none p-0 sm:p-1 flex flex-col gap-2 backdrop-blur-[10px] font-primary overflow-hidden box-border select-none'
    : 'w-full h-full min-w-0 min-h-0 bg-bg-secondary border border-border-primary rounded-[20px] sm:rounded-[24px] p-3 sm:p-6 flex flex-col gap-3 sm:gap-4 backdrop-blur-[10px] font-primary overflow-hidden box-border select-none';
  const topBarClassName = isCompactGameLayout
    ? 'flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 px-2 py-2 w-full'
    : 'flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 px-2 sm:px-5 py-2 sm:py-4 w-full';
  const canvasAreaClassName = isCompactGameLayout
    ? isGameRunning
      ? 'w-full h-full min-h-0 p-0'
      : 'w-full flex-1 min-h-0 px-2 py-2'
    : isGameRunning
      ? 'w-full h-full min-h-0 p-0'
      : 'w-full flex-1 min-h-0 p-2 sm:p-[40px_20px]';
  const inGameCanvasContainerClassName = isCompactGameLayout
    ? isGameRunning
      ? 'relative w-full h-full min-h-0'
      : 'relative w-full h-full min-h-0 flex items-center justify-center'
    : isGameRunning
      ? 'relative w-full h-full min-h-0'
      : 'relative w-full h-full min-h-0';

  return (
    <div
      className={`${containerClassName} touch-manipulation [-webkit-tap-highlight-color:transparent] [-webkit-user-select:none] [-webkit-touch-callout:none]`}
      onDoubleClick={handlePanelDoubleClick}
      onTouchEndCapture={handlePanelTouchEndCapture}
      onContextMenu={handlePanelContextMenu}
    >
      <div className={topBarClassName}>
        <div className="w-full sm:w-auto rounded-2xl bg-bg-card border border-bg-card px-3 py-2 flex flex-col gap-1">
          <div className="text-text-primary font-secondary text-ui-body font-normal">
            {t('game.score')}: {score}s
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-text-primary font-secondary text-ui-body font-normal">
              {t('game.best')}: {' '}
            </span>
            <span className="text-accent-blue font-secondary text-ui-body font-bold">
              {formatTime(profile.bestScore)}
            </span>
            <span className="text-text-placeholder font-secondary text-ui-body font-normal">
              {' | '}
            </span>
            <span className="text-text-primary font-secondary text-ui-body font-normal">
              {t('game.coins')}: {' '}
            </span>
            <span className="text-rose-400 font-secondary text-ui-body font-bold">
              {profile.coins}
            </span>
          </div>
        </div>

        <div className="w-full sm:w-auto flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: lives }).map((_, index) => (
              <img
                key={`life-${index}`}
                src={lifeIcon}
                alt={t('game.lifeIconAlt')}
                className="w-9 h-9 sm:w-12 sm:h-12 object-contain"
              />
            ))}
          </div>
          <div className="text-text-disabled font-secondary text-[11px] sm:text-ui-tab font-normal whitespace-nowrap">
            {t('game.spawnInterval')}: {spawnInterval}ms
          </div>
        </div>
      </div>

      <div className={canvasAreaClassName}>
        {(!gameStarted && !isCountingDown) ? (
            <div className="h-full min-h-0 flex flex-col items-center justify-center gap-4 sm:gap-6 px-2">
              <div className="text-text-primary font-secondary text-[12px] sm:text-ui-body font-bold tracking-[2px] text-center">
                {isTouchInput ? t('game.touchPrompt', { defaultValue: 'TAP' }) : startPromptText}
              </div>

              <div
                className="w-[180px] h-[54px] sm:w-[200px] sm:h-[60px] rounded-2xl border border-[#b5fff840] bg-gradient-primary shadow-[0_0_10px_rgba(74,222,128,0.28)] hover:shadow-[0_0_14px_rgba(74,222,128,0.36)] flex justify-center items-center px-6 py-4 cursor-pointer transition-[transform,box-shadow] duration-200 hover:scale-105"
                onClick={handleStartRequest}
              >
                <div className="text-bg-primary font-secondary text-[36px] sm:text-[50px] leading-none font-black tracking-[2px] drop-shadow-[0_0_4px_rgba(255,255,255,0.35)]">
                  {isTouchInput ? t('game.start', { defaultValue: 'START' }) : startActionText}
                </div>
              </div>

              <div className="text-text-primary font-secondary text-[12px] sm:text-ui-body font-bold tracking-[2px] text-center">
                {t('game.toStart')}
              </div>

              {onDifficultyClick && (
                  <button
                  type="button"
                  onClick={onDifficultyClick}
                  onMouseEnter={() => setIsDifficultyHovered(true)}
                  onMouseLeave={() => setIsDifficultyHovered(false)}
                  className={`relative w-full max-w-[300px] sm:w-[280px] min-h-[68px] sm:h-[84px] border-[4px] border-[#46ffe0] bg-[linear-gradient(180deg,#10304a_0%,#071929_100%)] transition-[box-shadow,transform] duration-200 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#46ffe0] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary ${
                    isDifficultyHovered ? 'shadow-[0_0_16px_rgba(43,229,185,0.42)]' : 'shadow-[0_0_10px_rgba(43,229,185,0.24)]'
                  }`}
                  aria-label={t('difficultyModal.title')}
                >
                  <span className="absolute inset-[6px] sm:inset-[7px] border border-[#4ef9df] pointer-events-none" />
                  <span className="absolute left-[8px] top-[8px] w-[12px] h-[12px] border-l-2 border-t-2 border-[#5bffe7] pointer-events-none sm:left-[10px] sm:top-[10px]" />
                  <span className="absolute right-[8px] top-[8px] w-[12px] h-[12px] border-r-2 border-t-2 border-[#5bffe7] pointer-events-none sm:right-[10px] sm:top-[10px]" />
                  <span className="absolute left-[8px] bottom-[8px] w-[12px] h-[12px] border-l-2 border-b-2 border-[#5bffe7] pointer-events-none sm:left-[10px] sm:bottom-[10px]" />
                  <span className="absolute right-[8px] bottom-[8px] w-[12px] h-[12px] border-r-2 border-b-2 border-[#5bffe7] pointer-events-none sm:right-[10px] sm:bottom-[10px]" />
                  <span
                    className={`absolute inset-0 flex items-center justify-center px-2 text-center text-[#5bffe7] font-primary text-[clamp(20px,7vw,34px)] sm:text-[34px] tracking-[1px] sm:tracking-[3px] leading-tight ${
                      isDifficultyHovered
                        ? '[filter:drop-shadow(0_0_6px_rgba(91,255,231,0.34))]'
                        : '[filter:drop-shadow(0_0_4px_rgba(91,255,231,0.22))]'
                    }`}
                  >
                    {t('difficultyModal.title', { defaultValue: '난이도 변경' })}
                  </span>
                </button>
              )}

              {isTouchInput ? (
                <div className="mt-5 flex flex-col gap-2 items-center">
                  <div className="text-accent-blue font-secondary text-ui-body font-bold tracking-widest">
                    {t('game.move')}
                  </div>
                  <div className="rounded-xl bg-bg-card border border-bg-card px-4 py-2 flex justify-center items-center">
                    <div className="text-text-primary font-secondary text-ui-body font-normal">
                      {t('game.touchMove', { defaultValue: 'JOYSTICK' })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-8 sm:mt-10 flex flex-wrap justify-center gap-5 sm:gap-8 items-start">
                  <div className="flex flex-col gap-2 items-center">
                    <div className="text-accent-blue font-secondary text-ui-body font-bold tracking-widest">
                      {t('game.move')}
                    </div>
                    <div className="rounded-xl bg-bg-card border border-bg-card px-4 py-2 flex justify-center items-center">
                      <div className="text-text-primary font-secondary text-ui-body font-normal">
                        {t('game.moveKeys')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={inGameCanvasContainerClassName}>
              <GameCanvas
                onGameOver={handleGameOver}
                onLivesChange={handleLivesChange}
                onScoreChange={handleScoreChange}
                onSpawnIntervalChange={handleSpawnIntervalChange}
                playerImage={playerImage}
                bulletImage={bulletImage}
                isModalOpen={isModalOpen}
                joystickVectorRef={isTouchInput ? joystickVectorRef : undefined}
                activeModifiers={activeModifiers}
                countdown={isCountingDown ? countdown : null}
              />
            {isTouchInput && gameStarted && (
              <div
                className="absolute z-20 pointer-events-none"
                style={{
                  right: `calc(env(safe-area-inset-right, 0px) + ${joystickInset}px)`,
                  bottom: `calc(env(safe-area-inset-bottom, 0px) + ${joystickInset}px)`,
                }}
              >
                <div className="pointer-events-auto">
                  <MobileJoystick
                    size={Math.round(joystickSize * 0.5)}
                    idleOpacity={0.62}
                    activeOpacity={0.94}
                    knobTransitionMs={80}
                    onVectorChange={(vector) => {
                      joystickVectorRef.current = vector;
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
