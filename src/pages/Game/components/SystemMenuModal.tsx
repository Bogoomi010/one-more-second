import React, { useMemo, useState } from 'react';
import Modal from '../../../components/Modal';
import { ACHIEVEMENTS, ensureDailyChallenge, getSkin, loadProfile, resetProfile, saveProfile, SKINS } from '../../../gameSystem';
import { PlayerProfile, SkinId } from '../../../gameSystem/types';

type TabId = 'profile' | 'shop' | 'achievements';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  setProfile: (p: PlayerProfile) => void;
}

export default function SystemMenuModal({ isOpen, onClose, profile, setProfile }: Props) {
  const [tab, setTab] = useState<TabId>('profile');

  const daily = useMemo(() => ensureDailyChallenge(profile).dailyChallenge, [profile]);

  const headerBtnStyle: React.CSSProperties = {
    flex: 1,
    padding: '8px 10px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: 12,
    cursor: 'pointer',
  };

  function persist(next: PlayerProfile) {
    saveProfile(next);
    setProfile(next);
  }

  function buySkin(id: SkinId) {
    const skin = getSkin(id);
    if (profile.ownedSkins.includes(id)) return;
    if (profile.coins < skin.priceCoins) return;

    persist({
      ...profile,
      coins: profile.coins - skin.priceCoins,
      ownedSkins: [...profile.ownedSkins, id],
      selectedSkinId: id,
    });
  }

  function selectSkin(id: SkinId) {
    if (!profile.ownedSkins.includes(id)) return;
    persist({ ...profile, selectedSkinId: id });
  }

  function handleReset() {
    const next = resetProfile();
    setProfile(next);
    setTab('profile');
  }

  return (
    <Modal isOpen={isOpen}>
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button style={headerBtnStyle} onClick={() => setTab('profile')}>프로필</button>
          <button style={headerBtnStyle} onClick={() => setTab('shop')}>상점</button>
          <button style={headerBtnStyle} onClick={() => setTab('achievements')}>업적</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {tab === 'profile' && (
            <div style={{ color: '#e5e7eb', fontSize: 12, lineHeight: 1.6 }}>
              <div style={{ marginBottom: 10 }}>
                <div><b>Coins</b>: {profile.coins}</div>
                <div><b>Best</b>: {profile.bestScore}s</div>
                <div><b>Total Runs</b>: {profile.totalRuns}</div>
                <div><b>Total Time</b>: {profile.totalSecondsSurvived}s</div>
                <div><b>Skin</b>: {getSkin(profile.selectedSkinId).name}</div>
              </div>

              <div style={{ padding: 10, borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}>
                <div style={{ color: '#fff', marginBottom: 6 }}><b>Daily Challenge</b></div>
                <div>목표: <b>{daily.targetSeconds}s</b> 생존</div>
                <div>보상: <b>{daily.rewardCoins}</b> 코인</div>
                <div>상태: {daily.completed ? '완료' : '미완료'}</div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  onClick={handleReset}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: 12,
                    border: '1px solid rgba(239,68,68,0.35)',
                    background: 'rgba(239,68,68,0.12)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  진행 초기화
                </button>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          )}

          {tab === 'shop' && (
            <div style={{ color: '#e5e7eb', fontSize: 12, lineHeight: 1.5 }}>
              <div style={{ marginBottom: 10 }}><b>Coins</b>: {profile.coins}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {SKINS.map((skin) => {
                  const owned = profile.ownedSkins.includes(skin.id);
                  const selected = profile.selectedSkinId === skin.id;

                  return (
                    <div key={skin.id} style={{
                      padding: 10,
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ color: '#fff' }}><b>{skin.name}</b></div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ width: 10, height: 10, borderRadius: 999, background: skin.playerColor, display: 'inline-block' }} />
                          <span style={{ width: 10, height: 10, borderRadius: 999, background: skin.bulletColor, display: 'inline-block' }} />
                          <span style={{ opacity: 0.9 }}>{skin.priceCoins} coins</span>
                        </div>
                      </div>

                      {!owned ? (
                        <button
                          onClick={() => buySkin(skin.id)}
                          disabled={profile.coins < skin.priceCoins}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 10,
                            border: '1px solid rgba(255,255,255,0.12)',
                            background: profile.coins < skin.priceCoins ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.25)',
                            color: '#fff',
                            cursor: profile.coins < skin.priceCoins ? 'not-allowed' : 'pointer',
                            fontSize: 12,
                          }}
                        >
                          구매
                        </button>
                      ) : (
                        <button
                          onClick={() => selectSkin(skin.id)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 10,
                            border: '1px solid rgba(255,255,255,0.12)',
                            background: selected ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >
                          {selected ? '선택됨' : '선택'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'achievements' && (
            <div style={{ color: '#e5e7eb', fontSize: 12, lineHeight: 1.5 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ACHIEVEMENTS.map((a) => {
                  const unlocked = Boolean(profile.achievements[a.id]);
                  return (
                    <div key={a.id} style={{
                      padding: 10,
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: unlocked ? 'rgba(34,197,94,0.14)' : 'rgba(255,255,255,0.04)',
                    }}>
                      <div style={{ color: '#fff', marginBottom: 3 }}><b>{a.title}</b> {unlocked ? '(완료)' : ''}</div>
                      <div style={{ opacity: 0.9 }}>{a.desc}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 12 }}>
                <button
                  onClick={onClose}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
