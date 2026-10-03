import React, { useEffect, useState } from 'react';
import WorldCompanion from './AnimatedWorldCompanion';
import type { WorldCompanionDef } from '../data/companions';
import { COMPANION_MOMENTS } from '../engine/companionMotion';
import type { TimeOfDay } from '../types';
interface Props {
  companions: WorldCompanionDef[]; timeOfDay: TimeOfDay; lightIntensity: number; isEditing: boolean;
  onInteract: (pet: WorldCompanionDef, x: number, y: number) => void;
}
export default function WorldCompanions({ companions, timeOfDay, lightIntensity, isEditing, onInteract }: Props) {
  const [moment, setMoment] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const resting = timeOfDay === 'night';
  const current = COMPANION_MOMENTS[moment];
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateVisibility = () => setHidden(document.hidden);
    const updateMotion = () => setReducedMotion(media.matches);
    updateVisibility(); updateMotion();
    document.addEventListener('visibilitychange', updateVisibility);
    media.addEventListener('change', updateMotion);
    return () => { document.removeEventListener('visibilitychange', updateVisibility); media.removeEventListener('change', updateMotion); };
  }, []);
  useEffect(() => {
    if (!companions.length || resting || isEditing || hidden || reducedMotion) return;
    const timer = window.setTimeout(() => setMoment(index => (index + 1) % COMPANION_MOMENTS.length), current.duration);
    return () => window.clearTimeout(timer);
  }, [companions.length, resting, isEditing, hidden, reducedMotion, current.duration, moment]);
  return <>{companions.map(pet => {
    const cue = pet.id === 'max' ? current.max : current.abi;
    return <WorldCompanion key={pet.id} def={pet}
      cue={{ ...cue, pose: resting ? 'rest' : isEditing || hidden || reducedMotion ? 'idle' : cue.pose }}
      paused={isEditing || hidden || reducedMotion} lightIntensity={lightIntensity}
      isEditing={isEditing} onInteract={onInteract} />;
  })}</>;
}
