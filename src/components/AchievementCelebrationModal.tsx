import React, { useId, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ACHIEVEMENT_REWARD_COINS, ACHIEVEMENTS } from '../gameSystem';
import { useModalAccessibility } from './useModalAccessibility';

interface AchievementCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievementIds: string[];
}

function getUniqueAchievementIds(achievementIds: string[]) {
  const seen = new Set<string>();
  return achievementIds.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export default function AchievementCelebrationModal({
  isOpen,
  onClose,
  achievementIds,
}: AchievementCelebrationModalProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const normalizedIds = useMemo(() => getUniqueAchievementIds(achievementIds), [achievementIds]);
  const achievementCount = normalizedIds.length;

  const unlockedAchievements = useMemo(
    () =>
      normalizedIds
        .map((id) => {
          const definition = ACHIEVEMENTS.find((item) => item.id === id);
          if (!definition) return null;

          return {
            id,
            title: t(`achievements.${id}.title`, { defaultValue: definition.title }),
            desc: t(`achievements.${id}.desc`, { defaultValue: definition.desc }),
          };
        })
        .filter((item): item is { id: string; title: string; desc: string } => Boolean(item)),
    [normalizedIds, t]
  );

  useModalAccessibility({
    isOpen,
    dialogRef,
    onClose,
    autoFocusSelector: '[data-modal-autofocus="achievement-celebration-close"]',
  });

  if (!isOpen || unlockedAchievements.length === 0) return null;

  const title =
    achievementCount > 1
      ? t('achievementsCelebration.multiTitle', {
          count: achievementCount,
          defaultValue: `🎉 ${achievementCount}개 업적을 달성했습니다!`,
        })
      : t('achievementsCelebration.singleTitle', {
          defaultValue: '🎉 업적을 달성했습니다!',
        });
  const subtitle = t('achievementsCelebration.subtitle', {
    defaultValue: '축하 이벤트를 확인해 주세요!',
  });

  return (
    <div
      className="fixed inset-0 z-[10030] bg-black/75 backdrop-blur-[8px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="relative w-[min(620px,calc(100vw-24px))] max-h-[calc(100vh-24px)] rounded-[24px] border border-border-primary bg-gradient-to-br from-bg-card to-bg-primary shadow-[0_24px_70px_rgba(0,0,0,0.6)] p-6 sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2
              id={titleId}
              className="m-0 text-[24px] sm:text-[28px] font-bold font-primary text-accent-green tracking-[1px] leading-tight"
            >
              {title}
            </h2>
            <p id={descriptionId} className="m-0 mt-2 text-sm text-text-secondary font-primary">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-modal-autofocus="achievement-celebration-close"
            className="mt-1 h-8 px-3 rounded-lg border border-border-secondary bg-bg-secondary text-text-primary text-[12px]"
            aria-label={t('systemMenu.close')}
          >
            {t('systemMenu.close')}
          </button>
        </div>

        <div className="max-h-[45vh] overflow-y-auto pr-1 space-y-2">
          {unlockedAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className="rounded-2xl border border-accent-green/50 bg-accent-green-alpha px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="m-0 text-[15px] font-semibold font-primary text-text-primary">
                    {achievement.title}
                  </p>
                  <p className="m-0 mt-1 text-[12px] text-text-secondary font-primary max-w-[85%]">
                    {achievement.desc}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-accent-green">
                  +{ACHIEVEMENT_REWARD_COINS}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-border-secondary bg-bg-card px-4 py-3 text-sm font-primary">
          <span className="text-text-primary">
            {t('systemMenu.coinsAmount', { count: unlockedAchievements.length * ACHIEVEMENT_REWARD_COINS })}
          </span>
        </div>
      </div>
    </div>
  );
}
