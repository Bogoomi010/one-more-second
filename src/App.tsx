import React, { useState } from 'react';
import Layout from './components/Layout';
import GamePage from './pages/Game';
import { loadProfile, ensureDailyChallenge } from './gameSystem';
import SystemMenuModal from './pages/Game/components/SystemMenuModal';

function App() {
  const [profile, setProfile] = useState(() => ensureDailyChallenge(loadProfile()));
  const [userCountry, setUserCountry] = useState<string>('KR');
  const [rankingRefreshTrigger, setRankingRefreshTrigger] = useState(0);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);

  return (
    <>
      <Layout
        profile={profile}
      userCountry={userCountry}
      rankingRefreshTrigger={rankingRefreshTrigger}
        onSettingsClick={() => setSystemMenuOpen(true)}
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