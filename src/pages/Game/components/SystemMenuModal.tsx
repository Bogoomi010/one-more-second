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
      <div className="w-full h-full flex flex-col">
        <div className="flex gap-2 mb-3">
          <button
            className={`flex-1 px-2.5 py-2 rounded-[10px] border text-xs cursor-pointer transition-colors ${
              tab === 'profile'
                ? 'border-accent-blue bg-accent-blue/30 text-white'
                : 'border-white/15 bg-white/10 text-white'
            }`}
            onClick={() => setTab('profile')}
          >
            프로필
          </button>
          <button
            className={`flex-1 px-2.5 py-2 rounded-[10px] border text-xs cursor-pointer transition-colors ${
              tab === 'shop'
                ? 'border-accent-blue bg-accent-blue/30 text-white'
                : 'border-white/15 bg-white/10 text-white'
            }`}
            onClick={() => setTab('shop')}
          >
            상점
          </button>
          <button
            className={`flex-1 px-2.5 py-2 rounded-[10px] border text-xs cursor-pointer transition-colors ${
              tab === 'achievements'
                ? 'border-accent-blue bg-accent-blue/30 text-white'
                : 'border-white/15 bg-white/10 text-white'
            }`}
            onClick={() => setTab('achievements')}
          >
            업적
          </button>
          <button
            className={`flex-1 px-2.5 py-2 rounded-[10px] border text-xs cursor-pointer transition-colors ${
              tab === 'settings'
                ? 'border-accent-blue bg-accent-blue/30 text-white'
                : 'border-white/15 bg-white/10 text-white'
            }`}
            onClick={() => setTab('settings')}
          >
            설정
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {tab === 'profile' && (
            <div className="text-gray-200 text-xs leading-relaxed">
              <div className="mb-2.5">
                <div><b>Coins</b>: {profile.coins}</div>
                <div><b>Best</b>: {profile.bestScore}s</div>
                <div><b>Total Runs</b>: {profile.totalRuns}</div>
                <div><b>Total Time</b>: {profile.totalSecondsSurvived}s</div>
                <div><b>Skin</b>: {getSkin(profile.selectedSkinId).name}</div>
              </div>

              <div className="p-2.5 rounded-xl border border-white/15 bg-white/5">
                <div className="text-white mb-1.5"><b>Daily Challenge</b></div>
                <div>목표: <b>{daily.targetSeconds}s</b> 생존</div>
                <div>보상: <b>{daily.rewardCoins}</b> 코인</div>
                <div>상태: {daily.completed ? '완료' : '미완료'}</div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-2.5 py-2 rounded-xl border border-red-500/40 bg-red-500/20 text-white cursor-pointer text-xs transition-colors hover:bg-red-500/30"
                >
                  진행 초기화
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-2.5 py-2 rounded-xl border border-white/15 bg-white/10 text-white cursor-pointer text-xs transition-colors hover:bg-white/20"
                >
                  닫기
                </button>
              </div>
            </div>
          )}

          {tab === 'shop' && (
            <div className="text-gray-200 text-xs leading-relaxed">
              <div className="mb-2.5"><b>Coins</b>: {profile.coins}</div>
              <div className="flex flex-col gap-2.5">
                {SKINS.map((skin) => {
                  const owned = profile.ownedSkins.includes(skin.id);
                  const selected = profile.selectedSkinId === skin.id;

                  return (
                    <div
                      key={skin.id}
                      className="p-2.5 rounded-xl border border-white/15 bg-white/5 flex items-center justify-between gap-2"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="text-white"><b>{skin.name}</b></div>
                        <div className="flex gap-1.5 items-center">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: skin.playerColor }} />
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: skin.bulletColor }} />
                          <span className="opacity-90">{skin.priceCoins} coins</span>
                        </div>
                      </div>

                      {!owned ? (
                        <button
                          onClick={() => buySkin(skin.id)}
                          disabled={profile.coins < skin.priceCoins}
                          className={`px-2.5 py-2 rounded-[10px] border text-white text-xs ${
                            profile.coins < skin.priceCoins
                              ? 'border-white/15 bg-white/10 cursor-not-allowed'
                              : 'border-white/15 bg-blue-500/30 cursor-pointer hover:bg-blue-500/40'
                          }`}
                        >
                          구매
                        </button>
                      ) : (
                        <button
                          onClick={() => selectSkin(skin.id)}
                          className={`px-2.5 py-2 rounded-[10px] border text-white text-xs cursor-pointer ${
                            selected
                              ? 'border-white/15 bg-green-500/30'
                              : 'border-white/15 bg-white/10 hover:bg-white/20'
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
            <div className="text-gray-200 text-xs leading-relaxed">
              <div className="flex flex-col gap-2.5">
                {ACHIEVEMENTS.map((a) => {
                  const unlocked = Boolean(profile.achievements[a.id]);
                  return (
                    <div
                      key={a.id}
                      className={`p-2.5 rounded-xl border ${
                        unlocked
                          ? 'border-white/15 bg-green-500/20'
                          : 'border-white/15 bg-white/5'
                      }`}
                    >
                      <div className="text-white mb-1">
                        <b>{a.title}</b> {unlocked ? '(완료)' : ''}
                      </div>
                      <div className="opacity-90">{a.desc}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3">
                <button
                  onClick={onClose}
                  className="w-full px-2.5 py-2 rounded-xl border border-white/15 bg-white/10 text-white cursor-pointer text-xs hover:bg-white/20 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div className="text-gray-200 text-xs leading-relaxed">
              {/* 그래픽 설정 */}
              <div className="mb-4">
                <div className="text-white mb-2 text-sm"><b>그래픽</b></div>
                
                <div className="mb-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.graphics.particles}
                      onChange={(e) => updateSetting('graphics', 'particles', e.target.checked)}
                    />
                    <span>파티클 효과</span>
                  </label>
                </div>

                <div className="mb-2.5">
                  <label className="block mb-1">
                    피격 플래시 강도: {settings.graphics.hitFlashIntensity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.graphics.hitFlashIntensity}
                    onChange={(e) => updateSetting('graphics', 'hitFlashIntensity', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="mb-2.5">
                  <label className="block mb-1">프레임 제한</label>
                  <select
                    value={settings.graphics.fpsLimit}
                    onChange={(e) => updateSetting('graphics', 'fpsLimit', Number(e.target.value) as 30 | 60 | 0)}
                    className="w-full px-2 py-1.5 rounded-lg border border-white/15 bg-white/10 text-white text-xs"
                  >
                    <option value="30">30 FPS</option>
                    <option value="60">60 FPS</option>
                    <option value="0">무제한</option>
                  </select>
                </div>
              </div>

              {/* 사운드 설정 */}
              <div className="mb-4">
                <div className="text-white mb-2 text-sm"><b>사운드</b></div>
                
                <div className="mb-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.audio.bgmEnabled}
                      onChange={(e) => updateSetting('audio', 'bgmEnabled', e.target.checked)}
                    />
                    <span>BGM 활성화</span>
                  </label>
                </div>

                <div className="mb-2.5">
                  <label className="block mb-1">
                    BGM 볼륨: {settings.audio.bgmVolume}%
                  </label>
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

                <div className="mb-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.audio.sfxEnabled}
                      onChange={(e) => updateSetting('audio', 'sfxEnabled', e.target.checked)}
                    />
                    <span>효과음 활성화</span>
                  </label>
                </div>

                <div className="mb-2.5">
                  <label className="block mb-1">
                    효과음 볼륨: {settings.audio.sfxVolume}%
                  </label>
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

              {/* 프로필 관리 */}
              <div className="mb-4">
                <div className="text-white mb-2 text-sm"><b>프로필 관리</b></div>
                
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={exportProfile}
                    className="flex-1 px-2.5 py-2 rounded-[10px] border border-white/15 bg-blue-500/30 text-white cursor-pointer text-xs hover:bg-blue-500/40 transition-colors"
                  >
                    내보내기
                  </button>
                  <label
                    className="flex-1 px-2.5 py-2 rounded-[10px] border border-white/15 bg-blue-500/30 text-white cursor-pointer text-xs text-center hover:bg-blue-500/40 transition-colors"
                  >
                    가져오기
                    <input
                      type="file"
                      accept=".json"
                      onChange={importProfile}
                      className="hidden"
                    />
                  </label>
                </div>

                <button
                  onClick={handleResetSettings}
                  className="w-full px-2.5 py-2 rounded-[10px] border border-red-500/40 bg-red-500/20 text-white cursor-pointer text-xs hover:bg-red-500/30 transition-colors"
                >
                  설정 초기화
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full px-2.5 py-2 rounded-xl border border-white/15 bg-white/10 text-white cursor-pointer text-xs hover:bg-white/20 transition-colors"
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
