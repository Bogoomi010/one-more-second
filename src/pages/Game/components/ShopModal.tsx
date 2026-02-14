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

const MIN_SHOP_PRICE = 1000;

function getShopPrice(priceCoins: number): number {
  if (priceCoins <= 0) return 0;
  return Math.max(priceCoins, MIN_SHOP_PRICE);
}

export default function ShopModal({ isOpen, onClose, profile, setProfile }: ShopModalProps) {
  const { t } = useTranslation();
  const [shopSkinTab, setShopSkinTab] = useState<ShopSkinTab>('player');

  const getSkinName = (id: string, fallbackName: string) =>
    t(`skins.${id}`, { defaultValue: fallbackName });

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
    const shopPrice = getShopPrice(skin.priceCoins);
    if (profile.ownedPlayerSkins.includes(id)) return;
    if (profile.coins < shopPrice) return;

    persist({
      ...profile,
      coins: profile.coins - shopPrice,
      ownedPlayerSkins: [...profile.ownedPlayerSkins, id],
      selectedPlayerSkinId: id,
    });
  }

  function buyBulletSkin(id: BulletSkinId) {
    const skin = getBulletSkin(id);
    const shopPrice = getShopPrice(skin.priceCoins);
    if (profile.ownedBulletSkins.includes(id)) return;
    if (profile.coins < shopPrice) return;

    persist({
      ...profile,
      coins: profile.coins - shopPrice,
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

          <div className="flex gap-2 p-1.5 bg-bg-card-alt border border-border-secondary rounded-2xl w-full">
            <button
              type="button"
              onClick={() => setShopSkinTab('player')}
              aria-pressed={shopSkinTab === 'player'}
              className={`flex-1 h-[42px] rounded-xl cursor-pointer text-[12px] font-bold transition-all duration-200 font-primary flex items-center justify-center border ${
                shopSkinTab === 'player'
                  ? 'bg-accent-green text-bg-primary border-accent-green shadow-[0_0_0_1px_rgba(74,222,128,0.45),0_6px_16px_rgba(74,222,128,0.22)]'
                  : 'bg-bg-card text-text-secondary border-border-secondary hover:bg-bg-card-alt hover:text-text-primary'
              }`}
            >
              {t('systemMenu.shopPlayerSkins')}
            </button>
            <button
              type="button"
              onClick={() => setShopSkinTab('bullet')}
              aria-pressed={shopSkinTab === 'bullet'}
              className={`flex-1 h-[42px] rounded-xl cursor-pointer text-[12px] font-bold transition-all duration-200 font-primary flex items-center justify-center border ${
                shopSkinTab === 'bullet'
                  ? 'bg-accent-green text-bg-primary border-accent-green shadow-[0_0_0_1px_rgba(74,222,128,0.45),0_6px_16px_rgba(74,222,128,0.22)]'
                  : 'bg-bg-card text-text-secondary border-border-secondary hover:bg-bg-card-alt hover:text-text-primary'
              }`}
            >
              {t('systemMenu.shopBulletSkins')}
            </button>
          </div>

          {shopSkinTab === 'player' ? (
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PLAYER_SKINS.map((skin) => {
                  const shopPrice = getShopPrice(skin.priceCoins);
                  const owned = profile.ownedPlayerSkins.includes(skin.id);
                  const selected = profile.selectedPlayerSkinId === skin.id;
                  const canBuy = profile.coins >= shopPrice;

                  return (
                    <div key={skin.id} className="rounded-2xl border border-border-secondary bg-bg-card p-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[14px] text-text-primary font-semibold font-primary">{getSkinName(skin.id, skin.name)}</div>
                        <div className="mt-1 text-[12px] text-text-secondary font-primary">{t('systemMenu.coinsAmount', { count: shopPrice })}</div>
                        <img
                          src={skin.image}
                          alt={`${getSkinName(skin.id, skin.name)} ${t('systemMenu.playerSkin')}`}
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
                {BULLET_SKINS.filter((skin) => skin.id !== 'bullet-gimic').map((skin) => {
                  const shopPrice = getShopPrice(skin.priceCoins);
                  const owned = profile.ownedBulletSkins.includes(skin.id);
                  const selected = profile.selectedBulletSkinId === skin.id;
                  const canBuy = profile.coins >= shopPrice;

                  return (
                    <div key={skin.id} className="rounded-2xl border border-border-secondary bg-bg-card p-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[14px] text-text-primary font-semibold font-primary">{getSkinName(skin.id, skin.name)}</div>
                        <div className="mt-1 text-[12px] text-text-secondary font-primary">{t('systemMenu.coinsAmount', { count: shopPrice })}</div>
                        <img
                          src={skin.image}
                          alt={`${getSkinName(skin.id, skin.name)} ${t('systemMenu.bulletSkin')}`}
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
