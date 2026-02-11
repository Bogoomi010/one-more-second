import React, { useState, useEffect } from 'react';

interface GameBottomBarProps {
  latency?: number;
  onlineUsers?: number;
  onSettingsClick?: () => void;
}

export default function GameBottomBar({
  latency = 12,
  onlineUsers = 1204,
  onSettingsClick,
}: GameBottomBarProps) {
  const [currentLatency, setCurrentLatency] = useState(latency);
  const [currentOnlineUsers] = useState(onlineUsers);

  // Latency 업데이트 시뮬레이션 (실제로는 WebSocket이나 API에서 받아올 수 있음)
  useEffect(() => {
    const interval = setInterval(() => {
      // 실제로는 서버에서 받아온 값으로 업데이트
      setCurrentLatency(prev => {
        const variation = Math.floor(Math.random() * 5) - 2; // -2 ~ +2ms 변동
        return Math.max(5, Math.min(50, prev + variation));
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const formatOnlineUsers = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toLocaleString();
  };

  return (
    <div className="w-full min-w-0 bg-bg-secondary border border-border-primary rounded-[24px] px-4 sm:px-6 py-4 flex justify-between items-center gap-3 sm:gap-4 backdrop-blur-[10px] font-primary">
      {/* Connection Info */}
      <div className="flex items-center gap-4">
        {/* Latency */}
        <div className="flex items-center gap-2">
          <span className="text-[20px] font-tertiary text-accent-blue">
            📡
          </span>
          <span className="text-text-disabled font-secondary text-[11px] font-normal">
            Latency: {currentLatency}ms
          </span>
        </div>

        {/* Online Users */}
        <div className="flex items-center gap-2">
          <span className="text-[20px] font-tertiary text-accent-green">
            👥
          </span>
          <span className="text-text-disabled font-secondary text-[11px] font-normal">
            {formatOnlineUsers(currentOnlineUsers)} online
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex items-center gap-4">
        {onSettingsClick && (
          <span
            className="text-text-disabled font-secondary text-[11px] font-normal cursor-pointer transition-colors duration-200 hover:text-text-primary"
            onClick={onSettingsClick}
          >
            Settings
          </span>
        )}
      </div>
    </div>
  );
}
