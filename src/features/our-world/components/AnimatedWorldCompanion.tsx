import React, { useEffect, useRef, useState } from 'react';
import { COMPANION_ANIMATION } from '../data/companion-animation';
import type { WorldCompanionDef } from '../data/companions';
import type { CompanionCue, CompanionPose } from '../engine/companionMotion';
interface Props {
  def: WorldCompanionDef;
  cue: CompanionCue;
  paused: boolean;
  friendReaction?: number;
  lightIntensity: number;
  isEditing: boolean;
  onInteract: (def: WorldCompanionDef, screenX: number, screenY: number, action: string) => void;
}
export default function WorldCompanion({
  def,
  cue,
  paused,
  friendReaction,
  lightIntensity,
  isEditing,
  onInteract,
}: Props) {
  const [reactionPose, setReactionPose] = useState<CompanionPose | null>(null);
  const [moving, setMoving] = useState(cue.pose === 'walk' || cue.pose === 'run');
  const greetTimer = useRef<number | undefined>(undefined);
  const greetingCount = useRef(0);
  const targetRef = useRef({ x: cue.x, y: cue.y });
  const atlas = def.id === 'max' ? COMPANION_ANIMATION.max : COMPANION_ANIMATION.abi;
  const size = def.id === 'max' ? 160 : 96;
  useEffect(() => {
    const changed = targetRef.current.x !== cue.x || targetRef.current.y !== cue.y;
    targetRef.current = { x: cue.x, y: cue.y };
    if ((cue.pose !== 'walk' && cue.pose !== 'run') || paused || !changed) {
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
  useEffect(() => {
    if (friendReaction === undefined) return;
    window.clearTimeout(greetTimer.current);
    setReactionPose(friendReaction % 2 ? 'tilt' : 'hop');
    greetTimer.current = window.setTimeout(() => setReactionPose(null), 1700);
  }, [friendReaction]);
  const pose =
    reactionPose ||
    (moving ? cue.pose : cue.pose === 'walk' || cue.pose === 'run' ? 'idle' : cue.pose);
  const actionPose = [
    'sit',
    'tilt',
    'pant',
    'hop',
    'lie',
    'watch',
    'sniff',
    'drink',
    'shake',
  ].includes(pose);
  const greet = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    window.clearTimeout(greetTimer.current);
    const reactions: { pose: CompanionPose; action: string }[] = [
      { pose: 'hop', action: 'salta para saludarte' },
      { pose: 'tilt', action: 'inclina la cabeza para escucharte' },
      { pose: 'pant', action: 'se alegra de verte' },
      { pose: 'stretch', action: 'se estira para que lo acaricies' },
    ];
    const reaction = reactions[greetingCount.current++ % reactions.length];
    setReactionPose(reaction.pose);
    greetTimer.current = window.setTimeout(() => setReactionPose(null), 2200);
    const rect = event.currentTarget.getBoundingClientRect();
    onInteract(def, rect.left + rect.width / 2, rect.top + rect.height / 3, reaction.action);
  };
  return (
    <button
      type="button"
      disabled={isEditing}
      onClick={greet}
      className={`world-companion world-companion--${pose}${paused ? ' world-companion--paused' : ''}`}
      aria-label={`Acariciar a ${def.name}`}
      data-companion={def.id}
      data-pose={pose}
      style={{
        left: `${cue.x}%`,
        bottom: `${cue.y}%`,
        width: size,
        height: size,
        transform: `translateX(-50%) scale(${Math.max(0.7, 1 - Math.max(0, cue.y - 20) * 0.012)})`,
        transitionDuration: `${cue.duration}ms, ${cue.duration}ms, ${cue.duration}ms, 1s`,
        transitionDelay: `${cue.delay || 0}ms, ${cue.delay || 0}ms, ${cue.delay || 0}ms, 0ms`,
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
          style={{ backgroundImage: `url('${actionPose ? atlas.actionSource : atlas.source}')` }}
        />
      </span>
    </button>
  );
}
