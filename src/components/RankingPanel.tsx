import React, { useEffect, useState } from 'react';
import { getName } from 'country-list';
import 'flag-icons/css/flag-icons.min.css';
import { RankingEntry } from '../gameSystem/ranking';
import {
  getCountryRanking,
  getDailyRanking,
  getGlobalRanking,
} from '../services/rankingService';
import rankingIcon from '../assets/icon-ranking-background.png';

type RankingType = 'global' | 'country' | 'daily';

interface NewRankingPanelProps {
  userCountry?: string;
  refreshTrigger?: number;
}

const COUNTRY_OPTIONS = ['KR', 'US', 'JP', 'CN', 'GB', 'DE', 'FR'] as const;

interface CountryFlagProps {
  countryCode: string;
  className?: string;
}

function CountryFlag({ countryCode, className = '' }: CountryFlagProps) {
  const normalized = countryCode.toLowerCase().replace(/[^a-z]/g, '').slice(0, 2);

  if (normalized.length !== 2) {
    return <span className="text-[10px] font-bold text-text-placeholder">{countryCode.toUpperCase()}</span>;
  }

  return <span className={`fi fi-${normalized} ${className}`} aria-hidden="true" />;
}

export default function NewRankingPanel({ userCountry, refreshTrigger = 0 }: NewRankingPanelProps) {
  const [rankingType, setRankingType] = useState<RankingType>('global');
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>(userCountry ?? 'KR');

  const loadRankings = React.useCallback(async (): Promise<RankingEntry[]> => {
    switch (rankingType) {
      case 'global':
        return getGlobalRanking(50);
      case 'country':
        return getCountryRanking(selectedCountry, 30);
      case 'daily':
        return getDailyRanking(undefined, 30);
    }
    return [];
  }, [rankingType, selectedCountry]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const next = await loadRankings();
      if (isMounted) setRankings(next);
    })();
    return () => {
      isMounted = false;
    };
  }, [loadRankings, refreshTrigger]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatScore = (score: number): string => score.toLocaleString();

  const getRankColor = (rank: number): string => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return '#e0e0e0';
  };

  const getTabLabel = (type: RankingType): string => {
    switch (type) {
      case 'global':
        return 'Global';
      case 'country':
        return 'Local';
      case 'daily':
        return 'Daily';
    }
  };

  const getFooterText = (): React.ReactNode => {
    switch (rankingType) {
      case 'global':
        return `TOTAL ${rankings.length} RECORDS`;
      case 'country': {
        const countryName = getName(selectedCountry) ?? selectedCountry;
        return (
          <span className="inline-flex items-center gap-1.5">
            <CountryFlag countryCode={selectedCountry} className="rounded-[2px]" />
            <span>{`${countryName.toUpperCase()} ${rankings.length} RECORDS`}</span>
          </span>
        );
      }
      case 'daily':
        return `TODAY ${rankings.length} RECORDS`;
    }
  };

  return (
    <div className="w-full h-full min-w-0 min-h-0 bg-bg-secondary border border-border-primary rounded-[24px] p-6 flex flex-col gap-6 backdrop-blur-[10px] font-primary overflow-hidden box-border">
      <div className="flex items-center gap-2">
        <i className="fi-br-ranking-podium text-[23px] leading-none text-text-primary" aria-hidden="true" />
        <h2 className="m-0 text-[20px] font-bold text-text-primary font-primary">
          Ranking
        </h2>
      </div>

      <div className="flex gap-1 p-1.5 bg-bg-card rounded-2xl w-full">
        {(['global', 'country', 'daily'] as RankingType[]).map((type) => (
          <button
            key={type}
            onClick={() => setRankingType(type)}
            className={`flex-1 py-2 bg-transparent border-none rounded-xl cursor-pointer text-[12px] font-bold transition-all duration-200 font-primary flex items-center justify-center ${
              rankingType === type ? 'text-bg-primary bg-accent-green' : 'text-text-disabled'
            }`}
          >
            {getTabLabel(type)}
          </button>
        ))}
      </div>

      {rankingType === 'country' && (
        <div>
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <CountryFlag countryCode={selectedCountry} className="rounded-[2px]" />
            </div>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full py-2.5 pl-9 pr-3 bg-bg-card text-white border border-border-primary rounded-xl text-[13px] cursor-pointer font-primary"
            >
              {COUNTRY_OPTIONS.map((countryCode) => {
                const countryName = getName(countryCode) ?? countryCode;
                return (
                  <option key={countryCode} value={countryCode}>
                    {countryName}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        {rankings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 h-full">
            <div className="w-16 h-16 flex items-center justify-center bg-bg-card rounded-[32px]">
              <img
                src={rankingIcon}
                alt="Empty state icon"
                className="w-8 h-8 object-contain opacity-40"
              />
            </div>
            <div className="text-[14px] font-medium text-text-placeholder text-center font-primary">
              No records available yet.
            </div>
            <div className="text-[10px] font-bold text-accent-blue-alpha tracking-wide font-secondary">
              START PLAYING TO RANK UP
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 h-full overflow-y-auto pr-1">
            {rankings.map((entry, index) => {
              const rank = index + 1;
              const isTopThree = rank <= 3;
              const rankColor = getRankColor(rank);
              const finalScore = entry.finalScore ?? entry.score;
              const survivedTime = entry.normalScore ?? entry.score;

              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                    isTopThree ? 'bg-white/[0.07]' : 'bg-white/[0.03]'
                  }`}
                  style={{
                    borderColor: isTopThree ? `${rankColor}40` : '#ffffff0a'
                  }}
                >
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-[13px] flex-shrink-0 font-primary ${
                      isTopThree ? 'text-black' : 'text-white bg-bg-card-alt'
                    }`}
                    style={isTopThree ? { background: rankColor } : {}}
                  >
                    {rank}
                  </div>

                  <div className="flex-shrink-0">
                    <CountryFlag countryCode={entry.country} className="rounded-[2px]" />
                  </div>

                  <div
                    className={`flex-1 text-white text-[14px] overflow-hidden text-ellipsis whitespace-nowrap font-primary ${
                      isTopThree ? 'font-bold' : 'font-medium'
                    }`}
                  >
                    {entry.nickname}
                  </div>

                  <div className="flex flex-col items-end justify-center gap-0.5 leading-none flex-shrink-0">
                    <div
                      className="text-[14px] font-bold font-secondary"
                      style={{ color: isTopThree ? rankColor : '#94a3b8' }}
                    >
                      {formatScore(finalScore)}
                    </div>
                    <div className="text-[10px] font-medium text-text-placeholder font-secondary">
                      {formatTime(survivedTime)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center pt-4 border-t border-border-secondary w-full shrink-0">
        <div className="text-[10px] font-medium text-text-placeholder tracking-wide font-secondary">
          {getFooterText()}
        </div>
      </div>
    </div>
  );
}
