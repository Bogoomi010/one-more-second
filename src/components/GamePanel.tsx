import React, { useCallback, useEffect, useRef, useState } from 'react';
import { sound } from '@pixi/sound';
import { useTranslation } from 'react-i18next';
import GameCanvas from '../pages/Game/components/GameCanvas';
import MobileJoystick from '../pages/Game/components/MobileJoystick';
import countdownOneImage from '../assets/icon-countdown-one.png';
import countdownTwoImage from '../assets/icon-countdown-two.png';
import countdownThreeImage from '../assets/icon-countdown-three.png';
import { audioManager } from '../gameSystem/audio';
import { GameResult, GameplayModifierId, PlayerProfile } from '../gameSystem/types';
import lifeIcon from '../assets/icon_life.png';

interface NewGamePanelProps {
  profile: PlayerProfile;
  playerImage: string;
  bulletImage: string;
  onGameOver: (result: GameResult) => void;
  isModalOpen?: boolean;
  activeModifiers?: GameplayModifierId[];
}

function resolveJoystickSize(viewportWidth: number): number {
  if (viewportWidth <= 360) return 132;
  if (viewportWidth <= 420) return 146;
  if (viewportWidth <= 520) return 160;
  if (viewportWidth <= 680) return 174;
  return 186;
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
  audioManager.resume();
  const pixiAudioContext = sound.context?.audioContext;
  if (pixiAudioContext && pixiAudioContext.state === 'suspended') {
    void pixiAudioContext.resume().catch(() => {
      // Browser can reject before a valid user gesture.
    });
  }
  sound.resumeAll();
}

export default function NewGamePanel({
  profile,
  playerImage,
  bulletImage,
  onGameOver,
  isModalOpen = false,
  activeModifiers = [],
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

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

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

  const joystickSize = resolveJoystickSize(viewportWidth);
  const joystickInset = viewportWidth <= 400 ? 8 : 12;

  const handleGameOver = (result: GameResult) => {
    setGameStarted(false);
    setCountdown(null);
    setScore(0);
    setSpawnInterval(500);
    joystickVectorRef.current = { x: 0, y: 0 };
    onGameOver(result);
  };

  const countdownImage =
    countdown === 3
      ? countdownThreeImage
      : countdown === 2
        ? countdownTwoImage
        : countdown === 1
          ? countdownOneImage
          : null;

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

  return (
    <div
      className="w-full h-full min-w-0 min-h-0 bg-bg-secondary border border-border-primary rounded-[20px] sm:rounded-[24px] p-3 sm:p-6 flex flex-col gap-3 sm:gap-4 backdrop-blur-[10px] font-primary overflow-hidden box-border select-none"
      style={{
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
      onDoubleClick={handlePanelDoubleClick}
      onTouchEndCapture={handlePanelTouchEndCapture}
      onContextMenu={handlePanelContextMenu}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 px-2 sm:px-5 py-2 sm:py-4 w-full">
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

      <div className="w-full flex-1 min-h-0 p-2 sm:p-[40px_20px]">
        {!gameStarted ? (
          isCountingDown ? (
            <div className="h-full min-h-[320px] sm:min-h-[422px] flex items-center justify-center px-2">
              {countdownImage && (
                <img
                  src={countdownImage}
                  alt={`Countdown ${countdown}`}
                  className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] object-contain"
                />
              )}
            </div>
          ) : (
            <div className="h-full min-h-[320px] sm:min-h-[422px] flex flex-col items-center justify-center gap-4 sm:gap-6 px-2">
              <div className="text-text-primary font-secondary text-[12px] sm:text-ui-body font-bold tracking-[2px] text-center">
                {isTouchInput ? t('game.touchPrompt', { defaultValue: 'TAP' }) : startPromptText}
              </div>

              <div
                className="w-[180px] h-[54px] sm:w-[200px] sm:h-[60px] rounded-2xl bg-gradient-primary flex justify-center items-center px-6 py-4 cursor-pointer transition-transform duration-200 hover:scale-105"
                onClick={handleStartRequest}
              >
                <div className="text-bg-primary font-secondary text-[36px] sm:text-[50px] leading-none font-black tracking-[2px]">
                  {isTouchInput ? t('game.start', { defaultValue: 'START' }) : startActionText}
                </div>
              </div>

              <div className="text-text-primary font-secondary text-[12px] sm:text-ui-body font-bold tracking-[2px] text-center">
                {t('game.toStart')}
              </div>

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
          )
        ) : (
          <div className="relative w-full h-full min-h-[320px] sm:min-h-[422px]">
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
            />
            {isTouchInput && (
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
