import React from 'react';
import { PlayerProfile } from '../gameSystem/types';
import NewRankingPanel from './NewRankingPanel';
import NewStatsPanel from './NewStatsPanel';
import GameBottomBar from './GameBottomBar';

interface LayoutProps {
  children: React.ReactNode;
  profile?: PlayerProfile;
  userCountry?: string;
  rankingRefreshTrigger?: number;
  onSettingsClick?: () => void;
}

export default function Layout({ children, profile, userCountry, rankingRefreshTrigger, onSettingsClick }: LayoutProps) {
  return (
    <div className="h-screen bg-bg-primary flex flex-col items-center w-full overflow-hidden box-border">
      {/* Header */}
      <div className="w-full bg-bg-secondary border border-border-primary px-6 py-4 flex justify-between items-center backdrop-blur-[10px]">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="w-[40px] h-[40px] rounded-xl bg-bg-card flex justify-center items-center">
            <span className="text-[24px] font-tertiary font-bold text-bg-primary">
              ⚡
            </span>
          </div>
          <div className="flex items-center gap-1 font-primary">
            <span className="text-[24px] italic font-bold text-text-primary">ONE</span>
            <span className="text-[24px] italic font-bold text-accent-green">MORE</span>
            <span className="text-[24px] italic font-bold text-text-primary">SECOND</span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-6">
          {/* Navigation */}
          <div className="flex gap-8 items-center">
            <span className="text-accent-green font-primary text-[14px] font-bold">
              Game
            </span>
            <span className="text-text-muted font-primary text-[14px] font-bold cursor-pointer">
              Market
            </span>
            <span className="text-text-muted font-primary text-[14px] font-bold cursor-pointer">
              Global Wall
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-bg-card-alt" />

          {/* Language Button */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer">
            <span className="text-base font-tertiary">🌐</span>
            <span className="text-text-muted font-primary text-[14px] font-semibold">
              EN
            </span>
          </div>

          {/* Menu Button */}
          {onSettingsClick && (
            <div
              className="w-8 h-8 rounded-lg bg-bg-card-alt border border-white/20 flex justify-center items-center cursor-pointer transition-all duration-200 hover:bg-white/20"
              onClick={onSettingsClick}
            >
              <span className="text-base font-tertiary text-text-primary">
                ☰
              </span>
            </div>
          )}

          {/* User Button */}
          <div className="w-[40px] h-[40px] rounded-xl bg-bg-card border border-border-primary flex justify-center items-center cursor-pointer">
            <span className="text-[20px] font-tertiary">👤</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full min-h-0 flex justify-center p-5 box-border overflow-hidden">
        <div className="w-full max-w-[min(1920px,calc(100%-40px))] h-full min-h-0 box-border overflow-hidden">
          <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] gap-5 items-stretch">
            <div className="min-w-0 min-h-0 h-full rounded-2xl border border-border-primary bg-bg-secondary/30 p-4 flex flex-col items-center overflow-hidden">
              <div className="mb-3 text-[11px] font-secondary font-bold tracking-wide text-text-placeholder">LEFT</div>
              <div className="w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden">
                <NewRankingPanel
                  userCountry={userCountry}
                  refreshTrigger={rankingRefreshTrigger}
                />
              </div>
            </div>

            <div className="min-w-0 min-h-0 h-full rounded-2xl border border-border-primary bg-bg-secondary/30 p-4 flex flex-col overflow-hidden">
              <div className="mb-3 text-[11px] font-secondary font-bold tracking-wide text-text-placeholder">MAIN</div>
              <div className="w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden">
                {Array.isArray(children) ? children.map((child, idx) => (
                  <div key={idx} className="w-full max-w-full flex justify-center min-h-0">
                    {child}
                  </div>
                )) : (
                  <div className="w-full max-w-full flex justify-center min-h-0">
                    {children}
                  </div>
                )}
              </div>
              <div className="w-full shrink-0 pt-4">
                <div className="rounded-xl border border-border-secondary bg-bg-primary/40 p-3">
                  <div className="mb-2 text-[10px] font-secondary font-bold tracking-wide text-text-placeholder">FOOTER</div>
                  <div className="w-full flex justify-center overflow-hidden">
                    <GameBottomBar onSettingsClick={onSettingsClick} />
                  </div>
                </div>
              </div>
            </div>

            <div className="min-w-0 min-h-0 h-full rounded-2xl border border-border-primary bg-bg-secondary/30 p-4 flex flex-col items-center overflow-hidden">
              <div className="mb-3 text-[11px] font-secondary font-bold tracking-wide text-text-placeholder">RIGHT</div>
              <div className="w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden">
                {profile ? <NewStatsPanel profile={profile} /> : <div className="w-full max-w-80" />}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-[#ffffff0d] py-12 flex justify-center items-center shrink-0">
        <div className="flex items-center gap-1 font-secondary text-[10px] font-normal">
          <span className="text-text-placeholder">© 2024</span>
          <span className="text-accent-blue">ONE MORE SECOND</span>
          <span className="text-text-placeholder">. STAY FOCUSED.</span>
        </div>
      </footer>
    </div>
  );
}
