import React, { useMemo, useState } from 'react';
import NewGamePanel from './components/GamePanel';
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
import { GameResult, GameplayModifierId, PlayerProfile } from '../../gameSystem/types';
import { syncLocalProfileToCloud, UserIdentityProfile } from '../../services/userDataService';
import { normalizeIntegerScore, SCORE_LIMITS } from '../../utils/validation';

interface GameProps {
  profile: PlayerProfile;
  setProfile: (profile: PlayerProfile) => void;
  setUserCountry: (country: string) => void;
  onRankingUpdate: () => void;
  isSystemMenuOpen?: boolean;
  activeModifiers?: GameplayModifierId[];
  onDifficultyClick?: () => void;
  isCompactGameLayout?: boolean;
  profileIdentity: UserIdentityProfile | null;
  isProfileSetupOpen: boolean;
  identityLoading: boolean;
  onRequestProfileSetup: () => void;
  onAchievementsUnlocked?: (achievementIds: string[]) => void;
}

export default function Game({
  profile,
  setProfile,
  setUserCountry,
  onRankingUpdate,
  isSystemMenuOpen = false,
  activeModifiers = [],
  onDifficultyClick,
  isCompactGameLayout = false,
  profileIdentity,
  isProfileSetupOpen,
  identityLoading,
  onRequestProfileSetup,
  onAchievementsUnlocked,
}: GameProps) {
  const [score, setScore] = useState(0);
  const [normalScore, setNormalScore] = useState(0);
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
    const finalRunScore = normalizeIntegerScore(result.finalScore ?? result.scoreSeconds, {
      min: 0,
      max: SCORE_LIMITS.maxScore,
    });
    const baseRunScore = normalizeIntegerScore(result.baseScore ?? result.scoreSeconds, {
      min: 0,
      max: SCORE_LIMITS.maxNormalScore,
    });
    setScore(finalRunScore);
    setNormalScore(baseRunScore);
    setIsNewHighScore(finalRunScore > profile.bestScore);

    // 프로필 업데이트 (코인/통계/업적/데일리)
    const beforeAchievementIds = new Set(Object.keys(profile.achievements));
    let next = ensureDailyChallenge(profile);

    const { profile: afterRun, runReward } = applyRunToProfile(next, result);
    next = afterRun;

    const { profile: afterDaily, rewarded: dailyReward } = applyDailyChallengeResult(next, result.scoreSeconds);
    next = afterDaily;

    const coinsBeforeAchievementRewards = next.coins;
    next = applyAchievements(next, result, coinsBeforeAchievementRewards);
    const unlockedAchievementIds = Object.keys(next.achievements).filter(
      (id) => !beforeAchievementIds.has(id)
    );
    const achievementReward = Math.max(0, next.coins - coinsBeforeAchievementRewards);
    if (unlockedAchievementIds.length > 0) {
      onAchievementsUnlocked?.(unlockedAchievementIds);
    }

    saveProfile(next);
    setProfile(next);
    void syncLocalProfileToCloud(next, { unlockedAchievementIds });

    const lines: string[] = [];
    lines.push(`+${runReward} coins`);
    if (dailyReward > 0) lines.push(`+${dailyReward} coins (daily)`);
    if (achievementReward > 0) lines.push(`+${achievementReward} coins (achievements)`);
    setLastRunMessage(lines);

    setShowScoreModal(true);
  };

  const handleRestartGame = () => {
    setScore(0);
    setNormalScore(0);
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
        activeModifiers={activeModifiers}
        onDifficultyClick={onDifficultyClick}
        isCompactGameLayout={isCompactGameLayout}
      />

      <ScoreSubmitModal
        score={score}
        timePlayed={normalScore}
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
