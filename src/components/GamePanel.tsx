import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import GameCanvas from '../pages/Game/components/GameCanvas';
import { GameResult } from '../gameSystem/types';
import { PlayerProfile } from '../gameSystem/types';
import lifeIcon from '../assets/icon_life.png';

interface NewGamePanelProps {
  profile: PlayerProfile;
  playerImage: string;
  bulletImage: string;
  onGameOver: (result: GameResult) => void;
  isModalOpen?: boolean;
}

export default function NewGamePanel({
  profile,
  playerImage,
  bulletImage,
  onGameOver,
  isModalOpen = false,
}: NewGamePanelProps) {
  const { t } = useTranslation();
  const [score, setScore] = useState(0);
  const [spawnInterval, setSpawnInterval] = useState(500);
  const [lives, setLives] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // 게임 시작 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted && !isModalOpen && e.key === 'Enter') {
        setGameStarted(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, isModalOpen]);

  const handleGameOver = (result: GameResult) => {
    setGameStarted(false);
    setScore(0);
    setSpawnInterval(500);
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

  return (
    <div className="w-full h-full min-w-0 min-h-0 bg-bg-secondary border border-border-primary rounded-[24px] p-6 flex flex-col gap-4 backdrop-blur-[10px] font-primary overflow-hidden box-border">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-5 py-4 w-full">
        {/* Stats Panel */}
        <div className="rounded-2xl bg-bg-card border border-bg-card px-3 py-2 flex flex-col gap-1">
          <div className="text-text-primary font-secondary text-ui-body font-normal">
            {t('game.score')}: {score}s
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-primary font-secondary text-ui-body font-normal">
              {t('game.best')}: {' '}
            </span>
            <span className="text-accent-blue font-secondary text-ui-body font-bold">
              {formatTime(profile.bestScore)}
            </span>
            <span className="text-text-placeholder font-secondary text-ui-body font-normal">
              {' '}•{' '}
            </span>
            <span className="text-text-primary font-secondary text-ui-body font-normal">
              {t('game.coins')}: {' '}
            </span>
            <span className="text-rose-400 font-secondary text-ui-body font-bold">
              {profile.coins}
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-col items-end justify-center gap-1">
          <div className="flex items-center justify-center">
            {Array.from({ length: lives }).map((_, index) => (
              <img
                key={`life-${index}`}
                src={lifeIcon}
                alt={t('game.lifeIconAlt')}
                className="w-12 h-12 object-contain"
              />
            ))}
          </div>
          <div className="text-text-disabled font-secondary text-ui-tab font-normal">
            {t('game.spawnInterval')}: {spawnInterval}ms
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full flex-1 min-h-0 p-[24px_12px] sm:p-[40px_20px]">
        {!gameStarted ? (
          <div className="h-full min-h-[360px] sm:min-h-[422px] flex flex-col items-center justify-center gap-6">
            {/* Press Text */}
            <div className="text-text-primary font-secondary text-ui-body font-bold tracking-[2px]">
              {t('game.press')}
            </div>

            {/* Enter Button */}
            <div
              className="w-[200px] h-[60px] rounded-2xl bg-gradient-primary flex justify-center items-center px-6 py-4 cursor-pointer transition-transform duration-200 hover:scale-105"
              onClick={() => setGameStarted(true)}
            >
              <div className="text-bg-primary font-secondary text-[50px] leading-none font-black tracking-[2px]">
                {t('game.enter')}
              </div>
            </div>

            {/* To Start Text */}
            <div className="text-text-primary font-secondary text-ui-body font-bold tracking-[2px]">
              {t('game.toStart')}
            </div>
            
            {/* Controls Row */}
            <div className="mt-10 flex gap-8 items-start">
              {/* Move Control */}
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

              {/* Slowmo Control */}
              <div className="flex flex-col gap-2 items-center">
                <div className="text-rose-400 font-secondary text-ui-body font-bold tracking-widest">
                  {t('game.slowmo')}
                </div>
                <div className="rounded-xl bg-bg-card border border-bg-card px-4 py-2 flex justify-center items-center">
                  <div className="text-text-primary font-secondary text-ui-body font-normal">
                    {t('game.slowmoKey')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full min-h-[360px] sm:min-h-[422px]">
            <GameCanvas
              onGameOver={handleGameOver}
              onLivesChange={handleLivesChange}
              onScoreChange={handleScoreChange}
              onSpawnIntervalChange={handleSpawnIntervalChange}
              playerImage={playerImage}
              bulletImage={bulletImage}
              isModalOpen={isModalOpen}
            />
          </div>
        )}
      </div>
    </div>
  );
}
