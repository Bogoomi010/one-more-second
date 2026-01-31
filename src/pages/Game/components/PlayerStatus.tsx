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
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: 400,
      gap: 12,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ color: '#fff', fontFamily: 'monospace' }}>
          Score: {score}s
        </div>
        <div style={{ color: '#a1a1aa', fontFamily: 'monospace', fontSize: 12 }}>
          Best: {bestScore}s · Coins: {coins}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#fff', fontFamily: 'monospace' }}>Lives:</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: lives }).map((_, index) => (
              <span key={index} style={{ color: '#f44', fontSize: 18 }}>♥</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: 12 }}>
            Interval: {spawnInterval}ms
          </div>
          <button
            onClick={onOpenMenu}
            style={{
              padding: '6px 8px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            메뉴
          </button>
        </div>
      </div>
    </div>
  );
}
