import React, { useState } from 'react';
import { PlayerProfile } from '../gameSystem/types';
import { ACHIEVEMENTS } from '../gameSystem/achievements';

interface StatsPanelProps {
  profile: PlayerProfile;
}

type TabType = 'stats' | 'achievements';

export default function StatsPanel({ profile }: StatsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('stats');

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}초`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const unlockedAchievements = ACHIEVEMENTS.filter((ach) => profile.achievements[ach.id]);
  const achievementProgress = (unlockedAchievements.length / ACHIEVEMENTS.length) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 탭 선택 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #333', paddingBottom: 8 }}>
        <button
          onClick={() => setActiveTab('stats')}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: activeTab === 'stats' ? '#2563eb' : 'rgba(255,255,255,0.05)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: activeTab === 'stats' ? 'bold' : 'normal',
            transition: 'all 0.2s',
          }}
        >
          통계
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: activeTab === 'achievements' ? '#2563eb' : 'rgba(255,255,255,0.05)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: activeTab === 'achievements' ? 'bold' : 'normal',
            transition: 'all 0.2s',
          }}
        >
          업적 ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
        </button>
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'stats' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 최고 기록 */}
            <div
              style={{
                padding: 16,
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(37, 99, 235, 0.05) 100%)',
                borderRadius: 12,
                border: '1px solid rgba(37, 99, 235, 0.3)',
              }}
            >
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>최고 기록</div>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: '#fff' }}>{formatTime(profile.bestScore)}</div>
            </div>

            {/* 통계 그리드 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <StatCard label="총 플레이" value={`${profile.totalRuns}회`} />
              <StatCard label="보유 코인" value={`${profile.coins}`} icon="💰" />
              <StatCard label="총 생존 시간" value={formatTime(profile.totalSecondsSurvived)} />
              <StatCard label="평균 생존" value={formatTime(Math.floor(profile.totalSecondsSurvived / Math.max(1, profile.totalRuns)))} />
              <StatCard label="보유 스킨" value={`${profile.ownedSkins.length}개`} icon="🎨" />
              <StatCard label="업적 달성" value={`${unlockedAchievements.length}/${ACHIEVEMENTS.length}`} icon="🏆" />
            </div>

            {/* 데일리 챌린지 */}
            <div
              style={{
                padding: 16,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 12,
                border: '1px solid #333',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>
                오늘의 챌린지 {profile.dailyChallenge.completed ? '✅' : ''}
              </div>
              <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 4 }}>
                목표: {profile.dailyChallenge.targetSeconds}초 생존
              </div>
              <div style={{ fontSize: 13, color: '#34d399' }}>
                보상: {profile.dailyChallenge.rewardCoins} 코인
              </div>
              {profile.dailyChallenge.completed && (
                <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>완료됨!</div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* 진행도 바 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#9ca3af' }}>달성률</span>
                <span style={{ fontSize: 13, color: '#fff', fontWeight: 'bold' }}>
                  {achievementProgress.toFixed(0)}%
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: 8,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${achievementProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #2563eb 0%, #34d399 100%)',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>

            {/* 업적 리스트 */}
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = profile.achievements[ach.id];
              return (
                <div
                  key={ach.id}
                  style={{
                    padding: 12,
                    background: unlocked ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.03)',
                    borderRadius: 8,
                    border: unlocked ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid #333',
                    opacity: unlocked ? 1 : 0.6,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: unlocked ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)',
                        borderRadius: '50%',
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      {unlocked ? '✓' : '🔒'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 2 }}>
                        {ach.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{ach.desc}</div>
                      {unlocked && (
                        <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                          {formatDate(unlocked.unlockedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon?: string;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div
      style={{
        padding: 12,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        border: '1px solid #333',
      }}
    >
      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
        {icon && <span style={{ marginRight: 4 }}>{icon}</span>}
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>{value}</div>
    </div>
  );
}
