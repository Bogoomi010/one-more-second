import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Game from './index';
import { defaultProfile } from '../../gameSystem/storage';
import { PlayerProfile } from '../../gameSystem/types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'game.enter') return 'ENTER';
      if (key === 'game.lifeIconAlt') return 'Life icon';
      return key;
    },
  }),
}));

// Mock the GameCanvas component since it uses canvas API
jest.mock('./components/GameCanvas', () => {
  return function MockGameCanvas({ onGameOver }: any) {
    return (
      <div data-testid="game-canvas">
        <button onClick={() => onGameOver({ scoreSeconds: 30, hitsTaken: 2 })}>
          Trigger Game Over
        </button>
      </div>
    );
  };
});

describe('Game Page Integration', () => {
  const GAME_START_COUNTDOWN_TICKS = 3;
  const GAME_START_COUNTDOWN_STEP_MS = 1000;
  const mockSetProfile = jest.fn();
  const mockSetUserCountry = jest.fn();
  const mockOnRankingUpdate = jest.fn();

  const defaultProps = {
    profile: defaultProfile(),
    setProfile: mockSetProfile,
    setUserCountry: mockSetUserCountry,
    onRankingUpdate: mockOnRankingUpdate,
    profileIdentity: null,
    isProfileSetupOpen: false,
    identityLoading: false,
    onRequestProfileSetup: jest.fn(),
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const completeStartCountdown = () => {
    for (let i = 0; i < GAME_START_COUNTDOWN_TICKS; i += 1) {
      act(() => {
        jest.advanceTimersByTime(GAME_START_COUNTDOWN_STEP_MS);
      });
    }
  };

  const startGame = () => {
    const enterButton = screen.getByText(/ENTER|game\.enter/i);
    fireEvent.click(enterButton);
    completeStartCountdown();
  };

  const getLocalDateKey = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  it('should render game canvas', () => {
    render(<Game {...defaultProps} />);
    startGame();
    expect(screen.getByTestId('game-canvas')).toBeInTheDocument();
  });

  it('should display initial lives', () => {
    render(<Game {...defaultProps} />);

    expect(screen.getAllByAltText(/Life icon|game\.lifeIconAlt/).length).toBe(3);
  });

  it('should update profile on game over', async () => {
    const profile = { ...defaultProfile(), coins: 0 };
    render(<Game {...defaultProps} profile={profile} />);
    startGame();
    const triggerButton = screen.getByText('Trigger Game Over');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(mockSetProfile).toHaveBeenCalled();
    });
    
    const updatedProfile = mockSetProfile.mock.calls[mockSetProfile.mock.calls.length - 1][0];
    expect(updatedProfile.totalRuns).toBe(1);
    expect(updatedProfile.totalSecondsSurvived).toBe(30);
    expect(updatedProfile.coins).toBeGreaterThan(0);
  });

  it('should show score modal after game over', async () => {
    render(<Game {...defaultProps} />);
    startGame();
    const triggerButton = screen.getByText('Trigger Game Over');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByText('GAME OVER')).toBeInTheDocument();
    });
  });

  it('should apply daily challenge reward', async () => {
    const profile: PlayerProfile = {
      ...defaultProfile(),
      dailyChallenge: {
        ...defaultProfile().dailyChallenge,
        dateKey: getLocalDateKey(),
        type: 'survival',
        targetSeconds: 20,
        rewardCoins: 500,
        completed: false,
      },
    };
    
    render(<Game {...defaultProps} profile={profile} />);
    startGame();
    const triggerButton = screen.getByText('Trigger Game Over');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(mockSetProfile).toHaveBeenCalled();
    });
    
    const updatedProfile = mockSetProfile.mock.calls[mockSetProfile.mock.calls.length - 1][0];
    expect(updatedProfile.dailyChallenge.completed).toBe(true);
  });

  it('should unlock achievements on game over', async () => {
    render(<Game {...defaultProps} />);
    startGame();
    const triggerButton = screen.getByText('Trigger Game Over');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(mockSetProfile).toHaveBeenCalled();
    });
    
    const updatedProfile = mockSetProfile.mock.calls[mockSetProfile.mock.calls.length - 1][0];
    expect(updatedProfile.achievements['first-run']).toBeDefined();
    expect(updatedProfile.achievements['survive-10']).toBeDefined();
    expect(updatedProfile.achievements['survive-30']).toBeDefined();
  });
});
