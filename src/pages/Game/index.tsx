import React, { useMemo, useState } from 'react';
import NewGamePanel from '../../components/GamePanel';
import ScoreSubmitModal from './components/ScoreSubmitModal';
import {
  applyAchievements,
  applyDailyChallengeResult,
  applyRunToProfile,
  ensureDailyChallenge,
  getBulletSkin,
  getPlayerSkin,
  saveProfile,
} from '../../gameSystem';
import { GameResult, PlayerProfile } from '../../gameSystem/types';
import { syncLocalProfileToCloud, UserIdentityProfile } from '../../services/userDataService';

interface GameProps {
  profile: PlayerProfile;
  setProfile: (profile: PlayerProfile) => void;
  setUserCountry: (country: string) => void;
  onRankingUpdate: () => void;
  isSystemMenuOpen?: boolean;
  profileIdentity: UserIdentityProfile | null;
  isProfileSetupOpen: boolean;
  identityLoading: boolean;
  onRequestProfileSetup: () => void;
}

export default function Game({
  profile,
  setProfile,
  setUserCountry,
  onRankingUpdate,
  isSystemMenuOpen = false,
  profileIdentity,
  isProfileSetupOpen,
  identityLoading,
  onRequestProfileSetup,
}: GameProps) {
  const [score, setScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [lastRunMessage, setLastRunMessage] = useState<string[]>([]);

  const playerSkin = useMemo(
    () => getPlayerSkin(profile.selectedPlayerSkinId),
    [profile.selectedPlayerSkinId]
  );
  const bulletSkin = useMemo(
    () => getBulletSkin(profile.selectedBulletSkinId),
    [profile.selectedBulletSkinId]
  );

  const handleGameOver = (result: GameResult) => {
    setScore(result.scoreSeconds);
    setIsNewHighScore(result.scoreSeconds > profile.bestScore);

    // 프로필 업데이트 (코인/통계/업적/데일리)
    let next = ensureDailyChallenge(profile);

    const { profile: afterRun, runReward } = applyRunToProfile(next, result);
    next = afterRun;

    const { profile: afterDaily, rewarded: dailyReward } = applyDailyChallengeResult(next, result.scoreSeconds);
    next = afterDaily;

    next = applyAchievements(next, result);

    saveProfile(next);
    setProfile(next);
    void syncLocalProfileToCloud(next);

    const lines: string[] = [];
    lines.push(`+${runReward} coins`);
    if (dailyReward > 0) lines.push(`+${dailyReward} coins (daily)`);
    setLastRunMessage(lines);

    setShowScoreModal(true);
  };

  const handleRestartGame = () => {
    setScore(0);
    setIsNewHighScore(false);
    setShowScoreModal(false);
    setLastRunMessage([]);
  };

  return (
    <>
      <NewGamePanel
        profile={profile}
        playerImage={playerSkin.image}
        bulletImage={bulletSkin.image}
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
        profileIdentity={profileIdentity}
        isProfileSetupOpen={isProfileSetupOpen}
        identityLoading={identityLoading}
        onRequestProfileSetup={onRequestProfileSetup}
        isNewHighScore={isNewHighScore}
      />
    </>
  );
}
