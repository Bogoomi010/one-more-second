import React, { useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ACHIEVEMENTS, ACHIEVEMENT_REWARD_COINS } from '../../../gameSystem';
import { PlayerProfile } from '../../../gameSystem/types';
import { useModalAccessibility } from '../../../components/useModalAccessibility';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
}

export default function AchievementsModal({ isOpen, onClose, profile }: AchievementsModalProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useModalAccessibility({
    isOpen,
    dialogRef,
    onClose,
    autoFocusSelector: '[data-modal-autofocus="achievements-close"]',
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] bg-black/75 backdrop-blur-lg flex items-center justify-center p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        className="w-[min(1120px,calc(100vw-24px))] max-h-[calc(100vh-24px)] rounded-[24px] border border-border-primary bg-bg-primary shadow-[0_24px_70px_rgba(0,0,0,0.55)] px-6 py-6 sm:px-8 sm:py-8 flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2
              id={titleId}
              className="m-0 text-[28px] font-bold font-primary text-accent-green tracking-[1px]"
            >
              {t('systemMenu.achievements')}
            </h2>
            <p id={descriptionId} className="m-0 mt-1 text-[12px] text-text-secondary font-primary">
              {t('stats.achievementProgress')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-modal-autofocus="achievements-close"
            className="w-10 h-10 rounded-xl border border-border-secondary bg-bg-card text-text-primary hover:bg-bg-card-alt"
            aria-label={t('systemMenu.closeAria')}
          >
            X
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ACHIEVEMENTS.map((achievement) => {
              const unlocked = Boolean(profile.achievements[achievement.id]);
              const title = t(`achievements.${achievement.id}.title`, { defaultValue: achievement.title });
              const desc = t(`achievements.${achievement.id}.desc`, { defaultValue: achievement.desc });

              return (
                <div
                  key={achievement.id}
                  className={`rounded-2xl border p-4 ${
                    unlocked
                      ? 'border-accent-green/50 bg-accent-green-alpha'
                      : 'border-border-secondary bg-bg-card'
                  }`}
                >
                  <div className="text-[14px] font-semibold font-primary text-text-primary">
                    {title} {unlocked ? ` ${t('systemMenu.completed')}` : ''}
                  </div>
                  <div className="mt-1 text-[12px] text-text-secondary font-primary">{desc}</div>
                  <div className="mt-1 text-[11px] text-accent-green font-primary">
                    +{t('systemMenu.coinsAmount', { count: ACHIEVEMENT_REWARD_COINS })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
