import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { defaultProfile } from '../gameSystem/storage';

jest.mock('../i18n/index', () => ({
  SUPPORTED_LANGUAGES: ['en', 'ko', 'ja', 'zh-CN'],
  getLanguagePath: (value: string) => `/${value}`,
  normalizeLanguage: (value?: string) => (value as 'en' | 'ko' | 'ja' | 'zh-CN') ?? 'en',
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: Layout } = require('./Layout') as {
  default: React.ComponentType<Record<string, unknown>>;
};

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
    'systemMenu.achievements': 'Achievements',
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

function renderLayout(profileIncluded = true, overrides: Partial<React.ComponentProps<typeof Layout>> = {}) {
  return render(
    <Layout profile={profileIncluded ? defaultProfile() : undefined} {...overrides}>
      <div>GAME_CONTENT</div>
    </Layout>
  );
}

beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      media: query,
      matches: query.includes('1239px') ? true : false,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })) as typeof window.matchMedia;
  }

  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

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

    const dialog = screen.getByRole('dialog', { name: 'Stats' });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByTestId('stats-panel-mock')).toBeInTheDocument();

    fireEvent.click(statsButton);
    expect(screen.queryByRole('dialog', { name: 'Stats' })).not.toBeInTheDocument();
  });

  it('opens achievements modal from desktop header achievements button', () => {
    const onAchievementsClick = jest.fn();
    renderLayout(true, { onAchievementsClick });

    fireEvent.click(screen.getByRole('button', { name: 'Achievements' }));
    expect(onAchievementsClick).toHaveBeenCalledTimes(1);
  });
});
