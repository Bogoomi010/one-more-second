import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Toast from '../../../components/Toast';
import {
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
import { PlayerProfile } from '../../../gameSystem/types';
import { GameSettings } from '../../../gameSystem/settings';
import { syncLocalProfileToCloud } from '../../../services/userDataService';
import { useModalAccessibility } from '../../../components/useModalAccessibility';

export type SystemMenuTabId = 'profile' | 'settings';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  setProfile: (p: PlayerProfile) => void;
  onSettingsChange?: (next: GameSettings) => void;
  isLoggedIn?: boolean;
  visibleTabs?: SystemMenuTabId[];
  initialTab?: SystemMenuTabId;
}

export default function SystemMenuModal({
  isOpen,
  onClose,
  profile,
  setProfile,
  onSettingsChange,
  isLoggedIn = true,
  visibleTabs,
  initialTab,
}: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<SystemMenuTabId>('settings');
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<'info' | 'success' | 'error'>('info');
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const subtitleId = useId();

  useModalAccessibility({
    isOpen,
    dialogRef,
    onClose,
    autoFocusSelector: '[data-modal-autofocus="system-menu-close"]',
  });

  const availableTabs = useMemo<SystemMenuTabId[]>(() => {
    const defaultTabs: SystemMenuTabId[] = ['profile', 'settings'];
    const baseTabs: SystemMenuTabId[] = visibleTabs && visibleTabs.length > 0 ? visibleTabs : defaultTabs;
    const uniqueTabs = Array.from(new Set<SystemMenuTabId>(baseTabs));
    const filteredTabs = isLoggedIn ? uniqueTabs : uniqueTabs.filter((tabId) => tabId !== 'profile');
    return filteredTabs.length > 0 ? filteredTabs : ['settings'];
  }, [isLoggedIn, visibleTabs]);

  const daily = useMemo(() => ensureDailyChallenge(profile).dailyChallenge, [profile]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (!isOpen) return;

    const nextInitialTab =
      initialTab && availableTabs.includes(initialTab)
        ? initialTab
        : availableTabs[0];

    setTab(nextInitialTab);
    setSettings(loadSettings());
  }, [availableTabs, initialTab, isOpen]);

  if (!isOpen) return null;

  function handleReset() {
    const next = resetProfile();
    setProfile(next);
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
    onSettingsChange?.(next);
  }

  function handleResetSettings() {
    const next = resetSettings();
    setSettings(next);
    audioManager.updateVolumes();
    onSettingsChange?.(next);
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
          setToastMessage(t('systemMenu.importSuccess'));
        } else {
          setToastVariant('error');
          setToastMessage(t('systemMenu.importInvalid'));
        }
      } catch {
        setToastVariant('error');
        setToastMessage(t('systemMenu.importReadError'));
      }
    };
    reader.readAsText(file);
  }

  const tabButton = (id: SystemMenuTabId, label: string) => (
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
    <div
      className="fixed inset-0 z-[10001] bg-black/75 backdrop-blur-lg flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-[min(1120px,calc(100vw-24px))] max-h-[calc(100vh-24px)] rounded-[24px] border border-border-primary bg-bg-primary shadow-[0_24px_70px_rgba(0,0,0,0.55)] px-6 py-6 sm:px-8 sm:py-8 flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2
              id={titleId}
              className="m-0 text-[28px] font-bold font-primary text-accent-green tracking-[1px]"
            >
              {t('systemMenu.title')}
            </h2>
            <p id={subtitleId} className="m-0 mt-1 text-[12px] text-text-secondary font-primary">
              {t('systemMenu.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-modal-autofocus="system-menu-close"
            className="w-10 h-10 rounded-xl border border-border-secondary bg-bg-card text-text-primary hover:bg-bg-card-alt"
            aria-label={t('systemMenu.closeAria')}
          >
            X
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {availableTabs.map((tabId) => tabButton(tabId, t(`systemMenu.${tabId}`)))}
        </div>

        <div className="flex-1 min-h-0 overflow-auto pr-1">
          {tab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border-secondary bg-bg-card p-4">
                <h3 className="m-0 mb-3 text-[14px] text-text-primary font-primary">{t('systemMenu.basicInfo')}</h3>
                <div className="space-y-2 text-[13px] text-text-secondary font-primary">
                  <div>{t('systemMenu.coins')}: <b className="text-text-primary">{profile.coins}</b></div>
                  <div>{t('systemMenu.best')}: <b className="text-text-primary">{t('systemMenu.secondsValue', { value: profile.bestScore })}</b></div>
                  <div>{t('systemMenu.totalRuns')}: <b className="text-text-primary">{profile.totalRuns}</b></div>
                  <div>{t('systemMenu.totalTime')}: <b className="text-text-primary">{t('systemMenu.secondsValue', { value: profile.totalSecondsSurvived })}</b></div>
                  <div>{t('systemMenu.playerSkin')}: <b className="text-text-primary">{getPlayerSkin(profile.selectedPlayerSkinId).name}</b></div>
                  <div>{t('systemMenu.bulletSkin')}: <b className="text-text-primary">{getBulletSkin(profile.selectedBulletSkinId).name}</b></div>
                </div>
              </div>

              <div className="rounded-2xl border border-border-secondary bg-bg-card p-4">
                <h3 className="m-0 mb-3 text-[14px] text-text-primary font-primary">{t('systemMenu.dailyChallenge')}</h3>
                <div className="space-y-2 text-[13px] text-text-secondary font-primary">
                  <div>
                    {t('systemMenu.dailyChallengeGoal', { seconds: daily.targetSeconds })}
                  </div>
                  <div>
                    {t('systemMenu.dailyChallengeReward', { coins: daily.rewardCoins })}
                  </div>
                  <div>
                    {t('systemMenu.dailyChallengeStatus', {
                      status: daily.completed
                        ? t('systemMenu.dailyChallengeCompleted')
                        : t('systemMenu.dailyChallengeIncomplete'),
                    })}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 h-[46px] rounded-xl border border-red-500/40 bg-red-500/20 text-white text-[13px] font-semibold hover:bg-red-500/30"
                >
                  {t('systemMenu.resetProgress')}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-[46px] rounded-xl border border-border-secondary bg-bg-card text-text-primary text-[13px] font-semibold hover:bg-bg-card-alt"
                >
                  {t('systemMenu.close')}
                </button>
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border-secondary bg-bg-card p-4">
                <h3 className="m-0 mb-3 text-[14px] text-text-primary font-primary">{t('settings.graphics')}</h3>
                <div className="space-y-3 text-[12px] text-text-secondary font-primary">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.graphics.particles}
                      onChange={(e) => updateSetting('graphics', 'particles', e.target.checked)}
                    />
                    {t('settings.particles')}
                  </label>

                  <div>
                    <div className="mb-1">{t('settings.hitFlash', { intensity: settings.graphics.hitFlashIntensity })}</div>
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
                    <div className="mb-1">{t('settings.fpsLimit')}</div>
                    <select
                      value={settings.graphics.fpsLimit}
                      onChange={(e) => updateSetting('graphics', 'fpsLimit', Number(e.target.value) as 30 | 60 | 0)}
                      className="w-full h-10 px-3 rounded-xl border border-border-secondary bg-bg-card-alt text-text-primary"
                    >
                      <option value="30">{t('settings.fps30')}</option>
                      <option value="60">{t('settings.fps60')}</option>
                      <option value="0">{t('settings.fpsUnlimited')}</option>
                    </select>
                  </div>

                  <div>
                    <div className="mb-1">
                      {t('settings.touchMoveSpeed', { value: settings.graphics.touchMoveSpeed })}
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      step="5"
                      value={settings.graphics.touchMoveSpeed}
                      onChange={(e) => updateSetting('graphics', 'touchMoveSpeed', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="mb-1">
                      {t('settings.touchDeadzone', { value: settings.graphics.touchDeadzone })}
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      step="1"
                      value={settings.graphics.touchDeadzone}
                      onChange={(e) => updateSetting('graphics', 'touchDeadzone', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border-secondary bg-bg-card p-4">
                <h3 className="m-0 mb-3 text-[14px] text-text-primary font-primary">{t('settings.audio')}</h3>
                <div className="space-y-3 text-[12px] text-text-secondary font-primary">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.audio.bgmEnabled}
                      onChange={(e) => updateSetting('audio', 'bgmEnabled', e.target.checked)}
                    />
                    {t('settings.bgmEnabled')}
                  </label>
                  <div>
                    <div className="mb-1">{t('settings.bgmVolume', { volume: settings.audio.bgmVolume })}</div>
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
                    {t('settings.sfxEnabled')}
                  </label>
                  <div>
                    <div className="mb-1">{t('settings.sfxVolume', { volume: settings.audio.sfxVolume })}</div>
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
                <h3 className="m-0 mb-3 text-[14px] text-text-primary font-primary">{t('settings.profileManagement')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={exportProfile}
                    className="h-[42px] rounded-xl bg-bg-card-alt border border-border-secondary text-text-primary hover:bg-bg-card"
                  >
                    {t('settings.export')}
                  </button>

                  <label className="h-[42px] rounded-xl bg-bg-card-alt border border-border-secondary text-text-primary hover:bg-bg-card flex items-center justify-center cursor-pointer">
                    {t('settings.import')}
                    <input type="file" accept=".json" onChange={importProfile} className="hidden" />
                  </label>

                  <button
                    type="button"
                    onClick={handleResetSettings}
                    className="h-[42px] rounded-xl bg-red-500/20 border border-red-500/40 text-white hover:bg-red-500/30"
                  >
                    {t('settings.resetSettings')}
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
