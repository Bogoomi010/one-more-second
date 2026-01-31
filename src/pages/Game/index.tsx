import React, { useMemo, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import PlayerStatus from './components/PlayerStatus';
import ScoreSubmitModal from './components/ScoreSubmitModal';
import SystemMenuModal from './components/SystemMenuModal';
import {
  applyAchievements,
  applyDailyChallengeResult,
  applyRunToProfile,
  ensureDailyChallenge,
  getSkin,
  loadProfile,
  saveProfile,
} from '../../gameSystem';
import { GameResult, PlayerProfile } from '../../gameSystem/types';

export default function Game() {
  const [lives, setLives] = useState(3);
  const [spawnInterval, setSpawnInterval] = useState(500);
  const [score, setScore] = useState(0);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile>(() => ensureDailyChallenge(loadProfile()));
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [lastRunMessage, setLastRunMessage] = useState<string[]>([]);

  const skin = useMemo(() => getSkin(profile.selectedSkinId), [profile.selectedSkinId]);

  const handleGameOver = (result: GameResult) => {
    setScore(result.scoreSeconds);

    // 프로필 업데이트 (코인/통계/업적/데일리)
    let next = ensureDailyChallenge(profile);

    const { profile: afterRun, runReward } = applyRunToProfile(next, result);
    next = afterRun;

    const { profile: afterDaily, rewarded: dailyReward } = applyDailyChallengeResult(next, result.scoreSeconds);
    next = afterDaily;

    next = applyAchievements(next, result);

    saveProfile(next);
    setProfile(next);

    const lines: string[] = [];
    lines.push(`+${runReward} coins (run)`);
    if (dailyReward > 0) lines.push(`+${dailyReward} coins (daily)`);
    setLastRunMessage(lines);

    setShowScoreModal(true);
  };

  const handleRestartGame = () => {
    setLives(3);
    setSpawnInterval(500);
    setScore(0);
    setShowScoreModal(false);
    setLastRunMessage([]);
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          padding: 20,
          height: '600px',
          background: 'black',
          position: 'relative',
        }}
      >
        <PlayerStatus
          lives={lives}
          spawnInterval={spawnInterval}
          score={score}
          coins={profile.coins}
          bestScore={profile.bestScore}
          onOpenMenu={() => setSystemMenuOpen(true)}
        />

        <GameCanvas
          lives={lives}
          setLives={setLives}
          setSpawnIntervalStatus={setSpawnInterval}
          setScore={setScore}
          onGameOver={handleGameOver}
          playerColor={skin.playerColor}
          bulletColor={skin.bulletColor}
        />
      </div>

      <SystemMenuModal
        isOpen={systemMenuOpen}
        onClose={() => setSystemMenuOpen(false)}
        profile={profile}
        setProfile={setProfile}
      />

      <ScoreSubmitModal
        score={score}
        onClose={handleRestartGame}
        isOpen={showScoreModal}
        systemLines={lastRunMessage}
      />
    </>
  );
}
