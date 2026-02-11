import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import GamePage from './pages/Game';
import { loadProfile, ensureDailyChallenge } from './gameSystem';
import SystemMenuModal from './pages/Game/components/SystemMenuModal';
import { useAuth } from './context/AuthContext';
import i18n from './i18n';
import { getUserLanguagePreference } from './services/userDataService';

function App() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [profile, setProfile] = useState(() => ensureDailyChallenge(loadProfile()));
  const [userCountry, setUserCountry] = useState<string>('KR');
  const [rankingRefreshTrigger, setRankingRefreshTrigger] = useState(0);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const syncLanguageFromCloud = async () => {
      if (!user) return;
      const language = await getUserLanguagePreference(user.uid);
      if (!cancelled && language) {
        await i18n.changeLanguage(language);
      }
    };

    void syncLanguageFromCloud();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleUserButtonClick = async () => {
    try {
      if (user) {
        await signOut();
        return;
      }
      await signInWithGoogle();
    } catch (error) {
      console.error('Auth action failed:', error);
      const message =
        error instanceof Error && error.message.includes('auth/configuration-not-found')
          ? 'Firebase Authentication 설정이 완료되지 않았습니다. Firebase 콘솔에서 Google 로그인 활성화와 Authorized domains(localhost) 설정을 확인해주세요.'
          : '로그인 처리 중 오류가 발생했습니다. Firebase 설정을 확인해주세요.';
      window.alert(message);
    }
  };

  const userInitial = user?.displayName?.trim()?.charAt(0)?.toUpperCase();

  return (
    <>
      <Layout
        profile={profile}
        userCountry={userCountry}
        rankingRefreshTrigger={rankingRefreshTrigger}
        onSettingsClick={() => setSystemMenuOpen(true)}
        onUserButtonClick={handleUserButtonClick}
        userInitial={userInitial}
      >
        <GamePage
          profile={profile}
          setProfile={setProfile}
          setUserCountry={setUserCountry}
          onRankingUpdate={() => setRankingRefreshTrigger(prev => prev + 1)}
          isSystemMenuOpen={systemMenuOpen}
        />
      </Layout>

      <SystemMenuModal
        isOpen={systemMenuOpen}
        onClose={() => setSystemMenuOpen(false)}
        profile={profile}
        setProfile={setProfile}
      />
    </>
  );
}

export default App;
