import React, { useState, useEffect } from 'react';
import Flag from 'react-world-flags';
import { getName } from 'country-list';
import { RankingEntry, getGlobalRanking, getCountryRanking, getDailyRanking } from '../gameSystem/ranking';

type RankingType = 'global' | 'country' | 'daily';

interface RankingPanelProps {
  userCountry?: string;
  refreshTrigger?: number;
}

export default function RankingPanel({ userCountry, refreshTrigger = 0 }: RankingPanelProps) {
  const [rankingType, setRankingType] = useState<RankingType>('global');
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>(userCountry ?? 'KR');

  useEffect(() => {
    loadRankings();
  }, [rankingType, selectedCountry, refreshTrigger]);

  const loadRankings = () => {
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
  };

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 탭 선택 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #333', paddingBottom: 8 }}>
        <button
          onClick={() => setRankingType('global')}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: rankingType === 'global' ? '#2563eb' : 'rgba(255,255,255,0.05)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: rankingType === 'global' ? 'bold' : 'normal',
            transition: 'all 0.2s',
          }}
        >
          전체
        </button>
        <button
          onClick={() => setRankingType('country')}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: rankingType === 'country' ? '#2563eb' : 'rgba(255,255,255,0.05)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: rankingType === 'country' ? 'bold' : 'normal',
            transition: 'all 0.2s',
          }}
        >
          국가별
        </button>
        <button
          onClick={() => setRankingType('daily')}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: rankingType === 'daily' ? '#2563eb' : 'rgba(255,255,255,0.05)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: rankingType === 'daily' ? 'bold' : 'normal',
            transition: 'all 0.2s',
          }}
        >
          일일
        </button>
      </div>

      {/* 국가 선택 (국가별 탭일 때만) */}
      {rankingType === 'country' && (
        <div style={{ marginBottom: 12 }}>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: 8,
              fontSize: 13,
              cursor: 'pointer',
            }}
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

      {/* 랭킹 리스트 */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {rankings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
            아직 기록이 없습니다
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rankings.map((entry, index) => {
              const rank = index + 1;
              const countryName = getName(entry.country) ?? entry.country;

              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    background: rank <= 3 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                    borderRadius: 8,
                    border: rank <= 3 ? `1px solid ${getRankColor(rank)}40` : '1px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* 순위 */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: rank <= 3 ? getRankColor(rank) : 'rgba(255,255,255,0.1)',
                      color: rank <= 3 ? '#000' : '#fff',
                      borderRadius: '50%',
                      fontWeight: 'bold',
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {rank}
                  </div>

                  {/* 국기 */}
                  <div style={{ flexShrink: 0 }}>
                    <Flag code={entry.country} height="16" style={{ borderRadius: 2 }} />
                  </div>

                  {/* 닉네임 */}
                  <div
                    style={{
                      flex: 1,
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: rank <= 3 ? 'bold' : 'normal',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entry.nickname}
                  </div>

                  {/* 점수 */}
                  <div
                    style={{
                      color: getRankColor(rank),
                      fontSize: 15,
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}
                  >
                    {formatTime(entry.score)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 하단 정보 */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid #333',
          fontSize: 11,
          color: '#666',
          textAlign: 'center',
        }}
      >
        {rankingType === 'global' && `전체 ${rankings.length}개 기록`}
        {rankingType === 'country' && `${getName(selectedCountry)} ${rankings.length}개 기록`}
        {rankingType === 'daily' && `오늘 ${rankings.length}개 기록`}
      </div>
    </div>
  );
}
