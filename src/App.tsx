import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import DifficultyModal from './components/DifficultyModal';
import ProfileSetupModal from './components/ProfileSetupModal';
import Toast from './components/Toast';
import AchievementCelebrationModal from './components/AchievementCelebrationModal';
import AchievementConfetti from './components/AchievementConfetti';
import ConfirmModal from './components/ConfirmModal';
import GamePage from './pages/Game';
import {
  audioManager,
  ensureDailyChallenge,
  defaultProfile,
  loadProfile,
  loadSettings,
  resetProfile,
  saveSettings,
} from './gameSystem';
import SystemMenuModal from './pages/Game/overlays/SystemMenuModal';
import ShopModal from './pages/Game/overlays/ShopModal';
import AchievementsModal from './pages/Game/overlays/AchievementsModal';
import { useAuth } from './context/AuthContext';
import i18n from './i18n';
import {
  getLanguageFromPath,
  getLanguagePath,
  normalizeLanguage,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from './i18n/index';
import { getFirebaseAuthErrorMessage } from './utils/firebaseAuthError';
import { GameplayModifierId } from './gameSystem/types';
import {
  getUserIdentityProfile,
  getUserLanguagePreference,
  upsertUserIdentityProfile,
  UserIdentityProfile,
} from './services/userDataService';

type ToastVariant = 'info' | 'success' | 'error';

const ALLOWED_AI_ACCOUNT_EMAILS = new Set(['kbkboldmolt@gmail.com']);

function AppShell() {
  const location = useLocation();

  const {
    firebaseEnabled,
    user,
    signInWithGoogle,
    signOut,
    loading: authLoading,
  } = useAuth();
  const [profile, setProfile] = useState(() => ensureDailyChallenge(defaultProfile()));
  const [userCountry, setUserCountry] = useState<string>('KR');
  const [userIdentity, setUserIdentity] = useState<UserIdentityProfile | null>(null);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [pendingProfileSetupCheck, setPendingProfileSetupCheck] = useState(false);
  const [rankingRefreshTrigger, setRankingRefreshTrigger] = useState(0);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);
  const [difficultyModalOpen, setDifficultyModalOpen] = useState(false);
  const [activeModifiers, setActiveModifiers] = useState<GameplayModifierId[]>(
    () => loadSettings().gameplay.enabledModifiers
  );
  const [isAudioMuted, setIsAudioMuted] = useState(() => {
    const settings = loadSettings();
    return !settings.audio.bgmEnabled && !settings.audio.sfxEnabled;
  });
  const [profileSetupOpen, setProfileSetupOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<ToastVariant>('info');
  const [compactPanelMode, setCompactPanelMode] = useState(false);
  const [achievementPopupIds, setAchievementPopupIds] = useState<string[]>([]);
  const [isAiMode, setIsAiMode] = useState(false);
  const canUseAiMode = Boolean(user?.email && ALLOWED_AI_ACCOUNT_EMAILS.has(user.email.toLowerCase()));

  useEffect(() => {
    const pathLanguage = getLanguageFromPath(location.pathname);
    if (!pathLanguage) return;

    if ((i18n.resolvedLanguage ?? i18n.language) !== pathLanguage) {
      void i18n.changeLanguage(pathLanguage);
    }
    document.documentElement.setAttribute('lang', pathLanguage === 'zh-CN' ? 'zh-CN' : pathLanguage);
  }, [location.pathname]);

  useEffect(() => {
    if (!canUseAiMode && isAiMode) {
      setIsAiMode(false);
    }
  }, [canUseAiMode, isAiMode]);

  const showToast = (message: string, variant: ToastVariant = 'info') => {
    setToastVariant(variant);
    setToastMessage(message);
  };

  const handleToggleMute = () => {
    const settings = loadSettings();
    const currentlyMuted = !settings.audio.bgmEnabled && !settings.audio.sfxEnabled;

    const next = {
      ...settings,
      audio: {
        ...settings.audio,
        bgmEnabled: currentlyMuted,
        sfxEnabled: currentlyMuted,
      },
    };

    saveSettings(next);
    audioManager.updateVolumes();

    if (!currentlyMuted) {
      audioManager.stopBGM();
    }

    setIsAudioMuted(!next.audio.bgmEnabled && !next.audio.sfxEnabled);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (achievementPopupIds.length === 0) return;
    const timer = window.setTimeout(() => setAchievementPopupIds([]), 5200);
    return () => window.clearTimeout(timer);
  }, [achievementPopupIds]);

  useEffect(() => {
    if (!isAiMode) return;
    if (achievementPopupIds.length === 0) return;
    setAchievementPopupIds([]);
  }, [isAiMode, achievementPopupIds]);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      setProfile(ensureDailyChallenge(loadProfile()));
      return;
    }

    setProfile(resetProfile());
    setUserCountry('KR');
    setAchievementPopupIds([]);
  }, [authLoading, user]);

  useEffect(() => {
    let cancelled = false;

    const syncFromCloud = async () => {
      if (!user) return;
      setIdentityLoading(true);

      const [language, identity] = await Promise.all([
        getUserLanguagePreference(user.uid),
        getUserIdentityProfile(user.uid),
      ]);

      if (cancelled) return;

      const pathLanguage = getLanguageFromPath(location.pathname);
      if (language && !pathLanguage) {
        await i18n.changeLanguage(language);
      }

      setUserIdentity(identity);
      if (identity?.country) {
        setUserCountry(identity.country);
      }

      if (pendingProfileSetupCheck) {
        setProfileSetupOpen(!identity);
        setPendingProfileSetupCheck(false);
      }

      setIdentityLoading(false);
    };

    void syncFromCloud();

    if (!user) {
      setUserIdentity(null);
      setIdentityLoading(false);
      setPendingProfileSetupCheck(false);
      setProfileSetupOpen(false);
    }

    return () => {
      cancelled = true;
    };
  }, [pendingProfileSetupCheck, user]);

  const handleLoginClick = async () => {
    if (!firebaseEnabled) {
      showToast('Firebase 인증이 설정되지 않았습니다. FIREBASE 환경변수를 확인하세요.', 'error');
      return;
    }

    try {
      await signInWithGoogle();
      setPendingProfileSetupCheck(true);
    } catch (error) {
      console.error('Auth action failed:', error);
      showToast(getFirebaseAuthErrorMessage(error), 'error');
    }
  };

  const handleLogoutClick = () => {
    setLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await signOut();
      setProfile(resetProfile());
      setAchievementPopupIds([]);
      setLogoutConfirmOpen(false);
      setUserIdentity(null);
      setIdentityLoading(false);
      setPendingProfileSetupCheck(false);
      setProfileSetupOpen(false);
      setSystemMenuOpen(false);
      setProfileMenuOpen(false);
      setShopOpen(false);
      setAchievementsModalOpen(false);
      setDifficultyModalOpen(false);
      setUserCountry('KR');
      setRankingRefreshTrigger((prev) => prev + 1);
      showToast('로그아웃 되었습니다.', 'success');
    } catch (error) {
      console.error('Logout failed:', error);
      showToast('로그아웃 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleIdentityConfirm = async (identity: UserIdentityProfile) => {
    if (!user) {
      console.warn('[App] handleIdentityConfirm blocked: no user');
      return;
    }

    console.debug('[App] handleIdentityConfirm start', {
      uid: user.uid,
      identity,
    });

    try {
      await upsertUserIdentityProfile(user.uid, identity);
      setUserIdentity(identity);
      setUserCountry(identity.country);
      setRankingRefreshTrigger((prev) => prev + 1);
      console.debug('[App] handleIdentityConfirm success', {
        uid: user.uid,
      });
    } catch (error) {
      console.error('[App] handleIdentityConfirm failed', error);
    }
  };

  const userInitial = user?.displayName?.trim()?.charAt(0)?.toUpperCase();

  return (
    <>
      <Layout
        profile={profile}
        userCountry={userCountry}
        rankingRefreshTrigger={rankingRefreshTrigger}
        compactPanelModeOverride={compactPanelMode}
        onCompactPanelModeChange={setCompactPanelMode}
        onAchievementsClick={() => {
          setSystemMenuOpen(false);
          setProfileMenuOpen(false);
          setAchievementsModalOpen(true);
        }}
        onMarketClick={() => setShopOpen(true)}
        onSettingsClick={() => {
          setAchievementsModalOpen(false);
          setProfileMenuOpen(false);
          setSystemMenuOpen(true);
        }}
        onDifficultyClick={() => setDifficultyModalOpen(true)}
        onProfileMenuClick={() => {
          setAchievementsModalOpen(false);
          setSystemMenuOpen(false);
          setProfileMenuOpen(true);
        }}
        onToggleMute={handleToggleMute}
        isMuted={isAudioMuted}
        onProfileEditClick={() => setProfileSetupOpen(true)}
        onLoginClick={handleLoginClick}
        onLogoutClick={handleLogoutClick}
        isLoggedIn={Boolean(user)}
        userDisplayName={userIdentity?.nickname ?? user?.displayName ?? undefined}
        userPhotoUrl={user?.photoURL ?? undefined}
        userInitial={userInitial}
      >
        <GamePage
          profile={profile}
          setProfile={setProfile}
          setUserCountry={setUserCountry}
          onRankingUpdate={() => setRankingRefreshTrigger((prev) => prev + 1)}
          isSystemMenuOpen={
            systemMenuOpen ||
            profileMenuOpen ||
            shopOpen ||
            achievementsModalOpen ||
            difficultyModalOpen
          }
          activeModifiers={activeModifiers}
          onDifficultyClick={() => setDifficultyModalOpen(true)}
          isCompactGameLayout={compactPanelMode}
          profileIdentity={userIdentity}
          isProfileSetupOpen={profileSetupOpen}
          identityLoading={identityLoading}
          onRequestProfileSetup={() => setProfileSetupOpen(true)}
          isAiMode={isAiMode}
          canUseAiMode={canUseAiMode}
          onAiModeChange={setIsAiMode}
          onAchievementsUnlocked={(ids) => {
            if (isAiMode) return;
            const uniqueIds = Array.from(new Set(ids));
            if (uniqueIds.length > 0) {
              setAchievementPopupIds(uniqueIds);
            }
          }}
        />
      </Layout>

      <DifficultyModal
        isOpen={difficultyModalOpen}
        value={activeModifiers}
        onClose={() => setDifficultyModalOpen(false)}
        onApply={(next) => {
          setActiveModifiers(next);
          const settings = loadSettings();
          saveSettings({
            ...settings,
            gameplay: {
              ...settings.gameplay,
              enabledModifiers: next,
            },
          });
        }}
      />

      <SystemMenuModal
        isOpen={systemMenuOpen}
        onClose={() => setSystemMenuOpen(false)}
        profile={profile}
        setProfile={setProfile}
        isLoggedIn={Boolean(user)}
        visibleTabs={['settings']}
        initialTab="settings"
        onSettingsChange={(next) => {
          setIsAudioMuted(!next.audio.bgmEnabled && !next.audio.sfxEnabled);
          setActiveModifiers(next.gameplay.enabledModifiers);
        }}
      />

      <AchievementsModal
        isOpen={achievementsModalOpen}
        onClose={() => setAchievementsModalOpen(false)}
        profile={profile}
      />

      <SystemMenuModal
        isOpen={profileMenuOpen}
        onClose={() => setProfileMenuOpen(false)}
        profile={profile}
        setProfile={setProfile}
        isLoggedIn={Boolean(user)}
        visibleTabs={['profile']}
        initialTab="profile"
        onSettingsChange={(next) => {
          setIsAudioMuted(!next.audio.bgmEnabled && !next.audio.sfxEnabled);
          setActiveModifiers(next.gameplay.enabledModifiers);
        }}
      />

      <ShopModal
        isOpen={shopOpen}
        onClose={() => setShopOpen(false)}
        profile={profile}
        setProfile={setProfile}
      />

      <ProfileSetupModal
        isOpen={profileSetupOpen}
        initialValue={userIdentity}
        onConfirm={handleIdentityConfirm}
        onClose={() => setProfileSetupOpen(false)}
      />

      <ConfirmModal
        isOpen={logoutConfirmOpen}
        title="로그아웃"
        message="정말 로그아웃 하시겠습니까?"
        confirmText="로그아웃"
        cancelText="취소"
        confirmVariant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutConfirmOpen(false)}
      />

      <Toast message={toastMessage} visible={Boolean(toastMessage)} variant={toastVariant} />
      <AchievementConfetti isActive={achievementPopupIds.length > 0} achievementCount={achievementPopupIds.length} />
      <AchievementCelebrationModal
        isOpen={achievementPopupIds.length > 0}
        onClose={() => setAchievementPopupIds([])}
        achievementIds={achievementPopupIds}
      />
    </>
  );
}

function AppLanguageRoute() {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const normalizedLanguage = normalizeLanguage(lang);
  const isSupportedLanguage = Boolean(lang && SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage));

  useEffect(() => {
    if (isSupportedLanguage) return;

    const segments = location.pathname.split('/').filter(Boolean);
    const remainingSegments = segments.slice(1);
    const fallbackPath = getLanguagePath(normalizedLanguage) +
      (remainingSegments.length > 0 ? `/${remainingSegments.join('/')}` : '');

    navigate(fallbackPath, { replace: true });
  }, [isSupportedLanguage, location.pathname, navigate, normalizedLanguage]);

  if (!isSupportedLanguage) {
    return null;
  }

  return <AppShell />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={getLanguagePath('en')} replace />} />
      <Route path="/:lang/*" element={<AppLanguageRoute />} />
      <Route path="*" element={<Navigate to={getLanguagePath('en')} replace />} />
    </Routes>
  );
}

export default App;
