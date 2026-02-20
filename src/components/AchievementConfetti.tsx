import { useEffect, useState } from 'react';
import ReactConfetti from 'react-confetti';

type Props = {
  isActive: boolean;
  achievementCount: number;
};

type WindowSize = {
  width: number;
  height: number;
};

const Confetti = ReactConfetti as unknown as React.FC<Record<string, unknown>>;

function getConfettiColors(achievementCount: number) {
  const base = ['#ffbe0b', '#fb5607', '#ff006e', '#8338ec', '#3a86ff', '#06d6a0', '#ef476f', '#ffd166'];

  if (achievementCount >= 4) {
    return [...base, '#f15bb5', '#00bbf9', '#f1c27d'];
  }

  return base;
}

export default function AchievementConfetti({ isActive, achievementCount }: Props) {
  const [size, setSize] = useState<WindowSize>(() => ({
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    height: typeof window === 'undefined' ? 0 : window.innerHeight,
  }));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!isActive || size.width === 0 || size.height === 0) {
    return null;
  }

  const colorPalette = getConfettiColors(Math.max(1, achievementCount));
  const count = Math.min(720, 260 + Math.max(1, achievementCount) * 140);

  return (
    <div className="fixed inset-0 z-[10040] pointer-events-none overflow-hidden">
      <style>{`
        @keyframes achievement-confetti-rush {
          0% {
            opacity: 0;
          }
          8% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        .achievement-confetti-layer canvas {
          border: 1px solid #c0c0c0;
          background: transparent;
          cursor: -webkit-grab;
          display: block;
        }

        .achievement-confetti-layer {
          width: 100%;
          height: 100%;
          animation: achievement-confetti-rush 5.2s ease-in-out;
          filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.18));
        }
      `}</style>

      <div className="absolute inset-0 achievement-confetti-layer">
        <Confetti
          width={size.width}
          height={size.height}
          numberOfPieces={count}
          gravity={0.17}
          recycle={false}
          colors={colorPalette}
          confettiSource={{
            x: 0,
            y: 0,
            w: size.width,
            h: 0,
          }}
          initialVelocityY={{ min: 2, max: 14 }}
          initialVelocityX={{ min: -20, max: 20 }}
          opacity={0.95}
          tweenDuration={2200}
          wind={0}
        />

        <Confetti
          width={size.width}
          height={size.height}
          numberOfPieces={Math.floor(count * 0.65)}
          gravity={0.24}
          recycle={false}
          colors={[...colorPalette].reverse()}
          confettiSource={{
            x: size.width * 0.45,
            y: 0,
            w: size.width,
            h: 0,
          }}
          initialVelocityY={{ min: 3, max: 12 }}
          initialVelocityX={{ min: -28, max: 28 }}
          friction={0.98}
          wind={0}
        />
      </div>
    </div>
  );
}
