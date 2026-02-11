import React, { useEffect, useRef, useState } from 'react';
import { getName } from 'country-list';
import 'flag-icons/css/flag-icons.min.css';
import { submitScore } from '../../../utils/api';
import { ScoreRecord } from '../../../types/score';
import { addRankingEntry } from '../../../gameSystem/ranking';
import { useAuth } from '../../../context/AuthContext';

interface ScoreSubmitModalProps {
  score: number;
  timePlayed?: number;
  onClose: () => void;
  isOpen: boolean;
  systemLines?: string[];
  onCountrySelect?: (country: string) => void;
  onRankingUpdate?: () => void;
}

interface CountryOption {
  value: string;
  label: string;
}

const majorCountryCodes = ['KR', 'US', 'JP', 'CN', 'GB', 'DE', 'FR', 'CA', 'AU', 'IN'];

const countries: CountryOption[] = majorCountryCodes
  .map((code: string) => ({
    value: code,
    label: getName(code) || code,
  }))
  .filter((country) => country.label);

const ScoreSubmitModal: React.FC<ScoreSubmitModalProps> = ({
  score,
  timePlayed: _timePlayed = 0,
  onClose,
  isOpen,
  systemLines = [],
  onCountrySelect,
  onRankingUpdate,
}) => {
  const { user, loading: authLoading, firebaseEnabled, signInWithGoogle } = useAuth();
  const [nickname, setNickname] = useState('');
  const [country, setCountry] = useState<string>('');
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countryMenuRef = useRef<HTMLDivElement | null>(null);
  const selectedCountry = countries.find((item) => item.value === country);

  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryMenuRef.current && !countryMenuRef.current.contains(event.target as Node)) {
        setIsCountryMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const submitScoreData = async () => {
    if (!nickname || !country) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const scoreData: ScoreRecord = {
      nickname,
      country,
      score,
    };

    addRankingEntry(nickname, country, score);

    if (onCountrySelect) {
      onCountrySelect(country);
    }

    if (onRankingUpdate) {
      onRankingUpdate();
    }

    const response = await submitScore(scoreData);
    setIsSubmitting(false);

    if (response.success) {
      setNickname('');
      setCountry('');
      onClose();
    } else {
      setError(response.message || '스코어 제출에 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitScoreData();
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google 로그인에 실패했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-lg flex items-center justify-center">
      <div className="w-[min(520px,calc(100vw-24px))] h-[min(860px,calc(100vh-16px))] rounded-[24px] border border-border-primary shadow-[0_20px_60px_rgba(0,0,0,0.5)] bg-bg-primary px-5 sm:px-8 md:px-10 py-8 sm:py-10 md:py-12 flex flex-col overflow-y-auto overflow-x-visible">
        <div className="w-full mb-8">
          <h2 className="font-primary text-[48px] font-bold text-green-500 tracking-[3px] mb-4 text-center drop-shadow-[0_0_12px_rgba(34,197,94,0.6)]">
            GAME OVER
          </h2>

          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-[20px] px-4 py-2 bg-accent-green-alpha border border-accent-green/30 max-w-full">
              <span className="text-sm">🏆</span>
              <span className="font-primary text-xs font-semibold text-accent-green tracking-[1px]">
                NEW HIGH SCORE!
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

          {firebaseEnabled && (
            <div className="mb-5 rounded-xl border border-border-secondary bg-bg-card px-4 py-3">
              {user ? (
                <div className="text-[12px] font-primary text-accent-green">
                  로그인됨: 클라우드 점수/기록 동기화가 활성화됩니다.
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="m-0 text-[12px] text-text-secondary font-primary">
                    로그인하면 점수가 클라우드에 저장됩니다.
                  </p>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={authLoading}
                    className="rounded-lg border border-border-secondary bg-bg-secondary px-3 py-2 text-[11px] font-semibold text-text-primary cursor-pointer hover:bg-bg-card-alt disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {authLoading ? 'Loading...' : 'Google 로그인'}
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mb-8">
            <div className="flex flex-col gap-5">
              <div className="flex-1">
                <label className="block font-primary text-[10px] font-medium text-text-disabled tracking-[1px] mb-2">
                  NICKNAME
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full h-12 min-h-12 box-border rounded-xl border border-border-secondary bg-bg-card text-text-primary text-sm font-primary px-4 outline-none"
                  placeholder="Enter your name..."
                  autoFocus
                />
              </div>

              <div className="flex-1 mt-5">
                <label className="block font-primary text-[10px] font-medium text-text-disabled tracking-[1px] mb-2">
                  COUNTRY
                </label>
                <div className="relative" ref={countryMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsCountryMenuOpen((prev) => !prev)}
                    className="w-full h-12 min-h-12 rounded-xl border border-border-secondary bg-bg-card text-text-primary text-sm font-primary px-4 cursor-pointer flex items-center justify-between"
                    aria-haspopup="listbox"
                    aria-expanded={isCountryMenuOpen}
                  >
                    <span className="flex items-center gap-2">
                      {selectedCountry ? (
                        <span
                          className={`fi fi-${selectedCountry.value.toLowerCase()} rounded-[2px]`}
                          aria-hidden="true"
                        />
                      ) : null}
                      <span>{selectedCountry?.label ?? 'Select country...'}</span>
                    </span>
                    <span className="text-text-disabled text-xs">{isCountryMenuOpen ? '▲' : '▼'}</span>
                  </button>

                  {isCountryMenuOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-64 overflow-y-auto rounded-xl border border-border-primary bg-bg-secondary shadow-lg p-1">
                      {countries.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setCountry(option.value);
                            setIsCountryMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-primary hover:bg-bg-card-alt flex items-center gap-2"
                          role="option"
                          aria-selected={country === option.value}
                        >
                          <span
                            className={`fi fi-${option.value.toLowerCase()} rounded-[2px]`}
                            aria-hidden="true"
                          />
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="mt-auto w-full">
          {error && (
            <div className="text-center mb-4">
              <p className="font-primary text-sm text-accent-green tracking-[0.5px]">{error}</p>
            </div>
          )}

          <button
            onClick={submitScoreData}
            disabled={isSubmitting}
            className={`w-full h-[52px] rounded-xl border-none font-primary text-[15px] font-semibold transition-all duration-200 ${
              isSubmitting
                ? 'bg-accent-green-alpha text-bg-primary cursor-not-allowed'
                : 'bg-accent-green text-bg-primary cursor-pointer hover:brightness-110'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Score (제출하기)'}
          </button>

          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-transparent border-none text-text-disabled font-primary text-sm font-medium cursor-pointer transition-colors duration-200 hover:text-accent-green"
            >
              Restart (다시)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-2xl bg-accent-green-alpha border border-accent-green/40 text-accent-green text-base cursor-pointer transition-all duration-200 hover:brightness-110 flex items-center justify-center"
            >
              ×
            </button>
          </div>

          <div className="text-center mt-12">
            <p className="font-primary text-[10px] font-medium text-text-placeholder tracking-[1.5px]">
              ONE MORE SECOND - WEB GAME EDITION
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreSubmitModal;
