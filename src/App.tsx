import React, { useState } from 'react';
import Layout from './components/Layout';
import GamePage from './pages/Game';
import { loadProfile, ensureDailyChallenge } from './gameSystem';

function App() {
  const [profile, setProfile] = useState(() => ensureDailyChallenge(loadProfile()));
  const [userCountry, setUserCountry] = useState<string>('KR');
  const [rankingRefreshTrigger, setRankingRefreshTrigger] = useState(0);

  return (
    <Layout 
      profile={profile} 
      userCountry={userCountry}
      rankingRefreshTrigger={rankingRefreshTrigger}
    >
      <GamePage 
        profile={profile}
        setProfile={setProfile}
        setUserCountry={setUserCountry}
        onRankingUpdate={() => setRankingRefreshTrigger(prev => prev + 1)}
      />
    </Layout>
  );
}

export default App;