import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BULLET_SKINS,
  PLAYER_SKINS,
  getBulletSkin,
  getPlayerSkin,
  saveProfile,
} from '../../../gameSystem';
import { BulletSkinId, PlayerProfile, PlayerSkinId } from '../../../gameSystem/types';
import { syncLocalProfileToCloud } from '../../../services/userDataService';

type ShopSkinTab = 'player' | 'bullet';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  setProfile: (profile: PlayerProfile) => void;
}

export default function ShopModal({ isOpen, onClose, profile, setProfile }: ShopModalProps) {
  const { t } = useTranslation();
  const [shopSkinTab, setShopSkinTab] = useState<ShopSkinTab>('player');

  useEffect(() => {
    if (!isOpen) return;
    setShopSkinTab('player');
  }, [isOpen]);

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

  return (
    <div className="fixed inset-0 z-[10001] bg-black/75 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="w-[min(920px,calc(100vw-24px))] h-[min(760px,calc(100vh-24px))] rounded-[24px] border border-border-primary bg-bg-primary shadow-[0_24px_70px_rgba(0,0,0,0.55)] px-6 py-6 sm:px-8 sm:py-8 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="m-0 text-[28px] font-bold font-primary text-accent-green tracking-[1px]">{t('systemMenu.shop')}</h2>
            <p className="m-0 mt-1 text-[12px] text-text-secondary font-primary">{t('systemMenu.shopSubtitle', { defaultValue: 'Buy and equip skins.' })}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-border-secondary bg-bg-card text-text-primary hover:bg-bg-card-alt"
            aria-label={t('systemMenu.closeAria')}
          >
            X
          </button>
        </div>

        <div className="flex-1 overflow-auto pr-1 space-y-6">
          <div className="text-[13px] text-text-secondary font-primary">
            {t('systemMenu.coins')}: <b className="text-text-primary">{profile.coins}</b>
          </div>

          <div className="flex gap-1 p-1.5 bg-bg-card rounded-2xl w-full">
            <button
              type="button"
              onClick={() => setShopSkinTab('player')}
              className={`flex-1 py-2 bg-transparent border-none rounded-xl cursor-pointer text-[12px] font-bold transition-all duration-200 font-primary flex items-center justify-center ${
                shopSkinTab === 'player' ? 'text-bg-primary bg-accent-green' : 'text-text-disabled'
              }`}
            >
              {t('systemMenu.shopPlayerSkins')}
            </button>
            <button
              type="button"
              onClick={() => setShopSkinTab('bullet')}
              className={`flex-1 py-2 bg-transparent border-none rounded-xl cursor-pointer text-[12px] font-bold transition-all duration-200 font-primary flex items-center justify-center ${
                shopSkinTab === 'bullet' ? 'text-bg-primary bg-accent-green' : 'text-text-disabled'
              }`}
            >
              {t('systemMenu.shopBulletSkins')}
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
                        <div className="mt-1 text-[12px] text-text-secondary font-primary">{t('systemMenu.coinsAmount', { count: skin.priceCoins })}</div>
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
                          {t('systemMenu.buy')}
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
                          {selected ? t('systemMenu.selected') : t('systemMenu.select')}
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
                        <div className="mt-1 text-[12px] text-text-secondary font-primary">{t('systemMenu.coinsAmount', { count: skin.priceCoins })}</div>
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
                          {t('systemMenu.buy')}
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
                          {selected ? t('systemMenu.selected') : t('systemMenu.select')}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
