import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import PlayerStatus from './components/PlayerStatus';
import ScoreSubmitModal from './components/ScoreSubmitModal';

export default function Game() {
  const [lives, setLives] = useState(3);
  const [spawnInterval, setSpawnInterval] = useState(500);
  const [score, setScore] = useState(0);
  const [showScoreModal, setShowScoreModal] = useState(false);

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    setShowScoreModal(true);
  };

  const handleRestartGame = () => {
    setLives(3);
    setSpawnInterval(500);
    setScore(0);
    setShowScoreModal(false);
  };

  return (
    <>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        padding: 20,
        height: '600px',
        background: 'black',
        position: 'relative'
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
          onGameOver={handleGameOver}
        />
      </div>
      <ScoreSubmitModal
        score={score}
        onClose={handleRestartGame}
        isOpen={showScoreModal}
      />
    </>
  );
}
