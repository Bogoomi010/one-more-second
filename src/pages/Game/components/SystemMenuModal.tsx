import React, { useEffect, useMemo, useState } from 'react';
import Toast from '../../../components/Toast';
import {
  ACHIEVEMENTS,
  BULLET_SKINS,
  PLAYER_SKINS,
  audioManager,
  ensureDailyChallenge,
  getBulletSkin,
  getPlayerSkin,
  loadProfile,
  loadSettings,
  resetProfile,
  resetSettings,
  saveProfile,
  saveSettings,
} from '../../../gameSystem';
import { BulletSkinId, PlayerProfile, PlayerSkinId } from '../../../gameSystem/types';
import { GameSettings } from '../../../gameSystem/settings';
import { syncLocalProfileToCloud } from '../../../services/userDataService';

type TabId = 'profile' | 'shop' | 'achievements' | 'settings';
type ShopSkinTab = 'player' | 'bullet';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  setProfile: (p: PlayerProfile) => void;
}

export default function SystemMenuModal({ isOpen, onClose, profile, setProfile }: Props) {
  const [tab, setTab] = useState<TabId>('profile');
  const [shopSkinTab, setShopSkinTab] = useState<ShopSkinTab>('player');
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
    void syncLocalProfileToCloud(next);
  }

  function buyPlayerSkin(id: PlayerSkinId) {
    const skin = getPlayerSkin(id);
    if (profile.ownedPlayerSkins.includes(id)) return;
    if (profile.coins < skin.priceCoins) return;

    persist({
      ...profile,
      coins: profile.coins - skin.priceCoins,
      ownedPlayerSkins: [...profile.ownedPlayerSkins, id],
      selectedPlayerSkinId: id,
    });
  }

  function buyBulletSkin(id: BulletSkinId) {
    const skin = getBulletSkin(id);
    if (profile.ownedBulletSkins.includes(id)) return;
    if (profile.coins < skin.priceCoins) return;

    persist({
      ...profile,
      coins: profile.coins - skin.priceCoins,
      ownedBulletSkins: [...profile.ownedBulletSkins, id],
      selectedBulletSkinId: id,
    });
  }

  function selectPlayerSkin(id: PlayerSkinId) {
    if (!profile.ownedPlayerSkins.includes(id)) return;
    persist({ ...profile, selectedPlayerSkinId: id });
  }

  function selectBulletSkin(id: BulletSkinId) {
    if (!profile.ownedBulletSkins.includes(id)) return;
    persist({ ...profile, selectedBulletSkinId: id });
  }

  function handleReset() {
    const next = resetProfile();
    setProfile(next);
    setTab('profile');
    setShopSkinTab('player');
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
          const normalized = loadProfile();
          setProfile(normalized);
          void syncLocalProfileToCloud(normalized);
          setToastVariant('success');
          setToastMessage('Profile imported.');
        } else {
          setToastVariant('error');
          setToastMessage('Invalid profile file.');
        }
      } catch {
        setToastVariant('error');
        setToastMessage('Unable to read profile file.');
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
            <p className="m-0 mt-1 text-[12px] text-text-secondary font-primary">Manage profile, shop, achievements and settings.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-border-secondary bg-bg-card text-text-primary hover:bg-bg-card-alt"
            aria-label="Close"
          >
            X
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {tabButton('profile', 'Profile')}
          {tabButton('shop', 'Shop')}
          {tabButton('achievements', 'Achievements')}
          {tabButton('settings', 'Settings')}
        </div>

        <div className="flex-1 overflow-auto pr-1">
          {tab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border-secondary bg-bg-card p-4">
                <h3 className="m-0 mb-3 text-[14px] text-text-primary font-primary">Basic Info</h3>
                <div className="space-y-2 text-[13px] text-text-secondary font-primary">
                  <div>Coins: <b className="text-text-primary">{profile.coins}</b></div>
                  <div>Best: <b className="text-text-primary">{profile.bestScore}s</b></div>
                  <div>Total Runs: <b className="text-text-primary">{profile.totalRuns}</b></div>
                  <div>Total Time: <b className="text-text-primary">{profile.totalSecondsSurvived}s</b></div>
                  <div>Player Skin: <b className="text-text-primary">{getPlayerSkin(profile.selectedPlayerSkinId).name}</b></div>
                  <div>Bullet Skin: <b className="text-text-primary">{getBulletSkin(profile.selectedBulletSkinId).name}</b></div>
                </div>
              </div>

              <div className="rounded-2xl border border-border-secondary bg-bg-card p-4">
                <h3 className="m-0 mb-3 text-[14px] text-text-primary font-primary">Daily Challenge</h3>
                <div className="space-y-2 text-[13px] text-text-secondary font-primary">
                  <div>Target: <b className="text-text-primary">{daily.targetSeconds}s survive</b></div>
                  <div>Reward: <b className="text-text-primary">{daily.rewardCoins} coins</b></div>
                  <div>Status: <b className="text-text-primary">{daily.completed ? 'Done' : 'Pending'}</b></div>
                </div>
              </div>

              <div className="md:col-span-2 flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 h-[46px] rounded-xl border border-red-500/40 bg-red-500/20 text-white text-[13px] font-semibold hover:bg-red-500/30"
                >
                  Reset Progress
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-[46px] rounded-xl border border-border-secondary bg-bg-card text-text-primary text-[13px] font-semibold hover:bg-bg-card-alt"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {tab === 'shop' && (
            <div className="space-y-6">
              <div className="text-[13px] text-text-secondary font-primary">
                Coins: <b className="text-text-primary">{profile.coins}</b>
              </div>

              <div className="flex gap-1 p-1.5 bg-bg-card rounded-2xl w-full">
                <button
                  type="button"
                  onClick={() => setShopSkinTab('player')}
                  className={`flex-1 py-2 bg-transparent border-none rounded-xl cursor-pointer text-[12px] font-bold transition-all duration-200 font-primary flex items-center justify-center ${
                    shopSkinTab === 'player' ? 'text-bg-primary bg-accent-green' : 'text-text-disabled'
                  }`}
                >
                  Player Skins
                </button>
                <button
                  type="button"
                  onClick={() => setShopSkinTab('bullet')}
                  className={`flex-1 py-2 bg-transparent border-none rounded-xl cursor-pointer text-[12px] font-bold transition-all duration-200 font-primary flex items-center justify-center ${
                    shopSkinTab === 'bullet' ? 'text-bg-primary bg-accent-green' : 'text-text-disabled'
                  }`}
                >
                  Bullet Skins
                </button>
              </div>

              {shopSkinTab === 'player' ? (
                <section>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PLAYER_SKINS.map((skin) => {
                      const owned = profile.ownedPlayerSkins.includes(skin.id);
                      const selected = profile.selectedPlayerSkinId === skin.id;
                      const canBuy = profile.coins >= skin.priceCoins;

                      return (
                        <div key={skin.id} className="rounded-2xl border border-border-secondary bg-bg-card p-4 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[14px] text-text-primary font-semibold font-primary">{skin.name}</div>
                            <div className="mt-1 text-[12px] text-text-secondary font-primary">{skin.priceCoins} coins</div>
                            <img
                              src={skin.image}
                              alt={`${skin.name} player`}
                              className="mt-2 w-8 h-8 object-contain rounded-md border border-border-secondary bg-bg-card-alt p-0.5"
                            />
                          </div>

                          {!owned ? (
                            <button
                              type="button"
                              onClick={() => buyPlayerSkin(skin.id)}
                              disabled={!canBuy}
                              className={`h-[40px] px-4 rounded-xl text-[12px] font-semibold ${
                                !canBuy
                                  ? 'bg-bg-card-alt text-text-disabled border border-border-secondary cursor-not-allowed'
                                  : 'bg-accent-green text-bg-primary hover:brightness-110'
                              }`}
                            >
                              BUY
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => selectPlayerSkin(skin.id)}
                              className={`h-[40px] px-4 rounded-xl text-[12px] font-semibold border ${
                                selected
                                  ? 'bg-accent-green-alpha border-accent-green text-accent-green'
                                  : 'bg-bg-card-alt border-border-secondary text-text-primary hover:bg-bg-card'
                              }`}
                            >
                              {selected ? 'SELECTED' : 'SELECT'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : (
                <section>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {BULLET_SKINS.map((skin) => {
                      const owned = profile.ownedBulletSkins.includes(skin.id);
                      const selected = profile.selectedBulletSkinId === skin.id;
                      const canBuy = profile.coins >= skin.priceCoins;

                      return (
                        <div key={skin.id} className="rounded-2xl border border-border-secondary bg-bg-card p-4 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[14px] text-text-primary font-semibold font-primary">{skin.name}</div>
                            <div className="mt-1 text-[12px] text-text-secondary font-primary">{skin.priceCoins} coins</div>
                            <img
                              src={skin.image}
                              alt={`${skin.name} bullet`}
                              className="mt-2 w-8 h-8 object-contain rounded-md border border-border-secondary bg-bg-card-alt p-0.5"
                            />
                          </div>

                          {!owned ? (
                            <button
                              type="button"
                              onClick={() => buyBulletSkin(skin.id)}
                              disabled={!canBuy}
                              className={`h-[40px] px-4 rounded-xl text-[12px] font-semibold ${
                                !canBuy
                                  ? 'bg-bg-card-alt text-text-disabled border border-border-secondary cursor-not-allowed'
                                  : 'bg-accent-green text-bg-primary hover:brightness-110'
                              }`}
                            >
                              BUY
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => selectBulletSkin(skin.id)}
                              className={`h-[40px] px-4 rounded-xl text-[12px] font-semibold border ${
                                selected
                                  ? 'bg-accent-green-alpha border-accent-green text-accent-green'
                                  : 'bg-bg-card-alt border-border-secondary text-text-primary hover:bg-bg-card'
                              }`}
                            >
                              {selected ? 'SELECTED' : 'SELECT'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
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
                      {a.title} {unlocked ? '(Done)' : ''}
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
                <h3 className="m-0 mb-3 text-[14px] text-text-primary font-primary">Graphics</h3>
                <div className="space-y-3 text-[12px] text-text-secondary font-primary">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.graphics.particles}
                      onChange={(e) => updateSetting('graphics', 'particles', e.target.checked)}
                    />
                    Particle Effects
                  </label>

                  <div>
                    <div className="mb-1">Hit Flash Intensity: {settings.graphics.hitFlashIntensity}%</div>
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
                    <div className="mb-1">FPS Limit</div>
                    <select
                      value={settings.graphics.fpsLimit}
                      onChange={(e) => updateSetting('graphics', 'fpsLimit', Number(e.target.value) as 30 | 60 | 0)}
                      className="w-full h-10 px-3 rounded-xl border border-border-secondary bg-bg-card-alt text-text-primary"
                    >
                      <option value="30">30 FPS</option>
                      <option value="60">60 FPS</option>
                      <option value="0">Unlimited</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border-secondary bg-bg-card p-4">
                <h3 className="m-0 mb-3 text-[14px] text-text-primary font-primary">Audio</h3>
                <div className="space-y-3 text-[12px] text-text-secondary font-primary">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.audio.bgmEnabled}
                      onChange={(e) => updateSetting('audio', 'bgmEnabled', e.target.checked)}
                    />
                    BGM Enabled
                  </label>
                  <div>
                    <div className="mb-1">BGM Volume: {settings.audio.bgmVolume}%</div>
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
                    SFX Enabled
                  </label>
                  <div>
                    <div className="mb-1">SFX Volume: {settings.audio.sfxVolume}%</div>
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
                <h3 className="m-0 mb-3 text-[14px] text-text-primary font-primary">Profile Management</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={exportProfile}
                    className="h-[42px] rounded-xl bg-bg-card-alt border border-border-secondary text-text-primary hover:bg-bg-card"
                  >
                    Export
                  </button>

                  <label className="h-[42px] rounded-xl bg-bg-card-alt border border-border-secondary text-text-primary hover:bg-bg-card flex items-center justify-center cursor-pointer">
                    Import
                    <input type="file" accept=".json" onChange={importProfile} className="hidden" />
                  </label>

                  <button
                    type="button"
                    onClick={handleResetSettings}
                    className="h-[42px] rounded-xl bg-red-500/20 border border-red-500/40 text-white hover:bg-red-500/30"
                  >
                    Reset Settings
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