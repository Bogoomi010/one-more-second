import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Game from './index';
import { defaultProfile } from '../../gameSystem/storage';

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
  const mockSetProfile = jest.fn();
  const mockSetUserCountry = jest.fn();
  const mockOnRankingUpdate = jest.fn();

  const defaultProps = {
    profile: defaultProfile(),
    setProfile: mockSetProfile,
    setUserCountry: mockSetUserCountry,
    onRankingUpdate: mockOnRankingUpdate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render game canvas', () => {
    render(<Game {...defaultProps} />);
    
    expect(screen.getByTestId('game-canvas')).toBeInTheDocument();
  });

  it('should display initial lives', () => {
    render(<Game {...defaultProps} />);
    
    expect(screen.getByText(/♥/)).toBeInTheDocument();
  });

  it('should update profile on game over', async () => {
    const profile = { ...defaultProfile(), coins: 0 };
    render(<Game {...defaultProps} profile={profile} />);
    
    const triggerButton = screen.getByText('Trigger Game Over');
    triggerButton.click();
    
    await waitFor(() => {
      expect(mockSetProfile).toHaveBeenCalled();
    });
    
    const updatedProfile = mockSetProfile.mock.calls[0][0];
    expect(updatedProfile.totalRuns).toBe(1);
    expect(updatedProfile.totalSecondsSurvived).toBe(30);
    expect(updatedProfile.coins).toBeGreaterThan(0);
  });

  it('should show score modal after game over', async () => {
    render(<Game {...defaultProps} />);
    
    const triggerButton = screen.getByText('Trigger Game Over');
    triggerButton.click();
    
    await waitFor(() => {
      expect(screen.getByText('GAME OVER')).toBeInTheDocument();
    });
  });

  it('should apply daily challenge reward', async () => {
    const profile = {
      ...defaultProfile(),
      dailyChallenge: {
        dateKey: new Date().toISOString().split('T')[0],
        targetSeconds: 20,
        rewardCoins: 30,
        completed: false,
      },
    };
    
    render(<Game {...defaultProps} profile={profile} />);
    
    const triggerButton = screen.getByText('Trigger Game Over');
    triggerButton.click();
    
    await waitFor(() => {
      expect(mockSetProfile).toHaveBeenCalled();
    });
    
    const updatedProfile = mockSetProfile.mock.calls[0][0];
    expect(updatedProfile.dailyChallenge.completed).toBe(true);
  });

  it('should unlock achievements on game over', async () => {
    render(<Game {...defaultProps} />);
    
    const triggerButton = screen.getByText('Trigger Game Over');
    triggerButton.click();
    
    await waitFor(() => {
      expect(mockSetProfile).toHaveBeenCalled();
    });
    
    const updatedProfile = mockSetProfile.mock.calls[0][0];
    expect(updatedProfile.achievements['first-run']).toBeDefined();
    expect(updatedProfile.achievements['survive-10']).toBeDefined();
    expect(updatedProfile.achievements['survive-30']).toBeDefined();
  });
});
