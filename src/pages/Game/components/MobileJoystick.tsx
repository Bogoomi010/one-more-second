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
const BASE_RING_INSET = 22;
const BASE_RING_SIZE = 146;
const BASE_KNOB_SIZE = 48;
const BASE_MAX_KNOB_DISTANCE = 52;
const BASE_ARROW_SIZE = 20;
const BASE_ARROW_INSET = 10;
const BASE_DOT_SIZE = 6;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function resolveDeadzonePx(): number {
  const settings = loadSettings();
  return clamp(settings.graphics.touchDeadzone, 0, 80);
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
  const ringInset = BASE_RING_INSET * ratio;
  const ringSize = BASE_RING_SIZE * ratio;
  const knobSize = BASE_KNOB_SIZE * ratio;
  const maxKnobDistance = BASE_MAX_KNOB_DISTANCE * ratio;
  const arrowSize = Math.max(14, BASE_ARROW_SIZE * ratio);
  const arrowInset = Math.max(8, BASE_ARROW_INSET * ratio);
  const dotSize = Math.max(4, BASE_DOT_SIZE * ratio);
  const knobBaseOffset = (size - knobSize) / 2;

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
      className={`relative rounded-full bg-[#161E2E] shadow-[inset_0_1px_0_rgba(148,163,184,0.12)] select-none touch-none w-[var(--joystick-size)] h-[var(--joystick-size)] opacity-[var(--joystick-opacity)] ${
        isDragging ? 'transition-none' : 'transition-opacity duration-[160ms] ease-linear'
      }`}
      style={{
        '--joystick-size': `${size}px`,
        '--joystick-opacity': isDragging ? activeOpacity : idleOpacity,
        '--joystick-ring-inset': `${ringInset}px`,
        '--joystick-ring-size': `${ringSize}px`,
        '--joystick-ring-opacity': isDragging ? 0.72 : 0.55,
        '--joystick-arrow-inset': `${arrowInset}px`,
        '--joystick-arrow-size': `${arrowSize}px`,
        '--joystick-knob-size': `${knobSize}px`,
        '--joystick-knob-left': `${knobBaseOffset + knobOffset.x}px`,
        '--joystick-knob-top': `${knobBaseOffset + knobOffset.y}px`,
        '--joystick-knob-shadow': isDragging
          ? '0 0 0 2px rgba(37,99,235,0.28)'
          : 'none',
        '--joystick-dot-size': `${dotSize}px`,
      } as React.CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className="absolute rounded-full bg-[#0D1422] left-[var(--joystick-ring-inset)] top-[var(--joystick-ring-inset)] w-[var(--joystick-ring-size)] h-[var(--joystick-ring-size)] opacity-[var(--joystick-ring-opacity)]"
      />

      <span
        className="absolute left-1/2 -translate-x-1/2 leading-none text-[#64748B] top-[var(--joystick-arrow-inset)] text-[var(--joystick-arrow-size)]"
      >
        ^
      </span>
      <span
        className="absolute left-1/2 -translate-x-1/2 leading-none text-[#64748B] bottom-[var(--joystick-arrow-inset)] text-[var(--joystick-arrow-size)]"
      >
        v
      </span>
      <span
        className="absolute top-1/2 -translate-y-1/2 leading-none text-[#64748B] left-[var(--joystick-arrow-inset)] text-[var(--joystick-arrow-size)]"
      >
        &lt;
      </span>
      <span
        className="absolute top-1/2 -translate-y-1/2 leading-none text-[#64748B] right-[var(--joystick-arrow-inset)] text-[var(--joystick-arrow-size)]"
      >
        &gt;
      </span>

      <div
        className={`absolute rounded-full bg-[#334155] flex items-center justify-center left-[var(--joystick-knob-left)] top-[var(--joystick-knob-top)] w-[var(--joystick-knob-size)] h-[var(--joystick-knob-size)] shadow-[var(--joystick-knob-shadow)] ${
          isDragging ? 'transition-none' : 'transition-all duration-[150ms] ease-out'
        }`}
        style={{
          transitionDuration: `${knobTransitionMs}ms`,
        }}
      >
        <div
          className="rounded-full bg-[#2563EB] w-[var(--joystick-dot-size)] h-[var(--joystick-dot-size)]"
          style={{
            transform: `translate(${clamp(knobOffset.x * 0.1, -3 * ratio, 3 * ratio)}px, ${clamp(knobOffset.y * 0.1, -3 * ratio, 3 * ratio)}px)`,
          }}
        />
      </div>
    </div>
  );
}
