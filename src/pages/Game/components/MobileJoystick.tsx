import React, { useEffect, useRef, useState } from 'react';
import { loadSettings, SETTINGS_UPDATED_EVENT } from '../../../gameSystem/settings';

type JoystickVector = {
  x: number;
  y: number;
};

interface MobileJoystickProps {
  onVectorChange: (vector: JoystickVector) => void;
  onInteraction?: () => void;
  size?: number;
  idleOpacity?: number;
  activeOpacity?: number;
  knobTransitionMs?: number;
}

const BASE_SIZE = 190;
const BASE_MAX_KNOB_DISTANCE = 52;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function resolveDeadzonePx(): number {
  const settings = loadSettings();
  return clamp(settings.graphics.touchDeadzone, 0, 80);
}

type JoystickSizePreset = {
  containerSizeClass: string;
  ringClass: string;
  arrowTopClass: string;
  arrowBottomClass: string;
  arrowLeftClass: string;
  arrowRightClass: string;
  arrowSizeClass: string;
  knobBaseClass: string;
  dotSizeClass: string;
};

const MOBILE_JOYSTICK_SIZE_PRESETS: Record<number, JoystickSizePreset> = {
  132: {
    containerSizeClass: 'w-[132px] h-[132px]',
    ringClass: 'left-[15.3px] top-[15.3px] w-[101.4px] h-[101.4px]',
    arrowTopClass: 'top-[8px]',
    arrowBottomClass: 'bottom-[8px]',
    arrowLeftClass: 'left-[8px]',
    arrowRightClass: 'right-[8px]',
    arrowSizeClass: 'text-[14px]',
    knobBaseClass: 'w-[33.3px] h-[33.3px]',
    dotSizeClass: 'w-[4.2px] h-[4.2px]',
  },
  146: {
    containerSizeClass: 'w-[146px] h-[146px]',
    ringClass: 'left-[16.9px] top-[16.9px] w-[112.2px] h-[112.2px]',
    arrowTopClass: 'top-[8px]',
    arrowBottomClass: 'bottom-[8px]',
    arrowLeftClass: 'left-[8px]',
    arrowRightClass: 'right-[8px]',
    arrowSizeClass: 'text-[15.4px]',
    knobBaseClass: 'w-[36.9px] h-[36.9px]',
    dotSizeClass: 'w-[4.6px] h-[4.6px]',
  },
  158: {
    containerSizeClass: 'w-[158px] h-[158px]',
    ringClass: 'left-[18.3px] top-[18.3px] w-[121.4px] h-[121.4px]',
    arrowTopClass: 'top-[8.3px]',
    arrowBottomClass: 'bottom-[8.3px]',
    arrowLeftClass: 'left-[8.3px]',
    arrowRightClass: 'right-[8.3px]',
    arrowSizeClass: 'text-[16.6px]',
    knobBaseClass: 'w-[39.9px] h-[39.9px]',
    dotSizeClass: 'w-[5px] h-[5px]',
  },
  160: {
    containerSizeClass: 'w-[160px] h-[160px]',
    ringClass: 'left-[18.5px] top-[18.5px] w-[122.9px] h-[122.9px]',
    arrowTopClass: 'top-[8.4px]',
    arrowBottomClass: 'bottom-[8.4px]',
    arrowLeftClass: 'left-[8.4px]',
    arrowRightClass: 'right-[8.4px]',
    arrowSizeClass: 'text-[16.8px]',
    knobBaseClass: 'w-[40.4px] h-[40.4px]',
    dotSizeClass: 'w-[5.1px] h-[5.1px]',
  },
  174: {
    containerSizeClass: 'w-[174px] h-[174px]',
    ringClass: 'left-[20.1px] top-[20.1px] w-[133.7px] h-[133.7px]',
    arrowTopClass: 'top-[9.2px]',
    arrowBottomClass: 'bottom-[9.2px]',
    arrowLeftClass: 'left-[9.2px]',
    arrowRightClass: 'right-[9.2px]',
    arrowSizeClass: 'text-[18.3px]',
    knobBaseClass: 'w-[44px] h-[44px]',
    dotSizeClass: 'w-[5.5px] h-[5.5px]',
  },
  175: {
    containerSizeClass: 'w-[175px] h-[175px]',
    ringClass: 'left-[20.3px] top-[20.3px] w-[134.5px] h-[134.5px]',
    arrowTopClass: 'top-[9.2px]',
    arrowBottomClass: 'bottom-[9.2px]',
    arrowLeftClass: 'left-[9.2px]',
    arrowRightClass: 'right-[9.2px]',
    arrowSizeClass: 'text-[18.4px]',
    knobBaseClass: 'w-[44.2px] h-[44.2px]',
    dotSizeClass: 'w-[5.5px] h-[5.5px]',
  },
  186: {
    containerSizeClass: 'w-[186px] h-[186px]',
    ringClass: 'left-[21.5px] top-[21.5px] w-[142.9px] h-[142.9px]',
    arrowTopClass: 'top-[9.8px]',
    arrowBottomClass: 'bottom-[9.8px]',
    arrowLeftClass: 'left-[9.8px]',
    arrowRightClass: 'right-[9.8px]',
    arrowSizeClass: 'text-[19.6px]',
    knobBaseClass: 'w-[47px] h-[47px]',
    dotSizeClass: 'w-[5.9px] h-[5.9px]',
  },
  192: {
    containerSizeClass: 'w-[192px] h-[192px]',
    ringClass: 'left-[22.2px] top-[22.2px] w-[147.5px] h-[147.5px]',
    arrowTopClass: 'top-[10.1px]',
    arrowBottomClass: 'bottom-[10.1px]',
    arrowLeftClass: 'left-[10.1px]',
    arrowRightClass: 'right-[10.1px]',
    arrowSizeClass: 'text-[20.2px]',
    knobBaseClass: 'w-[48.5px] h-[48.5px]',
    dotSizeClass: 'w-[6.1px] h-[6.1px]',
  },
  209: {
    containerSizeClass: 'w-[209px] h-[209px]',
    ringClass: 'left-[24.2px] top-[24.2px] w-[160.6px] h-[160.6px]',
    arrowTopClass: 'top-[11px]',
    arrowBottomClass: 'bottom-[11px]',
    arrowLeftClass: 'left-[11px]',
    arrowRightClass: 'right-[11px]',
    arrowSizeClass: 'text-[22px]',
    knobBaseClass: 'w-[52.8px] h-[52.8px]',
    dotSizeClass: 'w-[6.6px] h-[6.6px]',
  },
  223: {
    containerSizeClass: 'w-[223px] h-[223px]',
    ringClass: 'left-[25.8px] top-[25.8px] w-[171.4px] h-[171.4px]',
    arrowTopClass: 'top-[11.7px]',
    arrowBottomClass: 'bottom-[11.7px]',
    arrowLeftClass: 'left-[11.7px]',
    arrowRightClass: 'right-[11.7px]',
    arrowSizeClass: 'text-[23.5px]',
    knobBaseClass: 'w-[56.3px] h-[56.3px]',
    dotSizeClass: 'w-[7px] h-[7px]',
  },
};

function getNearestPreset(size: number): JoystickSizePreset {
  const keys = Object.keys(MOBILE_JOYSTICK_SIZE_PRESETS)
    .map((key) => Number(key))
    .sort((a, b) => a - b);
  const nearest = keys.reduce((prev, curr) => {
    return Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev;
  }, keys[0]);

  return MOBILE_JOYSTICK_SIZE_PRESETS[nearest];
}

function getOpacityClass(opacity: number): string | null {
  if (opacity === 0.62) return 'opacity-[0.62]';
  if (opacity === 0.66) return 'opacity-[0.66]';
  if (opacity === 0.94) return 'opacity-[0.94]';
  if (opacity === 0.96) return 'opacity-[0.96]';
  return null;
}

function getTransitionDurationClass(durationMs: number): string {
  if (durationMs === 80) return 'duration-[80ms]';
  if (durationMs === 90) return 'duration-[90ms]';
  if (durationMs === 150) return 'duration-[150ms]';
  return 'duration-[160ms]';
}

export default function MobileJoystick({
  onVectorChange,
  onInteraction,
  size = BASE_SIZE,
  idleOpacity = 0.66,
  activeOpacity = 0.96,
  knobTransitionMs = 90,
}: MobileJoystickProps) {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const [deadzonePx, setDeadzonePx] = useState(resolveDeadzonePx);
  const [isDragging, setIsDragging] = useState(false);

  const ratio = size / BASE_SIZE;
  const maxKnobDistance = BASE_MAX_KNOB_DISTANCE * ratio;
  const knobSizePreset = getNearestPreset(size);
  const ringShadowClass = isDragging
    ? 'shadow-[0_0_0_2px_rgba(37,99,235,0.28)]'
    : 'shadow-none';
  const knobPositionClass = `absolute rounded-full bg-[#334155] flex items-center justify-center left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${knobSizePreset.knobBaseClass} ${ringShadowClass} ${
    isDragging ? 'transition-none' : `transition-all ${getTransitionDurationClass(knobTransitionMs)} ease-out`
  }`;
  const opacityClass = isDragging
    ? getOpacityClass(activeOpacity) ?? 'opacity-[0.96]'
    : getOpacityClass(idleOpacity) ?? 'opacity-[0.66]';

  useEffect(() => {
    const handleSettingsUpdated = () => {
      setDeadzonePx(resolveDeadzonePx());
    };

    window.addEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdated as EventListener);
    return () => {
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    return () => {
      onVectorChange({ x: 0, y: 0 });
    };
  }, [onVectorChange]);

  const emitVector = (offsetX: number, offsetY: number) => {
    const distance = Math.hypot(offsetX, offsetY);
    const scaledDeadzone = deadzonePx * ratio;
    const cappedDeadzone = Math.min(scaledDeadzone, maxKnobDistance - 1);

    if (distance <= cappedDeadzone || distance <= 0.0001) {
      onVectorChange({ x: 0, y: 0 });
      return;
    }

    const activeMagnitude = (distance - cappedDeadzone) / (maxKnobDistance - cappedDeadzone);
    const normalizedMagnitude = clamp(activeMagnitude, 0, 1);
    const nx = (offsetX / distance) * normalizedMagnitude;
    const ny = (offsetY / distance) * normalizedMagnitude;

    onVectorChange({
      x: clamp(nx, -1, 1),
      y: clamp(ny, -1, 1),
    });
  };

  const updateFromClientPoint = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;

    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rawDx = clientX - centerX;
    const rawDy = clientY - centerY;
    const distance = Math.hypot(rawDx, rawDy);

    if (distance <= maxKnobDistance || distance <= 0.0001) {
      setKnobOffset({ x: rawDx, y: rawDy });
      emitVector(rawDx, rawDy);
      return;
    }

    const clampedDx = (rawDx / distance) * maxKnobDistance;
    const clampedDy = (rawDy / distance) * maxKnobDistance;
    setKnobOffset({ x: clampedDx, y: clampedDy });
    emitVector(clampedDx, clampedDy);
  };

  const reset = () => {
    activePointerIdRef.current = null;
    setIsDragging(false);
    setKnobOffset({ x: 0, y: 0 });
    onVectorChange({ x: 0, y: 0 });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    onInteraction?.();
    activePointerIdRef.current = event.pointerId;
    setIsDragging(true);
    updateFromClientPoint(event.clientX, event.clientY);

    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    updateFromClientPoint(event.clientX, event.clientY);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    reset();
  };

  return (
    <div
      ref={baseRef}
      className={`relative rounded-full bg-[#161E2E] shadow-[inset_0_1px_0_rgba(148,163,184,0.12)] select-none touch-none ${knobSizePreset.containerSizeClass} ${opacityClass} ${
        isDragging ? 'transition-none' : 'transition-opacity duration-[160ms] ease-linear'
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className={`absolute rounded-full bg-[#0D1422] ${knobSizePreset.ringClass} ${isDragging ? 'opacity-[0.72]' : 'opacity-[0.55]'}`}
      />

      <span
        className={`absolute left-1/2 -translate-x-1/2 leading-none text-[#64748B] ${knobSizePreset.arrowTopClass} ${knobSizePreset.arrowSizeClass}`}
      >
        ^
      </span>
      <span
        className={`absolute left-1/2 -translate-x-1/2 leading-none text-[#64748B] ${knobSizePreset.arrowBottomClass} ${knobSizePreset.arrowSizeClass}`}
      >
        v
      </span>
      <span
        className={`absolute top-1/2 -translate-y-1/2 leading-none text-[#64748B] ${knobSizePreset.arrowLeftClass} ${knobSizePreset.arrowSizeClass}`}
      >
        &lt;
      </span>
      <span
        className={`absolute top-1/2 -translate-y-1/2 leading-none text-[#64748B] ${knobSizePreset.arrowRightClass} ${knobSizePreset.arrowSizeClass}`}
      >
        &gt;
      </span>

      <div
        className={knobPositionClass}
        style={{
          transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
        }}
      >
        <div
          className={`rounded-full bg-[#2563EB] ${knobSizePreset.dotSizeClass} absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`}
        />
      </div>
    </div>
  );
}
