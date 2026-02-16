import React from 'react';

interface PlayerStatusProps {
  score?: number;
  lives?: number;
  spawnInterval?: number;
  coins?: number;
  bestScore?: number;
  onOpenMenu?: () => void;
}

export default function PlayerStatus({
  score = 0,
  lives = 3,
  spawnInterval = 500,
  coins = 0,
  bestScore = 0,
  onOpenMenu,
}: PlayerStatusProps) {
  return (
    <div className="flex flex-row items-center justify-between w-[400px] gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="text-text-primary font-secondary">
          Score: {score}s
        </div>
        <div className="text-text-placeholder font-secondary text-[12px]">
          Best: {bestScore}s · Coins: {coins}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 items-end">
        <div className="flex items-center gap-2">
          <span className="text-text-primary font-secondary">Lives:</span>
          <div className="flex gap-1">
            {Array.from({ length: lives }).map((_, index) => (
              <span key={index} className="text-[#f44] text-[18px]">♥</span>
            ))}
          </div>
        </div>
        <div className="flex gap-2.5 items-center">
          <div className="text-text-primary font-secondary text-[12px]">
            Interval: {spawnInterval}ms
          </div>
          <button
            onClick={onOpenMenu}
            className="px-2 py-1.5 rounded-[10px] border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.06)] text-text-primary text-[12px] cursor-pointer font-[Montserrat,_-apple-system,_BlinkMacSystemFont,_sans-serif]"
          >
            메뉴
          </button>
        </div>
      </div>
    </div>
  );
}
