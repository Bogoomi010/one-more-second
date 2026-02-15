import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GAMEPLAY_MODIFIERS,
  calculateScoreBreakdown,
} from '../gameSystem/modifiers';
import { GameplayModifierId } from '../gameSystem/types';

interface DifficultyModalProps {
  isOpen: boolean;
  value: GameplayModifierId[];
  onClose: () => void;
  onApply: (next: GameplayModifierId[]) => void;
  previewBaseScore?: number;
}

function hasModifier(list: GameplayModifierId[], id: GameplayModifierId): boolean {
  return list.includes(id);
}

export default function DifficultyModal({
  isOpen,
  value,
  onClose,
  onApply,
  previewBaseScore = 100,
}: DifficultyModalProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<GameplayModifierId[]>(value);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(value);
  }, [isOpen, value]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const breakdown = useMemo(
    () => calculateScoreBreakdown(previewBaseScore, draft),
    [previewBaseScore, draft]
  );

  if (!isOpen) return null;

  const toggleModifier = (id: GameplayModifierId) => {
    setDraft((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const getModifierName = (id: GameplayModifierId, fallback: string): string =>
    t(`gameplayModifiers.${id}.name`, { defaultValue: fallback });

  const getModifierDescription = (id: GameplayModifierId, fallback: string): string =>
    t(`gameplayModifiers.${id}.description`, { defaultValue: fallback });

  return (
    <div
      className="fixed inset-0 z-[10030] bg-black/75 backdrop-blur-lg flex items-center justify-center p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-[min(640px,calc(100vw-24px))] rounded-[24px] border border-border-primary bg-bg-primary shadow-[0_24px_70px_rgba(0,0,0,0.55)] px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-5"
        role="dialog"
        aria-modal="true"
        aria-label={t('difficultyModal.dialogAria')}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="m-0 text-[24px] font-bold font-primary text-accent-green">
              {t('difficultyModal.title')}
            </h2>
            <p className="m-0 mt-1 text-[12px] text-text-secondary font-primary">
              {t('difficultyModal.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-border-secondary bg-bg-card text-text-primary hover:bg-bg-card-alt"
            aria-label={t('difficultyModal.closeAria')}
          >
            X
          </button>
        </div>

        <div className="rounded-2xl border border-border-secondary bg-bg-card p-4">
          <div className="text-[12px] text-text-secondary font-primary">
            {t('difficultyModal.scoreFormula')}
          </div>
          <div className="mt-2 text-[14px] text-text-primary font-primary font-semibold">
            {t('difficultyModal.scorePreview', {
              baseScore: breakdown.baseScore,
              finalScore: breakdown.finalScore,
              adjustmentScore: breakdown.adjustmentScore,
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {GAMEPLAY_MODIFIERS.map((modifier) => {
            const enabled = hasModifier(draft, modifier.id);
            return (
              <div
                key={modifier.id}
                className="rounded-2xl border border-border-secondary bg-bg-card p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[14px] font-semibold text-text-primary font-primary">
                    {getModifierName(modifier.id, modifier.name)}
                  </div>
                  <div className="text-[12px] font-semibold text-accent-blue font-primary">
                    +{Math.round(modifier.weight * 100)}%
                  </div>
                </div>

                <div className="text-[12px] text-text-secondary font-primary">
                  {getModifierDescription(modifier.id, modifier.description)}
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => toggleModifier(modifier.id)}
                    aria-pressed={enabled}
                    className={`h-8 px-4 rounded-full text-[12px] font-semibold font-primary border transition-colors ${
                      enabled
                        ? 'border-accent-green bg-accent-green text-bg-primary'
                        : 'border-border-secondary bg-bg-primary text-text-secondary hover:bg-bg-card-alt'
                    }`}
                  >
                    {enabled ? t('difficultyModal.toggleOn') : t('difficultyModal.toggleOff')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 h-[46px] rounded-xl border-none bg-accent-green text-bg-primary text-[13px] font-semibold hover:brightness-110"
          >
            {t('difficultyModal.apply')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-[46px] rounded-xl border border-border-secondary bg-bg-card text-text-primary text-[13px] font-semibold hover:bg-bg-card-alt"
          >
            {t('difficultyModal.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
