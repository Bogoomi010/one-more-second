import React, { useEffect, useMemo, useState } from 'react';
import Toast from '../../../components/Toast';
import {
  ACHIEVEMENTS,
  ensureDailyChallenge,
  getSkin,
  loadSettings,
  resetProfile,
  resetSettings,
  saveProfile,
  saveSettings,
  SKINS,
  audioManager,
} from '../../../gameSystem';
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<'info' | 'success' | 'error'>('info');

  const daily = useMemo(() => ensureDailyChallenge(profile).dailyChallenge, [profile]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  if (!isOpen) return null;

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
    value: unknown
  ) {
    const next = {
      ...settings,
      [category]: {
        ...(settings[category] as Record<string, unknown>),
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
        const imported = JSON.parse(e.target?.result as string) as PlayerProfile & { version?: number };
        if (imported && imported.version === 1) {
          saveProfile(imported);
          setProfile(imported);
          setToastVariant('success');
          setToastMessage('프로필을 가져왔습니다.');
        } else {
          setToastVariant('error');
          setToastMessage('올바르지 않은 프로필 파일입니다.');
        }
      } catch {
        setToastVariant('error');
        setToastMessage('파일을 읽을 수 없습니다.');
      }
    };
    reader.readAsText(file);
  }

  const tabButton = (id: TabId, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setTab(id)}
      className={`px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all border ${
        tab === id
          ? 'bg-accent-green text-bg-primary border-accent-green shadow-[0_0_12px_rgba(74,222,128,0.35)]'
          : 'bg-bg-card text-text-secondary border-border-secondary hover:bg-bg-card-alt hover:text-text-primary'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[10001] bg-black/75 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="w-[min(920px,calc(100vw-24px))] h-[min(760px,calc(100vh-24px))] rounded-[24px] border border-border-primary bg-bg-primary shadow-[0_24px_70px_rgba(0,0,0,0.55)] px-6 py-6 sm:px-8 sm:py-8 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="m-0 text-[28px] font-bold font-primary text-accent-green tracking-[1px]">SYSTEM MENU</h2>
            <p className="m-0 mt-1 text-[12px] text-text-secondary font-primary">게임 상태, 스킨, 설정을 관리합니다.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-border-secondary bg-bg-card text-text-primary hover:bg-bg-card-alt"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {tabButton('profile', '프로필')}
          {tabButton('shop', '상점')}
          {tabButton('achievements', '업적')}
          {tabButton('settings', '설정')}
        </div>

        <div className="flex-1 overflow-auto pr-1">
          {tab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border-secondary bg-bg-card p-4">
                <h3 className="m-0 mb-3 text-[14px] text-text-primary font-primary">기본 정보</h3>
                <div className="space-y-2 text-[13px] text-text-secondary font-primary">
                  <div>Coins: <b className="text-text-primary">{profile.coins}</b></div>
                  <div>Best: <b className="text-text-primary">{profile.bestScore}s</b></div>
                  <div>Total Runs: <b className="text-text-primary">{profile.totalRuns}</b></div>
                  <div>Total Time: <b className="text-text-primary">{profile.totalSecondsSurvived}s</b></div>
                  <div>Skin: <b className="text-text-primary">{getSkin(profile.selectedSkinId).name}</b></div>
                </div>
              </div>

              <div className="rounded-2xl border border-border-secondary bg-bg-card p-4">
                <h3 className="m-0 mb-3 text-[14px] text-text-primary font-primary">데일리 챌린지</h3>
                <div className="space-y-2 text-[13px] text-text-secondary font-primary">
                  <div>목표: <b className="text-text-primary">{daily.targetSeconds}s 생존</b></div>
                  <div>보상: <b className="text-text-primary">{daily.rewardCoins} 코인</b></div>
                  <div>상태: <b className="text-text-primary">{daily.completed ? '완료' : '미완료'}</b></div>
                </div>
              </div>

              <div className="md:col-span-2 flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 h-[46px] rounded-xl border border-red-500/40 bg-red-500/20 text-white text-[13px] font-semibold hover:bg-red-500/30"
                >
                  진행 초기화
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-[46px] rounded-xl border border-border-secondary bg-bg-card text-text-primary text-[13px] font-semibold hover:bg-bg-card-alt"
                >
                  닫기
                </button>
              </div>
            </div>
          )}

          {tab === 'shop' && (
            <div>
              <div className="mb-3 text-[13px] text-text-secondary font-primary">Coins: <b className="text-text-primary">{profile.coins}</b></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SKINS.map((skin) => {
                  const owned = profile.ownedSkins.includes(skin.id);
                  const selected = profile.selectedSkinId === skin.id;

                  return (
                    <div key={skin.id} className="rounded-2xl border border-border-secondary bg-bg-card p-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[14px] text-text-primary font-semibold font-primary">{skin.name}</div>
                        <div className="mt-1 text-[12px] text-text-secondary font-primary">{skin.priceCoins} coins</div>
                        <div className="mt-2 flex gap-2">
                          <span className="w-3 h-3 rounded-full inline-block" style={{ background: skin.playerColor }} />
                          <span className="w-3 h-3 rounded-full inline-block" style={{ background: skin.bulletColor }} />
                        </div>
                      </div>

                      {!owned ? (
                        <button
                          type="button"
                          onClick={() => buySkin(skin.id)}
                          disabled={profile.coins < skin.priceCoins}
                          className={`h-[40px] px-4 rounded-xl text-[12px] font-semibold ${
                            profile.coins < skin.priceCoins
                              ? 'bg-bg-card-alt text-text-disabled border border-border-secondary cursor-not-allowed'
                              : 'bg-accent-green text-bg-primary hover:brightness-110'
                          }`}
                        >
                          구매
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => selectSkin(skin.id)}
                          className={`h-[40px] px-4 rounded-xl text-[12px] font-semibold border ${
                            selected
                              ? 'bg-accent-green-alpha border-accent-green text-accent-green'
                              : 'bg-bg-card-alt border-border-secondary text-text-primary hover:bg-bg-card'
                          }`}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ACHIEVEMENTS.map((a) => {
                const unlocked = Boolean(profile.achievements[a.id]);
                return (
                  <div
                    key={a.id}
                    className={`rounded-2xl border p-4 ${
                      unlocked
                        ? 'border-accent-green/50 bg-accent-green-alpha'
                        : 'border-border-secondary bg-bg-card'
                    }`}
                  >
                    <div className="text-[14px] font-semibold font-primary text-text-primary">
                      {a.title} {unlocked ? '✓' : ''}
                    </div>
                    <div className="mt-1 text-[12px] text-text-secondary font-primary">{a.desc}</div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border-secondary bg-bg-card p-4">
                <h3 className="m-0 mb-3 text-[14px] text-text-primary font-primary">그래픽</h3>
                <div className="space-y-3 text-[12px] text-text-secondary font-primary">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.graphics.particles}
                      onChange={(e) => updateSetting('graphics', 'particles', e.target.checked)}
                    />
                    파티클 효과
                  </label>

                  <div>
                    <div className="mb-1">피격 플래시 강도: {settings.graphics.hitFlashIntensity}%</div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.graphics.hitFlashIntensity}
                      onChange={(e) => updateSetting('graphics', 'hitFlashIntensity', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="mb-1">FPS 제한</div>
                    <select
                      value={settings.graphics.fpsLimit}
                      onChange={(e) => updateSetting('graphics', 'fpsLimit', Number(e.target.value) as 30 | 60 | 0)}
                      className="w-full h-10 px-3 rounded-xl border border-border-secondary bg-bg-card-alt text-text-primary"
                    >
                      <option value="30">30 FPS</option>
                      <option value="60">60 FPS</option>
                      <option value="0">무제한</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border-secondary bg-bg-card p-4">
                <h3 className="m-0 mb-3 text-[14px] text-text-primary font-primary">오디오</h3>
                <div className="space-y-3 text-[12px] text-text-secondary font-primary">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.audio.bgmEnabled}
                      onChange={(e) => updateSetting('audio', 'bgmEnabled', e.target.checked)}
                    />
                    BGM 활성화
                  </label>
                  <div>
                    <div className="mb-1">BGM 볼륨: {settings.audio.bgmVolume}%</div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.audio.bgmVolume}
                      onChange={(e) => updateSetting('audio', 'bgmVolume', Number(e.target.value))}
                      className="w-full"
                      disabled={!settings.audio.bgmEnabled}
                    />
                  </div>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.audio.sfxEnabled}
                      onChange={(e) => updateSetting('audio', 'sfxEnabled', e.target.checked)}
                    />
                    효과음 활성화
                  </label>
                  <div>
                    <div className="mb-1">효과음 볼륨: {settings.audio.sfxVolume}%</div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.audio.sfxVolume}
                      onChange={(e) => updateSetting('audio', 'sfxVolume', Number(e.target.value))}
                      className="w-full"
                      disabled={!settings.audio.sfxEnabled}
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 rounded-2xl border border-border-secondary bg-bg-card p-4">
                <h3 className="m-0 mb-3 text-[14px] text-text-primary font-primary">프로필 관리</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={exportProfile}
                    className="h-[42px] rounded-xl bg-bg-card-alt border border-border-secondary text-text-primary hover:bg-bg-card"
                  >
                    내보내기
                  </button>

                  <label className="h-[42px] rounded-xl bg-bg-card-alt border border-border-secondary text-text-primary hover:bg-bg-card flex items-center justify-center cursor-pointer">
                    가져오기
                    <input type="file" accept=".json" onChange={importProfile} className="hidden" />
                  </label>

                  <button
                    type="button"
                    onClick={handleResetSettings}
                    className="h-[42px] rounded-xl bg-red-500/20 border border-red-500/40 text-white hover:bg-red-500/30"
                  >
                    설정 초기화
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Toast message={toastMessage} visible={Boolean(toastMessage)} variant={toastVariant} />
    </div>
  );
}
