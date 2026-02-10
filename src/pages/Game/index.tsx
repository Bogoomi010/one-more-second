import React, { useMemo, useState } from 'react';
import NewGamePanel from './components/NewGamePanel';
import ScoreSubmitModal from './components/ScoreSubmitModal';
import {
  applyAchievements,
  applyDailyChallengeResult,
  applyRunToProfile,
  ensureDailyChallenge,
  getSkin,
  saveProfile,
} from '../../gameSystem';
import { GameResult, PlayerProfile } from '../../gameSystem/types';

interface GameProps {
  profile: PlayerProfile;
  setProfile: (profile: PlayerProfile) => void;
  setUserCountry: (country: string) => void;
  onRankingUpdate: () => void;
  isSystemMenuOpen?: boolean;
}

export default function Game({ profile, setProfile, setUserCountry, onRankingUpdate, isSystemMenuOpen = false }: GameProps) {
  const [score, setScore] = useState(0);
  const [showScoreModal, setShowScoreModal] = useState(false);
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
    lines.push(`+${runReward} coins`);
    if (dailyReward > 0) lines.push(`+${dailyReward} coins (daily)`);
    setLastRunMessage(lines);

    setShowScoreModal(true);
  };

  const handleRestartGame = () => {
    setScore(0);
    setShowScoreModal(false);
    setLastRunMessage([]);
  };

  return (
    <>
      <NewGamePanel
        profile={profile}
        playerColor={skin.playerColor}
        bulletColor={skin.bulletColor}
        onGameOver={handleGameOver}
        isModalOpen={showScoreModal || isSystemMenuOpen}
      />

      <ScoreSubmitModal
        score={score}
        timePlayed={score}
        onClose={handleRestartGame}
        isOpen={showScoreModal}
        systemLines={lastRunMessage}
        onCountrySelect={setUserCountry}
        onRankingUpdate={onRankingUpdate}
      />
    </>
  );
}
