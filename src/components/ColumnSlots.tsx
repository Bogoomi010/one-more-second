import React from 'react';

interface AdSlotProps {
  position: string;
}

export function AdSlot({ position }: AdSlotProps) {
  return (
    <div className="w-full rounded-xl border border-dashed border-border-secondary bg-bg-primary/20 px-3 py-2">
      <div className="text-[10px] font-secondary font-bold tracking-wide text-text-placeholder">
        AD SLOT
      </div>
      <div className="mt-1 text-[11px] font-secondary text-text-muted">{position}</div>
    </div>
  );
}

interface LeftColumnProps {
  mainPanel: React.ReactNode;
}

export function LeftColumn({ mainPanel }: LeftColumnProps) {
  return (
    <div className="w-full h-full min-w-0 min-h-0 overflow-hidden">
      <div className="w-full h-full min-w-0 min-h-0 overflow-hidden">{mainPanel}</div>
    </div>
  );
}

interface MainColumnProps {
  mainPanel: React.ReactNode;
}

export function MainColumn({ mainPanel }: MainColumnProps) {
  return (
    <div className="w-full h-full min-w-0 min-h-0 overflow-hidden">
      <div className="w-full h-full min-w-0 min-h-0 overflow-hidden">{mainPanel}</div>
    </div>
  );
}

interface RightColumnProps {
  mainPanel: React.ReactNode;
}

export function RightColumn({ mainPanel }: RightColumnProps) {
  return (
    <div className="w-full h-full min-w-0 min-h-0 overflow-hidden">
      <div className="w-full h-full min-w-0 min-h-0 overflow-hidden">{mainPanel}</div>
    </div>
  );
}
