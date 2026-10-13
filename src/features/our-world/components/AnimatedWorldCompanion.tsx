import React, { useEffect, useRef, useState } from 'react';
import { COMPANION_ANIMATION } from '../data/companion-animation';
import type { WorldCompanionDef } from '../data/companions';
import type { CompanionCue } from '../engine/companionMotion';
interface Props {
  def: WorldCompanionDef;
  cue: CompanionCue;
  paused: boolean;
  lightIntensity: number;
  isEditing: boolean;
  onInteract: (def: WorldCompanionDef, screenX: number, screenY: number) => void;
}
export default function WorldCompanion({
  def,
  cue,
  paused,
  lightIntensity,
  isEditing,
  onInteract,
}: Props) {
  const [greeting, setGreeting] = useState(false);
  const [moving, setMoving] = useState(cue.pose === 'walk');
  const greetTimer = useRef<number | undefined>(undefined);
  const targetRef = useRef({ x: cue.x, y: cue.y });
  const atlas = def.id === 'max' ? COMPANION_ANIMATION.max : COMPANION_ANIMATION.abi;
  const size = def.id === 'max' ? 160 : 96;
  useEffect(() => {
    const changed = targetRef.current.x !== cue.x || targetRef.current.y !== cue.y;
    targetRef.current = { x: cue.x, y: cue.y };
    if (cue.pose !== 'walk' || paused || !changed) {
      setMoving(false);
      return;
    }
    setMoving(!cue.delay);
    const start = window.setTimeout(() => setMoving(true), cue.delay || 0);
    const stop = window.setTimeout(() => setMoving(false), cue.duration + (cue.delay || 0));
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(stop);
    };
  }, [cue.pose, cue.x, cue.y, cue.duration, cue.delay, paused]);
  useEffect(() => () => window.clearTimeout(greetTimer.current), []);
  const pose = moving ? 'walk' : greeting ? 'play' : cue.pose === 'walk' ? 'idle' : cue.pose;
  const greet = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    window.clearTimeout(greetTimer.current);
    setGreeting(true);
    greetTimer.current = window.setTimeout(() => setGreeting(false), 1800);
    const rect = event.currentTarget.getBoundingClientRect();
    onInteract(def, rect.left + rect.width / 2, rect.top + rect.height / 3);
  };
  return (
    <button
      type="button"
      disabled={isEditing}
      onClick={greet}
      className={`world-companion world-companion--${pose}${paused ? ' world-companion--paused' : ''}`}
      aria-label={def.name}
      data-companion={def.id}
      data-pose={pose}
      style={{
        left: `${cue.x}%`,
        bottom: `${cue.y}%`,
        width: size,
        height: size,
        transitionDuration: `${cue.duration}ms, ${cue.duration}ms, 1s`,
        transitionDelay: `${cue.delay || 0}ms, ${cue.delay || 0}ms, 0ms`,
        zIndex: Math.floor((100 - cue.y) * 10),
        filter: `brightness(${0.65 + lightIntensity * 0.35})`,
      }}
    >
      <span className="world-companion__shadow" aria-hidden="true" />
      <span
        className="world-companion__body"
        style={{ transform: `scaleX(${cue.facingRight ? 1 : -1})` }}
      >
        <span
          className="world-companion__sprite"
          aria-hidden="true"
          style={{ backgroundImage: `url('${atlas.source}')` }}
        />
      </span>
    </button>
  );
}
