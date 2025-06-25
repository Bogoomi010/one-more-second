import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import PlayerStatus from './components/PlayerStatus';

export default function Game() {
  const [lives, setLives] = useState(3);
  const [spawnInterval, setSpawnInterval] = useState(500);
  const [score, setScore] = useState(0);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20,
      padding: 20,
      height: '600px',
      background: 'black'
    }}>
      <PlayerStatus
        lives={lives}
        spawnInterval={spawnInterval}
        score={score}
      />
      <GameCanvas
        lives={lives}
        setLives={setLives}
        setSpawnIntervalStatus={setSpawnInterval}
        setScore={setScore}
      />
    </div>
  );
}
