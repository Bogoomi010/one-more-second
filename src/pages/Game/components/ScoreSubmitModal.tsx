import React, { useState, useEffect } from 'react';
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
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <Flag code={value} height="12" />
    <span
      style={{
        marginLeft: '6px',
        fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: '11px',
      }}
    >
      {label}
    </span>
  </div>
);

const ScoreSubmitModal: React.FC<ScoreSubmitModalProps> = ({
  score,
  timePlayed = 0,
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
    <div
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #2d3561 0%, #1a1a1a 100%)',
          borderRadius: '24px',
          padding: '48px 40px',
          width: '430px',
          height: '730px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header Section */}
        <div style={{ width: '100%', marginBottom: '32px' }}>
          <h2
            style={{
              fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: '48px',
              fontWeight: '700',
              color: '#FFFFFF',
              letterSpacing: '3px',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            GAME OVER
          </h2>

          {/* New High Score Badge */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 193, 7, 0.15)',
                borderRadius: '20px',
                padding: '8px 16px',
              }}
            >
              <span style={{ fontSize: '14px' }}>🏆</span>
              <span
                style={{
                  fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#FFC107',
                  letterSpacing: '1px',
                }}
              >
                NEW HIGH SCORE!
              </span>

              {systemLines.length > 0 && (
                <div style={{ fontSize: '12px', color: '#FFC107', lineHeight: 1.6, textAlign: 'left' }}>
                  {systemLines.map((l, idx) => (
                    <div key={idx}>{l}</div>
                  ))}
                </div>
              )}
            </div>


          </div>

          {/* Final Score */}
          <div style={{ marginBottom: '30px' }}>
            <p
              className="text-xs"
              style={{
                fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
                color: '#9CA3AF',
                letterSpacing: '2px',
                fontWeight: '500',
                textAlign: 'center',
                marginBottom: '0',
                lineHeight: '1',
              }}
            >
              FINAL SCORE
            </p>
            <p
              style={{
                fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: '72px',
                fontWeight: '700',
                color: '#818CF8',
                letterSpacing: '-2px',
                textAlign: 'center',
                marginTop: '30px',
                lineHeight: '1',
              }}
            >
              {score}
            </p>
          </div>

          {/* Input Row */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mb-8">
            <div className="flex flex-col gap-5">
              <div className="flex-1">
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontSize: '10px',
                    fontWeight: '500',
                    color: '#9CA3AF',
                    letterSpacing: '1px',
                    marginBottom: '8px',
                  }}
                >
                  NICKNAME
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  style={{
                    width: '100%',
                    fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: 'none',
                    borderRadius: '12px',
                    height: '48px',
                    minHeight: '48px',
                    fontSize: '14px',
                    color: 'white',
                    padding: '0 16px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Enter your name..."
                  autoFocus
                />
              </div>

              <div className="flex-1" style={{ marginTop: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontSize: '10px',
                    fontWeight: '500',
                    color: '#9CA3AF',
                    letterSpacing: '1px',
                    marginBottom: '8px',
                  }}
                >
                  COUNTRY
                </label>
                <Select
                  options={countries}
                  value={country}
                  onChange={(option: CountryOption | null) => setCountry(option)}
                  placeholder="Select..."
                  formatOptionLabel={formatOptionLabel}
                  isSearchable={true}
                  components={{
                    SingleValue: (props: any) => (
                      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <span
                          style={{
                            fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
                            fontSize: '14px',
                            color: 'white',
                            lineHeight: '1',
                          }}
                        >
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
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      borderColor: 'transparent',
                      borderRadius: '12px',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: 'transparent',
                      },
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
                      color: 'white',
                      fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
                      fontSize: '14px',
                    }),
                    option: (base: any, state: any) => ({
                      ...base,
                      padding: '12px 16px',
                      backgroundColor: state.isSelected
                        ? '#818CF8'
                        : state.isFocused
                          ? 'rgba(129, 140, 248, 0.2)'
                          : 'rgba(30, 35, 45, 1)',
                      color: 'white',
                      cursor: 'pointer',
                      fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
                      fontSize: '14px',
                    }),
                    menu: (base: any) => ({
                      ...base,
                      backgroundColor: 'rgba(30, 35, 45, 1)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
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
                      color: '#6B7280',
                      fontSize: '14px',
                      fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
                      margin: 0,
                    }),
                    dropdownIndicator: (base: any) => ({
                      ...base,
                      padding: '0',
                      paddingRight: '8px',
                      color: '#9CA3AF',
                      display: 'flex',
                      alignItems: 'center',
                    }),
                    indicatorSeparator: () => ({
                      display: 'none',
                    }),
                    singleValue: (base: any) => ({
                      ...base,
                      margin: 0,
                    }),
                  }}
                />
              </div>
            </div>

          </form>

        </div>

        {/* Bottom Section - Fixed to bottom */}
        <div style={{ marginTop: 'auto', width: '100%' }}>
          {error && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <p
                style={{
                  fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
                  fontSize: '14px',
                  color: '#EF4444',
                  letterSpacing: '0.5px',
                }}
              >
                {error}
              </p>
            </div>
          )}

          <button
            onClick={submitScoreData}
            disabled={isSubmitting}
            style={{
              width: '100%',
              background: '#818CF8',
              color: '#FFFFFF',
              fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: '15px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '12px',
              height: '52px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Score (제출하기)'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                color: '#9CA3AF',
                fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
            >
              Restart (재시작)
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '16px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'background 0.2s',
              }}
            >
              ↻
            </button>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <p
              style={{
                fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: '10px',
                fontWeight: '500',
                color: '#6B7280',
                letterSpacing: '1.5px',
              }}
            >
              ONE MORE SECOND • WEB GAME EDITION
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreSubmitModal;
