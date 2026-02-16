import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PlayerProfile } from '../gameSystem/types';
import { ACHIEVEMENTS, ACHIEVEMENT_REWARD_COINS } from '../gameSystem/achievements';

interface NewStatsPanelProps {
  profile: PlayerProfile;
}

type TabType = 'stats' | 'trophy';

export default function NewStatsPanel({ profile }: NewStatsPanelProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const unlockedAchievements = ACHIEVEMENTS.filter((ach) => profile.achievements[ach.id]);

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      const time = `${hours}:${String(minutes).padStart(2, '0')}`;
      setTimeRemaining(t('stats.timeRemaining', { time }));
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000);

    return () => clearInterval(interval);
  }, [t]);

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
  const challengeProgress = Math.min((profile.bestScore / profile.dailyChallenge.targetSeconds) * 100, 100);
  const ownedSkinCount = Math.max(
    1,
    (profile.ownedPlayerSkins?.length ?? 0) + (profile.ownedBulletSkins?.length ?? 0) - 1
  );

  return (
    <div className="w-full h-full min-w-0 min-h-0 overflow-y-auto bg-bg-secondary border border-border-primary rounded-[24px] p-6 flex flex-col gap-4 backdrop-blur-[10px] font-primary">
      <div className="flex items-center gap-2">
        <span className="text-ui-title font-tertiary">📈</span>
        <h2 className="m-0 text-ui-title font-bold text-text-primary font-primary">
          {t('stats.title')}
        </h2>
      </div>

      <div className="flex gap-1 p-1.5 bg-bg-card rounded-2xl">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-2 rounded-xl border-none cursor-pointer text-ui-tab font-bold transition-all duration-200 font-primary ${
            activeTab === 'stats'
              ? 'bg-accent-blue text-bg-primary'
              : 'bg-transparent text-text-disabled'
          }`}
        >
          {t('stats.tabStats')}
        </button>
        <button
          onClick={() => setActiveTab('trophy')}
          className={`flex-1 py-2 rounded-xl border-none cursor-pointer text-ui-tab font-bold transition-all duration-200 font-primary ${
            activeTab === 'trophy'
              ? 'bg-accent-blue text-bg-primary'
              : 'bg-transparent text-text-disabled'
          }`}
        >
          {t('stats.tabTrophy', { unlocked: unlockedAchievements.length, total: ACHIEVEMENTS.length })}
        </button>
      </div>

      {activeTab === 'stats' ? (
        <>
          <div className="rounded-2xl p-[14px] bg-transparent border border-border-primary flex flex-col gap-2">
            <div className="text-ui-tab font-black text-accent-green font-secondary tracking-wide">
              {t('stats.personalBest')}
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

          <div className="flex flex-col gap-2.5">
            <div className="flex gap-4">
              <div className="flex-1 rounded-2xl p-2 bg-bg-card border border-bg-card flex flex-col gap-2">
                <div className="text-ui-tab font-black text-text-placeholder font-secondary tracking-wide">
                  {t('stats.totalRuns')}
                </div>
                <div className="text-ui-value font-bold text-accent-green font-secondary">
                  {t('stats.totalRunsValue', { count: profile.totalRuns })}
                </div>
              </div>

              <div className="flex-1 rounded-2xl p-2 bg-bg-card border border-bg-card flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-ui-icon font-tertiary">💎</span>
                  <div className="text-ui-tab font-black text-text-placeholder font-secondary tracking-wide">
                    {t('stats.coins')}
                  </div>
                </div>
                <div className="text-ui-value font-bold text-rose-400 font-secondary">
                  {profile.coins}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 rounded-2xl p-2 bg-bg-card border border-bg-card flex flex-col gap-2">
                <div className="text-ui-tab font-black text-text-placeholder font-secondary tracking-wide">
                  {t('stats.totalTime')}
                </div>
                <div className="text-ui-value font-bold text-accent-blue font-secondary">
                  {formatTime(profile.totalSecondsSurvived)}
                </div>
              </div>

              <div className="flex-1 rounded-2xl p-2 bg-bg-card border border-bg-card flex flex-col gap-2">
                <div className="text-ui-tab font-black text-text-placeholder font-secondary tracking-wide">
                  {t('stats.averageTime')}
                </div>
                <div className="text-ui-value font-bold text-text-primary font-secondary">
                  {formatTime(avgSurvival)}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 rounded-2xl p-2 bg-bg-card border border-bg-card flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-ui-icon font-tertiary">🧠</span>
                  <div className="text-ui-tab font-black text-text-placeholder font-secondary tracking-wide">
                    {t('stats.ownedSkins')}
                  </div>
                </div>
                <div className="text-ui-value font-bold text-text-primary">
                  <span className="font-secondary">{ownedSkinCount}</span>
                  <span className="font-primary">{t('stats.countUnit')}</span>
                </div>
              </div>

              <div className="flex-1 rounded-2xl p-2 bg-bg-card border border-bg-card flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-ui-icon font-tertiary">🏆</span>
                  <div className="text-ui-tab font-black text-text-placeholder font-secondary tracking-wide">
                    {t('stats.achievementProgress')}
                  </div>
                </div>
                <div className="text-ui-value font-bold text-text-primary font-secondary">
                  {unlockedAchievements.length}/{ACHIEVEMENTS.length}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-2.5 bg-transparent border-4 border-accent-blue flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-ui-icon-lg font-tertiary">🛡️</span>
              <div className="text-ui-tab font-black text-accent-blue font-secondary tracking-wide">
                {t('stats.dailyChallenge')}
              </div>
            </div>

            <div className="text-ui-body font-bold text-text-secondary font-primary">
              {t('stats.dailyChallengeTarget', { seconds: profile.dailyChallenge.targetSeconds })}
            </div>

            <div className="flex justify-between items-center">
              <div className="rounded-[4px] px-2 py-1 bg-accent-green-alpha border border-[#4ade8033]">
                <div className="text-ui-tab font-black text-accent-green font-secondary tracking-wide">
                  {t('stats.dailyChallengeReward', { coins: profile.dailyChallenge.rewardCoins })}
                </div>
              </div>

              <div className="text-ui-label font-normal text-text-placeholder font-secondary">
                {timeRemaining}
              </div>
            </div>

            <div className="w-full h-1.5 bg-bg-card rounded-[3px] overflow-hidden">
              <div
                className="h-full bg-accent-blue rounded-[3px] transition-all duration-300 w-[var(--daily-challenge-progress)]"
                style={{ '--daily-challenge-progress': `${challengeProgress}%` } as React.CSSProperties}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2 min-h-[400px]">
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = profile.achievements[ach.id];
            const title = t(`achievements.${ach.id}.title`, { defaultValue: ach.title });
            const desc = t(`achievements.${ach.id}.desc`, { defaultValue: ach.desc });

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
                      {title}
                    </div>
                    <div className="text-ui-tab text-text-disabled font-primary">
                      {desc}
                    </div>
                    <div className="text-[11px] text-accent-green font-primary mt-1">
                      +{t('systemMenu.coinsAmount', { count: ACHIEVEMENT_REWARD_COINS })}
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
