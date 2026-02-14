import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Layout from './Layout';
import { defaultProfile } from '../gameSystem/storage';

jest.mock('react-i18next', () => {
  const translationMap: Record<string, string> = {
    'layout.navGame': 'Game',
    'layout.navMarket': 'Shop',
    'layout.goHome': 'Go to homepage',
    'layout.languageSwitch': 'Change language',
    'layout.googleAuth': 'Google auth',
    'layout.userMenuSignedInAs': 'Signed in as',
    'layout.userMenuSignedOut': 'Not signed in',
    'layout.userMenuEditProfile': 'Edit Profile',
    'layout.userMenuLogin': 'Sign In',
    'layout.userMenuLogout': 'Sign Out',
    'layout.userDefaultName': 'User',
    'layout.systemMenu': 'System menu',
    'layout.footerYear': '2024',
    'layout.footerBrand': 'ONE MORE SECOND',
    'layout.footerTagline': 'STAY FOCUSED',
    'ranking.title': 'Ranking',
    'stats.tabStats': 'Stats',
    'stats.title': 'Stats & Achievements',
    'systemMenu.profile': 'Profile',
    'systemMenu.closeAria': 'Close',
  };

  return {
    useTranslation: () => ({
      t: (key: string) => translationMap[key] ?? key,
      i18n: {
        resolvedLanguage: 'en',
        language: 'en',
        changeLanguage: jest.fn(),
      },
    }),
  };
});

jest.mock('../services/userDataService', () => ({
  syncLanguagePreferenceToCloud: jest.fn(),
}));

jest.mock('./RankingPanel', () => function MockRankingPanel() {
  return <div data-testid="ranking-panel-mock">Ranking Panel Mock</div>;
});

jest.mock('./StatsPanel', () => function MockStatsPanel() {
  return <div data-testid="stats-panel-mock">Stats Panel Mock</div>;
});

jest.mock('./GameBottomBar', () => function MockGameBottomBar() {
  return <div data-testid="game-bottom-bar-mock" />;
});

function renderLayout(profileIncluded = true) {
  return render(
    <Layout profile={profileIncluded ? defaultProfile() : undefined}>
      <div>GAME_CONTENT</div>
    </Layout>
  );
}

describe('Layout mobile panel controls', () => {
  it('opens and closes ranking bottom sheet', () => {
    renderLayout();

    fireEvent.click(screen.getByRole('button', { name: 'Ranking' }));

    const dialog = screen.getByRole('dialog', { name: 'Ranking' });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByTestId('ranking-panel-mock')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog', { name: 'Ranking' })).not.toBeInTheDocument();
  });

  it('disables stats mobile button without profile', () => {
    renderLayout(false);
    expect(screen.getByRole('button', { name: 'Stats' })).toBeDisabled();
  });

  it('toggles stats bottom sheet with mobile button', () => {
    renderLayout(true);

    const statsButton = screen.getByRole('button', { name: 'Stats' });
    fireEvent.click(statsButton);

    const dialog = screen.getByRole('dialog', { name: 'Stats & Achievements' });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByTestId('stats-panel-mock')).toBeInTheDocument();

    fireEvent.click(statsButton);
    expect(screen.queryByRole('dialog', { name: 'Stats & Achievements' })).not.toBeInTheDocument();
  });
});
