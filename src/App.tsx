import React, { useEffect, useState } from 'react';
import { sound } from '@pixi/sound';
import Layout from './components/Layout';
import ProfileSetupModal from './components/ProfileSetupModal';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import GamePage from './pages/Game';
import { audioManager, ensureDailyChallenge, loadProfile, loadSettings, saveSettings } from './gameSystem';
import SystemMenuModal from './pages/Game/components/SystemMenuModal';
import ShopModal from './pages/Game/components/ShopModal';
import { useAuth } from './context/AuthContext';
import i18n from './i18n';
import {
  getUserIdentityProfile,
  getUserLanguagePreference,
  upsertUserIdentityProfile,
  UserIdentityProfile,
} from './services/userDataService';

type ToastVariant = 'info' | 'success' | 'error';

function App() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [profile, setProfile] = useState(() => ensureDailyChallenge(loadProfile()));
  const [userCountry, setUserCountry] = useState<string>('KR');
  const [userIdentity, setUserIdentity] = useState<UserIdentityProfile | null>(null);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [pendingProfileSetupCheck, setPendingProfileSetupCheck] = useState(false);
  const [rankingRefreshTrigger, setRankingRefreshTrigger] = useState(0);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(() => {
    const settings = loadSettings();
    return !settings.audio.bgmEnabled && !settings.audio.sfxEnabled;
  });
  const [profileSetupOpen, setProfileSetupOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<ToastVariant>('info');

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
      sound.stopAll();
    }

    setIsAudioMuted(!next.audio.bgmEnabled && !next.audio.sfxEnabled);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

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

      if (language) {
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
    try {
      await signInWithGoogle();
      setPendingProfileSetupCheck(true);
    } catch (error) {
      console.error('Auth action failed:', error);
      const message =
        error instanceof Error && error.message.includes('auth/configuration-not-found')
          ? 'Firebase Authentication 설정을 확인해주세요. 콘솔에서 Google 로그인을 활성화하고 Authorized domains를 점검해주세요.'
          : '로그인 처리 중 오류가 발생했습니다. Firebase 설정을 확인해주세요.';
      showToast(message, 'error');
    }
  };

  const handleLogoutClick = () => {
    setLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await signOut();
      setLogoutConfirmOpen(false);
      setUserIdentity(null);
      setIdentityLoading(false);
      setPendingProfileSetupCheck(false);
      setProfileSetupOpen(false);
      setSystemMenuOpen(false);
      setShopOpen(false);
      setUserCountry('KR');
      setRankingRefreshTrigger((prev) => prev + 1);
      showToast('로그아웃 되었습니다.', 'success');
    } catch (error) {
      console.error('Logout failed:', error);
      showToast('로그아웃 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleIdentityConfirm = async (identity: UserIdentityProfile) => {
    if (!user) return;
    await upsertUserIdentityProfile(user.uid, identity);
    setUserIdentity(identity);
    setUserCountry(identity.country);
    setRankingRefreshTrigger((prev) => prev + 1);
  };

  const userInitial = user?.displayName?.trim()?.charAt(0)?.toUpperCase();

  return (
    <>
      <Layout
        profile={profile}
        userCountry={userCountry}
        rankingRefreshTrigger={rankingRefreshTrigger}
        onMarketClick={() => setShopOpen(true)}
        onSettingsClick={() => setSystemMenuOpen(true)}
        onToggleMute={handleToggleMute}
        isMuted={isAudioMuted}
        onProfileEditClick={() => setProfileSetupOpen(true)}
        onLoginClick={handleLoginClick}
        onLogoutClick={handleLogoutClick}
        isLoggedIn={Boolean(user)}
        userDisplayName={userIdentity?.nickname ?? user?.displayName ?? undefined}
        userInitial={userInitial}
      >
        <GamePage
          profile={profile}
          setProfile={setProfile}
          setUserCountry={setUserCountry}
          onRankingUpdate={() => setRankingRefreshTrigger((prev) => prev + 1)}
          isSystemMenuOpen={systemMenuOpen || shopOpen}
          profileIdentity={userIdentity}
          isProfileSetupOpen={profileSetupOpen}
          identityLoading={identityLoading}
          onRequestProfileSetup={() => setProfileSetupOpen(true)}
        />
      </Layout>

      <SystemMenuModal
        isOpen={systemMenuOpen}
        onClose={() => setSystemMenuOpen(false)}
        profile={profile}
        setProfile={setProfile}
        onSettingsChange={(next) => {
          setIsAudioMuted(!next.audio.bgmEnabled && !next.audio.sfxEnabled);
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
    </>
  );
}

export default App;
