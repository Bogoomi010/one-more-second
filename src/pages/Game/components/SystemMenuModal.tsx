import React, { useMemo, useState } from 'react';
import Modal from '../../../components/Modal';
import { ACHIEVEMENTS, ensureDailyChallenge, getSkin, resetProfile, saveProfile, SKINS, loadSettings, saveSettings, audioManager, resetSettings } from '../../../gameSystem';
import { PlayerProfile, SkinId } from '../../../gameSystem/types';
import { GameSettings } from '../../../gameSystem/settings';

type TabId = 'profile' | 'shop' | 'achievements' | 'settings';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  setProfile: (p: PlayerProfile) => void;
}

export default function SystemMenuModal({ isOpen, onClose, profile, setProfile }: Props) {
  const [tab, setTab] = useState<TabId>('profile');
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());

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

  function updateSetting<K extends keyof GameSettings>(
    category: K,
    key: keyof GameSettings[K],
    value: any
  ) {
    const next = {
      ...settings,
      [category]: {
        ...(settings[category] as any),
        [key]: value,
      },
    } as GameSettings;
    setSettings(next);
    saveSettings(next);
    audioManager.updateVolumes();
  }

  function handleResetSettings() {
    const next = resetSettings();
    setSettings(next);
    audioManager.updateVolumes();
  }

  function exportProfile() {
    const data = JSON.stringify(profile, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oms-profile-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importProfile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (imported && imported.version === 1) {
          saveProfile(imported);
          setProfile(imported);
          alert('프로필을 가져왔습니다!');
        } else {
          alert('잘못된 프로필 파일입니다.');
        }
      } catch {
        alert('파일을 읽을 수 없습니다.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <Modal isOpen={isOpen}>
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button style={headerBtnStyle} onClick={() => setTab('profile')}>프로필</button>
          <button style={headerBtnStyle} onClick={() => setTab('shop')}>상점</button>
          <button style={headerBtnStyle} onClick={() => setTab('achievements')}>업적</button>
          <button style={headerBtnStyle} onClick={() => setTab('settings')}>설정</button>
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

          {tab === 'settings' && (
            <div style={{ color: '#e5e7eb', fontSize: 12, lineHeight: 1.5 }}>
              {/* 그래픽 설정 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#fff', marginBottom: 8, fontSize: 14 }}><b>그래픽</b></div>
                
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.graphics.particles}
                      onChange={(e) => updateSetting('graphics', 'particles', e.target.checked)}
                    />
                    <span>파티클 효과</span>
                  </label>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', marginBottom: 4 }}>
                    피격 플래시 강도: {settings.graphics.hitFlashIntensity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.graphics.hitFlashIntensity}
                    onChange={(e) => updateSetting('graphics', 'hitFlashIntensity', Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', marginBottom: 4 }}>프레임 제한</label>
                  <select
                    value={settings.graphics.fpsLimit}
                    onChange={(e) => updateSetting('graphics', 'fpsLimit', Number(e.target.value) as 30 | 60 | 0)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.06)',
                      color: '#fff',
                      fontSize: 12,
                    }}
                  >
                    <option value="30">30 FPS</option>
                    <option value="60">60 FPS</option>
                    <option value="0">무제한</option>
                  </select>
                </div>
              </div>

              {/* 사운드 설정 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#fff', marginBottom: 8, fontSize: 14 }}><b>사운드</b></div>
                
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.audio.bgmEnabled}
                      onChange={(e) => updateSetting('audio', 'bgmEnabled', e.target.checked)}
                    />
                    <span>BGM 활성화</span>
                  </label>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', marginBottom: 4 }}>
                    BGM 볼륨: {settings.audio.bgmVolume}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.audio.bgmVolume}
                    onChange={(e) => updateSetting('audio', 'bgmVolume', Number(e.target.value))}
                    style={{ width: '100%' }}
                    disabled={!settings.audio.bgmEnabled}
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.audio.sfxEnabled}
                      onChange={(e) => updateSetting('audio', 'sfxEnabled', e.target.checked)}
                    />
                    <span>효과음 활성화</span>
                  </label>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', marginBottom: 4 }}>
                    효과음 볼륨: {settings.audio.sfxVolume}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.audio.sfxVolume}
                    onChange={(e) => updateSetting('audio', 'sfxVolume', Number(e.target.value))}
                    style={{ width: '100%' }}
                    disabled={!settings.audio.sfxEnabled}
                  />
                </div>
              </div>

              {/* 프로필 관리 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#fff', marginBottom: 8, fontSize: 14 }}><b>프로필 관리</b></div>
                
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button
                    onClick={exportProfile}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(59,130,246,0.25)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    내보내기
                  </button>
                  <label
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(59,130,246,0.25)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 12,
                      textAlign: 'center',
                    }}
                  >
                    가져오기
                    <input
                      type="file"
                      accept=".json"
                      onChange={importProfile}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                <button
                  onClick={handleResetSettings}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid rgba(239,68,68,0.35)',
                    background: 'rgba(239,68,68,0.12)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  설정 초기화
                </button>
              </div>

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
          )}
        </div>
      </div>
    </Modal>
  );
}
