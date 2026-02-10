import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { getName } from 'country-list';
import Flag from 'react-world-flags';
import { submitScore } from '../../../utils/api';
import { ScoreRecord } from '../../../types/score';
import { addRankingEntry } from '../../../gameSystem/ranking';

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

// 주요 국가 코드 목록
const majorCountryCodes = [
  'KR', // 한국
  'US', // 미국
  'JP', // 일본
  'CN', // 중국
  'GB', // 영국
  'DE', // 독일
  'FR', // 프랑스
  'CA', // 캐나다
  'AU', // 호주
  'TW', // 대만
  'SG', // 싱가포르
  'IN', // 인도
  'BR', // 브라질
  'MX', // 멕시코
  'IT', // 이탈리아
  'ES', // 스페인
  'NL', // 네덜란드
  'SE', // 스웨덴
  'RU', // 러시아
  'TH', // 태국
  'VN', // 베트남
  'PH', // 필리핀
  'ID', // 인도네시아
  'MY', // 말레이시아
];

const countries: CountryOption[] = majorCountryCodes
  .map((code: string) => ({
    value: code,
    label: getName(code) || code,
  }))
  .filter((country) => country.label); // 유효한 국가만 필터링

const formatOptionLabel = ({ value, label }: CountryOption) => (
  <div className="flex items-center">
    <Flag code={value} height="12" />
    <span className="ml-1.5 font-primary text-[11px]">{label}</span>
  </div>
);

const ScoreSubmitModal: React.FC<ScoreSubmitModalProps> = ({
  score,
  timePlayed: _timePlayed = 0,
  onClose,
  isOpen,
  systemLines = [],
  onCountrySelect,
  onRankingUpdate,
}) => {
  const [nickname, setNickname] = useState('');
  const [country, setCountry] = useState<CountryOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모달이 열릴 때마다 에러 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitScoreData();
  };

  const submitScoreData = async () => {
    if (!nickname || !country) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const scoreData: ScoreRecord = {
      nickname,
      country: country.value,
      score,
    };

    // 로컬 랭킹에 추가
    addRankingEntry(nickname, country.value, score);

    // 국가 정보 전달
    if (onCountrySelect) {
      onCountrySelect(country.value);
    }

    // 랭킹 업데이트 트리거
    if (onRankingUpdate) {
      onRankingUpdate();
    }

    // 백엔드 API 호출 (선택적)
    const response = await submitScore(scoreData);
    setIsSubmitting(false);

    if (response.success) {
      setNickname('');
      setCountry(null);
      onClose();
    } else {
      setError(response.message || '스코어 제출에 실패했습니다.');
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
                  {systemLines.map((l, idx) => (
                    <div key={idx}>{l}</div>
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
                <Select
                  options={countries}
                  value={country}
                  onChange={(option: CountryOption | null) => setCountry(option)}
                  placeholder="Select..."
                  formatOptionLabel={formatOptionLabel}
                  isSearchable
                  components={{
                    SingleValue: (props: any) => (
                      <div className="flex items-center h-full">
                        <span className="font-primary text-sm text-white leading-none">
                          {props.children}
                        </span>
                      </div>
                    ),
                  }}
                  styles={{
                    control: (base: any) => ({
                      ...base,
                      height: '48px',
                      minHeight: '48px',
                      backgroundColor: 'var(--color-bg-card)',
                      borderColor: 'var(--color-border-secondary)',
                      borderRadius: '12px',
                      boxShadow: 'none',
                      '&:hover': { borderColor: 'transparent' },
                      paddingLeft: '6px',
                      paddingRight: '6px',
                    }),
                    valueContainer: (base: any) => ({
                      ...base,
                      padding: '0 10px',
                      display: 'flex',
                      justifyContent: 'flex-start',
                      height: '46px',
                    }),
                    input: (base: any) => ({
                      ...base,
                      color: 'var(--color-text-primary)',
                      fontFamily: 'Quicksand, -apple-system, BlinkMacSystemFont, sans-serif',
                      fontSize: '14px',
                    }),
                    option: (base: any, state: any) => ({
                      ...base,
                      padding: '12px 16px',
                      backgroundColor: state.isSelected
                        ? 'var(--color-accent-blue)'
                        : state.isFocused
                          ? 'var(--color-accent-blue-alpha)'
                          : 'var(--color-bg-secondary)',
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer',
                      fontFamily: 'Quicksand, -apple-system, BlinkMacSystemFont, sans-serif',
                      fontSize: '14px',
                    }),
                    menu: (base: any) => ({
                      ...base,
                      backgroundColor: 'var(--color-bg-primary)',
                      borderRadius: '12px',
                      border: '1px solid var(--color-border-primary)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                      overflow: 'hidden',
                    }),
                    menuList: (base: any) => ({
                      ...base,
                      padding: '4px',
                      maxHeight: '280px',
                    }),
                    placeholder: (base: any) => ({
                      ...base,
                      color: 'var(--color-text-placeholder)',
                      fontSize: '14px',
                      fontFamily: 'Quicksand, -apple-system, BlinkMacSystemFont, sans-serif',
                      margin: 0,
                    }),
                    dropdownIndicator: (base: any) => ({
                      ...base,
                      padding: '0',
                      paddingRight: '8px',
                      color: 'var(--color-text-disabled)',
                      display: 'flex',
                      alignItems: 'center',
                    }),
                    indicatorSeparator: () => ({ display: 'none' }),
                    singleValue: (base: any) => ({ ...base, margin: 0 }),
                  }}
                />
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
              Restart (재시작)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-2xl bg-accent-green-alpha border border-accent-green/40 text-accent-green text-base cursor-pointer transition-all duration-200 hover:brightness-110 flex items-center justify-center"
            >
              ↻
            </button>
          </div>

          <div className="text-center mt-12">
            <p className="font-primary text-[10px] font-medium text-text-placeholder tracking-[1.5px]">
              ONE MORE SECOND • WEB GAME EDITION
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreSubmitModal;
