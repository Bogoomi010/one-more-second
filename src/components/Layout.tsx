import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlayerProfile } from '../gameSystem/types';
import { syncLanguagePreferenceToCloud } from '../services/userDataService';
import RankingPanel from './RankingPanel';
import StatsPanel from './StatsPanel';
import GameBottomBar from './GameBottomBar';
import { LeftColumn, MainColumn, RightColumn } from './ColumnSlots';

type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh-CN';

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['ko', 'en', 'ja', 'zh-CN'];
const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  'zh-CN': '简体中文',
};

function normalizeLanguage(language?: string | null): SupportedLanguage {
  if (!language) return 'ko';
  if (language.startsWith('zh')) return 'zh-CN';
  if (language.startsWith('ja')) return 'ja';
  if (language.startsWith('en')) return 'en';
  if (language.startsWith('ko')) return 'ko';
  return 'ko';
}

function getLanguageLabel(language: SupportedLanguage): string {
  switch (language) {
    case 'ko':
      return 'KO';
    case 'en':
      return 'EN';
    case 'ja':
      return 'JA';
    case 'zh-CN':
      return 'ZH';
    default:
      return 'KO';
  }
}

interface LayoutProps {
  children: React.ReactNode;
  profile?: PlayerProfile;
  userCountry?: string;
  rankingRefreshTrigger?: number;
  onMarketClick?: () => void;
  onSettingsClick?: () => void;
  onProfileMenuClick?: () => void;
  onToggleMute?: () => void;
  isMuted?: boolean;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onProfileEditClick?: () => void;
  isLoggedIn?: boolean;
  userDisplayName?: string;
  userInitial?: string;
}

type MobilePanelType = 'ranking' | 'stats';

export default function Layout({
  children,
  profile,
  userCountry,
  rankingRefreshTrigger,
  onMarketClick,
  onSettingsClick,
  onProfileMenuClick,
  onToggleMute,
  isMuted = false,
  onLoginClick,
  onLogoutClick,
  onProfileEditClick,
  isLoggedIn = false,
  userDisplayName,
  userInitial,
}: LayoutProps) {
  const { t, i18n } = useTranslation();
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanelType | null>(null);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const currentLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!mobilePanel) return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobilePanel(null);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [mobilePanel]);

  const handleLanguageButtonClick = () => {
    setIsLanguageMenuOpen(prev => !prev);
  };

  const handleUserButtonClick = () => {
    setIsUserMenuOpen(prev => !prev);
  };

  const handleLanguageSelect = (nextLanguage: SupportedLanguage) => {
    i18n.changeLanguage(nextLanguage);
    void syncLanguagePreferenceToCloud(nextLanguage);
    setIsLanguageMenuOpen(false);
  };

  const handleBrandClick = () => {
    window.location.assign('/');
  };

  return (
    <div className="h-screen bg-bg-primary flex flex-col items-center w-full overflow-hidden box-border">
      <div className="relative z-40 w-full bg-bg-secondary border border-border-primary px-3 py-3 sm:px-6 sm:py-4 flex justify-between items-center backdrop-blur-[10px]">
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleBrandClick}
            className="flex items-center gap-1 font-primary bg-transparent border-none p-0 cursor-pointer"
            aria-label={t('layout.goHome')}
          >
            <span className="text-[16px] sm:text-[24px] italic font-bold text-text-primary">ONE</span>
            <span className="text-[16px] sm:text-[24px] italic font-bold text-accent-green">MORE</span>
            <span className="hidden sm:inline text-[24px] italic font-bold text-text-primary">SECOND</span>
          </button>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden md:flex gap-8 items-center">
            <span className="text-accent-green font-primary text-[14px] font-bold">{t('layout.navGame')}</span>
            <button
              type="button"
              className="text-text-muted font-primary text-[14px] font-bold cursor-pointer bg-transparent border-none p-0 hover:text-text-primary transition-colors duration-200"
              onClick={onMarketClick}
              title={t('layout.navMarket')}
              aria-label={t('layout.navMarket')}
            >
              {t('layout.navMarket')}
            </button>
          </div>

          <div className="hidden md:block w-px h-6 bg-bg-card-alt" />

          {onMarketClick && (
            <button
              type="button"
              className="md:hidden h-8 px-2 rounded-lg border border-border-secondary bg-bg-card text-text-primary text-[11px] font-primary font-semibold"
              onClick={onMarketClick}
              title={t('layout.navMarket')}
              aria-label={t('layout.navMarket')}
            >
              {t('layout.navMarket')}
            </button>
          )}

          <div className="relative" ref={languageMenuRef}>
            <button
              type="button"
              className="w-8 h-8 flex justify-center items-center cursor-pointer bg-transparent border-none p-0 text-text-primary/80 hover:text-text-primary transition-colors duration-200"
              onClick={handleLanguageButtonClick}
              title={t('layout.languageSwitch')}
              aria-label={t('layout.languageSwitch')}
              aria-expanded={isLanguageMenuOpen}
              aria-haspopup="menu"
            >
              <i className="fi-br-language text-[23px] leading-none" aria-hidden="true" />
            </button>

            {isLanguageMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] min-w-[144px] rounded-xl border border-border-primary bg-bg-secondary shadow-lg z-[60] p-1.5">
                {SUPPORTED_LANGUAGES.map(option => (
                  <button
                    key={option}
                    type="button"
                    className={`w-full px-3 py-2 rounded-lg text-left text-[13px] font-primary transition-colors ${
                      option === currentLanguage
                        ? 'bg-bg-card text-text-primary'
                        : 'text-text-muted hover:bg-bg-card-alt hover:text-text-primary'
                    }`}
                    onClick={() => handleLanguageSelect(option)}
                  >
                    <span className="inline-flex items-center justify-between w-full">
                      <span>{LANGUAGE_NAMES[option]}</span>
                      <span className="text-[12px] opacity-80">{getLanguageLabel(option)}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {onToggleMute && (
            <button
              type="button"
              className="w-8 h-8 flex justify-center items-center cursor-pointer bg-transparent border-none p-0 text-text-primary/80 hover:text-text-primary transition-colors duration-200"
              onClick={onToggleMute}
              title={isMuted ? t('layout.unmute') : t('layout.mute')}
              aria-label={isMuted ? t('layout.unmute') : t('layout.mute')}
            >
              <i
                className={isMuted ? 'fi-br-volume-mute text-[23px] leading-none' : 'fi-sr-volume-down text-[23px] leading-none'}
                aria-hidden="true"
              />
            </button>
          )}

          {onSettingsClick && (
            <button
              type="button"
              className="w-8 h-8 flex justify-center items-center cursor-pointer bg-transparent border-none p-0 text-text-primary/80 hover:text-text-primary transition-colors duration-200"
              onClick={onSettingsClick}
              title={t('layout.systemMenu')}
              aria-label={t('layout.systemMenu')}
            >
              <i className="fi-ss-settings text-[23px] leading-none" aria-hidden="true" />
            </button>
          )}

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              className="w-8 h-8 flex justify-center items-center cursor-pointer bg-transparent border-none p-0 text-text-primary/80 hover:text-text-primary transition-colors duration-200"
              onClick={handleUserButtonClick}
              title={t('layout.googleAuth')}
              aria-label={t('layout.googleAuth')}
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
            >
              <i className="fi-rr-circle-user text-[27px] leading-none text-text-primary" aria-hidden="true" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] min-w-[220px] rounded-xl border border-border-primary bg-bg-secondary shadow-lg z-[60] p-2">
                <div className="px-2 py-1.5 text-[11px] uppercase tracking-wide text-text-muted font-primary">
                  {isLoggedIn
                    ? `${t('layout.userMenuSignedInAs')}: ${userDisplayName ?? t('layout.userDefaultName')}`
                    : t('layout.userMenuSignedOut')}
                </div>

                {isLoggedIn ? (
                  <>
                    <button
                      type="button"
                      className="w-full px-3 py-2 rounded-lg text-left text-[13px] font-primary text-text-primary hover:bg-bg-card-alt"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onProfileMenuClick?.();
                      }}
                    >
                      {t('systemMenu.profile')}
                    </button>
                    <button
                      type="button"
                      className="w-full px-3 py-2 rounded-lg text-left text-[13px] font-primary text-text-primary hover:bg-bg-card-alt"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onProfileEditClick?.();
                      }}
                    >
                      {t('layout.userMenuEditProfile')}
                    </button>
                    <button
                      type="button"
                      className="w-full px-3 py-2 rounded-lg text-left text-[13px] font-primary text-text-primary hover:bg-bg-card-alt"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogoutClick?.();
                      }}
                    >
                      {t('layout.userMenuLogout')}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="w-full px-3 py-2 rounded-lg text-left text-[13px] font-primary text-text-primary hover:bg-bg-card-alt"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLoginClick?.();
                    }}
                  >
                    {t('layout.userMenuLogin')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 w-full min-h-0 flex justify-center px-3 pt-3 pb-24 md:p-5 box-border overflow-hidden">
        <div className="w-full max-w-[min(1920px,calc(100%-40px))] h-full min-h-0 box-border overflow-hidden">
          <div className="hidden md:grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] gap-5 items-stretch">
            <LeftColumn
              mainPanel={
                <div className="w-full h-full min-w-0 min-h-0 overflow-hidden">
                  <RankingPanel userCountry={userCountry} refreshTrigger={rankingRefreshTrigger} />
                </div>
              }
            />

            <MainColumn
              mainPanel={
                <div className="w-full h-full min-w-0 min-h-0 flex flex-col gap-4 overflow-hidden">
                  <div className="w-full flex-1 min-w-0 min-h-0 overflow-hidden">{children}</div>
                  <div className="hidden md:block">
                    <GameBottomBar onSettingsClick={onSettingsClick} />
                  </div>
                </div>
              }
            />

            <RightColumn
              mainPanel={
                <div className="w-full h-full min-w-0 min-h-0 overflow-hidden">
                  {profile ? <StatsPanel profile={profile} /> : <div className="w-full h-full min-w-0 min-h-0" />}
                </div>
              }
            />
          </div>

          <div className="md:hidden w-full h-full min-h-0 overflow-hidden">
            <div className="w-full h-full min-w-0 min-h-0 overflow-hidden">{children}</div>
          </div>
        </div>
      </main>

      <div className="md:hidden fixed left-1/2 bottom-4 -translate-x-1/2 z-[10010] w-[calc(100%-24px)] max-w-[420px]">
        <div className="w-full rounded-2xl border border-border-primary bg-bg-secondary/95 backdrop-blur-[10px] p-2 flex items-center gap-2">
          <button
            type="button"
            className={`flex-1 h-[44px] rounded-xl border text-[12px] font-bold font-primary transition-colors ${
              mobilePanel === 'ranking'
                ? 'bg-accent-green text-bg-primary border-accent-green'
                : 'bg-bg-card border-border-secondary text-text-primary'
            }`}
            onClick={() => setMobilePanel((prev) => (prev === 'ranking' ? null : 'ranking'))}
            aria-pressed={mobilePanel === 'ranking'}
          >
            {t('ranking.title')}
          </button>
          <button
            type="button"
            className={`flex-1 h-[44px] rounded-xl border text-[12px] font-bold font-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              mobilePanel === 'stats'
                ? 'bg-accent-blue text-bg-primary border-accent-blue'
                : 'bg-bg-card border-border-secondary text-text-primary'
            }`}
            onClick={() => setMobilePanel((prev) => (prev === 'stats' ? null : 'stats'))}
            aria-pressed={mobilePanel === 'stats'}
            disabled={!profile}
          >
            {t('stats.tabStats')}
          </button>
        </div>
      </div>

      {mobilePanel && (
        <div
          className="md:hidden fixed inset-0 z-[10020] bg-black/75 backdrop-blur-lg"
          role="presentation"
          onClick={() => setMobilePanel(null)}
        >
          <div
            className="absolute inset-x-0 bottom-0 h-[min(78vh,720px)] rounded-t-[24px] border border-border-primary bg-bg-primary p-3 pb-5 flex flex-col gap-3"
            role="dialog"
            aria-modal="true"
            aria-label={mobilePanel === 'ranking' ? t('ranking.title') : t('stats.title')}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-1">
              <h2 className="m-0 text-[18px] font-bold font-primary text-text-primary">
                {mobilePanel === 'ranking' ? t('ranking.title') : t('stats.title')}
              </h2>
              <button
                type="button"
                className="w-9 h-9 rounded-xl border border-border-secondary bg-bg-card text-text-primary"
                onClick={() => setMobilePanel(null)}
                aria-label={t('systemMenu.closeAria')}
              >
                X
              </button>
            </div>

            <div className="w-full flex-1 min-h-0 overflow-hidden">
              {mobilePanel === 'ranking' ? (
                <RankingPanel userCountry={userCountry} refreshTrigger={rankingRefreshTrigger} />
              ) : profile ? (
                <StatsPanel profile={profile} />
              ) : (
                <div className="w-full h-full min-h-0" />
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="hidden md:flex w-full border-t border-[#ffffff0d] py-12 justify-center items-center shrink-0">
        <div className="flex items-center gap-1 font-secondary text-[10px] font-normal">
          <span className="text-text-placeholder">{t('layout.footerYear')}</span>
          <span className="text-accent-blue">{t('layout.footerBrand')}</span>
          <span className="text-text-placeholder">{t('layout.footerTagline')}</span>
        </div>
      </footer>
    </div>
  );
}
