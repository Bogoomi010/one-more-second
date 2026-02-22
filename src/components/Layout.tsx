import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { PlayerProfile } from '../gameSystem/types';
import { syncLanguagePreferenceToCloud } from '../services/userDataService';
import { DEFAULT_ONLINE_USERS_FALLBACK, subscribeOnlineUsersCount } from '../services/onlinePresenceService';
import RankingPanel from './RankingPanel';
import StatsPanel from './StatsPanel';
import GameBottomBar from './GameBottomBar';
import { LeftColumn, MainColumn, RightColumn } from './ColumnSlots';
import { SUPPORTED_LANGUAGES, getLanguagePath, normalizeLanguage, type SupportedLanguage } from '../i18n/index';
const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  'zh-CN': '简体中文',
};
const COMPACT_PANEL_BREAKPOINT = 1240;
const ULTRA_COMPACT_PANEL_BREAKPOINT = 540;

function syncCanonicalAndSocialMetaPath(nextPath: string) {
  const canonicalUrl = `${window.location.origin}${nextPath}`;
  const setMeta = (selector: string, key: string, value: string) => {
    const node = document.querySelector(selector);
    if (!node) return;
    node.setAttribute(key, value);
  };

  setMeta('link[rel="canonical"]', 'href', canonicalUrl);
  setMeta('meta[property="og:url"]', 'content', canonicalUrl);
  setMeta('meta[name="twitter:url"]', 'content', canonicalUrl);
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
  onAchievementsClick?: () => void;
  onMarketClick?: () => void;
  onSettingsClick?: () => void;
  onDifficultyClick?: () => void;
  onProfileMenuClick?: () => void;
  onToggleMute?: () => void;
  isMuted?: boolean;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onProfileEditClick?: () => void;
  isLoggedIn?: boolean;
  userDisplayName?: string;
  userInitial?: string;
  userPhotoUrl?: string;
  compactPanelModeOverride?: boolean;
  onCompactPanelModeChange?: (enabled: boolean) => void;
  onBrandStoryClick?: () => void;
}

type MobilePanelType = 'ranking' | 'stats';

export default function Layout({
  children,
  profile,
  userCountry,
  rankingRefreshTrigger,
  onAchievementsClick,
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
  userPhotoUrl,
  compactPanelModeOverride,
  onCompactPanelModeChange,
  onBrandStoryClick,
}: LayoutProps) {
  const { t, i18n } = useTranslation();
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [compactPanelMode, setCompactPanelMode] = useState(false);
  const [ultraCompactPanelMode, setUltraCompactPanelMode] = useState(false);
  const [isWindowWiderThanGamePanel, setIsWindowWiderThanGamePanel] = useState(true);
  const [isBrandStoryOpen, setIsBrandStoryOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanelType | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<number>(DEFAULT_ONLINE_USERS_FALLBACK);
  const [isUserPhotoLoadFailed, setIsUserPhotoLoadFailed] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement | null>(null);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const gamePanelRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const shouldUseCompactGameLayout = compactPanelMode && Boolean(compactPanelModeOverride);
  const shouldUseCompactHeaderDropdown = compactPanelMode && (ultraCompactPanelMode || !isWindowWiderThanGamePanel);

  const currentLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
        setIsHeaderMenuOpen(false);
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

  useEffect(() => {
    return subscribeOnlineUsersCount(setOnlineUsers);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${COMPACT_PANEL_BREAKPOINT - 1}px)`);
    const handleMediaChange = () => {
      const next = mediaQuery.matches;
      setCompactPanelMode(next);
      onCompactPanelModeChange?.(next);
    };

    handleMediaChange();
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [onCompactPanelModeChange]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${ULTRA_COMPACT_PANEL_BREAKPOINT - 1}px)`);
    const handleMediaChange = () => {
      const next = mediaQuery.matches;
      setUltraCompactPanelMode(next);
      if (!next) {
        setIsHeaderMenuOpen(false);
      }
    };

    handleMediaChange();
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  useEffect(() => {
    if (!compactPanelMode) {
      setIsWindowWiderThanGamePanel(true);
      return;
    }

    const updatePanelComparison = () => {
      const panelWidth = gamePanelRef.current?.offsetWidth ?? 0;
      if (panelWidth > 0) {
        setIsWindowWiderThanGamePanel(window.innerWidth > panelWidth);
      }
    };

    const resizeObserver = new ResizeObserver(updatePanelComparison);

    if (gamePanelRef.current) {
      resizeObserver.observe(gamePanelRef.current);
    }
    updatePanelComparison();
    window.addEventListener('resize', updatePanelComparison);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePanelComparison);
    };
  }, [compactPanelMode]);

  useEffect(() => {
    if (!compactPanelMode) {
      setMobilePanel(null);
    }

    if (!ultraCompactPanelMode) {
      setIsHeaderMenuOpen(false);
    }
  }, [compactPanelMode, ultraCompactPanelMode]);

  useEffect(() => {
    setIsUserPhotoLoadFailed(false);
  }, [userPhotoUrl, isLoggedIn]);

  useEffect(() => {
    syncCanonicalAndSocialMetaPath(location.pathname);
  }, [location.pathname]);

  const handleLanguageButtonClick = () => {
    setIsLanguageMenuOpen(prev => !prev);
  };

  const handleBrandStoryClick = () => {
    if (onBrandStoryClick) {
      onBrandStoryClick();
      return;
    }
    setIsBrandStoryOpen(prev => !prev);
  };

  const handleUserButtonClick = () => {
    setIsUserMenuOpen(prev => !prev);
  };

  const handleLanguageSelect = (nextLanguage: SupportedLanguage) => {
    i18n.changeLanguage(nextLanguage);
    void syncLanguagePreferenceToCloud(nextLanguage);
    const pathname = location.pathname;
    const segments = pathname.split('/').filter(Boolean);
    const nextSegments = segments[0] && SUPPORTED_LANGUAGES.includes(segments[0] as SupportedLanguage)
      ? [nextLanguage, ...segments.slice(1)]
      : [nextLanguage, ...segments];
    const nextPath = `/${nextSegments.join('/')}`.replace(/\/{2,}/g, '/');

    navigate(nextPath);
    syncCanonicalAndSocialMetaPath(nextPath);
    document.documentElement.setAttribute('lang', nextLanguage === 'zh-CN' ? 'zh-CN' : nextLanguage);
    setIsLanguageMenuOpen(false);
  };

  const toggleMobilePanel = (next: MobilePanelType) => {
    setMobilePanel((prev) => (prev === next ? null : next));
  };

  const handleBrandClick = () => {
    const languagePath = getLanguagePath(normalizeLanguage(i18n.resolvedLanguage ?? i18n.language));
    navigate(languagePath);
    syncCanonicalAndSocialMetaPath(languagePath);
  };

  const shouldShowUserPhoto = isLoggedIn && Boolean(userPhotoUrl) && !isUserPhotoLoadFailed;

  return (
    <div className="h-screen bg-bg-primary flex flex-col items-center w-full overflow-hidden box-border">
      <div className="relative z-40 w-full bg-bg-secondary border border-border-primary px-3 py-3 sm:px-6 sm:py-4 flex justify-between items-center backdrop-blur-[10px]">
        <div className="flex items-baseline">
          <div className="flex items-baseline gap-1.5 leading-none">
            <button
              type="button"
              onClick={handleBrandClick}
              className="inline-flex items-baseline gap-1 font-primary bg-transparent border-none p-0 cursor-pointer leading-none"
              aria-label={t('layout.goHome')}
            >
              <span className="text-brand-title sm:text-brand-title-lg leading-none italic font-bold text-text-primary">
                ONE
              </span>
              <span className="text-brand-title sm:text-brand-title-lg leading-none italic font-bold text-accent-green">
                MORE
              </span>
              <span className="hidden sm:inline text-brand-title-lg leading-none italic font-bold text-text-primary">
                SECOND
              </span>
            </button>
            <span className="text-brand-subtitle sm:text-brand-subtitle-lg leading-none text-text-muted font-primary">
              dodge game
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          {compactPanelMode && !shouldUseCompactHeaderDropdown && (
            <>
              <button
                type="button"
                className="h-8 px-2 rounded-lg border border-border-secondary bg-bg-card text-text-primary text-[10px] sm:text-[11px] font-primary font-semibold"
                onClick={() => toggleMobilePanel('ranking')}
              >
                {t('ranking.title')}
              </button>
              <button
                type="button"
                className="h-8 px-2 rounded-lg border border-border-secondary bg-bg-card text-text-primary text-[10px] sm:text-[11px] font-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => toggleMobilePanel('stats')}
                disabled={!profile}
              >
                {t('stats.tabStats')}
              </button>
            </>
          )}
          {compactPanelMode && shouldUseCompactHeaderDropdown ? (
            <div className="relative" ref={headerMenuRef}>
              <button
                type="button"
                className="h-8 px-2 rounded-lg border border-border-secondary bg-bg-card text-text-primary text-[10px] sm:text-[11px] font-primary font-semibold"
                onClick={() => setIsHeaderMenuOpen((prev) => !prev)}
                title="Menu"
                aria-label="Menu"
                aria-haspopup="menu"
                aria-expanded={isHeaderMenuOpen}
              >
                ☰
              </button>
              {isHeaderMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] min-w-[180px] rounded-xl border border-border-primary bg-bg-secondary shadow-lg z-[80] p-1.5">
                  <button
                    type="button"
                    className="w-full px-3 py-2 rounded-lg text-left text-[13px] font-primary text-text-primary hover:bg-bg-card-alt"
                    onClick={() => {
                      toggleMobilePanel('ranking');
                      setIsHeaderMenuOpen(false);
                    }}
                  >
                    {t('ranking.title')}
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2 rounded-lg text-left text-[13px] font-primary text-text-primary hover:bg-bg-card-alt disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                      toggleMobilePanel('stats');
                      setIsHeaderMenuOpen(false);
                    }}
                    disabled={!profile}
                  >
                    {t('stats.tabStats')}
                  </button>
                  {onAchievementsClick && (
                    <button
                      type="button"
                      className="w-full px-3 py-2 rounded-lg text-left text-[13px] font-primary text-text-primary hover:bg-bg-card-alt"
                      onClick={() => {
                        onAchievementsClick();
                        setIsHeaderMenuOpen(false);
                      }}
                    >
                      {t('systemMenu.achievements')}
                    </button>
                  )}
                  {onMarketClick && (
                    <button
                      type="button"
                      className="w-full px-3 py-2 rounded-lg text-left text-[13px] font-primary text-text-primary hover:bg-bg-card-alt"
                      onClick={() => {
                        onMarketClick();
                        setIsHeaderMenuOpen(false);
                      }}
                    >
                      {t('layout.navMarket')}
                    </button>
                  )}
                  <button
                    type="button"
                    className="w-full px-3 py-2 rounded-lg text-left text-[13px] font-primary text-text-primary hover:bg-bg-card-alt"
                    onClick={() => {
                      handleBrandStoryClick();
                      setIsHeaderMenuOpen(false);
                    }}
                  >
                    {t('layout.navBrandStory')}
                  </button>
                </div>
              )}
            </div>
          ) : compactPanelMode ? (
            <div className="flex items-center gap-2 sm:gap-2.5">
              {onAchievementsClick ? (
                <button
                  type="button"
                  className="text-text-muted font-primary text-sm sm:text-lg font-bold cursor-pointer bg-transparent border-none p-0 hover:text-text-primary transition-colors duration-200"
                  onClick={onAchievementsClick}
                  title={t('systemMenu.achievements')}
                  aria-label={t('systemMenu.achievements')}
                >
                  {t('systemMenu.achievements')}
                </button>
              ) : (
                <span className="text-text-muted font-primary text-sm sm:text-lg font-bold">
                  {t('systemMenu.achievements')}
                </span>
              )}
              <button
                type="button"
                className="text-text-muted font-primary text-sm sm:text-lg font-bold cursor-pointer bg-transparent border-none p-0 hover:text-text-primary transition-colors duration-200"
                onClick={onMarketClick}
                title={t('layout.navMarket')}
                aria-label={t('layout.navMarket')}
              >
                {t('layout.navMarket')}
              </button>
              <button
                type="button"
                className="text-text-muted font-primary text-sm sm:text-lg font-bold cursor-pointer bg-transparent border-none p-0 hover:text-text-primary transition-colors duration-200"
                onClick={handleBrandStoryClick}
                title={t('layout.navBrandStory')}
                aria-label={t('layout.navBrandStory')}
              >
                {t('layout.navBrandStory')}
              </button>
            </div>
          ) : null}

          {compactPanelMode ? null : <div className="hidden md:block w-px h-6 bg-bg-card-alt" />}

          {!compactPanelMode && onMarketClick && (
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
              {shouldShowUserPhoto ? (
                <img
                  src={userPhotoUrl}
                  alt={userDisplayName ?? t('layout.userDefaultName')}
                  className="w-8 h-8 rounded-full object-cover border border-border-secondary bg-bg-card"
                  onError={() => setIsUserPhotoLoadFailed(true)}
                />
              ) : isLoggedIn ? (
                userInitial ? (
                  <span className="w-8 h-8 rounded-full bg-bg-card border border-border-secondary text-text-primary/90 text-xs font-bold font-primary flex items-center justify-center">
                    {userInitial}
                  </span>
                ) : (
                  <i className="fi-rr-circle-user text-[27px] leading-none text-text-primary" aria-hidden="true" />
                )
              ) : (
                <i className="fi-rr-circle-user text-[27px] leading-none text-text-primary" aria-hidden="true" />
              )}
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

      <main
        className={
          shouldUseCompactGameLayout
            ? 'flex-1 w-full min-h-0 overflow-hidden'
            : 'flex-1 w-full min-h-0 flex justify-center px-3 pt-3 pb-24 md:p-5 box-border overflow-hidden'
        }
      >
        <div
          ref={gamePanelRef}
          className={
            shouldUseCompactGameLayout
              ? 'w-full h-full min-h-0 min-w-0 overflow-hidden'
              : 'w-full max-w-[min(1920px,calc(100%-40px))] h-full min-h-0 box-border overflow-hidden'
          }
        >
          {compactPanelMode ? (
            <div className="w-full h-full min-h-0 min-w-0 overflow-hidden">
              {children}
            </div>
          ) : (
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
                      <GameBottomBar onlineUsers={onlineUsers} onSettingsClick={onSettingsClick} />
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
          )}
        </div>
      </main>

      {compactPanelMode && mobilePanel && (
        <div
          className="fixed inset-0 z-[10020] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setMobilePanel(null)}
        >
          <div
            className="w-full max-w-[900px] max-h-[86vh] overflow-hidden rounded-[20px] border border-border-primary bg-bg-primary shadow-[0_24px_70px_rgba(0,0,0,0.55)] p-3 pb-5 flex flex-col gap-3"
            role="dialog"
            aria-modal="true"
            aria-label={mobilePanel === 'ranking' ? t('ranking.title') : t('stats.tabStats')}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-1">
              <h2 className="m-0 text-[18px] font-bold font-primary text-text-primary">
                {mobilePanel === 'ranking' ? t('ranking.title') : t('stats.tabStats')}
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

      {isBrandStoryOpen && (
        <div
          className="absolute inset-0 z-[10010] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setIsBrandStoryOpen(false)}
        >
          <section
            className="w-full max-w-[900px] max-h-[88vh] overflow-y-auto rounded-3xl border border-border-primary bg-bg-secondary px-5 py-6 sm:px-8 sm:py-7 shadow-[0_34px_100px_rgba(0,0,0,0.55)]"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-2xl font-extrabold font-primary text-text-primary">{t('layout.brandStoryTitle')}</h2>
              </div>
              <button
                type="button"
                className="h-8 w-8 rounded-lg border border-border-secondary bg-bg-card text-text-primary text-lg font-bold"
                onClick={() => setIsBrandStoryOpen(false)}
                aria-label={t('layout.brandStoryClose')}
              >
                ×
              </button>
            </div>
            <div className="mt-5 space-y-3 text-text-primary/90 font-primary leading-relaxed">
              {t('layout.brandStoryDescription')
                .split('\n')
                .map((line, index) => (
                  <p
                    key={`${line}-${index}`}
                    className={index > 0 ? 'mt-2' : ''}
                  >
                    {line}
                  </p>
                ))}
            </div>
          </section>
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
