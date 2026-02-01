import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RankingPanel from './RankingPanel';
import { addRankingEntry, clearRankingData } from '../gameSystem/ranking';

describe('RankingPanel Component', () => {
  beforeEach(() => {
    clearRankingData();
  });

  it('should render tab buttons', () => {
    render(<RankingPanel />);
    
    expect(screen.getByText('전체')).toBeInTheDocument();
    expect(screen.getByText('국가별')).toBeInTheDocument();
    expect(screen.getByText('일일')).toBeInTheDocument();
  });

  it('should show empty message when no rankings', () => {
    render(<RankingPanel />);
    
    expect(screen.getByText('아직 기록이 없습니다')).toBeInTheDocument();
  });

  it('should display global rankings', () => {
    addRankingEntry('Player1', 'KR', 100);
    addRankingEntry('Player2', 'US', 90);
    
    render(<RankingPanel />);
    
    expect(screen.getByText('Player1')).toBeInTheDocument();
    expect(screen.getByText('Player2')).toBeInTheDocument();
  });

  it('should switch to country tab', () => {
    addRankingEntry('Player1', 'KR', 100);
    addRankingEntry('Player2', 'US', 90);
    
    render(<RankingPanel />);
    
    fireEvent.click(screen.getByText('국가별'));
    
    // Should show country selector
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should format time correctly', () => {
    addRankingEntry('Player1', 'KR', 65);
    
    render(<RankingPanel />);
    
    expect(screen.getByText('1m 5s')).toBeInTheDocument();
  });

  it('should show rank numbers', () => {
    addRankingEntry('Player1', 'KR', 100);
    addRankingEntry('Player2', 'KR', 90);
    
    render(<RankingPanel />);
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
