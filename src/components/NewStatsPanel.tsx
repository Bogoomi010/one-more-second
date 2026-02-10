import React, { useState, useEffect } from 'react';
import { PlayerProfile } from '../gameSystem/types';
import { ACHIEVEMENTS } from '../gameSystem/achievements';

interface NewStatsPanelProps {
  profile: PlayerProfile;
}

type TabType = 'stats' | 'trophy';

export default function NewStatsPanel({ profile }: NewStatsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const unlockedAchievements = ACHIEVEMENTS.filter((ach) => profile.achievements[ach.id]);
  const achievementProgress = (unlockedAchievements.length / ACHIEVEMENTS.length) * 100;

  // Daily challenge 남은 시간 계산
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining(`${hours}:${String(minutes).padStart(2, '0')} REMAINING`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toFixed(1)}s`;
  };

  const formatBestTime = (seconds: number): { number: string; unit: string } => {
    if (seconds < 60) {
      return { number: seconds.toFixed(1), unit: 's' };
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return { number: `${mins}.${Math.floor(secs / 10)}`, unit: 'm' };
  };

  const bestTime = formatBestTime(profile.bestScore);
  const avgSurvival = Math.floor(profile.totalSecondsSurvived / Math.max(1, profile.totalRuns));

  // Daily challenge 진행률 계산
  const challengeProgress = Math.min((profile.bestScore / profile.dailyChallenge.targetSeconds) * 100, 100);

  return (
    <div className="w-full max-w-80 bg-bg-secondary border border-border-primary rounded-[24px] p-6 flex flex-col gap-4 backdrop-blur-[10px] font-primary">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-ui-title font-tertiary">📈</span>
        <h2 className="m-0 text-ui-title font-bold text-text-primary font-primary">
          Stats & Achievements
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1.5 bg-bg-card rounded-2xl">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-2 rounded-xl border-none cursor-pointer text-ui-tab font-bold transition-all duration-200 font-primary ${
            activeTab === 'stats'
              ? 'bg-accent-blue text-bg-primary'
              : 'bg-transparent text-text-disabled'
          }`}
        >
          Stats
        </button>
        <button
          onClick={() => setActiveTab('trophy')}
          className={`flex-1 py-2 rounded-xl border-none cursor-pointer text-ui-tab font-bold transition-all duration-200 font-primary ${
            activeTab === 'trophy'
              ? 'bg-accent-blue text-bg-primary'
              : 'bg-transparent text-text-disabled'
          }`}
        >
          Trophy ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'stats' ? (
        <>
          {/* PERSONAL BEST Card */}
          <div className="rounded-2xl p-[14px] bg-transparent border border-border-primary flex flex-col gap-2">
            <div className="text-ui-meta font-black text-accent-green font-secondary tracking-wide">
              PERSONAL BEST
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-ui-value-hero font-bold text-text-primary font-secondary">
                {bestTime.number}
              </span>
              <span className="text-ui-value font-normal text-accent-blue font-secondary">
                {bestTime.unit}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="flex flex-col gap-2.5">
            {/* Row 1 */}
            <div className="flex gap-4">
              {/* 총 플레이 횟수 */}
              <div className="flex-1 rounded-2xl p-2 bg-bg-card border border-bg-card flex flex-col gap-2">
                <div className="text-ui-label font-black text-text-placeholder font-secondary tracking-wide">
                  총 플레이 횟수
                </div>
                <div className="text-ui-value font-bold text-accent-green font-secondary">
                  {profile.totalRuns}회
                </div>
              </div>

              {/* 보유 코인 */}
              <div className="flex-1 rounded-2xl p-2 bg-bg-card border border-bg-card flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-ui-icon font-tertiary">💎</span>
                  <div className="text-ui-label font-black text-text-placeholder font-secondary tracking-wide">
                    보유 코인
                  </div>
                </div>
                <div className="text-ui-value font-bold text-rose-400 font-secondary">
                  {profile.coins}
                </div>
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex gap-4">
              {/* 총 생존 시간 */}
              <div className="flex-1 rounded-2xl p-2 bg-bg-card border border-bg-card flex flex-col gap-2">
                <div className="text-ui-label font-black text-text-placeholder font-secondary tracking-wide">
                  총 생존 시간
                </div>
                <div className="text-ui-value font-bold text-accent-blue font-secondary">
                  {formatTime(profile.totalSecondsSurvived)}
                </div>
              </div>

              {/* 평균 생존 */}
              <div className="flex-1 rounded-2xl p-2 bg-bg-card border border-bg-card flex flex-col gap-2">
                <div className="text-ui-label font-black text-text-placeholder font-secondary tracking-wide">
                  평균 생존
                </div>
                <div className="text-ui-value font-bold text-text-primary font-secondary">
                  {formatTime(avgSurvival)}
                </div>
              </div>
            </div>

            {/* Row 3 */}
            <div className="flex gap-4">
              {/* 보유 스킨 */}
              <div className="flex-1 rounded-2xl p-2 bg-bg-card border border-bg-card flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-ui-icon font-tertiary">🧠</span>
                  <div className="text-ui-label font-black text-text-placeholder font-secondary tracking-wide">
                    보유 스킨
                  </div>
                </div>
                <div className="text-ui-value font-bold text-text-primary">
                  <span className="font-secondary">{profile.ownedSkins.length}</span>
                  <span className="font-primary">개</span>
                </div>
              </div>

              {/* 업적 달성 */}
              <div className="flex-1 rounded-2xl p-2 bg-bg-card border border-bg-card flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-ui-icon font-tertiary">🏆</span>
                  <div className="text-ui-label font-black text-text-placeholder font-secondary tracking-wide">
                    업적 달성
                  </div>
                </div>
                <div className="text-ui-value font-bold text-text-primary font-secondary">
                  {unlockedAchievements.length}/{ACHIEVEMENTS.length}
                </div>
              </div>
            </div>
          </div>

          {/* DAILY CHALLENGE Card */}
          <div className="rounded-2xl p-2.5 bg-transparent border-4 border-accent-blue flex flex-col gap-1.5">
            {/* Header */}
            <div className="flex items-center gap-2">
              <span className="text-ui-icon-lg font-tertiary">🛡️</span>
              <div className="text-ui-meta font-black text-accent-blue font-secondary tracking-wide">
                DAILY CHALLENGE
              </div>
            </div>

            {/* Description */}
            <div className="text-ui-body font-bold text-text-secondary font-primary">
              Survive {profile.dailyChallenge.targetSeconds}s in one run
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center">
              {/* Reward Badge */}
              <div className="rounded-[4px] px-2 py-1 bg-accent-green-alpha border border-[#4ade8033]">
                <div className="text-ui-label font-black text-accent-green font-secondary tracking-wide">
                  REWARD: {profile.dailyChallenge.rewardCoins} COINS
                </div>
              </div>

              {/* Time Remaining */}
              <div className="text-ui-label font-normal text-text-placeholder font-secondary">
                {timeRemaining}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-bg-card rounded-[3px] overflow-hidden">
              <div
                className="h-full bg-accent-blue rounded-[3px] transition-all duration-300"
                style={{ width: `${challengeProgress}%` }}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2 min-h-[400px]">
          {/* Achievement List */}
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = profile.achievements[ach.id];
            return (
              <div
                key={ach.id}
                className={`p-3 rounded-xl border ${
                  unlocked
                    ? 'bg-accent-green-alpha border-[#4ade8033] opacity-100'
                    : 'bg-bg-card border-bg-card opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 flex items-center justify-center rounded-full text-ui-icon-lg flex-shrink-0 ${
                      unlocked ? 'bg-[#4ade8033]' : 'bg-bg-card-alt'
                    }`}
                  >
                    {unlocked ? '✓' : '🔒'}
                  </div>
                  <div className="flex-1">
                    <div className="text-ui-body font-bold text-white mb-0.5 font-primary">
                      {ach.title}
                    </div>
                    <div className="text-ui-tab text-text-disabled font-primary">
                      {ach.desc}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
