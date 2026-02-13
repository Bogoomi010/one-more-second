import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { submitScore } from '../../../utils/api';
import { ScoreRecord } from '../../../types/score';
import { addRankingEntry } from '../../../gameSystem/ranking';
import { useAuth } from '../../../context/AuthContext';
import { UserIdentityProfile } from '../../../services/userDataService';
import retryIcon from '../../../assets/icon-retry.png';

interface ScoreSubmitModalProps {
  score: number;
  timePlayed?: number;
  onClose: () => void;
  isOpen: boolean;
  systemLines?: string[];
  onCountrySelect?: (country: string) => void;
  onRankingUpdate?: () => void;
  profileIdentity: UserIdentityProfile | null;
  isProfileSetupOpen: boolean;
  identityLoading: boolean;
  onRequestProfileSetup: () => void;
  isNewHighScore: boolean;
}

const ScoreSubmitModal: React.FC<ScoreSubmitModalProps> = ({
  score,
  timePlayed: _timePlayed = 0,
  onClose,
  isOpen,
  systemLines = [],
  onCountrySelect,
  onRankingUpdate,
  profileIdentity,
  isProfileSetupOpen,
  identityLoading,
  onRequestProfileSetup,
  isNewHighScore,
}) => {
  const { t } = useTranslation();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAfterProfileSetup, setSubmitAfterProfileSetup] = useState(false);
  const [requestedProfileSetup, setRequestedProfileSetup] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSubmitAfterProfileSetup(false);
      setRequestedProfileSetup(false);
    }
  }, [isOpen]);

  const submitScoreData = useCallback(async () => {
    if (!user) {
      setError(t('scoreSubmit.signInRequired'));
      return;
    }

    if (!profileIdentity?.nickname || !profileIdentity?.country) {
      setError(t('scoreSubmit.profileRequired'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const scoreData: ScoreRecord = {
      nickname: profileIdentity.nickname,
      country: profileIdentity.country,
      score,
    };

    const response = await submitScore(scoreData);
    setIsSubmitting(false);

    if (response.success) {
      addRankingEntry(scoreData.nickname, scoreData.country, scoreData.score);
      if (onCountrySelect) {
        onCountrySelect(scoreData.country);
      }
      if (onRankingUpdate) {
        onRankingUpdate();
      }
      onClose();
    } else {
      setError(response.message || t('scoreSubmit.submitFailed'));
    }
  }, [onClose, onCountrySelect, onRankingUpdate, profileIdentity, score, t, user]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      setSubmitAfterProfileSetup(true);
      setRequestedProfileSetup(true);
      // 로그인 후에는 기존 유저 여부와 관계없이 프로필 설정 모달을 연다.
      onRequestProfileSetup();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('scoreSubmit.signInFailed'));
    }
  };

  useEffect(() => {
    if (!submitAfterProfileSetup || !isOpen) return;
    if (!requestedProfileSetup) return;
    if (isProfileSetupOpen) return;
    if (!user || identityLoading) return;

    if (!profileIdentity?.nickname || !profileIdentity?.country) {
      setSubmitAfterProfileSetup(false);
      setRequestedProfileSetup(false);
      setError(t('scoreSubmit.profileSetupCanceled'));
      return;
    }

    setSubmitAfterProfileSetup(false);
    setRequestedProfileSetup(false);
    void submitScoreData();
  }, [
    identityLoading,
    isOpen,
    isProfileSetupOpen,
    profileIdentity,
    requestedProfileSetup,
    submitAfterProfileSetup,
    submitScoreData,
    t,
    user,
  ]);

  const handleOpenProfileSetup = () => {
    setSubmitAfterProfileSetup(true);
    setRequestedProfileSetup(true);
    onRequestProfileSetup();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-lg flex items-center justify-center">
      <div className={`w-[min(520px,calc(100vw-24px))] ${user ? 'h-[min(760px,calc(100vh-16px))]' : 'h-[min(600px,calc(100vh-16px))]'} rounded-[24px] border border-border-primary shadow-[0_20px_60px_rgba(0,0,0,0.5)] bg-bg-primary px-5 sm:px-8 md:px-10 py-8 sm:py-10 md:py-12 flex flex-col overflow-y-auto overflow-x-visible`}>
        <div className="w-full mb-8">
          <h2 className="font-primary text-[48px] font-bold text-green-500 tracking-[3px] mb-4 text-center drop-shadow-[0_0_12px_rgba(34,197,94,0.6)]">
            GAME OVER
          </h2>

          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-[20px] px-4 py-2 bg-accent-green-alpha border border-accent-green/30 max-w-full">
              <span className="text-sm">🏆</span>
              <span className="font-primary text-xs font-semibold text-accent-green tracking-[1px]">
                {!user ? 'nice score! 😎' : isNewHighScore ? 'NEW HIGH SCORE!' : 'Not bad...😒'}
              </span>
              {systemLines.length > 0 && (
                <div className="text-xs text-accent-green leading-relaxed text-left">
                  {systemLines.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-[30px]">
            <p className="font-primary text-xs text-text-disabled tracking-[2px] font-medium text-center mb-0 leading-none">
              FINAL SCORE
            </p>
            <p className="font-primary text-[72px] font-bold text-accent-green tracking-[-2px] text-center mt-[30px] leading-none drop-shadow-[0_0_10px_rgba(74,222,128,0.55)]">
              {score}
            </p>
          </div>

          {!user ? (
            <div className="rounded-xl border border-border-secondary bg-bg-card px-4 py-4 flex flex-col gap-3">
              <p className="text-[12px] text-text-secondary font-primary">{t('scoreSubmit.signInDescription')}</p>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={authLoading || identityLoading}
                className="h-12 rounded-xl border border-border-secondary bg-bg-secondary px-3 py-2 text-[13px] font-semibold text-text-primary cursor-pointer hover:bg-bg-card-alt disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {(authLoading || identityLoading) ? (
                  <>
                    <span className="w-4 h-4 border-2 border-text-primary/50 border-t-text-primary rounded-full animate-spin" />
                    <span>{t('scoreSubmit.loading')}</span>
                  </>
                ) : t('scoreSubmit.signInWithGoogle')}
              </button>
            </div>
          ) : profileIdentity ? (
            <div className="mb-6 rounded-xl border border-border-secondary bg-bg-card px-4 py-4 flex flex-col gap-2">
              <p className="m-0 text-[12px] text-text-secondary font-primary">
                {t('scoreSubmit.profileNickname')}: {profileIdentity.nickname}
              </p>
              <p className="m-0 text-[12px] text-text-secondary font-primary">
                {t('scoreSubmit.profileCountry')}: {profileIdentity.country}
              </p>
            </div>
          ) : (
            <div className="mb-6 rounded-xl border border-border-secondary bg-bg-card px-4 py-4 flex flex-col gap-3">
              <p className="m-0 text-[12px] text-text-secondary font-primary">{t('scoreSubmit.profileRequired')}</p>
              <button
                type="button"
                onClick={handleOpenProfileSetup}
                className="h-12 rounded-xl border border-border-secondary bg-bg-secondary px-3 py-2 text-[13px] font-semibold text-text-primary cursor-pointer hover:bg-bg-card-alt"
              >
                {t('scoreSubmit.openProfileSetup')}
              </button>
            </div>
          )}
        </div>

        <div className={!user ? 'w-full' : 'mt-auto w-full'}>
          {error && (
            <div className="text-center mb-4">
              <p className="font-primary text-sm text-accent-green tracking-[0.5px]">{error}</p>
            </div>
          )}

          {!user ? (
            <div className="w-full flex items-center justify-center mt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full h-[52px] rounded-xl border-none font-primary text-[15px] font-semibold transition-all duration-200 bg-accent-green text-bg-primary cursor-pointer hover:brightness-110"
              >
                {t('scoreSubmit.restart')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={submitScoreData}
                disabled={isSubmitting || !user || !profileIdentity}
                className={`w-full h-[52px] rounded-xl border-none font-primary text-[15px] font-semibold transition-all duration-200 ${
                  isSubmitting
                    ? 'bg-accent-green-alpha text-bg-primary cursor-not-allowed'
                    : 'bg-accent-green text-bg-primary cursor-pointer hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed'
                }`}
              >
                {isSubmitting ? t('scoreSubmit.submitting') : t('scoreSubmit.submit')}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full h-[52px] rounded-xl border-none font-primary text-[15px] font-semibold transition-all duration-200 bg-accent-green text-bg-primary cursor-pointer hover:brightness-110 flex items-center justify-center gap-2"
              >
                <img src={retryIcon} alt="retry" className="w-5 h-5 object-contain" />
                <span>{t('scoreSubmit.restart')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreSubmitModal;
