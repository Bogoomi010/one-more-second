import React, { useState, useEffect } from 'react';
import Flag from 'react-world-flags';
import { getName } from 'country-list';
import { RankingEntry, getGlobalRanking, getCountryRanking, getDailyRanking } from '../gameSystem/ranking';
import rankingIcon from '../assets/icon-ranking-background.png';

type RankingType = 'global' | 'country' | 'daily';

interface NewRankingPanelProps {
  userCountry?: string;
  refreshTrigger?: number;
}

export default function NewRankingPanel({ userCountry, refreshTrigger = 0 }: NewRankingPanelProps) {
  const [rankingType, setRankingType] = useState<RankingType>('global');
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>(userCountry ?? 'KR');

  const loadRankings = React.useCallback(() => {
    switch (rankingType) {
      case 'global':
        setRankings(getGlobalRanking(100));
        break;
      case 'country':
        setRankings(getCountryRanking(selectedCountry, 50));
        break;
      case 'daily':
        setRankings(getDailyRanking(undefined, 50));
        break;
    }
  }, [rankingType, selectedCountry]);

  useEffect(() => {
    loadRankings();
  }, [loadRankings, refreshTrigger]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#e0e0e0';
  };

  const getTabLabel = (type: RankingType): string => {
    switch (type) {
      case 'global': return 'Global';
      case 'country': return 'Local';
      case 'daily': return 'Daily';
    }
  };

  const getFooterText = (): string => {
    switch (rankingType) {
      case 'global':
        return `TOTAL ${rankings.length} RECORDS`;
      case 'country':
        return `${getName(selectedCountry)?.toUpperCase()} ${rankings.length} RECORDS`;
      case 'daily':
        return `TODAY ${rankings.length} RECORDS`;
    }
  };

  return (
    <div className="w-full max-w-80 h-[617px] bg-bg-secondary border border-border-primary rounded-[24px] p-6 flex flex-col gap-6 backdrop-blur-[10px] font-primary overflow-hidden box-border">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h2 className="m-0 text-[20px] font-bold text-text-primary font-primary">
          Ranking
        </h2>
      </div>

      {/* Tabs */}
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

      {/* Country Select (for country tab) */}
      {rankingType === 'country' && (
        <div>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full py-2.5 px-3 bg-bg-card text-white border border-border-primary rounded-xl text-[13px] cursor-pointer font-primary"
          >
            <option value="KR">🇰🇷 대한민국</option>
            <option value="US">🇺🇸 미국</option>
            <option value="JP">🇯🇵 일본</option>
            <option value="CN">🇨🇳 중국</option>
            <option value="GB">🇬🇧 영국</option>
            <option value="DE">🇩🇪 독일</option>
            <option value="FR">🇫🇷 프랑스</option>
          </select>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0">
        {rankings.length === 0 ? (
          // Empty State
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
          // Rankings List
          <div className="flex flex-col gap-2 h-full overflow-y-auto pr-1">
            {rankings.map((entry, index) => {
              const rank = index + 1;
              const isTopThree = rank <= 3;
              const rankColor = getRankColor(rank);

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
                  {/* Rank Badge */}
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-[13px] flex-shrink-0 font-primary ${
                      isTopThree ? 'text-black' : 'text-white bg-bg-card-alt'
                    }`}
                    style={isTopThree ? { background: rankColor } : {}}
                  >
                    {rank}
                  </div>

                  {/* Flag */}
                  <div className="flex-shrink-0">
                    <Flag code={entry.country} height="16" style={{ borderRadius: 3 }} />
                  </div>

                  {/* Nickname */}
                  <div
                    className={`flex-1 text-white text-[14px] overflow-hidden text-ellipsis whitespace-nowrap font-primary ${
                      isTopThree ? 'font-bold' : 'font-medium'
                    }`}
                  >
                    {entry.nickname}
                  </div>

                  {/* Score */}
                  <div
                    className={`text-[14px] font-bold flex-shrink-0 font-secondary`}
                    style={{ color: isTopThree ? rankColor : '#94a3b8' }}
                  >
                    {formatTime(entry.score)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center pt-4 border-t border-border-secondary w-full shrink-0">
        <div className="text-[10px] font-medium text-text-placeholder tracking-wide font-secondary">
          {getFooterText()}
        </div>
      </div>
    </div>
  );
}
