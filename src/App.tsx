import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import ProfileSetupModal from './components/ProfileSetupModal';
import GamePage from './pages/Game';
import { loadProfile, ensureDailyChallenge } from './gameSystem';
import SystemMenuModal from './pages/Game/components/SystemMenuModal';
import { useAuth } from './context/AuthContext';
import i18n from './i18n';
import {
  getUserIdentityProfile,
  getUserLanguagePreference,
  upsertUserIdentityProfile,
  UserIdentityProfile,
} from './services/userDataService';

function App() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [profile, setProfile] = useState(() => ensureDailyChallenge(loadProfile()));
  const [userCountry, setUserCountry] = useState<string>('KR');
  const [userIdentity, setUserIdentity] = useState<UserIdentityProfile | null>(null);
  const [rankingRefreshTrigger, setRankingRefreshTrigger] = useState(0);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [profileSetupOpen, setProfileSetupOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const syncFromCloud = async () => {
      if (!user) return;

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
    };

    void syncFromCloud();

    if (!user) {
      setUserIdentity(null);
    }

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleLoginClick = async () => {
    try {
      await signInWithGoogle();
      setProfileSetupOpen(true);
    } catch (error) {
      console.error('Auth action failed:', error);
      const message =
        error instanceof Error && error.message.includes('auth/configuration-not-found')
          ? 'Firebase Authentication 설정이 완료되지 않았습니다. Firebase 콘솔에서 Google 로그인을 활성화하고 Authorized domains를 확인해주세요.'
          : '로그인 처리 중 오류가 발생했습니다. Firebase 설정을 확인해주세요.';
      window.alert(message);
    }
  };

  const handleLogoutClick = async () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) return;

    try {
      await signOut();
      setUserIdentity(null);
    } catch (error) {
      console.error('Logout failed:', error);
      window.alert('로그아웃 처리 중 오류가 발생했습니다.');
    }
  };

  const handleIdentityConfirm = async (identity: UserIdentityProfile) => {
    if (!user) return;
    await upsertUserIdentityProfile(user.uid, identity);
    setUserIdentity(identity);
    setUserCountry(identity.country);
    setRankingRefreshTrigger(prev => prev + 1);
  };

  const userInitial = user?.displayName?.trim()?.charAt(0)?.toUpperCase();

  return (
    <>
      <Layout
        profile={profile}
        userCountry={userCountry}
        rankingRefreshTrigger={rankingRefreshTrigger}
        onSettingsClick={() => setSystemMenuOpen(true)}
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
          onRankingUpdate={() => setRankingRefreshTrigger(prev => prev + 1)}
          isSystemMenuOpen={systemMenuOpen}
          profileIdentity={userIdentity}
          onRequestProfileSetup={() => setProfileSetupOpen(true)}
        />
      </Layout>

      <SystemMenuModal
        isOpen={systemMenuOpen}
        onClose={() => setSystemMenuOpen(false)}
        profile={profile}
        setProfile={setProfile}
      />

      <ProfileSetupModal
        isOpen={profileSetupOpen}
        initialValue={userIdentity}
        onConfirm={handleIdentityConfirm}
        onClose={() => setProfileSetupOpen(false)}
      />
    </>
  );
}

export default App;
