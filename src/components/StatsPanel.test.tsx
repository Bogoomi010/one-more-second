import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StatsPanel from './StatsPanel';
import { defaultProfile } from '../gameSystem/storage';
import { PlayerProfile } from '../gameSystem/types';

describe('StatsPanel Component', () => {
  const mockProfile: PlayerProfile = {
    ...defaultProfile(),
    coins: 100,
    totalRuns: 10,
    totalSecondsSurvived: 500,
    bestScore: 60,
    achievements: {
      'first-run': { unlockedAt: Date.now() },
      'survive-10': { unlockedAt: Date.now() },
    },
  };

  it('should render tab buttons', () => {
    render(<StatsPanel profile={mockProfile} />);
    
    expect(screen.getByText('통계')).toBeInTheDocument();
    expect(screen.getByText(/업적/)).toBeInTheDocument();
  });

  it('should display best score', () => {
    render(<StatsPanel profile={mockProfile} />);
    
    expect(screen.getByText('1분 0초')).toBeInTheDocument();
  });

  it('should display total runs', () => {
    render(<StatsPanel profile={mockProfile} />);
    
    expect(screen.getByText('10회')).toBeInTheDocument();
  });

  it('should display coins', () => {
    render(<StatsPanel profile={mockProfile} />);
    
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should switch to achievements tab', () => {
    render(<StatsPanel profile={mockProfile} />);
    
    fireEvent.click(screen.getByText(/업적/));
    
    expect(screen.getByText('첫 판')).toBeInTheDocument();
    expect(screen.getByText('10초 생존')).toBeInTheDocument();
  });

  it('should show achievement progress', () => {
    render(<StatsPanel profile={mockProfile} />);
    
    fireEvent.click(screen.getByText(/업적/));
    
    expect(screen.getByText('달성률')).toBeInTheDocument();
  });

  it('should display daily challenge info', () => {
    render(<StatsPanel profile={mockProfile} />);
    
    expect(screen.getByText(/오늘의 챌린지/)).toBeInTheDocument();
  });

  it('should show completed status for unlocked achievements', () => {
    render(<StatsPanel profile={mockProfile} />);
    
    fireEvent.click(screen.getByText(/업적/));
    
    const checkmarks = screen.getAllByText('✓');
    expect(checkmarks.length).toBeGreaterThan(0);
  });

  it('should show locked status for locked achievements', () => {
    render(<StatsPanel profile={defaultProfile()} />);
    
    fireEvent.click(screen.getByText(/업적/));
    
    const locks = screen.getAllByText('🔒');
    expect(locks.length).toBeGreaterThan(0);
  });
});
