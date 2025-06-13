import React from 'react';

interface PlayerStatusProps {
  score?: number;
  lives?: number;
  spawnInterval?: number;
}

export default function PlayerStatus({ score = 0, lives = 3, spawnInterval = 500 }: PlayerStatusProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 120
    }}>
      <div style={{ color: '#fff', fontFamily: 'monospace', marginBottom: 8 }}>
        Score: {score}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ color: '#fff', fontFamily: 'monospace' }}>Lives:</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: lives }).map((_, index) => (
            <span key={index} style={{ color: '#f44', fontSize: 20 }}>♥</span>
          ))}
        </div>
      </div>
      <div style={{ color: '#fff', fontFamily: 'monospace' }}>
        Interval: {spawnInterval}ms
      </div>
    </div>
  );
} 